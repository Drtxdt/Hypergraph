# beta.7：等高线与局部打印

默认首页使用原创地形等高线与点阵折面。没有图片时图形不会成为独立的高屏序章；手机裁片不增加文流高度。文章正文、目录和工具操作区保持阅读纸面。

```yaml
appearance:
  contour:
    enable: true
    style: terrain # terrain / flow
    opacity: 0.18
    scope: site # site / home
  laser_print: true
home:
  masthead:
    artwork:
      enable: true
      image: {} # 默认原创点阵；自定义示例见下文
```

自定义 SVG／透明 PNG 使用 `home.masthead.artwork.image: {src: /images/signature.png}`，支持 `mobile`、`dark`、`mobile_dark` 与一次失败备用图 `fallback`，始终完整 contain 展示。不要把站名或链接仅写在装饰图片里。存在首页主图时优先显示主图，装饰不会同时占位。`show_cover: false` 禁止自定义图片请求，但内置几何和等高线仍由独立开关控制。

打印持续 840ms，在全屏入场揭幕阶段重叠开始；正常返回首页链接可重播，历史恢复、主题切换不重播。图片或模块迟到直接显示静态结果。减少动态、省流与 subtle/off 不请求打印模块；无脚本仍有静态成品。背景、等高线、打印是三个独立职责，不需要改已有 background 配置。

构建期生成固定地形和流线；资源同源且带内容散列。运行期仅对同源自定义装饰读取透明度；跨域素材和摄影主图使用边缘扫描。SVG 作为图片加载，不注入其源码。

开发验证：`npm run verify:fast` → `npm run verify` → `npm run pack:theme`。安装验证使用 `npm run verify:package -- <tarball绝对路径> <SHA-256>`，在仓库外临时站消费同一个包。截图是候选证据，不自动替换此前批准的基线。

性能与托管：生成站点同时输出 HTML 的 `.gz` 文件，内容与原页面完全相同（加密页面仅压缩其公开加密输出）。nginx 可启用 `gzip_static on; gzip_vary on;`，CDN 可使用等价压缩；必须正确返回 `Content-Encoding: gzip`。普通 HTML 始终保留；不支持压缩的主机仍能阅读，但不代表满足本报告的压缩网络条件。
