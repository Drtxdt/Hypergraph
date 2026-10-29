# Endfield 视觉确认点

状态：`2.0.0-beta.1`，第一阶段样板已实现，等待用户确认视觉方向。不是 2.0.0 发布或全站验收报告。

## 查看

运行 `node tools/serve-endfield.mjs 4190`，打开 `http://127.0.0.1:4190/__review/`。
页面包含同尺寸首页前后对照、明暗文章截图、390px 可操作手机预览，以及无封面长标题、单篇文章和空站入口。
旧首页使用 v1 公开演示内容，新首页增加原创设计札记；这不是相同内容的像素差异评分。

## 本次实现

- 72px 桌面导航轨、1024px 以下顶栏、导航当前位置、手机菜单 Escape 与焦点循环。
- 首页从当前第一页选取一篇 sticky 优先推荐，列表去重；独立无图构图及空站生成器。
- 文章标题、摘要、可选封面、42rem 正文、右侧目录与手机折叠目录。
- 纸白、炭灰、信号黄及本地 Archivo。封面为原创 SVG。
- 音乐实例位于 Swup 区域之外，收起不停止播放，手机按实际高度预留底部空间；无脚本保留原生控件。
- 默认预设 `endfield`，删除旧 `layout` 选项与三种官方预设；第三方预设接口仍保留。
- 导航改为有序 `label/url/icon/children` 条目；新增 `site_logo` 和文章 `cover_position`。
- appearance 类型复用，修复单独启用 `cover_tint` 不加载；封面信息 helper 交由页面决定构图。

## 验证证据

- `npm test`：13 项通过，包括同页推荐范围、去重顺序、独立 cover_tint 开关回归。
- `npm run typecheck`、`npm run build`：通过。
- `tools/inspect-endfield.mjs`：5 种页面状态 × 4 种宽度 × 2 种明暗，共 40 组无横向溢出检查。
- 检查了单篇/空站数量、无图页面不输出封面、手机音乐预留空间、收起保持播放、一次增强导航保留音频实例、手机目录折叠和菜单 Escape。
- 人工查看了桌面首页、桌面文章、手机首页以及无封面长标题截图；用户审美确认仍待完成。
- 截图与浏览器版本：`.local/screenshots/endfield/`；`checks.json` 记录断言，`build.json` 记录当前资源 SHA-256 和基线提交。
- v1 安装包 SHA-256 保持 `5e09dba1b43754c98df4f357e990bb88c04e2bf1b02148722b308e01ac06890e`。

## 重建样板

需要根目录开发依赖及 `demo/node_modules` 中的 Hexo 生成器。当前为视觉阶段工具，尚不是最终承诺的干净环境 `npm run verify`。

```powershell
npm run build
node tools/preview-endfield.mjs
node tools/preview-endfield.mjs no-cover
node tools/preview-endfield.mjs few
node tools/preview-endfield.mjs empty
node tools/serve-endfield.mjs 4190
```

自动截图脚本当前使用 Edge、4183 新样板与 4184 旧公开演示服务：

```powershell
node tools/serve.mjs .local/endfield/public 4183
node tools/serve.mjs demo/public 4184
node tools/inspect-endfield.mjs
```

## 确认后继续

全站页面、模块排序与样式收敛；完整动态文案中英文化与浮层统一；归档计数及空组件；公开 verify 与 CI；30 次导航、无脚本和加密等全面回归；Hexo/Node/子目录矩阵、有效性能采样、安装包与迁移验收。

当前旧功能脚本及文档尚未全部适配新版配置。源码样式已格式化，新外壳集中于 `src/endfield.css`；视觉确认后继续移除被替代的旧规则并拆分组件样式。不要把旧版功能矩阵或历史性能数据当作本次验收结果。

本阶段没有写入 `D:\hexo\blog`，没有修改旧备份，没有线上发布。按用户计划，三个可运行样例完成后须先确认视觉方向，再铺开全站。
