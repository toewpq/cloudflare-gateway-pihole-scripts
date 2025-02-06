# Cloudflare 网关 Pi-hole 脚本 (CGPS)
![Cloudflare Gateway Analytics screenshot showing a thousand blocked DNS requests](.github/images/gateway_analytics.png)

Cloudflare Gateway 允许您创建自定义规则，以根据防火墙策略过滤 HTTP、DNS 和网络流量。这是一个脚本集合，可用于获得与使用 Pi-hole 类似的体验，但使用 Cloudflare Gateway - 因此无需维护服务器或需要购买 Raspberry Pi！

## 关于各个脚本

- `cf_list_delete.js` - 从 Cloudflare Gateway 删除 CGPS 创建的所有列表。这对于后续运行很有用。
- `cf_list_create.js` - 获取包含域的 blocklist.txt 文件并在 Cloudflare Gateway 中创建列表
- `cf_gateway_rule_create.js` - 创建一个 Cloudflare Gateway 规则，以阻止所有流量（如果它与 CGPS 创建的列表匹配）。
- `cf_gateway_rule_delete.js` - 删除 CGPS 创建的 Cloudflare Gateway 规则。对于后续运行很有用。
- `download_lists.js` - 启动阻止列表和白名单下载。

＃＃ 特征

- 支持基本主机文件
- 完全支持域列表
- 自动清理过滤器列表：删除重复项、无效域、评论等
- 工作**完全无人值守**
- **白名单支持**，允许您通过强制受信任的域始终处于解锁状态来防止误报和破坏。
- 实验性**基于 SNI 的过滤**，独立于 DNS 设置运行，防止未经授权或恶意的 DNS 更改绕过过滤器。
- 可选的运行状况检查：发送 ping 请求，确保对工作流程执行进行持续监控和警报，或向 Discord Webhook 发送进度消息。

＃＃ 用法

### 先决条件

1. 在你的机器上安装 Node.js
2. Cloudflare [零信任](https://one.dash.cloudflare.com/) 帐户 - 免费计划就足够了。使用 Cloudflare [文档](https://developers.cloudflare.com/cloudflare-one/) 来了解详细信息。
3. Cloudflare 电子邮件、具有零信任读取和编辑权限的 **API令牌**，以及帐户 ID。有关如何创建令牌的更多信息，请参阅[此处](https://github.com/mrrfv/cloudflare-gateway-pihole-scripts/blob/main/extended_guide.md#cloudflare_api_token)。
4. 包含您要阻止的域的文件 - **免费计划最多 300000 个域** - 位于名为“blocklist.txt”的工作目录中。 Mulvad 提供了很棒的 [DNS 阻止列表](https://github.com/mulvad/dns-blocklists)，非常适合这个项目。其中包含下载推荐阻止列表的脚本“download_lists.js”。
5. 可选：您可以通过将域名放入“allowlist.txt”文件中将其列入白名单。您还可以使用“get_recomend_whitelist.sh”Bash 脚本来获取推荐的白名单。
6. 可选：用于发送通知的 Discord（或类似）Webhook URL。

### 本地运行

1. 克隆此存储库。
2. 运行`npm install`来安装依赖项。
3. 将 `.env.example` 复制到 `.env` 并填写值。
4. 如果这是后续运行，请按顺序执行“node cf_gateway_rule_delete.js”和“node cf_list_delete.js”以删除旧数据。
5. 如果您自己没有下载任何过滤器，请运行“node download_lists.js”命令下载推荐的过滤器列表（约 50 000 个域）。
6. 运行 `node cf_list_create.js` 在 Cloudflare Gateway 中创建列表。这需要一段时间。
7. 运行 `node cf_gateway_rule_create.js` 在 Cloudflare Gateway 中创建防火墙规则。
8. 祝贺你成功运行
### 在 GitHub Actions 中运行

这些脚本可以使用 GitHub Actions 运行，因此您的过滤器将自动更新并推送到 Cloudflare Gateway。如果您使用经常更新的恶意软件阻止列表，这非常有用。

请注意，GitHub Action 默认下载推荐的阻止列表和白名单。您可以通过设置操作变量来更改此行为。

1. 创建一个新的空的私有存储库。不鼓励分叉或公共存储库，但支持 - 尽管脚本永远不会泄漏您的 API 密钥，并且 GitHub Actions 秘密会自动从日志中编辑，但安全总比后悔好。如果您这样做，**无需使用“同步分叉”按钮**！无论您的分叉存储库中有什么内容，GitHub Action 都会下载最新的代码。
2. 在存储库设置中创建以下 GitHub Actions 密钥：
   - `CLOUDFLARE_API_TOKEN`：您的具有零信任读取和编辑权限的 Cloudflare API 令牌
   - `CLOUDFLARE_ACCOUNT_ID`：您的 Cloudflare 帐户 ID
   - `CLOUDFLARE_LIST_ITEM_LIMIT`：Cloudflare 零信任计划允许的阻止域的最大数量。默认为 300,000。如果您使用免费计划，则可选。
   - `PING_URL`：/可选/ GitHub Action 成功更新过滤器后用于 ping 的 HTTP(S) URL（使用curl）。对于查看状态很有用。
   - `DISCORD_WEBHOOK_URL`：/可选/要发送通知的 Discord（或类似）Webhook URL。
3. 如果需要，请在存储库设置中创建以下 GitHub Actions 变量：
   - `ALLOWLIST_URLS`：使用您自己的白名单。每行一个 URL。如果未提供此变量，将使用推荐的允许列表。
   - `BLOCKLIST_URLS`：使用您自己的阻止列表。每行一个 URL。如果未提供此变量，将使用推荐的阻止列表。
   - `BLOCK_PAGE_ENABLED`：如果主机被阻止，则启用显示阻止页面。
4. 在存储库中创建一个名为“.github/workflows/main.yml”的新文件，其中包含在此存储库中找到的“auto_update_github_action.yml”的内容。默认设置将在每周凌晨 3 点（世界标准时间）更新您的过滤器。您可以通过编辑“schedule”属性来更改此设置。
5. 在存储库设置中启用 GitHub Actions。

### Cloudflare 网关的 DNS 设置

1. 转到 Cloudflare 零信任仪表板，然后导航到网关 -> DNS 位置。
2. 单击默认位置，如果不存在则创建一个。
3. 根据提供的 DNS 地址配置您的路由器或设备。

或者，您可以安装 Cloudflare WARP 客户端并登录零信任。此方法通过 Cloudflare 服务器代理您的流量，这意味着它的工作原理与商业 VPN 类似。如果您想使用基于 SNI 的过滤功能，则需要执行此操作，因为它需要 Cloudflare 检查您的原始流量（如果禁用“TLS 解密”，HTTPS 仍保持加密状态）。

### 恶意软件拦截

默认过滤器列表仅针对广告和跟踪器拦截进行了优化，因为 Cloudflare 零信任本身配备了更高级的安全功能。建议您创建自己的 Cloudflare Gateway 防火墙策略，以利用 CGPS 之上的这些功能。

### 试运行

看看是否例如您的过滤器列表是有效的，无需实际更改 Cloudflare 帐户中的任何内容，您可以以“.env”或常规方式将“DRY_RUN”环境变量设置为 1。这只会将信息（例如将创建的列表或重复域的数量）打印到控制台。

**警告：** 目前仅适用于“cf_list_create.js”。

<!-- markdownlint-disable-next-line MD026 -->
##为什么不...

### Pi-hole 还是 Adguard Home？

- 复杂的设置让它在你的家外工作
- 需要树莓派

### 下一个DNS？

- 免费套餐每月进行 300,000 次查询后，DNS 过滤将被禁用

### Cloudflare 网关？

- 需要有效的支付卡或 PayPal 帐户
- 免费计划的域名限制为 300k

### 主机文件？

- 潜在的性能问题，尤其是在 [Windows](https://github.com/StevenBlack/hosts/issues/93)
- 没有过滤器更新
- 不适用于您的移动设备
- 没有关于您阻止了多少个域的统计信息

## 执照

麻省理工学院（MIT）许可证。有关更多信息，请参阅“许可证”。
