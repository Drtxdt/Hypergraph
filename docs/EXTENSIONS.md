# 扩展接口 v1

安装独立 npm 包后，在 `_config.hypergraph.yml` 中添加：

```yaml
extensions:
  - package: hypergraph-extension-reading-note
    enable: true
    config:
      text: 感谢阅读。
```

包的 CommonJS 入口导出 `id`、`apiVersion: 1`、`schema`、`scope`、`browser` 和可选 `setup`。`id` 是不重复的小写连字符标识。`schema` 校验用户配置并填入默认值。接口版本不匹配会中止生成，停用扩展后不读取或调用它。

`setup(api)` 可访问 `api.hexo` 注册 Hexo 构建钩子；使用 `api.addSlot(name, render)` 返回 HTML。当前公开插槽为 `home:before`、`post:after`、`footer`。HTML 由扩展负责转义。浏览器入口相对包入口解析，必须是已构建、无裸包导入的独立 ES 模块。

浏览器模块导出 `mount({ root, config, signal })`，返回清理函数。`scope: page` 在每次页面替换时清理；`scope: global` 只挂载一次。事件监听优先使用 `{ signal }`，定时器、Observer、第三方实例必须在清理函数中释放。异步工作完成前要检查 `signal.aborted`。

`examples/extension` 是可独立 `npm pack`、安装的示例。公开回归 `npm run verify` 和干净安装验收 验证切页后插槽只挂载一次以及停用后没有资源请求。升级时保持 `apiVersion: 1`，先在独立验证站测试；未来不兼容接口会提升版本，不静默运行。

扩展还可导出 `presets`，按名称提供 `{ config, templates, css }`。`config` 在主题默认值之后、用户覆盖之前合并；`templates` 将 `index.njk` 等模板文件名映射到完整 Nunjucks 源码，因此预设能改变页面构图。`css` 是可信扩展提供的样式。只有启用的扩展参与查找；未知 preset 会中止生成。构建侧也可调用 `api.addTemplate(name, source)`。

```js
module.exports = {
  id: 'my-editorial-preset',
  apiVersion: 1,
  presets: {
    magazine: {
      config: { home: { featured: false } },
      templates: { 'index.njk': '<h1>{{ config.title }}</h1><p>My composition</p>' }
    }
  }
};
```

`hypergraph:mount` 与 `hypergraph:unlock` 事件提供 `{ root, signal }`。需要访问解锁内容的扩展可监听后者，但不应把私密正文发送到外部服务。开发时改动扩展 setup、预设或依赖后重新启动 Hexo；浏览器模块使用页面信号清理，不能依赖重复加载脚本产生初始化。
