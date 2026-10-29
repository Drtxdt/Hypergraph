# Waline 评论部署与恢复

主题只需要公开服务地址，数据库密码、JWT 密钥不要写入主题配置。

1. 将 `deploy/waline` 作为独立 Vercel 项目部署。
2. 在 Vercel Storage 连接 Neon，按 [Waline 官方部署步骤](https://waline.js.org/guide/deploy/vercel.html) 初始化官方 `waline.pgsql` 表结构，并重新部署。
3. 设置 `SITE_URL`、`SITE_NAME`、`SERVER_URL` 与随机 `JWT_TOKEN`。数据库连接使用托管平台提供的环境变量，具体字段见 [数据库说明](https://waline.js.org/guide/database.html)。
4. 在 Vercel 绑定评论子域名，根据控制台给出的 DNS 值配置解析。访问 `/ui` 注册管理账号。
5. `_config.hypergraph.yml` 设置 `comments.enable: true` 和 `comments.server: https://你的评论域名`。访客允许匿名评论，无需 GitHub 登录。

服务端与站点域名应加入允许列表。先在预览站测试评论、回复、删除、计数与错误状态，再配置正式域名。加密文章自动不挂载评论。

备份：在管理界面导出评论数据，同时通过 Neon/PostgreSQL 工具保存数据库备份；将备份存入私人目录，保留日期和来源版本。恢复先在独立数据库导入，检查评论总数、路径、回复关系与管理用户，再切换服务端连接。不要直接覆盖唯一的生产数据库。SQLite 本地测试在停止服务后复制整个数据库文件作为备份；恢复时保留原文件并以备份副本启动。

托管账号、服务域名与费用由上线环境决定，本仓库不包含账号凭据，也不会自动创建付费服务。
