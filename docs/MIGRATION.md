# 通用迁移路线

先备份整个站点，在副本中安装当前主题包。保留站点的 url、root、timezone、permalink 和文章日期；替换重复的 Markdown／数学渲染流程后生成站点，逐项比较文章路径、分类标签、图片、音频和旧标签语法。不要直接运行针对作者站点的历史迁移脚本。

旧主题摘要中的图片不会自动成为封面。安装后运行 `npx --no-install hg-cover-candidates source/_posts` 获取只读候选，人工填写 cover／cover_position／cover_fit。正文不会被工具修改。

验证通过后再自行选择是否替换正式站点；部署是独立步骤。以下是历史项目记录，不是通用命令步骤。

# 现有博客迁移与回滚

2026-10-29 已将 Hypergraph 1.0.0 应用到 `D:\hexo\blog`，完成依赖安装和静态生成，没有执行线上部署。43 篇文章已取消加密，正文、分类、标签保留；42 篇旧缓存日期、slug 与原文章路径不变，另有 1 篇本地新增文章。Hello World 使用旧缓存日期。

迁移保留 `/audio/bgm.mp3`，SHA-256 与旧主题音频一致；规范域名为 `https://suzuranloveapple.me`。保留原部署设置、旧主题文件、原始 HTML 与 `linkcard`、`warning`。重复的搜索、公式、旧 Markdown 渲染及旧主题客户端依赖已显式移除，由主题内置 Markdown-it 和按需模块接管。

旧版 front-matter 会按本地时区重新解析 ISO 日期，因此迁移使用 Asia/Shanghai 显式日期文本，避免多减 8 小时。历史“本文已加密”标签仍保留；文章密码与通用密码提示摘要已清除。三篇加密测试只存在于 `.local/demo`，未混入正式站。

本地私人备份：`.local/backups/original-20261028` 和 `.local/backups/before-v1-2026-10-29T01-18-04-322Z`。包含原始 source、配置、依赖清单/锁文件、db.json 与旧主题；不应公开上传。应用前逐文件哈希检查防止覆盖备份之后的修改。应用记录在 `.local/migration-application/manifest.json`。

回归脚本：`tools/verify-migration.mjs` 检查验证副本；`tools/verify-applied-migration.mjs` 对照应用前备份检查实际站；`tools/audit-links.mjs D:/hexo/blog/public` 检查生成链接。实际站 43 篇内容与 42 篇日期/slug、音频、部署配置检查通过，3,054 条本地链接/锚点无错误。

如需回滚，先执行 `node tools/rollback-migration.mjs` 查看路径；确认后加 `--apply`。脚本先另存当前 source/配置/依赖/缓存，再恢复原备份。随后在博客目录执行 `npm ci`、`npx hexo clean`、`npx hexo generate`。该命令会恢复旧站配置，需本地目录写入权限；不会自动部署。

用于其他博客时，先创建独立副本并调整迁移工具中的源路径和约束，不要把本项目针对 43 篇文章的验收断言直接当作通用迁移工具。

## 从 Hypergraph 1.0 升级到 2.0

这是外观及导航配置的重大版本更新。将 `preset` 设为 `endfield`，删除旧 `layout`，把对象菜单转换为有序 `label/url/icon` 数组。`appearance.entrance` 改为 `appearance.motion: cinematic`；可选择 `subtle` 或 `off`。单层分组用 `children`。正文语法、扩展 API v1 和文章网址规则继续保留。

本项目的私人博客升级入口为 `node tools/upgrade-blog-v2.mjs --source=D:/hexo/blog`。它先在工作区生成独立副本，校验全部源文件散列、日期、slug、旧 HTML 路径及本地资源链接。公开验收和副本通过后，`--apply` 才会生成新的备份并替换主题包、主题覆盖配置、package.json 和锁文件。不会把旧迁移副本的文章覆盖回当前博客。

备份包含 source、themes、scaffolds、vendor、站点与主题配置、依赖清单及旧缓存。恢复时先停止本地服务，以 application-report.json 记录的备份恢复这些目录/文件，重新 npm install、hexo clean、hexo generate；线上部署始终由站长单独执行。
