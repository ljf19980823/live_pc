; 安装前检查并安装 Visual C++ Redistributable（离线方式）
!macro customInstall
  ; 检测是否已安装 VC++ 2015-2022 x64 运行库
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
  ${If} $0 != 1
    DetailPrint "正在安装 Visual C++ 运行库，请稍候..."
    ExecWait '"$INSTDIR\resources\vc_redist.x64.exe" /install /quiet /norestart'
  ${EndIf}
!macroend

!macro customUnInstall
!macroend
