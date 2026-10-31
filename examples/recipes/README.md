# beta.6 配方

将任一 YAML 内容合并到站点根目录 `_config.hypergraph.yml`。这些是同一套组件的配置示例，不是额外预设。数组整体替换。

- `technical.yml`：短刊头、纯纸面、完整显示图解。
- `portrait.yml`：分区刊头、竖图、边缘背景。
- `photography.yml`：摄影主图、图说、手选入口。

复制 `examples/content/source/images/landscape.jpg`、`portrait.jpg` 及 `demo/source/images/record.svg` 到站点 `source/images/`。摄影为美国 National Park Service 公共领域图片，肖像来自 NASA；来源与使用说明见 `examples/content/README.md`。SVG 为本项目原创，MIT。人物仅作素材适配示例，不代表站长身份或背书。

| 想修改 | 字段 |
|---|---|
| 站名、简介 | `home.title / description` |
| 主视觉图片 | `home.masthead.image.src` |
| 手机、深色替代图片 | `mobile / dark / mobile_dark` |
| 完整显示或裁切 | `fit: contain / cover` |
| 桌面、手机裁切焦点 | `position / mobile_position` |
| 图说与替代文本 | `caption / alt` |
| 主行动入口 | `home.masthead.action.label / url` |
| 分类入口 | `home.topics: auto` 或最多三项对象 |
| 环境图与浓度 | `background.image / opacity` |
| 关闭环境图片 | `background.mode: paper` |
| 专页横幅 | `page_banner.default / overrides` |

建议把人物主体放在图片安全区；分区文字不会盖住主体。`contain` 完整显示，留白由图片比例决定。文章正文图片不受这些字段控制。
