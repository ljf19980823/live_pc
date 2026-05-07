<template>
  <div class="video-player-mask" v-if="visible" @click.self="handleClose">
    <div class="video-player-box">
      <div class="video-player-header">
        <div class="video-player-title">{{ title || '视频播放' }}</div>
        <img
          src="@/assets/images/login/close.png"
          class="video-player-close"
          alt="关闭"
          @click="handleClose"
        >
      </div>
      <div class="video-player-body">
        <div v-if="initError" class="video-player-error">
          <div class="video-player-error-text">视频加载失败，请稍后重试</div>
        </div>
        <div v-else :id="playerId" class="video-player-container"></div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * VideoPlayer — 阿里云视频播放器组件
 *
 * 基于 aliyun-aliplayer SDK 实现，支持 URL 直接播放点播视频，
 * 以弹窗形式展示，关闭时自动销毁播放器实例，适合在各业务模块中复用。
 *
 * 使用示例：
 *   <VideoPlayer
 *     :visible="playerVisible"
 *     :source="'https://example.com/video.mp4'"
 *     title="课程回放"
 *     @close="playerVisible = false"
 *   />
 *
 * Props：
 *   visible  {Boolean}  是否显示播放弹窗
 *   source   {String}   视频播放地址（点播 URL）
 *   title    {String}   弹窗标题，默认 '视频播放'
 *
 * Events：
 *   close    关闭弹窗时触发，父组件需将 visible 置为 false
 */
import Aliplayer from 'aliyun-aliplayer'
import 'aliyun-aliplayer/build/skins/default/aliplayer-min.css'

/** 阿里云播放器 License 配置 */
const ALIPLAYER_LICENSE = {
  domain: 'fjlsjy123.com',   // 申请 License 时填写的域名
  key: 'xPQXSZn3Mq45H2eLW125d9c8910914548b973ab781f1bd6f7'       // 阿里云控制台获取的 License Key
}

/** 用于生成唯一的播放器容器 id，避免同页面多实例冲突 */
let playerIdCounter = 0

export default {
  name: 'VideoPlayer',

  props: {
    /**
     * 是否显示播放弹窗
     * @type {Boolean}
     * @default false
     */
    visible: {
      type: Boolean,
      default: false
    },

    /**
     * 视频播放地址
     * 可以是第三方点播地址，或阿里云点播服务中的播放地址
     * @type {String}
     * @default ''
     */
    source: {
      type: String,
      default: ''
    },

    /**
     * 弹窗标题，显示在播放器顶部
     * @type {String}
     * @default '视频播放'
     */
    title: {
      type: String,
      default: '视频播放'
    }
  },

  data() {
    return {
      /** 是否初始化失败（source 为空或播放器创建异常时为 true） */
      initError: false,
      /** Aliplayer 播放器实例 */
      playerInstance: null,
      /** 播放器挂载的 DOM 容器 id，每个组件实例唯一 */
      playerId: `aliplayer-${++playerIdCounter}`
    }
  },

  watch: {
    /**
     * 监听 visible 变化：
     *   true  → 等待 DOM 更新后初始化播放器
     *   false → 立即销毁播放器，释放资源
     */
    visible(val) {
      if (val) {
        this.$nextTick(() => {
          this.initPlayer()
        })
      } else {
        this.destroyPlayer()
      }
    },

    /** source 变更时（弹窗已打开状态）重新初始化播放器 */
    source(val) {
      if (this.visible && val) {
        console.log(val,'视频地址')
        this.$nextTick(() => {
          this.initPlayer()
        })
      }
    }
  },

  methods: {
    /**
     * 初始化阿里云播放器：
     * 1. 校验 source 是否有效
     * 2. 销毁已有实例，防止重复创建
     * 3. 创建新的 Aliplayer 实例并绑定到容器
     */
    async initPlayer() {
      this.initError = false

      if (!this.source) {
        this.initError = true
        return
      }

      this.destroyPlayer()

      try {
        const config = {
          id: this.playerId,
          source: this.source,
          width: '100%',
          height: '100%',
          autoplay: true,
          rePlay: false,
          playsinline: true,
          preload: true,
          controlBarVisibility: 'hover',
          useH5Prism: true
        }

        config.license = ALIPLAYER_LICENSE

        this.playerInstance = new Aliplayer(config, (player) => {
          console.log(config,'配置')
          console.log('VideoPlayer: 播放器初始化完成')
        })
      } catch (e) {
        console.error('VideoPlayer: 播放器初始化失败', e)
        this.initError = true
      }
    },

    /**
     * 销毁播放器实例并清空容器 innerHTML，
     * 防止下次打开时出现多个播放器重叠的问题。
     */
    destroyPlayer() {
      if (this.playerInstance) {
        try {
          this.playerInstance.dispose()
        } catch (e) {
          // 销毁失败时静默处理，不影响后续流程
        }
        this.playerInstance = null
      }
      const el = document.getElementById(this.playerId)
      if (el) el.innerHTML = ''
    },

    /** 关闭播放器，向父组件抛出 close 事件 */
    handleClose() {
      this.$emit('close')
    }
  },

  /** 组件销毁前主动释放播放器资源 */
  beforeDestroy() {
    this.destroyPlayer()
  }
}
</script>

<style lang="scss" scoped>
.video-player-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player-box {
  width:100vw;
  max-width: 100vh;
  background: #1a1a1a;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.video-player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  flex-shrink: 0;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
}

.video-player-title {
  font-size: 15px;
  font-weight: bold;
  color: #ffffff;
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-player-close {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 16px;
  opacity: 0.8;
  filter: brightness(10);

  &:hover {
    opacity: 1;
  }
}

.video-player-body {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.video-player-container {
  width: 100%;
  height: 100%;
}

.video-player-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player-error-text {
  font-size: 15px;
  color: #999999;
}
</style>
