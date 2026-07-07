<template>
  <div class="nc-wrap">
    <!-- 检测结果卡片 -->
    <div class="nc-card">
      <!-- 网络连接 / DNS -->
      <div class="nc-row">
        <span class="nc-row-label">网络连接情况</span>
        <span class="nc-row-val" :class="statusClass(networkStatus)">
          {{ statusText(networkStatus) }}
        </span>
      </div>
      <div class="nc-row">
        <span class="nc-row-label">域名解析检测</span>
        <span class="nc-row-val" :class="statusClass(dnsStatus)">
          {{ statusText(dnsStatus) }}
        </span>
      </div>

      <!-- 服务器延迟列表 -->
      <!-- <div class="nc-section-header">服务器连接情况</div>
      <div
        v-for="srv in servers"
        :key="srv.name"
        class="nc-row"
      >
        <span class="nc-row-label">{{ srv.name }}</span>
        <span class="nc-row-val" :class="latencyClass(srv)">
          {{ latencyText(srv) }}
        </span>
      </div> -->
    </div>

    <!-- 常见问题 -->
    <div class="nc-faq">
      <div class="nc-faq-title">
        <i class="el-icon-warning nc-faq-icon"></i>
        常见问题
      </div>
      <ul class="nc-faq-list">
        <li>建议使用有线网络，相比无线网（Wi-Fi）更加稳定流畅</li>
        <li>公共网络下尝试切换网络，如一个网络下用户人多，易导致卡顿</li>
        <li>家庭网络下尝试重启路由器，路由器长期运行后可能会导致卡顿</li>
        <li v-if="$isWindows">检查 Windows 防火墙设置：前往 控制面板 &gt; Windows Defender 防火墙 &gt; 允许应用通过防火墙，确认本应用已添加例外</li>
        <li v-else-if="$isMac">检查 macOS 防火墙设置：前往 系统设置 &gt; 网络 &gt; 防火墙，确认本应用已允许传入连接</li>
        <li>关闭其他占用网络的应用程序，如视频网站、下载工具等</li>
        <li v-if="$isWindows">尝试关闭或暂停杀毒软件、VPN 软件，确认其未拦截网络请求</li>
        <li v-else-if="$isMac">尝试关闭 VPN 或代理，确认其未影响直播连接</li>
        <li>重新进入此页面检测，如还有问题，请联系客服</li>
      </ul>
    </div>
  </div>
</template>

<script>
import platformMixin from '@/mixins/platform'

const BASE = process.env.VUE_APP_BASE_API && !process.env.VUE_APP_BASE_API.startsWith('/')
  ? process.env.VUE_APP_BASE_API
  : 'https://live.fjlsjy123.com/portal/api'

const SERVERS = [
  { name: '业务服务器',     url: `${BASE}/actuator/health` },
  { name: '资源服务器',     url: `${BASE}/resource/health` },
  { name: '视频点播服务器', url: `${BASE}/vod/health` },
  { name: '课件服务器1',    url: `${BASE}/courseware/health` },
  { name: '课件服务器2',    url: `${BASE}/courseware2/health` },
  { name: '课件服务器3',    url: `${BASE}/courseware3/health` },
  { name: '课件服务器4',    url: `${BASE}/courseware4/health` },
]

// 延迟阈值（ms）
const GOOD_MS   = 600
const WARN_MS   = 1500

export default {
  name: 'NetworkCheck',
  mixins: [platformMixin],
  data() {
    return {
      networkStatus: null,  // null=检测中 true=正常 false=异常
      dnsStatus: null,
      servers: SERVERS.map(s => ({ ...s, latency: null, error: false }))
    }
  },
  mounted() {
    this.runChecks()
  },
  beforeDestroy() {
    this._destroyed = true
  },
  methods: {
    async runChecks() {
      this.networkStatus = null
      this.dnsStatus = null
      this.servers.forEach(s => { s.latency = null; s.error = false })

      // 1. 本地网络状态
      this.networkStatus = navigator.onLine

      // 2. DNS 解析（尝试到达公共地址）
      this.dnsStatus = await this.checkDns()

      // 3. 各服务器延迟（并发）
      await Promise.all(
        this.servers.map(async srv => {
          const ms = await this.ping(srv.url)
          if (this._destroyed) return
          if (ms === null) {
            srv.error = true
          } else {
            srv.latency = ms
          }
        })
      )
    },

    async checkDns() {
      try {
        const ctrl = new AbortController()
        const tid = setTimeout(() => ctrl.abort(), 3000)
        await fetch('https://www.baidu.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-cache',
          signal: ctrl.signal
        })
        clearTimeout(tid)
        return true
      } catch {
        return false
      }
    },

    async ping(url) {
      try {
        const ctrl = new AbortController()
        const tid = setTimeout(() => ctrl.abort(), 5000)
        const t0 = Date.now()
        await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: ctrl.signal
        })
        clearTimeout(tid)
        return Date.now() - t0
      } catch {
        return null
      }
    },

    statusText(val) {
      if (val === null) return '检测中...'
      return val ? '正常' : '异常'
    },
    statusClass(val) {
      if (val === null) return 'val-checking'
      return val ? 'val-good' : 'val-error'
    },
    latencyText(srv) {
      if (srv.latency === null && !srv.error) return '检测中...'
      if (srv.error) return '连接失败'
      return `${srv.latency}ms`
    },
    latencyClass(srv) {
      if (srv.latency === null && !srv.error) return 'val-checking'
      if (srv.error) return 'val-error'
      if (srv.latency < GOOD_MS) return 'val-good'
      if (srv.latency < WARN_MS) return 'val-warn'
      return 'val-error'
    }
  }
}
</script>

<style lang="scss" scoped>
.nc-wrap {
  width: 100%;
}

// ─── 检测卡片 ─────────────────────────────────────────────
.nc-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.nc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  font-size: 14px;
  color: #333;

  & + & {
    border-top: 1px solid #F5F6FA;
  }
}

.nc-row-label {
  font-size: 14px;
  color: #333;
}

.nc-row-val {
  font-size: 14px;
  font-weight: 500;
}

.nc-section-header {
  background: #F5F6FA;
  padding: 8px 24px;
  font-size: 13px;
  color: #999;
  border-top: 1px solid #F0F0F0;
}

// ─── 延迟颜色 ─────────────────────────────────────────────
.val-checking { color: #999; font-weight: 400; }
.val-good     { color: #22C55E; }
.val-warn     { color: #F59E0B; }
.val-error    { color: #EF4444; }

// ─── 常见问题 ─────────────────────────────────────────────
.nc-faq {
  background: #FFF8F0;
  border-radius: 10px;
  padding: 16px 20px;
  box-sizing: border-box;
}

.nc-faq-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.nc-faq-icon {
  color: #F59E0B;
  font-size: 16px;
  margin-right: 6px;
}

.nc-faq-list {
  margin: 0;
  padding-left: 18px;
  list-style: disc;

  li {
    font-size: 13px;
    color: #666;
    line-height: 1.8;
  }
}
</style>
