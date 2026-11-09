; 沿用已有安装范围，避免“所有用户”版与“当前用户”版各留一份。
; 同时存在两种安装时选择所有用户，electron-builder 会卸载两处旧安装。
; 首次安装默认当前用户，目录选择页面仍可使用。
!macro customInstallMode
  !ifndef BUILD_UNINSTALLER
    ${If} $hasPerMachineInstallation == "1"
      StrCpy $isForceMachineInstall "1"
    ${Else}
      StrCpy $isForceCurrentInstall "1"
    ${EndIf}
  !endif
!macroend

; electron-builder 默认在旧卸载程序无法启动时继续安装，可能留下旧版。
; 失败时停止；沿用框架卸载流程及 --updated 参数，保留升级时的用户数据。
!macro checkPreviousUninstall
  ${If} ${Errors}
    MessageBox MB_OK|MB_ICONSTOP "无法运行旧版本的卸载程序。请先在系统设置中修复或卸载旧版本，再重新安装。" /SD IDOK
    SetErrorLevel 2
    Quit
  ${EndIf}
  ${If} $R0 != 0
    MessageBox MB_OK|MB_ICONSTOP "旧版本卸载失败（错误码：$R0）。请退出旧版本并完成卸载，再重新安装。" /SD IDOK
    SetErrorLevel 2
    Quit
  ${EndIf}
!macroend

!macro customUnInstallCheck
  !insertmacro checkPreviousUninstall
!macroend

!macro customUnInstallCheckCurrentUser
  !insertmacro checkPreviousUninstall
!macroend

; 安装后检查随包提供的 Visual C++ Redistributable（离线方式）
!macro customInstall
  ; 检测是否已安装 VC++ 2015-2022 x64 运行库
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
  ${If} $0 != 1
  ${AndIf} ${FileExists} "$INSTDIR\resources\vc_redist.x64.exe"
    DetailPrint "正在安装 Visual C++ 运行库，请稍候..."
    ExecWait '"$INSTDIR\resources\vc_redist.x64.exe" /install /quiet /norestart'
  ${EndIf}
!macroend

!macro customUnInstall
!macroend
