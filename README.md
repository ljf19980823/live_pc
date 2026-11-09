# Lisheng-Live-PC

#### 介绍
立升直播系统PC端

#### 软件架构
软件架构说明


#### 安装教程

1.  Windows：运行 `.exe` 安装包，首次安装默认仅供当前用户使用，安装目录页面可点击“浏览”选择目标文件夹。重装沿用已有的安装范围和目录，安装前先卸载旧版；若重新选择目录，旧安装也会先卸载。旧版卸载失败会停止安装，避免继续留下两个版本。
2.  macOS：打开 `.dmg`，将 `Learn InClass.app` 拖到“应用程序”，遇到同名应用选择“替换”。直接打开 DMG 内的 App 时也可选择“安装到应用程序”，自动替换已退出的同名旧版并重新启动；若旧版仍在运行，需要先退出。也可拖到其他有写入权限的目标文件夹并替换旧版，从自选目录运行时选择“从当前位置运行”。安装完成后推出桌面上的安装磁盘。DMG 本身不提供目录选择向导。
3.  修改打包配置后，需要重新运行 GitHub Actions 的 `Build Electron App` 工作流并下载新安装包；已有安装包不会改变。本地打包可使用 `npm run electron:build`（Windows）或 `npm run electron:build:mac`（macOS）。

应用名称和桌面快捷方式固定为 `Learn InClass`，版本号只放在下载的安装包文件名中。升级时不要修改 `build.appId`、`build.nsis.guid` 或给 `build.productName`、`build.nsis.shortcutName` 加版本号。当前固定 GUID 与历史版本从 `com.lisheng.live.pc` 生成的 GUID 一致，继续使用原卸载注册信息。

已经积累的、名称带版本号或位于其他目录的应用副本需要清理一次：Windows 在“设置 → 应用 → 已安装的应用”中卸载旧版，确认剩余快捷方式的目标路径后删除失效的旧图标；macOS 退出旧版，保留目标安装目录内的 `Learn InClass.app`，将其他旧版 App 移到废纸篓，并推出旧 DMG 磁盘。程序不会扫描或删除用户其他目录中的 App。

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
