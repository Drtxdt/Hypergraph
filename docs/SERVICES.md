# 服务适配参数

所有服务默认关闭。以下字段都写在 `_config.hypergraph.yml`；公开 API 标识可以输出到页面，数据库密码、AI 密钥和管理员令牌应保留在服务端。

## 评论

设置 `comments.enable: true` 和 `comments.provider`。通用的 `lazy: true` 在组件进入视口时加载。`secondary` 使用同样字段开启第二种服务，切换会清理当前实例。加密文章强制关闭评论。

| provider | 必填参数 |
|---|---|
| waline | server |
| artalk | server；可选 site |
| twikoo | env_id |
| giscus | repo、repo_id、category_id |
| disqus | shortname |
| disqusjs | shortname、api_key；可选 server 代理地址 |
| livere | uid |
| valine | app_id、app_key；建议填写 server |
| utterances | repo |
| facebook | app_id |
| remark42 | server、site |
| gitalk | client_id、client_secret、repo、owner、proxy；admin 为数组 |

Gitalk 沿用上游浏览器 OAuth 客户端配置，其中 `client_secret` 会公开输出，不能复用私有服务密钥；推荐默认 Waline 或 Giscus。Gitalk 的 OAuth 代理必须由站长明确填写。Valine 的 LeanCloud SDK 随主题本地打包。Giscus、Utterances、Disqus、Livere、Facebook、Remark42 和 DogeCloud 的服务端嵌入脚本仍来自配置的提供商，这是服务协议所需请求。

`options` 可传入旧客户端支持的额外公开选项。Waline 的 `count`、`recent`、`barrage` 提供计数、最近评论和访客主动开启的弹幕；其他服务启用这三项会报告不支持的配置组合。它们不假装拥有统一的服务端接口。

本地测试包含 Waline SQLite 匿名写入/读回和所有适配器的加载、错误隔离与销毁。外部账号权限、域名白名单、OAuth 回调与供应商真实可用性须在上线时用自己的账号验证。

## 搜索、摘要与朋友圈

本地 `search: true` 提供标题、正文、标签检索和分页；加密文章排除在索引之外。`external_search` 使用 Algolia 的 `app_id`、公开 `search_key` 和 `index`，兼容 DocSearch 的 hierarchy/content/url 结果。

`ai_summary.endpoint` 接收 POST JSON `{ url, title, text }` 并返回 `{ summary }`；正文最多 12,000 字符，加密文章不请求。服务端负责认证、额度、缓存与模型密钥。无服务时可以直接使用 front-matter 的 `summary`。

`pages.fcircle.endpoint` 返回数组、`{ items: [...] }` 或 `{ article_data: [...] }`；条目支持 title、url/link、description、author、created。超时显示局部错误，正文照常阅读。

## 统计、聊天与广告

`analytics` 是数组，支持 google、baidu、clarity、umami、cloudflare、gtm、cnzz、51la、custom。每项填写 provider 和 id；Umami 以及 cnzz/51la/custom 还要填写控制台给出的完整脚本 `url`。51LA 的公开 `ck` 等选项放在 `options`。不同版本的控制台脚本可能包含额外初始化，应依照该服务文档配置，必要时使用自己的小型加载脚本。

`chat` 支持 crisp、tidio、chatra、knocket、daovoice、custom，填写 id；后两者需要完整脚本 url。`button` 显示主题入口，`hide_on_scroll` 控制滚动隐藏；Knocket/custom 没有统一公开打开接口时使用提供商自带入口或配置的联系链接。

`counters.endpoint` 是站长公开的统计代理，接受 `?path=...`，返回 `{ page_views: 123 }`；私有 Umami token 不放前端。也可开启 `counters.busuanzi`。

`adsense` 使用 enable、client（ca-pub-数字）和可选 slot。`ads` 数组支持 home、post、sidebar、footer 位置的可信 HTML。广告及聊天 SDK 只在启用后加载一次。原始注入脚本需要自己处理生命周期，复杂组件建议做成 npm 扩展。

参考：[Knocket 官方嵌入说明](https://knocket.trtc.io/blog/javascript-live-chat/)、[Remark42 前端配置](https://remark42.com/docs/configuration/)、[DisqusJS](https://github.com/SukkaW/DisqusJS)、[OpenCC.js](https://github.com/nk2028/opencc-js)。
