# beta.6 配置迁移

本轮重构的字段不保留兼容分支；旧值会在构建时报出配置路径。

| 旧字段 | 新字段 |
|---|---|
| `home.sections: [intro, featured, posts]` | `[masthead, featured, posts]` |
| `appearance.hero.home` | `home.masthead.image.src` |
| `appearance.hero.page/archive/...` | `page_banner.overrides.<类型>.src` |
| `appearance.hero.height` | `page_banner.height`（文章专题封面保持主题默认高度） |
| `appearance.taxonomy_banners` | `page_banner.overrides`，键为 `category:名称` / `tag:名称` |
| `background.image: /image.jpg` | `background.image: {src: /image.jpg}` |
| about 数组 | `about.sections` |
| friends 数组 | `friends.groups: [{items: [...]}]` |
| gallery 数组 | `gallery.albums: [{slug: records, title: 记录, photos: [...]}]` |

主视觉独立于文章封面。默认 `home.sections` 为 `masthead → featured → posts`，主视觉仅首页第一页出现。关闭主视觉不插回任何身份区，仍有辅助技术可读的站点标题。

图片对象：`src`、`mobile`、`dark`、`mobile_dark`、`fit`、`position`、`mobile_position`、`alt`、`caption`、`fallback`。手机深色按 `mobile_dark → mobile → dark → src` 回退；其他变体可省略。`show_cover: false` 关闭前景图片，不关闭独立背景。

背景模式 `paper / frame / home`：纯纸面、全站边缘氛围、仅首页氛围。默认 frame，浓度 0.12；没有图片时不请求任何环境素材。

页面横幅优先级：页面 front matter `page_banner` → 精确覆盖 → 类型覆盖 → 默认图片。显式 `false` 禁止该页横幅。工具与游戏操作页不插横幅。类型包括 `about/friends/gallery/album/archive/page/tools/games/category/tag`。

入场默认 always；完整打开或刷新首页播放，60% 停顿 600ms，黄色扫满 240ms 后淡出 600ms，总计约 2.4 秒。封面与动画并行；历史恢复、深层锚点、减少动态效果、省流、跳过和后台状态会直接放行。应急上限 4 秒不替代正常 2.5 秒可读门槛。
