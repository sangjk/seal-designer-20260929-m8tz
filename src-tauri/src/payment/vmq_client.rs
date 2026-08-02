//! V免签 HTTP 客户端（reqwest + rustls-tls，不引入 OpenSSL）。
//!
//! 三个动作：建单 `create_order`、查单 `check_order`、关单 `close_order`。
//! 全部只在 Rust 侧发起 —— 前端没有任何外部网络能力（ADR-003 / 问题 017）。

use std::sync::atomic::{AtomicU32, Ordering};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use reqwest::Client;

use crate::config;
use crate::error::{AppError, AppResult};
use crate::payment::models::{
    CheckOrderData, CreateOrderData, CreateOrderReq, OrderInfo, OrderStatus, SimpleOrderReq,
    VmqResp,
};
use crate::payment::sign::{sign_create, sign_query};

/// 商户单号尾部序号（进程内自增，保证同毫秒多次建单也不重复）。
static PAY_ID_SEQ: AtomicU32 = AtomicU32::new(0);

/// 生成商户单号：`SEAL{13位毫秒}{4位序号}`（共识格式，共享知识 6）。
///
/// # 返回
/// 形如 `SEAL17225688001230042` 的 ASCII 单号。
pub fn new_pay_id() -> String {
    let ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let seq = PAY_ID_SEQ.fetch_add(1, Ordering::Relaxed) % 10_000;
    format!("{}{:013}{:04}", config::PAY_ID_PREFIX, ms, seq)
}

/// V免签客户端。
pub struct VmqClient {
    /// 复用连接池的 HTTP 客户端。
    http: Client,
}

impl VmqClient {
    /// 创建客户端。
    ///
    /// # 返回
    /// 配置好超时的客户端实例。
    ///
    /// # 错误
    /// TLS / 连接池初始化失败时返回 `AppError::Network`。
    pub fn new() -> AppResult<Self> {
        let http = Client::builder()
            .timeout(Duration::from_secs(config::HTTP_TIMEOUT_SECS))
            .build()
            .map_err(|e| AppError::Network(e.to_string()))?;
        Ok(Self { http })
    }

    /// 建单（按价格）。
    ///
    /// # 参数
    /// - `pay_id`：商户单号。
    /// - `pay_type`：支付渠道，1=微信、2=支付宝。
    /// - `price`：金额字符串。
    ///
    /// # 返回
    /// 下发前端的订单信息（含 `really_price`）。
    ///
    /// # 错误
    /// 网络失败返回 `AppError::Network`；网关 `code != 200` 或缺字段返回 `AppError::Gateway`。
    pub async fn create_order(
        &self,
        pay_id: &str,
        pay_type: u8,
        price: &str,
    ) -> AppResult<OrderInfo> {
        // ★ param 恒为空串（&str），永不传 null（问题 009）
        let param = "";
        let body = CreateOrderReq {
            app_id: config::VMQ_APP_ID.to_string(),
            pay_id: pay_id.to_string(),
            pay_type,
            price: price.to_string(),
            param: param.to_string(),
            sign: sign_create(pay_id, param, pay_type, price, config::VMQ_APP_SECRET),
            is_html: "0".to_string(),
        };

        let url = format!("{}/api/pay/create", config::VMQ_HOST);
        let resp = self
            .http
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        let parsed: VmqResp<CreateOrderData> = resp
            .json()
            .await
            .map_err(|e| AppError::Parse(e.to_string()))?;

        if parsed.code != 200 {
            return Err(AppError::Gateway(if parsed.msg.is_empty() {
                format!("code={}", parsed.code)
            } else {
                parsed.msg
            }));
        }

        let data = parsed
            .data
            .ok_or_else(|| AppError::Gateway("网关未返回订单数据".to_string()))?;

        if data.order_id.is_empty() {
            return Err(AppError::Gateway("网关未返回系统单号".to_string()));
        }

        // 本地静态码模式必须展示实际应付金额；网关未给则回落到下单金额
        let really_price = if data.really_price.is_empty() {
            if data.price.is_empty() {
                price.to_string()
            } else {
                data.price.clone()
            }
        } else {
            data.really_price.clone()
        };

        Ok(OrderInfo {
            order_id: data.order_id,
            pay_id: if data.pay_id.is_empty() {
                pay_id.to_string()
            } else {
                data.pay_id
            },
            channel: pay_type,
            price: if data.price.is_empty() {
                price.to_string()
            } else {
                data.price
            },
            really_price,
        })
    }

    /// 查单。
    ///
    /// # 参数
    /// - `order_id`：系统单号。
    ///
    /// # 返回
    /// 订单状态。
    ///
    /// # 错误
    /// 网络失败返回 `AppError::Network`；网关异常返回 `AppError::Gateway`。
    pub async fn check_order(&self, order_id: &str) -> AppResult<OrderStatus> {
        let sign = sign_query(order_id, config::VMQ_APP_SECRET);
        let url = format!("{}/api/pay/check/{}", config::VMQ_HOST, order_id);

        let resp = self
            .http
            .get(&url)
            .query(&[("appId", config::VMQ_APP_ID), ("sign", sign.as_str())])
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        let parsed: VmqResp<CheckOrderData> = resp
            .json()
            .await
            .map_err(|e| AppError::Parse(e.to_string()))?;

        if parsed.code != 200 {
            return Err(AppError::Gateway(if parsed.msg.is_empty() {
                format!("code={}", parsed.code)
            } else {
                parsed.msg
            }));
        }

        let data = parsed
            .data
            .ok_or_else(|| AppError::Gateway("网关未返回订单状态".to_string()))?;

        Ok(OrderStatus {
            state: data.state,
            state_text: data.state_text,
        })
    }

    /// 关单。
    ///
    /// # 参数
    /// - `order_id`：系统单号。
    ///
    /// # 返回
    /// 网关确认关闭返回 `true`。
    ///
    /// # 错误
    /// 网络失败返回 `AppError::Network`。
    pub async fn close_order(&self, order_id: &str) -> AppResult<bool> {
        let body = SimpleOrderReq {
            app_id: config::VMQ_APP_ID.to_string(),
            sign: sign_query(order_id, config::VMQ_APP_SECRET),
        };
        let url = format!("{}/api/pay/close/{}", config::VMQ_HOST, order_id);

        let resp = self
            .http
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Network(e.to_string()))?;

        let parsed: VmqResp<serde_json::Value> = resp
            .json()
            .await
            .map_err(|e| AppError::Parse(e.to_string()))?;

        Ok(parsed.code == 200)
    }
}
