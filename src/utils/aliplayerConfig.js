// 统一所有播放器的倍速选项，保留 SDK 原有档位并追加 2.5x、3x。
export const ALIPLAYER_SPEED_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3].map(key => ({
  key,
  text: `${key}x`
}))
