本文对`Aliplayer`支持的属性、方法、事件进行详细说明。

**说明**

如果您在使用过程中遇到问题，可以参考[Web播放器常见问题](https://help.aliyun.com/zh/vod/developer-reference/faq-about-apsaravideo-player-for-web-1#task-1997027)或[播放异常自主排查](https://help.aliyun.com/zh/vod/developer-reference/troubleshoot-playback-errors#task-2246399)。

## 属性

初始化`Aliplayer`可以设置多种属性，包括授权License、播放资源信息、播放器样式信息、播放行为等。

| **名称** | **类型** | **说明** |
| --- | --- | --- |
| id  | String | 播放器外层容器的DOM元素ID。 |
| source | String | 使用URL播放方式时，通过source属性来指定视频播放地址URL。 **说明** - URL播放方式的播放优先级最高，高于VidAuth、VidSts等其他播放方式，即使用VidAuth、VidSts等其他播放方式时，不能指定source属性，若指定了source属性，播放器将优先选择source中的地址播放。建议仅设置一种播放方式。 - URL播放方式支持多清晰度设置，通过source属性来指定多路清晰度流的地址，更多信息，请参见[多清晰度播放](https://help.aliyun.com/zh/vod/developer-reference/basic-features#section-n0h-c7s-lwh)。示例如下： ``` source:’{“HD”:”address1”,”SD”:”address2”}’ ``` |
| vid | String | 媒体转码服务的媒体ID。 |
| playauth | String | 播放凭证，获取播放凭证请参见[获取音视频播放凭证](https://help.aliyun.com/zh/vod/api-getvideoplayauth)。 |
| customVodServer | String | 自定义点播代理域名（适用于2.32.0及以上版本VidAuth播放方式）。需[部署专属请求代理服务](https://help.aliyun.com/zh/vod/developer-reference/deploy-proxy-service)，当默认点播域名（\\*.aliyuncs.com）无法访问时，播放器会自动降级至您的代理服务，可有效规避运营商劫持风险，显著提升播放稳定性与成功率。 |
| playConfig | JSON | 使用Vid方式（VidAuth和VidSts方式）播放时的自定义设置字段，会透传给点播接口。支持设置的自定义字段及参数说明，请参见[媒体播放自定义设置 PlayConfig](https://help.aliyun.com/zh/vod/developer-reference/request-parameters#section-9g7-s9b-v7z)。取值示例： ``` {"PlayDomain":"vod.test_domain","PreviewTime":"20","MtsHlsUriToken":"yqCD7******oVjslp5Q"} ``` |
| authTimeout | Number | 通过Vid方式（VidAuth和VidSts方式）播放时，获取到的视频播放URL的有效时长。单位：秒，默认取值：7200。 请确保该时长大于视频的实际时长，防止播放地址在播放完成前过期。 |
| height | String | 播放器高度，取值： - **100%** - **100px** |
| width | String | 播放器宽度，取值： - **100%** - **100px** |
| autoSize | Boolean \\| String | 播放器尺寸自动适配视频内容，可选值 'height', 'width'。 如，您可以指定 width: '500px', autoSize: 'height'，播放器会保持宽度为 500px，高度根据视频实际比例自动调整。 或者，您可以指定 height: '500px', autoSize: 'width'，播放器会保持高度为 500px，宽度根据视频实际比例自动调整 注：autoSize: true 等同于 autoSize: 'height'，即默认是高度自适应。 |
| videoWidth | String | 视频宽度，更多信息请参见[设置显示模式](https://help.aliyun.com/zh/vod/developer-reference/basic-features#section-u71-uwo-vvr)。 |
| videoHeight | String | 视频高度，更多信息请参见[设置显示模式](https://help.aliyun.com/zh/vod/developer-reference/basic-features#section-u71-uwo-vvr)。 |
| preload | Boolean | 播放器自动加载。 |
| cover | String | 播放器默认封面图片，请填写正确的图片URL地址。需要autoplay值为**false**时，才生效。 |
| isLive | Boolean | 播放内容是否为直播，直播时会禁止用户拖动进度条。默认值为**false**，播放直播流时需要设置为**true**。 |
| autoplay | Boolean | 播放器是否自动播放，在移动端autoplay属性会失效。取值： - **true**（默认值）：开启自动播放。 - **false**：关闭自动播放。 **说明** 由于浏览器的限制，Web播放器SDK会出现自动播放失败的场景，具体说明请参见[进阶功能](https://help.aliyun.com/zh/vod/developer-reference/advanced-features-3#p-00w-jrt-lxe)。 |
| autoplayPolicy | Object | 播放器自适应静音自动播放策略。仅当`autoplay`设置为`true`时，本属性生效。配置示例如下： ``` autoplayPolicy: { fallbackToMute: true, // 有声自动播放失败后，是否降级为静音自动播放，默认为false showUnmuteBtn: true, // 静音自动播放时，是否居中显示静音大按钮，默认为true } ``` **说明** - 静音自动播放成功后，会触发`mutedAutoplay`事件。 - 当播放器开启自动播放（`autoplay`设置为`true`），并开启了自适应静音自动播放（`autoplayPolicy.fallbackToMute`设置为`true`）后，播放器首先会尝试带声音的自动播放，如果失败，则会降级尝试静音自动播放。请注意，静音自动播放也不意味着会100%播放成功。 |
| rePlay | Boolean | 播放器自动循环播放。 |
| useH5Prism | Boolean | 指定使用H5播放器。 |
| playsinline | Boolean | H5是否内置播放，有些Android浏览器不起作用。 |
| skinRes | Url | 皮肤图片，不建议随意修改该字段，如要修改，请参见[设置播放器皮肤](https://help.aliyun.com/zh/vod/developer-reference/configure-the-player-skin#topic-1960010)。 |
| skinLayout | Array \\| Boolean | 功能组件布局配置，不传该字段使用默认布局。取值：false表示隐藏所有功能组件。更多信息，请参见[配置skinLayout属性](https://help.aliyun.com/zh/vod/developer-reference/configure-skinlayout#topic-1960009)。 |
| skinLayoutIgnore | Array | 需要隐藏的UI组件。组件名称请参见[点播组件参数说明](https://help.aliyun.com/zh/vod/developer-reference/configure-skinlayout#c4961251b03p9)。配置示例如下： ``` skinLayoutIgnore: [ 'bigPlayButton', // 隐藏大播放按钮 'controlBar.fullScreenButton' // 隐藏控制条上的全屏按钮（通过点运算符进行子组件选择） ] ``` **说明** skinLayoutIgnore的优先级要高于skinLayout属性。 |
| controlBarVisibility | String | 控制面板的实现，取值： - **click**：单击播放器区域。 - **hover**（默认值）：移动到播放器区域。 - **always**：控制面板一直显示。 - **never**：隐藏整个控制面板。 |
| showBarTime | Number | 控制栏自动隐藏时间，单位：毫秒。 |
| enableSystemMenu | Boolean | 是否允许系统右键菜单显示，默认为**false**。 |
| format | String | 指定播放地址格式，取值： - **mp4** - **hls**或**m3u8** - **flv** - **mp3** 默认为空。 |
| mediaType | String | 指定返回音频还是视频，只有使用vid的播放方式时支持，默认值为**video**。取值： - **video**：视频。 - **audio**：针对只包含音频的视频格式，比如音频的MP4。 |
| qualitySort | String | 指定排序方式，只有使用Vid + PlayAuth播放方式时支持。取值： - **desc**：表示按倒序排序（即：从大到小排序）。 - **asc**：表示按正序排序（即：从小到大排序）。 默认值：**asc**。 |
| definition | String | 显示视频清晰度，多个使用半角逗号（,）分隔，比如：‘FD,LD’，此值是vid对应流清晰度的一个子集。取值： - **FD**（流畅） - **LD**（标清） - **SD**（高清） - **HD**（超清） - **OD**（原画） - **2K**（2K） - **4K**（4K） |
| defaultDefinition | String | 默认视频清晰度，此值是vid对应流的一个清晰度。取值： - **FD**（流畅） - **LD**（标清） - **SD**（高清） - **HD**（超清） - **OD**（原画） - **2K**（2K） - **4K**（4K） |
| autoPlayDelay | Number | 延迟播放时间，单位：秒。 |
| language | String | 国际化，默认为**zh-cn**。如果未设置，则采用浏览器语言。取值： - **zh-cn**：中文。 - **en-us**：英文。 |
| languageTexts | JSON | 自定义国际化文本JSON结构，key的值需要和language属性值对应起来。示例：{jp:{Play:”Play”}}自定义值请参见[JSON结构](https://player.alicdn.com/lang.json?spm=a2c4g.11186623.2.27.6bdcbf809nmsYQ&file=lang.json)。 |
| snapshotWatermark | Object | H5设置截图水印。 |
| useHlsPluginForSafari | Boolean | Safari浏览器是否启用HLS插件播放，Safari 11除外。取值： - **true**：启用。 - **false**（默认值）：禁用。 |
| enableStashBufferForFlv | Boolean | H5播放FLV时，设置是否启用播放缓存，只在直播下起作用。取值： - **true**（默认值）：启用。 - **false**：禁用。 |
| stashInitialSizeForFlv | Number | H5播放FLV时，初始缓存大小，只在直播下起作用。默认32KB。 当设置的值较小时，会提升起播速度，但是值太小时，可能会导致播放一小段之后卡顿。 |
| loadDataTimeout | Number | 缓冲多长时间后，提示用户切换低清晰度，单位：秒。默认20秒。 |
| waitingTimeout | Number | 最大缓冲超时时间，超过这个时间会有错误提示，单位：秒。默认60秒。 |
| diagnosisButtonVisible | Boolean | 是否显示检测按钮，取值： - **true**（默认值）：显示按钮。 - **false**：不显示按钮。 |
| disableSeek | Boolean | 禁用进度条的Seek，取值： - **true**：禁用。 - **false**（默认值）：不禁用。 |
| encryptType | Number | 设置是否播放阿里云视频加密（私有加密）视频，默认值为**0**，取值： - **0**：播放不加密视频。 - **1**：播放私有加密视频。 **说明** - 私有加密采用VID+[Playauth](https://help.aliyun.com/zh/vod/support/faq-about-parameter-parsing#concept-2526748)的方式进行播放。 - Web端标准加密使用URL方式播放，请参见[视频加密播放](https://help.aliyun.com/zh/vod/play-encrypted-video#task-1997626)。 |
| progressMarkers | Array | 进度条打点内容数组，更多信息，请参见[进度条标记](https://developer.aliyun.com/article/686043)。 |
| vodRetry | Number | 点播失败重试次数，默认3次。 |
| liveRetry | Number | 直播播放失败重试次数，默认5次。 |
| hlsFrameChasing | Boolean | HLS直播模式下，是否开启追帧。取值： - **true**：开启追帧。 - **false**（默认值）：不开启追帧。 **说明** 仅2.21.0以下版本Web播放器SDK支持设置本参数，2.21.0及以上版本如需在HLS直播模式下设置追帧，请参考`hlsOption.maxLiveSyncPlaybackRate`属性。 |
| chasingFirstParagraph | Number | 第一段追帧，单位：秒。默认20秒。 **说明** 仅2.21.0以下版本Web播放器SDK支持设置本参数，2.21.0及以上版本如需在HLS直播模式下设置追帧，请参考`hlsOption.maxLiveSyncPlaybackRate`属性。 |
| chasingSecondParagraph | Number | 第二段追帧，单位：秒。默认40秒。 **说明** 仅2.21.0以下版本Web播放器SDK支持设置本参数，2.21.0及以上版本如需在HLS直播模式下设置追帧，请参考`hlsOption.maxLiveSyncPlaybackRate`属性。 |
| chasingFirstSpeed | Number | 第一段追帧的倍速，默认1.1倍速。 **说明** 仅2.21.0以下版本Web播放器SDK支持设置本参数，2.21.0及以上版本如需在HLS直播模式下设置追帧，请参考`hlsOption.maxLiveSyncPlaybackRate`属性。 |
| chasingSecondSpeed | Number | 第二段追帧的倍速，默认1.2倍速。 **说明** 仅2.21.0以下版本Web播放器SDK支持设置本参数，2.21.0及以上版本如需在HLS直播模式下设置追帧，请参考`hlsOption.maxLiveSyncPlaybackRate`属性。 |
| hlsOption.maxLiveSyncPlaybackRate | Number | HLS直播模式下，设置直播追帧时的播放速度，默认为1，表示不追帧。 - 配置示例： ``` hlsOption: { maxLiveSyncPlaybackRate: 1.5, // 设置追帧的倍速 liveSyncDurationCount: 3 // 设置触发追帧的延迟切片个数 } ``` - 示例含义：当直播延迟大于3个切片的时长时，播放器会以1.5倍速播放追赶进度到3个切片（考虑到播放器需要一定的缓冲以应对网络变化，请谨慎修改`liveSyncDurationCount`的值，该值太小可能会引发卡顿）。 **说明** 仅2.21.0及以上版本Web播放器SDK支持设置本参数。 |
| flvFrameChasing | Boolean | FLV直播模式下，是否开启追帧，取值： - **true**：开启追帧。 - **false**：不开启追帧。 默认值为**false**。 |
| keyShortCuts | Boolean | 是否启用快捷键，取值： - **true**：开启快捷键。 - **false**：不开启快捷键。 默认值为**false**。 **说明** 方向键（左右键）控制快进和快退，方向键（上下键）控制音量的增减，空格键暂停和播放。 |
| keyFastForwardStep | Number | 快进快退的时间长度，单位：秒。默认为10秒。 |
| rtsFallback | Boolean | 当浏览器不支持RTS或RTS拉流失败时，播放器会自动尝试使用FLV/HLS进行降级播放，且优先选择延迟更低的FLV，当浏览器不支持FLV时，会选择HLS。 此功能是默认开启的，如果您需要禁用，可以传false。 |
| rtsFallbackType | String | 指定RTS降级到的协议，可选 HLS/FLV，默认不传此参数，代表自动选择，播放器会优先选择延迟更低的FLV，如果浏览器不支持则降级到HLS。 |
| rtsFallbackSource | String | 我们推荐使用播放器的默认降级策略，但是如果您希望指定固定的拉流地址进行降级，可以使用此参数。 |
| mediaAuth | String | 通用媒体管理服务的视频播放凭证。 可以登录[通用媒体管理服务控制台](https://ims.console.aliyun.com/light/media/list)获取（路径：**媒资管理** > **视频管理** > **管理** > **基础配置**）。示例：pg89f1200baw94rmcky2e\\*\\*\\*\\* **说明** Web播放器SDK 2.10.0及以上版本支持。 |
| traceId | String | traceId为您自有的用户唯一标识符，将traceId传入公共埋点，便于跟踪上报日志。正常情况下，Web播放器SDK已默认开启日志上报，传递traceId，可便于您标识用户身份；如果不传递，Web播放器SDK会默认生成一个uuid（播放器SDK生成的唯一标识符）并存储在浏览器缓存中。 **说明** Web播放器SDK 2.10.0及以上版本支持。 |
| textTracks | Array | 设置WebVTT外挂字幕，示例如下： ``` textTracks: [ { kind: 'subtitles', label: '中文', src: '字幕地址', srclang: 'zh-CN', default: true }, { kind: 'subtitles', label: '英文（美国）', src: '字幕地址', srclang: 'en-US' } ], ``` 字段解释如下： - kind：vtt类型，取值包括subtitles和captions。 - label：用于显示的字幕名称。 - srclang：字幕语言。 - src：字幕地址，请允许跨域访问。 - default：是否设置为默认显示字幕，取值为true和false。仅Web播放器SDK 2.15.7及以上版本支持设置该字段。 **说明** - Web播放器SDK 2.12.0及以上版本支持。 - WebVTT外挂字幕暂不支持以下浏览器： - IE - 安卓QQ浏览器、OPPO/一加的系统浏览器 - 其他劫持video标签的浏览器 - 字幕属性的详细说明可参考[HTML规范](https://html.spec.whatwg.org/multipage/media.html#the-track-element)。 - 更多关于字幕的进阶设置，请参见[外挂字幕](https://help.aliyun.com/zh/vod/developer-reference/advanced-features-3#p-w3a-4jl-c4h)。 |
| ratio | Number | 设置播放器按照固定比例缩放。例如：已知视频长宽比为16:9，通过设置播放器参数为`width: "100%", ratio: 16/9`，如此播放器则可以和视频内容保持比例一致，并且可以随页面缩放而自动等比例缩放。 |
| extLanguageTexts | Object | 播放器SDK内置了一套中英文界面文案，您可以通过本属性自定义部分界面的显示文案。以修改分辨率的显示文案为例：**HD**默认显示为**高清**，可以通过以下方式修改**HD**显示为**1080p**。 ``` extLanguageTexts: { 'zh-cn': { 'HD': "1080p" } } ``` |
| speedLevels | Array | 设置自定义倍速列表数组，key表示倍速数值，text表示UI文本，若不传则会使用默认列表。参数取值示例如下： ``` speedLevels: [ {"key": 0.25, "text": "0.25"}, {"key": 0.5, "text": "0.5"}, {"key": 1, "text": "原速"}, {"key": 1.25, "text": "1.25"}, {"key": 1.5, "text": "1.5"}, {"key": 2,"text": "2"} ] ``` |
| logo | Array | 设置自定义Logo图片。示例如下： ``` logo: [{ width: 30, position: 'bottom-right', origin: 'content', src: 'a.png' }, { width: 20, position: 'bottom-right', offsetY: -20, origin: 'content', src: 'b.png' }] ``` 字段解释如下： - src：Logo图片地址。 - origin：定位参照物。取值如下： - box：播放器 - content：视频内容 - width/height：Logo的宽高，单位是百分比（根据origin计算），如果只指定一边，则另一边按图片比例缩放。 - position：Logo的相对位置，相对origin定位。取值如下： - top-left：左上 - top-right：右上 - bottom-left：左下 - bottom-right：右下 - offsetX/offsetY：相对于position的偏移，单位：百分比%（根据origin计算）。 |
| license | Object | 如需使用[播放质量监控（旧版）](https://help.aliyun.com/zh/vod/user-guide/playback-quality-monitoring)、[单点追查](https://help.aliyun.com/zh/vod/developer-reference/single-point-tracing)、[播放H.265/H.266编码协议视频流](https://help.aliyun.com/zh/vod/developer-reference/advanced-features-3#section-j4v-zwt-641)等增值功能，请先填写[Web播放器SDK增值服务申请表单](https://yida.alibaba-inc.com/o/webplayer#/)申请License授权后，再按如下方式接入License： ``` // domian为申请License授权时所填写的域名 // Key为License密钥 license: { domain: "example.com", key: "example-key" } ``` |
| mute | Boolean | 设置是否静音播放。在浏览器禁止自动播放时可以通过配置此参数进行静音自动播放。详情请参见[进阶功能](https://help.aliyun.com/zh/vod/developer-reference/advanced-features-3#p-00w-jrt-lxe)。 |
| clickPause | Boolean | 点击视频画面进行暂停或播放。 - true：启用。 - false：禁用。 PC端默认值为true，移动端默认值为false，请勿与dbClickSkip属性同时使用以避免交互冲突。 |
| disablePip | Boolean | 隐藏浏览器自带的画中画按钮。 **说明** - 仅Web播放器SDK 2.20.0及以上版本支持。 - 仅火狐浏览器116及以上版本支持。 |
| env | String | 播放器的埋点数据默认会上传到中国数据中心，如果您有海外数据合规需求，请传入参数 env: 'SEA'，数据将上传到新加坡数据中心。 |
| watchStartTime | Number | 单独使用，代表开始播放的时间； 和 watchEndTime 配合使用，开启区间播放功能，只能在开始和结束时间范围内播放和拖拽进度条。 单位：秒 |
| watchEndTime | Number | 和 watchStartTime 配合使用，开启区间播放功能，只能在开始和结束时间范围内播放和拖拽进度条。 如果参数值小于watchStartTime，则watchStartTime失效。 单位：秒 |
| start | Number | 和 end 配合使用，截取视频的一部分作为一个独立的视频。如：原视频时长 60 秒，设置 start:10、end:30 后，视频显示时长为 20 秒，并从原视频的第 10 秒开始播放。 |
| end | Number | 和 start 配合使用，截取视频的一部分作为一个独立的视频。如：原视频时长 60 秒，设置 start:10、end:30 后，视频显示时长为 20 秒，并从原视频的第 10 秒开始播放。 |
| dbClickFullscreen | Boolean | 是否开启双击全屏，默认在 PC 端开启。 |
| longPressFastForward | Boolean | 长按倍速功能（仅支持移动端），取值： - true（默认值）：启用。 - false：禁用。 |
| dbClickSkip | Boolean | 双击左侧区域快退、双击右侧区域快进功能（仅支持移动端），取值： - true（默认值）：启用。 - false：禁用。 请勿与clickPause属性同时使用以避免交互冲突。 |
| enableMockFullscreen | Boolean | 网页全屏功能。播放器默认调用浏览器全屏API，在 iOS浏览器及部分Android浏览器上全屏会被系统播放器接管，导致UI消失等问题。如需避免被接管，可开启此参数以CSS实现伪全屏。默认值为false。 |
| watermark | Object | 设置动态水印。示例如下： ``` watermark: { enable: true, text: '版权所有 ©2026', mode: 'BULLET' } ``` 字段解释如下： - enable：是否启用动态水印。 - text：水印显示的文字内容。 - mode：水印模式。可选值： - BULLET：跑马灯（默认）。 - GHOST：随机闪烁。 - direction：运动方向。可选值： - RTL：从右到左（默认）。 - LTR：从左到右。 - STATIC：静止，仅GHOST模式有效。 - speed：运动速度，范围为`0~100`。值越大速度越快。BULLET模式默认值为50，GHOST模式默认值为30。 - interval：水印消失后到下一次出现的间隔时间，默认值为3000（毫秒）。 - duration：仅GHOST模式有效，每次水印的显示时长，默认值为5000（毫秒）。 - opacity：水印文字透明度，范围为`0~1`，默认值为0.5。 - fontSize：水印文字大小，CSS font-size值，默认值为14px。 - fontColor：水印文字颜色，支持任意CSS颜色值，默认值为#FFFFFF。 - top：水印显示区域距容器顶部的距离。支持像素值（如 `50`）或百分比（如 `'20%'`）。 - bottom：水印显示区域距容器底部的距离。支持像素值或百分比。 - left：水印显示区域距容器左侧的距离。支持像素值或百分比，仅GHOST模式有效。 - right：水印显示区域距容器右侧的距离。支持像素值或百分比，仅GHOST模式有效。 |
| memoryPlay | Object | 要在播放器中启用记忆播放功能，需要在播放器配置中添加 `memoryPlay` 选项。示例如下： ``` // 记忆播放配置 memoryPlay: { enable: true, // 启用记忆播放功能 autoSeek: false // 是否自动跳转到记忆位置 } ``` **字段解释如下：** - enable: 是否启用记忆播放功能。取值为： - `false`（默认值）： 禁用记忆播放功能。 - `true`：启用记忆播放功能。 - autoSeek：是否自动跳转到记忆位置**。**取值为： - `false`（默认值）：显示提示框让用户选择是否跳转（推荐）。 - `true`：视频加载后自动跳转到记忆位置并显示提示。 `getTimeFunction`/`saveTimeFunction` 用于需要自主控制播放进度的场景（如多端同步），未传入时播放器默认通过 `localStorage`存储播放进度。 - getTimeFunction：用于从指定存储位置获取记忆时间。函数定义:为`(videoKey) => number｜Promise<number>`。 - saveTimeFunction**：**用于保存当前播放时间。函数定义为`(videoKey, currentTime) => void`。 |
| menuMode | String | 设置播放速度 、清晰度 、字幕 、音轨 这四个组件展示位置 。取值为： - fold（默认值）：放在设置二级菜单中。 - expand：显示在控制栏上（一级菜单）。 |

## 方法

方法需要在ready事件发生之后或创建播放器ready回调里，可以在创建播放器构造函数的回调函数里调用。示例如下：

```
// 方式一：
var player = new Aliplayer({}, function (player) {
  player.play();
});

// 方式二：
var player = new Aliplayer({});
function handleReady(player) {
  player.play();
};
player.on('ready', handleReady);
```

**Aliplayer实例可以调用的方法如下：**

### **play()**

播放视频。

**函数定义**

```
() => Player
```

### **pause()**

暂停视频。

```
(showPlayButton?: boolean) => Player
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| showPlayButton | Boolean | 否   | 是否显示播放按钮。 |

### **replay()**

重播视频。

**函数定义**

```
() => Player
```

### **seek()**

跳转到指定时刻进行播放。

**函数定义**

```
(time: number) => Player 
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| time | number | 是   | 要跳转的时刻，时间单位：秒。 |

### **dispose()**

播放器销毁。

**函数定义**

```
() => void
```

### **getCurrentTime()**

获取当前的播放时刻，返回的时间单位：秒。

**函数定义**

```
() => number
```

### getDuration**()**

获取视频总时长，返回的单位为秒，这个需要在视频加载完成以后才可以获取到，可以在play事件后获取。

**函数定义**

```
() => number
```

### **getVolume()**

获取当前的音量，返回值为**0~1**的实数。iOS和部分Android会失效。

**函数定义**

```
() => number | undefined
```

### **setVolume()**

设置音量。

**函数定义**

```
(volume: number) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| volume | number | 是   | vol为**0~1**的实数，iOS和部分Android会失效。 |

### **mute()**

设置静音。

**函数定义**

```
(quiet?: boolean) => Player
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| quiet | boolean | 否   | 静音时是否隐藏左下角的文字提示。 |

### unMute**()**

取消静音。

**函数定义**

```
(quiet?: boolean) => Player
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| quiet | boolean | 否   | 取消静音时是否隐藏左下角的文字提示。 |

### getPlayTime**()**

获取用户的真实播放时长（不包含暂停时长，倍速情况下统计真实物理时间），返回值的单位是秒。

**函数定义**

```
() => number
```

### loadByUrl**()**

切换视频。目前只支持同种格式（如 MP4、HLS、FLV）之间切换，不同格式切换请销毁实例后重新创建。

**函数定义**

```
(url: string, seconds?: number, autoPlay?: boolean) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| url | string | 是   | 要切换的视频地址。 |
| seconds | number | 否   | 切换后的起播位置。 |
| autoPlay | boolean | 否   | 切换后是否自动播放。 |

### replayByVidAndPlayAuth**()**

点播（VOD）视频切换，仅支持同种格式视频切换。

**函数定义**

```
(vid: string, playauth: string) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| vid | string | 是   | 视频ID。 |
| playauth | string | 是   | 播放凭证。 |

### replayByVidAndAuthInfo**()**

媒体处理（MPS）视频切换，仅支持同种格式视频切换。

**函数定义**

```
(vid: string, accId: string, accSecret: string, stsToken: string, authInfo: string, domainRegion: string) => void
```

参数详情请参见[MPS播放](https://help.aliyun.com/zh/mps/use-cases/play-videos)。

### replayByMediaAuth**()**

通用媒体服务视频切换，仅支持同种格式视频切换。

**函数定义**

```
(mediaAuth: string) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| mediaAuth | string | 是   | 播放凭证。 |

### **getBuildInComponent()**

获取内置UI组件（如全屏按钮、进度条等）。

**函数定义**

```
(name: string) => BuildInComponent;
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| name | string | 是   | 内置组件名称（如fullScreenButton）可参见[配置skinLayout属性](https://help.aliyun.com/zh/vod/developer-reference/configure-skinlayout)，每个组件均支持hide/show方法控制隐藏/显示。 |

### setPlayerSize**()**

设置播放器尺寸大小。

**函数定义**

```
(width: string, height: string) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| width | string | 是   | 设置播放器大小，取值： - **400px** - **60%** |
| height | string | 是   |

### setSpeed**()**

手动设置播放的倍速。移动端可能会失效，比如Android微信。倍速播放UI默认是开启的。

**函数定义**

```
(speed: number) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| speed | number | 是   | 支持0.5~2倍速播放。 |

**说明**

关掉倍速的方法：

-   目前无法单独关闭或者自定义倍速，只能整体关掉设置。
    
-   通过hack方式关掉倍速是通过样式覆盖来实现的：
    
    ```
    .prism-setting-speed {
       display: none !important;
     }
    ```
    

### **setTraceId()**

传入公共埋点，用于日志跟踪。

**函数定义**

```
(traceId: string) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| traceId | string | 是   | 唯一识别ID。 |

**说明**

Web播放器SDK 2.10.0及以上版本支持。

### **setSanpshotProperties()**

设置截图参数。

**函数定义**

```
(width: number, height: number, rate: number) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| width | number | 是   | 高度、宽度单位为px，截图质量取值范围为0-1之间的数字，默认是1。视频截图详细说明请参见[视频截图](https://help.aliyun.com/zh/vod/developer-reference/advanced-features-3#p-6e6-unl-31c)。 |
| height | number | 是   |
| rate | number | 是   |

### **fullscreenService.requestFullScreen()**

播放器全屏。

**函数定义**

```
() => Player
```

### **fullscreenService.cancelFullScreen()**

播放器退出全屏，iOS调用无效，。

**函数定义**

```
() => Player
```

### **fullscreenService.getIsFullScreen()**

获取播放器全屏状态。

**函数定义**

```
() => boolean
```

### **getStatus()**

获取播放器状态。返回类型String取值示例如下：

-   **init**：初始化。
    
-   **ready**：准备。
    
-   **loading**：加载中。
    
-   **play**：播放。
    
-   **pause**：暂停。
    
-   **playing**：正在播放。
    
-   **waiting**：等待缓冲。
    
-   **error**：错误。
    
-   **ended**：结束。
    

**函数定义**

```
() => string
```

### **liveShiftSerivce.setLiveTimeRange()**

设置直播的开始结束时间，开启直播时移功能时使用。

**函数定义**

```
(start: string, end: string) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| start | string | 是   | start 直播开始时间。 |
| end | string | 是   | end 直播结束时间。 |

**示例**

```
player.liveShiftSerivce.setLiveTimeRange('2025/03/21 12:43:00', '2025/03/21 23:31:00')
```

### **setRotate()**

设置播放器旋转角度。

**函数定义**

```
(rotate: number) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| rotate | number | 是   | 正数表示正时针旋转，负数表示逆时针旋转。示例：setRotate(90)。更多信息，请参见[设置显示模式](https://help.aliyun.com/zh/vod/developer-reference/basic-features#section-u71-uwo-vvr)。 |

### **getRotate()**

获取播放器旋转角度。

**函数定义**

```
() => number
```

更多信息，请参见[设置显示模式](https://help.aliyun.com/zh/vod/developer-reference/basic-features#section-u71-uwo-vvr)。

### **setImage()**

设置镜像。

**函数定义**

```
(type: string) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| type | string | 是   | 取值： - **horizon**：水平。 - **vertical**：垂直。 示例：setImage(‘horizon’)。更多信息，请参见[设置显示模式](https://help.aliyun.com/zh/vod/developer-reference/basic-features#section-u71-uwo-vvr)。 |

### **setCover()**

设置封面。

**函数定义**

```
(coverUrl: string) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| coverUrl | string | 是   | 封面地址。 |

### **setProgressMarkers()**

设置打点。

**函数定义**

```
(markers: Array<{ time: number, text: string }>) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| markers | Array<markers> | 是   | markers：打点数据集合，必选； marker.time：打点时间，必选； marker.text：打点文字，必选； 详见参数 progressMarkers。 |

### **setPreviewTime()**

设置试看时间。

**函数定义**

```
(time: number) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| time | number | 是   | 单位：秒。更多信息，请参见[试看](https://player.alicdn.com/aliplayer/presentation/index.html?spm=a2c4g.11186623.2.35.6bdcbf80h3YEIM&type=preview)。 |

### **getPreviewTime()**

获取试看时间。

**函数定义**

```
() => number
```

### **isPreview()**

是否试看。

**函数定义**

```
() => boolean
```

### **getCurrentPDT()**

HLS的视频格式支持实时获取ProgramDateTime。

**函数定义**

```
() => number | undefined
```

### **setTextTracks()**

设置一组WebVTT字幕。

**函数定义**

```
(textTracks: Array<{ kind: string, label: string, src: string, srclang: string }>) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| textTracks | Array<object> | 是   | 示例如下： ``` player.setTextTracks([ { kind: 'subtitles', label: '中文', src: '字幕地址', srclang: 'zh-CN' },{ kind: 'subtitles', label: '英文（美国）', src: '字幕地址', srclang: 'en-US' }]) ``` **说明** Web播放器SDK 2.12.0及以上版本支持。 |

### **setLogo()**

设置自定义Logo图片。

**函数定义**

```
(logoList: Array<{ width: number, position: string, origin: string, src: string }>) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| logoList | Array<object> | 是   | 示例如下： ``` player.setLogo([{ width: 30, position: 'bottom-right', origin: 'content', src: 'a.jpg' }, { width: 20, position: 'bottom-right', offsetY: -20, origin: 'content', src: 'b.jpg' }]) ``` 各字段的详细解释参考属性：logo。 |

### **setWatchTime()**

动态更新当前视频的 watchStartTime/watchEndTime。

**函数定义**

```
(start: number, end: number) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| start | string | 是   | start 开始时间。 |
| end | string | 是   | end 结束时间。 |

### **setNextWatchTime()**

设置下一个视频的 watchStartTime/watchEndTime。如果您要使用loadByUrl/replayByVidAndPlayAuth 切换视频，且下一个视频的播放区间和当前视频不同，可以先调用 setNextWatchTime 设置下个视频的区间。

**函数定义**

```
(start: number, end: number) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| start | string | 是   | start 开始时间。 |
| end | string | 是   | end 结束时间。 |

### **setStartEnd()**

动态更新当前视频的 start/end。

**函数定义**

```
(start: number, end: number) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| start | string | 是   | start 开始时间。 |
| end | string | 是   | end 结束时间。 |

### **setNextStartEnd()**

设置下一个视频的 start/end。如果您要使用 loadByUrl/replayByVidAndPlayAuth 切换视频，且下一个视频的截取区间和当前视频不同，可以先调用 setNextStartEnd 设置下个视频的区间。

**函数定义**

```
(start: number, end: number) => void
```

**参数**

| **名称** | **参数类型** | **是否必选** | **说明** |
| --- | --- | --- | --- |
| start | string | 是   | start 开始时间。 |
| end | string | 是   | end 结束时间。 |

### **takeSnapshot()**

截图，返回的 base64 可以直接用 img.src 加载；可以使用 setSanpshotProperties 设置截图质量，snapshotWatermark 设置截图水印。

注：部分移动端浏览器由于 video 被劫持（如 UC、QQ 浏览器），可能无法使用截图功能。

**函数定义**

```
() => { time: number, base64: string, binary: string, error: Error | null }
```

**返回值**

| **名称** | **参数类型** | **说明** |
| --- | --- | --- |
| time | string | 截图时间。 |
| base64 | string | 截图内容base64。 |
| binary | string | 截图内容为二进制字符串。 |
| error | Error | 截图异常详情。 |

### showControlBar**()**

显示控制条。

**函数定义**

```
() => void
```

### hideControlBar**()**

隐藏控制条。

**函数定义**

```
() => void
```

## 事件

### **播放器事件**

| **名称** | **说明** |
| --- | --- |
| ready | 播放器视频初始化按钮渲染完毕。播放器UI初始设置需要此事件后触发，以避免UI被初始化所覆盖。 **说明** 播放器提供的方法需要在该事件发生后才可以调用。 |
| play | 视频由暂停恢复为播放时触发。 |
| pause | 视频暂停时触发。 |
| canplay | 能够开始播放音频和视频时发生，会多次触发，仅限H5播放器。 |
| playing | 播放中，会触发多次。 |
| ended | 当前视频播放完毕时触发。 |
| liveStreamStop | 直播流中断时触发。HLS直播流在重试5次未成功后触发。提示上层流中断或需要重新加载视频。 **说明** 如果HLS直播流断流或者出错，播放器会自动重试5次，不需要上层添加重试逻辑。 |
| onM3u8Retry | HLS直播流中断后重试事件，每次断流只触发一次。 |
| hideBar | 控制栏自动隐藏事件。 |
| showBar | 控制栏自动显示事件。 |
| waiting | 数据缓冲事件。 |
| timeupdate | 播放位置发生改变时触发，可通过getCurrentTime方法，得到当前播放时间。 |
| snapshoted | 截图完成事件。 |
| requestFullScreen | 全屏事件。 |
| cancelFullScreen | 取消全屏事件，iOS下不会触发。 |
| error | 错误事件。 |
| startSeek | 开始拖拽，参数返回拖拽点的时间。 |
| completeSeek | 完成拖拽，参数返回拖拽点的时间。 |
| resolutionChange | 直播情况下，推流端切换了分辨率。 |
| seiFrame | HLS或FLV收到SEI消息。 |
| rtsFallback | 当RTS降级时触发。其中，参数 `reason`为降级的原因，`fallbackUrl`为降级到的地址。 |
| settingSelected | 当设置列表（倍速、清晰度、字幕等）被选中时触发。 **说明** 因开源倍速插件与播放器设置不同步，使用它需自定义代码并重新编译。您可定义事件监听，若需要使用播放器的`settingSelected`，则需要移除该插件。 ``` /** * 设置列表被选中，如切换倍速到1.25X： * {name: '倍速', type: 'speed', text: '1.25X', key: 1.25} */ ``` |
| rtsTraceId | 当RTS拉流成功时触发，通过订阅该事件，可以获取到RTS TraceId。打印日志中的参数`data.paramData`中的参数字段traceId为拉流的TraceId，source为当前RTS流的播放地址。 ``` player.on('rtsTraceId', function(data) { console.log('[EVENT]rtsTraceId', data.paramData); }) ``` |
| autoplay | 自动播放成功或失败时会触发。回调参数`event.paramData`为`true`时表示自动播放成功；为`false`时表示自动播放失败，此时需要用户交互才能播放。 |
| mutedAutoplay | 当`autoplayPolicy.fallbackToMute`设置为`true`时，静音自动播放成功时触发。 |
| videoUnavailable | 当视频编码格式不支持导致视频播放发生黑屏时触发。例如在不支持H.265的浏览器上播放视频，会出现视频黑屏，只有声音播放，此时会触发该事件。 |

### **订阅事件**

-   通过播放器实例的on方法订阅。示例如下：
    
    ```
    function handleReady() {};
    player.on('ready', handleReady);
    // 有些事件会频繁触发，可以通过 player.one 只监听一次
    player.one('canplay', () => {});
    ```
    
-   通过播放器实例的off方法取消订阅。示例如下：
    
    ```
    player.off('ready',handleReady);
    ```