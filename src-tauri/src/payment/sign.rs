//! V免签 MD5 签名（App Proxy 模式）。
//!
//! 规则（规则/支付规则.md）：
//! - 建单（按价格）：`md5(payId + param + type + price + appSecret)`
//! - 查单 / 关单：`md5(orderId + appSecret)`
//! - 拼接为**纯字符串直连**，无 `&` / `=` 分隔符。
//!
//! ★ 铁律（问题 009 / 共享知识 6）：`param` 的类型是 **`&str`**，为空时传空串 `""`，
//!   绝不允许出现字面量 `"null"` —— 那会直接导致网关签名校验失败。

use md5::{Digest, Md5};

/// 计算字符串的 MD5 十六进制摘要（小写）。
///
/// # 参数
/// - `input`：待摘要的字符串。
///
/// # 返回
/// 32 位小写十六进制摘要。
pub fn md5_hex(input: &str) -> String {
    let mut hasher = Md5::new();
    hasher.update(input.as_bytes());
    let digest = hasher.finalize();
    let mut out = String::with_capacity(32);
    for byte in digest.iter() {
        out.push_str(&format!("{byte:02x}"));
    }
    out
}

/// 建单签名（按价格建单）。
///
/// # 参数
/// - `pay_id`：商户单号。
/// - `param`：透传参数，**空值请传 `""`**。
/// - `pay_type`：支付渠道，1=微信、2=支付宝。
/// - `price`：金额字符串，如 `9.9`。
/// - `secret`：应用密钥。
///
/// # 返回
/// MD5 签名。
pub fn sign_create(pay_id: &str, param: &str, pay_type: u8, price: &str, secret: &str) -> String {
    md5_hex(&format!("{pay_id}{param}{pay_type}{price}{secret}"))
}

/// 查单 / 关单签名。
///
/// # 参数
/// - `order_id`：系统单号。
/// - `secret`：应用密钥。
///
/// # 返回
/// MD5 签名。
pub fn sign_query(order_id: &str, secret: &str) -> String {
    md5_hex(&format!("{order_id}{secret}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn md5_matches_known_vector() {
        assert_eq!(md5_hex(""), "d41d8cd98f00b204e9800998ecf8427e");
        assert_eq!(md5_hex("abc"), "900150983cd24fb0d6963f7d28e17f72");
    }

    #[test]
    fn create_sign_uses_empty_param_not_null() {
        // 铁律回归测试：param 为空串时的签名，必须等价于直接拼接 payId + type + price + secret
        let with_empty = sign_create("SEAL1", "", 1, "9.9", "secret");
        let concatenated = md5_hex("SEAL119.9secret");
        assert_eq!(with_empty, concatenated);
        assert_ne!(with_empty, md5_hex("SEAL1null19.9secret"));
    }

    #[test]
    fn query_sign_is_order_id_plus_secret() {
        assert_eq!(sign_query("O1", "secret"), md5_hex("O1secret"));
    }
}
