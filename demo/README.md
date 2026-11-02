# 运行与发布演示站

在仓库根目录执行：

```sh
npm ci
npm run build
npm run pack:theme
npm run build:showcase
node tools/serve.mjs .local/showcase/public 4190 /Hypergraph
```

统一构建入口自动读取当前版本，使用 `dist/` 中对应安装包。公开输出位于 `.local/showcase/public`，包括默认字标、摄影和自定义标识三个示例。自定义发布地址作为第二个参数传入：

```sh
node tools/build-showcase.mjs dist/hexo-theme-hypergraph-2.1.0-beta.8.tgz https://drtxdt.github.io/Hypergraph/
```

本地浏览需要按发布子目录提供服务，或构建时使用 `http://localhost:4190/`。公开内容来自 `demo/source` 和公开素材示例，评论默认关闭。它不读取个人博客、测试私文或迁移备份。

GitHub Actions 在所有验证任务通过后，消费安装测试使用的同一份主题包，构建并发布 Pages。`build.json` 记录包散列、提交与发布地址。
