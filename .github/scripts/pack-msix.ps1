<#
.SYNOPSIS
    印章生成器 —— MSIX 手工封装脚本（ADR-001）。

.DESCRIPTION
    Tauri 2 的 Windows bundler 只实现 MSI/NSIS，**没有 MSIX target**（问题 012），
    因此 `.msix` 由本脚本用 Windows SDK 自带的 `makeappx.exe` 手工封装。

    执行顺序：
      1. 解析四段版本号（Tauri semver 三段 + `.0`）
      2. **白名单** staging（问题 016：黑名单必漏，白名单漏了会当场报错）
      3. 注入版本号到 AppxManifest 副本（不改仓库模板）
      4. 复制 MSIX 三张图标到 Assets\
      5. 清单预检（问题 020 的四类包接受验证错误全部在本地拦掉）
      6. 污染自检（混入 Cargo 中间产物即硬失败）
      7. makeappx pack

.PARAMETER Version
    四段版本号，如 `1.0.0.0`。省略时从 package.json 的 version 推导（补 `.0`）。

.PARAMETER ProjectRoot
    项目根目录。省略时取脚本所在目录的上两级。

.PARAMETER StagingDir
    MSIX 打包暂存目录。省略时为 `<ProjectRoot>\msix-staging`。

.PARAMETER OutFile
    输出的 .msix 路径。省略时为
    `<ProjectRoot>\src-tauri\target\release\bundle\msix\seal-designer_<Version>_x64.msix`。

.NOTES
    免证书：产出未签名 MSIX 直接上传微软合作伙伴中心，商店审核通过后自动签名（问题 007）。
#>
[CmdletBinding()]
param(
    [string] $Version = '',
    [string] $ProjectRoot = '',
    [string] $StagingDir = '',
    [string] $OutFile = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# ── 0. 路径解析 ───────────────────────────────────────────────────────────────

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}
Set-Location $ProjectRoot
Write-Host "项目根目录: $ProjectRoot"

$packageJsonPath = Join-Path $ProjectRoot 'package.json'
$manifestSrc     = Join-Path $ProjectRoot 'src-tauri\msix\AppxManifest.xml'
$iconDir         = Join-Path $ProjectRoot 'src-tauri\icons'
$releaseDir      = Join-Path $ProjectRoot 'src-tauri\target\release'

foreach ($p in @($packageJsonPath, $manifestSrc, $iconDir, $releaseDir)) {
    if (-not (Test-Path $p)) { throw "必需路径不存在: $p" }
}

# ── 1. 版本号：三段 semver → 四段 MSIX ────────────────────────────────────────

if ([string]::IsNullOrWhiteSpace($Version)) {
    $pkg = Get-Content $packageJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $raw = [string]$pkg.version
    if ([string]::IsNullOrWhiteSpace($raw)) { throw 'package.json 缺少 version 字段' }
    # 去掉 `-beta.1` 之类的预发布/构建后缀，微软只接受纯数字四段
    $core  = ($raw -split '[-+]')[0]
    $parts = @($core -split '\.')
    while ($parts.Count -lt 4) { $parts += '0' }
    $Version = ($parts[0..3] -join '.')
}
if ($Version -notmatch '^\d+\.\d+\.\d+\.\d+$') {
    throw "版本号必须是四段纯数字（如 1.0.0.0），当前: $Version"
}
Write-Host "MSIX 版本号: $Version"

if ([string]::IsNullOrWhiteSpace($StagingDir)) {
    $StagingDir = Join-Path $ProjectRoot 'msix-staging'
}
if ([string]::IsNullOrWhiteSpace($OutFile)) {
    $outDir  = Join-Path $releaseDir 'bundle\msix'
    # ★ Release 资产名必须 ASCII（问题 011）：GitHub 会吞掉资产名里的中文段
    $OutFile = Join-Path $outDir "seal-designer_${Version}_x64.msix"
}

# ── 2. 白名单 staging ─────────────────────────────────────────────────────────
#
# ★ 只能用白名单（问题 016）：
#   黑名单的失败模式是「多放了东西」——静默通过，只能靠体积或人工审计发现；
#   白名单的失败模式是「少放了东西」——当场报错。前者危险，后者安全。

if (Test-Path $StagingDir) { Remove-Item $StagingDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $StagingDir, (Join-Path $StagingDir 'Assets') | Out-Null
Write-Host "staging 目录: $StagingDir"

# 2.1 主程序 exe —— 包内固定使用 ASCII 名（问题 017）
$mainExeName = 'seal-designer.exe'
$mainExe = Get-ChildItem (Join-Path $releaseDir $mainExeName) -File -ErrorAction SilentlyContinue
if (-not $mainExe) {
    $mainExe = Get-ChildItem (Join-Path $releaseDir '*.exe') -File -ErrorAction SilentlyContinue |
        Select-Object -First 1
}
if (-not $mainExe) { throw "未找到主程序 exe（$releaseDir\*.exe），请先执行 tauri build" }
Copy-Item $mainExe.FullName (Join-Path $StagingDir $mainExeName) -Force
Write-Host "主程序 exe: $($mainExe.Name) -> $mainExeName"

# 2.2 运行时依赖 DLL（如 WebView2Loader.dll）——存在才复制
$dlls = @(Get-ChildItem (Join-Path $releaseDir '*.dll') -File -ErrorAction SilentlyContinue)
foreach ($d in $dlls) { Copy-Item $d.FullName (Join-Path $StagingDir $d.Name) -Force }
if ($dlls.Count -eq 0) {
    Write-Host '运行时 DLL: 无（webviewInstallMode=downloadBootstrapper，符合预期）'
} else {
    Write-Host "运行时 DLL: $($dlls.Count) 个（$(($dlls | Select-Object -ExpandProperty Name) -join ', ')）"
}

# 2.3 Tauri 资源目录（对应 tauri.conf.json 的 bundle.resources；本项目前端全内嵌，通常不存在）
$resourceDir = Join-Path $releaseDir 'resources'
if (Test-Path $resourceDir) {
    Copy-Item $resourceDir (Join-Path $StagingDir 'resources') -Recurse -Force
    Write-Host '资源目录: resources\ 已复制'
} else {
    Write-Host '资源目录: 无（前端资源已内嵌进 exe，符合预期）'
}

# ── 3. AppxManifest：复制模板并注入四段版本号 ─────────────────────────────────

$manifestDst = Join-Path $StagingDir 'AppxManifest.xml'
[xml]$manifest = Get-Content $manifestSrc -Raw -Encoding UTF8

$ns = New-Object System.Xml.XmlNamespaceManager($manifest.NameTable)
$ns.AddNamespace('d',    'http://schemas.microsoft.com/appx/manifest/foundation/windows10')
$ns.AddNamespace('uap',  'http://schemas.microsoft.com/appx/manifest/uap/windows10')

$identityNode = $manifest.SelectSingleNode('/d:Package/d:Identity', $ns)
if (-not $identityNode) { throw 'AppxManifest 缺少 <Identity> 节点' }
$identityNode.SetAttribute('Version', $Version)

# UTF-8 无 BOM 保存：makeappx 对 BOM 容忍，但保持干净更稳
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$writerSettings = New-Object System.Xml.XmlWriterSettings
$writerSettings.Encoding = $utf8NoBom
$writerSettings.Indent   = $true
$writer = [System.Xml.XmlWriter]::Create($manifestDst, $writerSettings)
try { $manifest.Save($writer) } finally { $writer.Dispose() }
Write-Host "AppxManifest: 已注入 Version=$Version"

# ── 4. MSIX 图标（宁少勿多，仅复制清单真实声明的三张）──────────────────────────

$iconNames = @('StoreLogo', 'Square44x44Logo', 'Square150x150Logo')
foreach ($n in $iconNames) {
    $srcIcon = Join-Path $iconDir "$n.png"
    if (-not (Test-Path $srcIcon)) {
        throw "缺少 MSIX 图标: $srcIcon（请执行 npx @tauri-apps/cli icon ../icon.png 重新生成）"
    }
    Copy-Item $srcIcon (Join-Path $StagingDir "Assets\$n.png") -Force
}
Write-Host "MSIX 图标: $($iconNames -join ', ') 已复制到 Assets\"

# ── 5. 清单预检（把问题 020 的四类包接受验证错误拦在本地）─────────────────────

# 5.1 清单声明的 Executable 必须在 staging 里真实存在（问题 014）
$appNode = $manifest.SelectSingleNode('/d:Package/d:Applications/d:Application', $ns)
if (-not $appNode) { throw 'AppxManifest 缺少 <Application> 节点' }
$declaredExe = $appNode.GetAttribute('Executable')
if ([string]::IsNullOrWhiteSpace($declaredExe)) { throw 'AppxManifest 的 Executable 为空' }
if (-not (Test-Path (Join-Path $StagingDir $declaredExe))) {
    throw "清单声明的 Executable 在包内不存在: $declaredExe"
}
# 5.2 包内路径必须 ASCII（问题 017）
if ($declaredExe -match '[^\x00-\x7F]') {
    throw "包内可执行文件名含非 ASCII 字符，makeappx 会损坏包内路径: $declaredExe"
}

# 5.3 清单引用的每一张图都必须在 payload 里（问题 020 错误 1）
$referenced = @()
$logoNode = $manifest.SelectSingleNode('/d:Package/d:Properties/d:Logo', $ns)
if ($logoNode) { $referenced += $logoNode.InnerText }
$visualNode = $appNode.SelectSingleNode('uap:VisualElements', $ns)
if (-not $visualNode) { throw 'AppxManifest 缺少 <uap:VisualElements> 节点' }
foreach ($attr in @('Square150x150Logo', 'Square44x44Logo')) {
    $value = $visualNode.GetAttribute($attr)
    if (-not [string]::IsNullOrWhiteSpace($value)) { $referenced += $value }
}
foreach ($rel in $referenced) {
    $full = Join-Path $StagingDir $rel
    if (-not (Test-Path $full)) { throw "清单引用的图标不在 payload 中: $rel" }
}
Write-Host "清单图标引用校验通过（$($referenced.Count) 张）"

# 5.4 PublisherDisplayName 非空（问题 020 错误 2）
$pdnNode = $manifest.SelectSingleNode('/d:Package/d:Properties/d:PublisherDisplayName', $ns)
if (-not $pdnNode -or [string]::IsNullOrWhiteSpace($pdnNode.InnerText)) {
    throw 'AppxManifest 的 PublisherDisplayName 为空，包接受验证会拒收'
}

# 5.5 至少一种支持语言 + 默认语言非空（问题 020 错误 3、4）
$resourceNodes = @($manifest.SelectNodes('/d:Package/d:Resources/d:Resource', $ns))
if ($resourceNodes.Count -eq 0) {
    throw 'AppxManifest 未声明任何 <Resource Language>，包接受验证会拒收'
}
$defaultLanguage = $manifest.DocumentElement.GetAttribute('DefaultLanguage')
if ([string]::IsNullOrWhiteSpace($defaultLanguage)) {
    throw 'AppxManifest 的 Package/@DefaultLanguage 为空，包接受验证会拒收'
}
Write-Host "语言声明校验通过（DefaultLanguage=$defaultLanguage，Resource 共 $($resourceNodes.Count) 项）"

# 5.6 不得声明 DefaultTile（问题 013：一旦有 Square310x310Logo 就强制要求 Wide310x150Logo）
if ($visualNode.SelectSingleNode('uap:DefaultTile', $ns)) {
    throw '检测到 <uap:DefaultTile>：tauri icon 不生成 Wide310x150Logo，会触发 makeappx 80080204'
}

# ── 6. 审计 + 体积统计 + 污染自检 ─────────────────────────────────────────────

# 6.1 审计：把「被白名单排除掉的东西」打出来，将来漏放必需文件能一眼看到
$skipped = @(
    Get-ChildItem $releaseDir -Force | Where-Object {
        $_.Name -ne 'resources' -and $_.Extension -notin @('.exe', '.dll')
    } | Select-Object -ExpandProperty Name
)
Write-Host "=== 白名单已排除的 target\release 顶层条目（共 $($skipped.Count) 项）==="
Write-Host ($skipped -join ', ')

# 6.2 体积统计：污染回归的一眼可见指标
$files = @(Get-ChildItem $StagingDir -Recurse -File -Force)
$bytes = [int64](($files | Measure-Object -Property Length -Sum).Sum)
Write-Host "=== staging 汇总: 文件数=$($files.Count), 总体积=$bytes 字节 ($([math]::Round($bytes / 1MB, 2)) MB) ==="

# 6.3 污染自检：混入即硬失败，不靠人看日志
$badDirs = @(
    Get-ChildItem $StagingDir -Directory -Force | Where-Object {
        $_.Name -in @('.fingerprint', 'nsis', 'examples', 'build', 'deps', 'incremental', 'bundle')
    } | Select-Object -ExpandProperty Name
)
# -Force 才能枚举到 `.` 开头的隐藏文件；按「文件名前缀」判断，不依赖 Extension
# （`.cargo-lock` 的 .Extension 是空串，会被扩展名黑名单直接放行）
$badFiles = @(
    Get-ChildItem $StagingDir -File -Force | Where-Object {
        $_.Name -like '.cargo*' -or $_.Extension -in @('.pdb', '.rlib', '.d', '.rmeta', '.lib', '.exp')
    } | Select-Object -ExpandProperty Name
)
$bad = @($badDirs) + @($badFiles)
if ($bad.Count -gt 0) {
    throw "staging 污染检测失败，混入了构建中间产物: $($bad -join ', ')"
}
Write-Host '污染自检通过：无 Cargo 中间产物 / NSIS 工具链 / 锁文件'

# ── 7. makeappx pack ──────────────────────────────────────────────────────────

$makeappx = Get-ChildItem 'C:\Program Files (x86)\Windows Kits\10\Bin\*\x64\makeappx.exe' -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending |
    Select-Object -First 1
if (-not $makeappx) { throw '未找到 makeappx.exe（Windows SDK 未安装？windows-latest runner 应预装）' }
Write-Host "makeappx: $($makeappx.FullName)"

$outParent = Split-Path $OutFile -Parent
New-Item -ItemType Directory -Force -Path $outParent | Out-Null

& $makeappx.FullName pack /d $StagingDir /p $OutFile /o
if ($LASTEXITCODE -ne 0) { throw "makeappx 打包失败 (exit=$LASTEXITCODE)" }

if (-not (Test-Path $OutFile)) { throw "makeappx 声称成功但产物不存在: $OutFile" }
$msixSize = (Get-Item $OutFile).Length
Write-Host "=== MSIX 打包完成: $OutFile ($msixSize 字节, $([math]::Round($msixSize / 1MB, 2)) MB) ==="
