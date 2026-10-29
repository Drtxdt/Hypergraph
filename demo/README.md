# 运行演示站

解压完整交付包后，在本目录执行：

```sh
npm ci
npm run build
npm run serve
```

浏览器打开命令输出的本地地址（默认 `http://localhost:4000`）。主题依赖来自相邻 `dist/hexo-theme-hypergraph-2.0.0.tgz`，请保留解压后的目录结构。要求 Node.js 22.12+ 或 24。

`public/` 已包含生成的静态站，可交给普通 HTTP 静态服务器预览；不要直接双击 HTML 使用 file 协议浏览。公开样例和八类个人空间数据均在 `source/`，没有真实博客文章或加密测试私文。音乐使用随演示提供的原创短提示音。

修改 `_config.hypergraph.yml` 可调整唯一官方外观 `endfield` 的动效、内容顺序与服务模块。评论默认关闭；接入自己的 Waline 服务地址后启用，部署说明见上级 `docs/COMMENTS.md`。

从 Git 克隆开发仓库时，`dist/`、演示站 `public/` 和缓存不纳入版本控制。先在仓库根目录运行 `npm ci`、`npm run build`、`node tools/package-release.mjs`，再进入 `demo/` 执行 `npm ci` 和 `npm run build`。完整交付 ZIP 已包含安装包和静态演示，无需这一步准备。
