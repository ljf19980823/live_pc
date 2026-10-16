# Lisheng-Live-PC

#### 介绍
立升直播系统PC端

#### 软件架构
软件架构说明


#### 安装教程

1.  xxxx
2.  xxxx
3.  xxxx

#### 使用说明

1.  xxxx
2.  xxxx
3.  xxxx

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)

## Windows 后台音频试修（win-audio-v2）

默认仅 Windows 在 `app.whenReady()` 前应用 `combined` 组合配置：请求进程内音频服务、禁止后台媒体挂起、禁止后台定时器节流、关闭原生遮挡计算和后台 EcoQoS 特性。保留上一版 `disable-renderer-backgrounding`、窗口 `backgroundThrottling: false`、推流期间 `prevent-app-suspension` 和跳过定时 GC/缓存清理。

需要同时更新课堂 Web（诊断标记 `audio-clock-v3`）和 Electron 客户端。屏幕共享的系统音频、采样率、SDK 混音功能保持现有业务配置。新版是针对已观察到的后台混音时钟欠速的试修，仍需 Windows 真机听测。

### 同包切换配置

先下课并完全退出所有客户端进程，再用 PowerShell 启动安装后的实际 EXE。参数只影响本次启动，不需要重复打包。

```powershell
$exe = 'C:\实际安装目录\Learn InClass.exe'
& $exe --live-audio-mode=combined
```

可将 `combined` 改为以下值，每次修改后重新完全退出、启动：

| 模式 | 这一版新增开关 |
| --- | --- |
| `combined`（默认） | 以下三组全部启用 |
| `in-process` | `disable-features` 合并 `AudioServiceOutOfProcess` |
| `background-media` | `disable-background-media-suspend` |
| `background-policy` | `disable-background-timer-throttling`，禁用 `CalculateNativeWinOcclusion`、`UseEcoQoSForBackgroundProcess` |
| `baseline` | 不添加上述开关，保留上一版保护作对照 |

默认保留硬件加速。可附加 `--live-audio-disable-gpu` 通过 `app.disableHardwareAcceleration()` 进行关闭硬件加速的同包对照，测试时同时观察屏幕共享帧率与 CPU。也支持环境变量 `LISHENG_AUDIO_MODE`、`LISHENG_AUDIO_DISABLE_GPU=1`，命令行优先；`--live-audio-disable-gpu=0` 覆盖环境变量。无效模式回退到 `combined`，记录 `invalidMode: true`。不覆盖已有 `disable-features` 项，不关闭音频服务沙箱。

### 取证

在实际课堂 iframe 的开发者工具中执行：

```js
const state = liveAudioDiagnostics.snapshot();
state.native.environment; // fixVersion、Electron/Chrome 版本、audioRuntime 实际启动配置
state.mixer?.clock; // 五秒采样：音频时钟增量/真实时间增量 ratio，正常接近 1
liveAudioDiagnostics.startRecording(60);
// 切出/最小化，复现后恢复窗口
await liveAudioDiagnostics.download();
```

默认先不录音完成一轮听测，再录音复现。共享系统声音时 `audioPath` 通常为 `sdk-mixer`，`secondary` 是共享音频轨。时钟速度连续两轮低于 0.9 会记录 `mixer-clock-slow`，重复告警限流 30 秒；恢复后记录 `mixer-clock-recovered`。原生状态 `audioServiceProcesses`、`processSampleTime` 记录最近一次 Electron 报告的音频服务进程；开关存在只代表请求配置，空进程列表不能单独证明音频服务已切至进程内。课堂的 `nativeStateAgeMs` 可用于识别缓存原生状态。

导出 ZIP 含诊断 JSON、麦克风采集音轨和 SDK 发送音轨的对照 WebM。客户端 `crash.log` 的 `[live-audio]` 同时保留窗口焦点/最小化、上述告警、配置和进程采样；可在外层 Electron 页面执行 `window.electronAPI.openCrashLogFolder()` 打开目录。日志与录音在本地导出，不自动上传。

本地回归：`node scripts/test-live-audio.cjs`。课堂仓库的 `Web/README.md` 包含完整听测、原 SDK 对照与导出步骤。
