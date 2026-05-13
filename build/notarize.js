/**
 * Mac 公证脚本（afterSign 钩子）
 * 仅在 macOS 环境且设置了 APPLE_ID 环境变量时执行公证
 *
 * 所需环境变量：
 *   APPLE_ID          - Apple 开发者账号邮箱
 *   APPLE_APP_PASSWORD - Apple ID 的应用专用密码（在 appleid.apple.com 生成）
 *   APPLE_TEAM_ID     - Apple 开发者 Team ID（在 developer.apple.com 查看）
 */

const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  // 仅 macOS 平台执行公证
  if (electronPlatformName !== 'darwin') return

  // 未配置 Apple ID 时跳过（本地开发调试场景）
  if (!process.env.APPLE_ID) {
    console.log('⚠️  跳过公证：未设置 APPLE_ID 环境变量')
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  console.log(`🔏 开始公证：${appPath}`)

  await notarize({
    tool: 'notarytool',
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  })

  console.log('✅ 公证完成')
}
