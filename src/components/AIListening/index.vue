<template>
  <div class="al-container">
      <!-- ===== 顶部标题栏 ===== -->
      <div class="al-topbar">
        <div class="al-topbar-left">
          <button class="al-back-btn" @click="handleClose" title="返回">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span class="al-breadcrumb-parent">课堂笔记</span>
          <span class="al-breadcrumb-sep">/</span>
          <span class="al-breadcrumb-current">{{ meetingTitle || '未命名笔记' }}</span>
        </div>
        <!-- <div class="al-topbar-right">
          <button class="al-tb-btn al-tb-btn--outline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            AI问答
          </button>
          <button class="al-tb-btn">编辑</button>
          <button class="al-tb-btn">翻译</button>
          <button class="al-tb-btn al-tb-btn--primary" @click="handleShare">分享</button>
          <button class="al-tb-btn al-tb-btn--icon" title="更多操作">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
        </div> -->
      </div>

      <!-- ===== 主体（左右分栏） ===== -->
      <div class="al-body">
      <!-- ===== 左侧：视频 + 内容 ===== -->
      <div class="al-left">
        <!-- 视频播放器 -->
        <div class="al-player-wrap">
          <ListenVideoPlayer
            v-if="videoUrl || teacherVideoUrl"
            ref="videoPlayer"
            :inline="true"
            :main-source="videoUrl"
            :teacher-source="teacherVideoUrl"
            :title="meetingTitle"
            @timeupdate="onVideoTimeUpdate"
          />
          <div v-else class="al-no-video">
            <span>暂无视频</span>
          </div>
        </div>

        <!-- 标签页 -->
        <div class="al-tabs-bar">
          <div
            class="al-tab"
            :class="{ active: activeTab === 'transcript' }"
            @click="activeTab = 'transcript'"
          >转写</div>
          <div
            class="al-tab"
            :class="{ active: activeTab === 'summary' }"
            @click="activeTab = 'summary'"
          >AI纪要</div>
        </div>

        <!-- 内容区 -->
        <div class="al-content-area" ref="transcriptArea" @scroll="onTranscriptScroll">
          <!-- 图文纪要按钮 -->
          <!-- <div class="al-pictxt-row">
            <button class="al-pictxt-btn" @click="handlePicTxt">
              图文纪要
              <span class="al-new-badge">NEW</span>
            </button>
          </div> -->

          <!-- ===== 转写内容 ===== -->
          <div v-if="activeTab === 'transcript'" class="al-transcript-list">
            <div v-if="transcriptLoading" class="al-loading-placeholder">
              <div class="al-skeleton" v-for="i in 3" :key="i"></div>
            </div>
            <div
              v-else
              v-for="(item, index) in transcriptList"
              :key="item.paragraphId || index"
              class="al-tran-entry"
              :class="{ 'al-tran-entry--active': activeParagraphIndex === index }"
              :ref="'tran_' + index"
              @click="seekToTranscript(item)"
            >
              <div class="al-tran-meta">
                <img v-if="item.avatarUrl" :src="item.avatarUrl" class="al-speaker-avatar" />
                <span v-else class="al-speaker-badge" :class="'speaker-color-' + item.speakerColorIndex">
                  {{ item.speakerName.slice(-1) }}
                </span>
                <span class="al-speaker-name">{{ item.speakerName }}</span>
                <span class="al-tran-sep">·</span>
                <span class="al-tran-ts">{{ item.displayTime }}</span>
              </div>
              <p class="al-tran-text">{{ item.text }}</p>
            </div>
          </div>

          <!-- ===== AI纪要内容 ===== -->
          <div v-if="activeTab === 'summary'" class="al-summary-area">
            <div v-if="summaryLoading" class="al-loading-placeholder">
              <div class="al-skeleton" v-for="i in 4" :key="i" style="margin-bottom:10px;"></div>
            </div>
            <div v-else-if="summaryHtmlUrl" class="al-summary-iframe-wrap">
              <button class="al-summary-fullscreen-btn" @click="summaryFullscreen = true" title="全屏查看">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
                放大查看
              </button>
              <iframe
                :src="summaryHtmlUrl"
                class="al-summary-iframe"
                frameborder="0"
                allowfullscreen
              ></iframe>
            </div>
             <div v-else class="al-summary-empty">
              <span>暂无AI纪要</span>
            </div>
            <!-- 全屏遮罩 -->
            <transition name="al-fs-fade">
              <div v-if="summaryFullscreen" class="al-summary-fs-mask" @click.self="summaryFullscreen = false">
                <div class="al-summary-fs-box">
                  <button class="al-summary-fs-close" @click="summaryFullscreen = false" title="关闭">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <iframe
                    :src="summaryHtmlUrl"
                    class="al-summary-fs-iframe"
                    frameborder="0"
                    allowfullscreen
                  ></iframe>
                </div>
              </div>
            </transition>
           
          </div>
        </div>
      </div>

      <!-- ===== 右侧：AI问答 ===== -->
      <div class="al-right">
        <!-- Header -->
        <div class="al-chat-hd">
          <span class="al-chat-title">AI问答</span>
          <div class="al-chat-hd-btns">
            <!-- 有对话时显示新建对话，无对话时显示搜索 -->
            <button
              class="al-hd-btn"
              :title="chatMessages.length > 0 ? '新建对话' : '搜索'"
              @click="chatMessages.length > 0 ? newChatSession() : null"
            >
              <!-- 新建图标（有对话状态） -->
              <svg v-if="chatMessages.length > 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <!-- 搜索图标（无对话状态） -->
              <!-- <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg> -->
            </button>
            <!-- 菜单按钮 -->
            <!-- <button class="al-hd-btn" title="更多">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button> -->
            <!-- 关闭按钮 -->
            <button class="al-hd-btn al-hd-close-btn" @click="handleClose" title="关闭">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Chat Body -->
        <div class="al-chat-body" ref="chatBodyEl">
          <!-- ===== 欢迎态（无对话） ===== -->
          <div v-if="chatMessages.length === 0 && !aiLoading" class="al-welcome-area">
            <div class="al-welcome-greeting">
              <span class="al-welcome-emoji">👋</span>
              <span class="al-welcome-text">Hi，我可以帮你干什么？</span>
            </div>
            <p class="al-scope-hint">问答范围：{{ scopeText }}</p>
            <div class="al-quick-questions">
              <button
                v-for="q in quickQuestions"
                :key="q"
                class="al-quick-btn"
                @click="sendChat(q)"
              >{{ q }}</button>
            </div>
          </div>

          <!-- ===== 对话消息列表 ===== -->
          <div v-if="chatMessages.length > 0" class="al-msg-list">
            <div
              v-for="(msg, idx) in chatMessages"
              :key="idx"
              class="al-msg-item"
              :class="'msg-' + msg.role"
            >
              <!-- 用户消息 -->
              <div v-if="msg.role === 'user'" class="al-msg-user-wrap">
                <div class="al-bubble-user">{{ msg.content }}</div>
              </div>

              <!-- AI消息 -->
              <div v-else class="al-msg-ai-wrap">
                <div v-if="msg.thinking" class="al-thinking-label">已思考{{ msg.thinkSec }}秒</div>
                <div class="al-bubble-ai">
                  <span v-if="msg.streaming" class="al-typing-cursor">{{ msg.content }}</span>
                  <span v-else>{{ msg.content }}</span>
                </div>
                <div v-if="!msg.streaming" class="al-msg-ops">
                  <!-- <button class="al-op-btn" @click="shareMsg(msg.content)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    分享
                  </button> -->
                  <!-- <span class="al-op-divider">|</span> -->
                  <button class="al-op-btn" @click="copyMsg(msg.content)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- AI 加载中 -->
            <div v-if="aiLoading" class="al-ai-loading">
              <div class="al-dot-loader">
                <span></span><span></span><span></span>
              </div>
            </div>

            <!-- 继续提问建议 -->
            <div v-if="followUpList.length > 0 && !aiLoading" class="al-followup-area">
              <div class="al-followup-title">继续提问</div>
              <button
                v-for="q in followUpList"
                :key="q"
                class="al-quick-btn2"
                @click="sendChat(q)"
              >{{ q }}</button>
            </div>
          </div>
        </div>

        <!-- Chat Footer -->
        <div class="al-chat-ft">
          <div class="al-input-box">
            <textarea
              ref="chatInput"
              v-model="inputText"
              class="al-textarea"
              placeholder="有问题尽管问我..."
              rows="1"
              @keydown.enter.exact.prevent="sendChat(inputText)"
              @input="autoResizeTextarea"
            ></textarea>
          </div>
          <div class="al-ft-toolbar">
            <button class="al-ft-btn al-ft-attach" title="附件">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button
              class="al-ft-btn al-deep-think-btn"
              :class="{ active: deepThinkMode }"
              @click="deepThinkMode = !deepThinkMode"
              title="深度思考"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 9h6M9 12h6M9 15h4"/>
              </svg>
              深度思考
            </button>
            <div class="al-ft-spacer"></div>
            <button
              class="al-send-btn"
              :class="{ enabled: inputText.trim() && !aiLoading }"
              :disabled="!inputText.trim() || aiLoading"
              @click="sendChat(inputText)"
              title="发送"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
</template>

<script>
import ListenVideoPlayer from '@/components/ListenVideoPlayer/index.vue'
import { get } from '@/utils/request'

/**
 * AIListening — AI 听记组件
 * 包含：视频播放器、转写/AI纪要标签页、右侧 AI 问答对话面板
 */

const mockAiChat = (question, deepThink, history) => {
  const thinkSec = deepThink ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 3) + 1

  const responses = {
    '用30字概括': {
      answer: '对话聚焦音频设备连接问题，最终确认使用耳机解决声音输出，达成"能用就行"共识。',
      followUp: ['插线后延迟具体指什么？', '切换音频设备怎么操作？']
    },
    'AI一键生成思维导图': {
      answer: '已为您生成思维导图，本次直播主要围绕以下几个核心议题展开：\n\n1. 直播数字编辑技术（数字化工具应用、内容制作流程）\n2. 传播路径优化（算法分发、用户增长策略）\n3. 技术架构建设（可扩展性设计、数据分析体系）\n4. 用户体验提升（界面优化、互动功能增强）',
      followUp: ['导出为 PDF 格式', '思维导图能否按时间轴排列？']
    },
    '帮我提炼一下重点内容': {
      answer: '本次直播的重点内容如下：\n\n① 直播数字编辑是当今传播环境的核心竞争力\n② 用户体验与内容质量需要保持动态平衡\n③ 技术架构的可扩展性决定了平台的长期发展潜力\n④ 社区运营和口碑传播是用户增长的关键\n⑤ 数据分析工具的引入可显著提升内容策略精准度',
      followUp: ['这些内容如何形成方案？', '哪个方向最值得优先投入？']
    },
    'default': {
      answer: '根据本次直播内容，关于您的问题，主要观点如下：直播数字化编辑需要关注内容质量、技术架构和用户体验三个核心维度，缺一不可。建议从用户需求出发，结合数据分析逐步迭代优化。',
      followUp: ['能否举个具体案例？', '如何制定实施路线图？']
    }
  }

  const resp = responses[question] || responses['default']
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        data: {
          answer: resp.answer,
          thinkSec,
          followUp: resp.followUp
        }
      })
    }, deepThink ? 2500 : 1200)
  })
}

export default {
  name: 'AIListening',
  components: { ListenVideoPlayer },
  data() {
    return {
      // ===== 转写同步状态 =====
      currentTime: 0,
      activeParagraphIndex: -1,
      userScrolling: false,

      // ===== 内容标签 =====
      activeTab: 'transcript',

      // ===== 转写数据 =====
      transcriptLoading: false,
      transcriptList: [],

      // ===== AI纪要数据 =====
      summaryLoading: false,
      summaryHtmlUrl: '',
      summaryFullscreen: false,

      // ===== AI问答 =====
      chatMessages: [],
      inputText: '',
      aiLoading: false,
      deepThinkMode: false,
      followUpList: [],

      // 快捷问题（欢迎状态）
      quickQuestions: [
        'AI一键生成思维导图',
        '帮我提炼一下重点内容'
      ]
    }
  },
  computed: {
    videoUrl() {
      return this.$route.query.videoUrl || ''
    },
    teacherVideoUrl() {
      return this.$route.query.teacherVideoUrl || ''
    },
    meetingId() {
      return this.$route.query.meetingId || ''
    },
    meetingTitle() {
      return this.$route.query.meetingTitle || '未命名笔记'
    },
    scopeText() {
      return this.$route.query.scopeText || ''
    },
    liveLessonId() {
      return this.$route.query.liveLessonId || ''
    },
    teacherId() {
      return this.$route.query.teacherId || ''
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    // ===== 初始化加载 =====
    loadData() {
      this.fetchTranscript()
      this.fetchSummary()
    },

    async fetchTranscript() {
        console.log(this.meetingId,'输出看下')
      if (!this.meetingId) return
      this.transcriptLoading = true
      const speakerColorMap = new Map()
      const allParagraphs = []
      let nextToken = null
      let hasNext = true
      try {
        while (hasNext) {
          const params = { maxResults: 50, direction: 0 }
          if (nextToken) params.nextToken = nextToken
          const res = await get(`/dingTalk/flashMinutes/${this.meetingId}/textInfos`, params)
          const data = (res && res.data) || {}
          const list = data.paragraphList || []
          list.forEach(item => {
            const speakerName = (item.speakerDisplay && item.speakerDisplay.nickName) || item.nickName || '发言人'
            // 优先使用子发言人ID → unionId → 显示名，确保不同发言人分到不同颜色
            const speakerKey = item.nickName 
            if (!speakerColorMap.has(speakerKey)) {
              speakerColorMap.set(speakerKey, (speakerColorMap.size % 10) + 1)
            }
            console.log('[转写发言人]', speakerKey, '→ color', speakerColorMap.get(speakerKey), item)
            allParagraphs.push({
              paragraphId: item.paragraphId || '',
              speakerName,
              avatarUrl: (item.speakerDisplay && item.speakerDisplay.avatarUrl) || '',
              unionId: item.unionId || '',
              startTime: item.startTime || 0,
              endTime: item.endTime || 0,
              startSeconds: (item.startTime || 0) / 1000,
              displayTime: this.formatMs(item.startTime || 0),
              text: item.paragraph || '',
              speakerColorIndex: speakerColorMap.get(speakerKey) || 1
            })
          })
          hasNext = !!data.hasNext
          nextToken = data.nextToken || null
        }
        this.transcriptList = allParagraphs
      } catch (e) {
        console.error('转写数据加载失败', e)
      } finally {
        this.transcriptLoading = false
      }
    },

    async fetchSummary() {
      this.summaryLoading = true
      this.summaryHtmlUrl = ''
      try {
        const params = {}
        if (this.liveLessonId) params.liveLessonId = this.liveLessonId
        if (this.teacherId) params.teacherId = this.teacherId
        const res = await get('/dingTalk/notes/html/path', params)
        if (res && res.code === 200 && res.data) {
          this.summaryHtmlUrl = res.data
        }
      } catch (e) {
        console.error('AI纪要加载失败', e)
      } finally {
        this.summaryLoading = false
      }
    },

    // ===== 视频与转写联动 =====
    onVideoTimeUpdate(time) {
      this.currentTime = time
      const timeMs = time * 1000
      let newActiveIndex = -1
      for (let i = 0; i < this.transcriptList.length; i++) {
        if (this.transcriptList[i].startTime <= timeMs) {
          newActiveIndex = i
        } else {
          break
        }
      }
      if (newActiveIndex !== this.activeParagraphIndex) {
        this.activeParagraphIndex = newActiveIndex
        if (newActiveIndex >= 0 && !this.userScrolling) {
          this.$nextTick(() => this.scrollToActiveParagraph())
        }
      }
    },

    seekToTranscript(item) {
      const player = this.$refs.videoPlayer
      if (player && typeof player.seekTo === 'function') {
        player.seekTo(item.startSeconds)
      }
    },

    scrollToActiveParagraph() {
      const refs = this.$refs['tran_' + this.activeParagraphIndex]
      const el = Array.isArray(refs) ? refs[0] : refs
      const container = this.$refs.transcriptArea
      if (!el || !container) return
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const offset = elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2
      container.scrollTop += offset
    },

    onTranscriptScroll() {
      this.userScrolling = true
      clearTimeout(this._scrollTimer)
      this._scrollTimer = setTimeout(() => {
        this.userScrolling = false
      }, 3000)
    },

    formatMs(ms) {
      if (!ms && ms !== 0) return '00:00'
      const totalSec = Math.floor(ms / 1000)
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      }
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    },

    // ===== 图文纪要 =====
    handlePicTxt() {
      this.$message && this.$message.info('图文纪要功能开发中...')
    },

    // ===== AI问答 =====
    async sendChat(text) {
      if (!text || !text.trim() || this.aiLoading) return
      const question = text.trim()

      // 清空输入
      this.inputText = ''
      this.followUpList = []

      // 添加用户消息
      this.chatMessages.push({ role: 'user', content: question })

      // 重置 textarea 高度
      this.$nextTick(() => {
        if (this.$refs.chatInput) {
          this.$refs.chatInput.style.height = 'auto'
        }
        this.scrollChatToBottom()
      })

      // 开始加载
      this.aiLoading = true

      try {
        const res = await mockAiChat(question, this.deepThinkMode, this.chatMessages)
        if (res.code === 200) {
          const { answer, thinkSec, followUp } = res.data

          this.chatMessages.push({
            role: 'ai',
            content: answer,
            thinking: this.deepThinkMode,
            thinkSec,
            streaming: false
          })

          this.followUpList = followUp || []
        }
      } catch (e) {
        this.chatMessages.push({
          role: 'ai',
          content: '抱歉，请求失败，请稍后重试。',
          thinking: false,
          thinkSec: 0,
          streaming: false
        })
      } finally {
        this.aiLoading = false
        this.$nextTick(() => {
          this.scrollChatToBottom()
        })
      }
    },

    newChatSession() {
      this.chatMessages = []
      this.followUpList = []
      this.inputText = ''
    },

    shareMsg(content) {
      this.$message && this.$message.success('分享功能开发中')
    },

    copyMsg(content) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(content).then(() => {
          this.$message && this.$message.success('已复制到剪贴板')
        })
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = content
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.$message && this.$message.success('已复制到剪贴板')
      }
    },

    scrollChatToBottom() {
      const body = this.$refs.chatBodyEl
      if (body) {
        body.scrollTop = body.scrollHeight
      }
    },

    autoResizeTextarea() {
      const el = this.$refs.chatInput
      if (!el) return
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    },

    // ===== 分享 =====
    handleShare() {
      this.$emit('share', { meetingId: this.meetingId, meetingTitle: this.meetingTitle })
    },

    // ===== 返回 =====
    handleClose() {
      this.$router.back()
    }
  },

  beforeDestroy() {
    clearTimeout(this._scrollTimer)
  }
}
</script>

<style lang="scss" scoped>
// ===== 颜色变量 =====
$primary: #3B6FFF;
$primary-light: #EEF3FF;
$text-main: #1A1A2E;
$text-sub: #888;
$text-hint: #999;
$border: #EBEBEB;
$bg-hover: #F5F7FA;
$white: #fff;

// ===== 主容器（全页面） =====
.al-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: $white;
  overflow: hidden;
}

// ===== 顶部标题栏 =====
.al-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  min-height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid $border;
  background: $white;
  flex-shrink: 0;
}

.al-topbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  min-width: 0;
}

.al-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: $text-sub;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: $bg-hover;
    color: $text-main;
  }
}

.al-breadcrumb-parent {
  color: $text-sub;
  cursor: pointer;
  white-space: nowrap;
  &:hover { color: $primary; }
}

.al-breadcrumb-sep {
  color: $text-hint;
  font-size: 12px;
}

.al-breadcrumb-current {
  color: $text-main;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.al-topbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.al-tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid $border;
  border-radius: 6px;
  background: $white;
  color: $text-main;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: $bg-hover;
    border-color: #d0d0d0;
  }

  &--outline {
    border-color: $primary;
    color: $primary;
    &:hover { background: $primary-light; }
  }

  &--primary {
    background: $primary;
    border-color: $primary;
    color: $white;
    &:hover { background: darken($primary, 8%); }
  }

  &--icon {
    padding: 0 8px;
    color: $text-sub;
    border-color: transparent;
    background: transparent;
    &:hover { background: $bg-hover; border-color: $border; }
  }
}

// ===== 主体左右分栏 =====
.al-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// ===================================================================
// 左侧面板
// ===================================================================
.al-left {
  flex: 0 0 721px;
  width: 580px;
  display: flex;
  flex-direction: column;
  background: $white;
  border-right: 1px solid $border;
  overflow: hidden;
}

// ===== 视频播放器 =====
.al-player-wrap {
  position: relative;
  width: 100%;
  background: #ffffff;
  flex-shrink: 0;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  padding: 18px 51px;
  box-sizing: border-box;
}

// 无视频占位
.al-no-video {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 13px;
}

// ===== 标签页 =====
.al-tabs-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 40px;
  border-bottom: 1px solid $border;
  flex-shrink: 0;

  .al-tab {
    padding: 12px 0;
    font-size: 14px;
    color: $text-sub;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
    user-select: none;

    &:hover {
      color: $primary;
    }

    &.active {
      color: $primary;
      font-weight: 600;
      border-bottom-color: $primary;
    }
  }
}

// ===== 内容区 =====
.al-content-area {
  flex: 1;
  overflow-y: auto;
  padding: 14px 24px 16px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

// 图文纪要按钮
.al-pictxt-row {
  margin-bottom: 14px;
}

.al-pictxt-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: $primary-light;
  color: $primary;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: darken($primary-light, 3%);
  }

  .al-new-badge {
    background: $primary;
    color: $white;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 8px;
    letter-spacing: 0.3px;
  }
}

// ===== 转写列表 =====
.al-transcript-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.al-tran-entry {
  padding: 10px 8px;
  border-bottom: 1px solid #F5F5F5;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: $bg-hover;
  }

  &--active {
    background: $primary-light;
    border-bottom-color: transparent;

    .al-tran-ts {
      color: $primary;
    }

    .al-tran-text {
      color: $primary;
    }
  }
}

// 发言人头像
.al-speaker-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.al-tran-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.al-speaker-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: $white;
  flex-shrink: 0;

  &.speaker-color-1  { background: #3B6FFF; }
  &.speaker-color-2  { background: #7B5EA7; }
  &.speaker-color-3  { background: #FF7043; }
  &.speaker-color-4  { background: #26A69A; }
  &.speaker-color-5  { background: #EF5350; }
  &.speaker-color-6  { background: #FFA726; }
  &.speaker-color-7  { background: #29B6F6; }
  &.speaker-color-8  { background: #66BB6A; }
  &.speaker-color-9  { background: #EC407A; }
  &.speaker-color-10 { background: #8D6E63; }
}

.al-speaker-name {
  font-size: 13px;
  color: $text-main;
  font-weight: 500;
}

.al-tran-sep {
  font-size: 12px;
  color: $text-hint;
}

.al-tran-ts {
  font-size: 12px;
  color: $text-hint;
}

.al-tran-text {
  font-size: 13px;
  color: #444;
  line-height: 1.65;
  margin: 0;
  padding-left: 26px;
}

// ===== AI纪要区域 =====
.al-summary-area {
  padding: 4px 0;
}

.al-summary-iframe-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  position: relative;
}

.al-summary-fullscreen-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-end;
  margin-bottom: 8px;
  padding: 4px 10px;
  height: 28px;
  border: 1px solid $border;
  border-radius: 6px;
  background: $white;
  color: $text-sub;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &:hover {
    background: $bg-hover;
    border-color: #c0c0c0;
    color: $text-main;
  }
}

.al-summary-iframe {
  width: 100%;
  flex: 1;
  min-height: 400px;
  border: 1px solid $border;
  border-radius: 6px;
  background: #fff;
}

// ===== 全屏遮罩 =====
.al-summary-fs-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
}

.al-summary-fs-box {
  position: relative;
  width: 90vw;
  height: 90vh;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.al-summary-fs-close {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  color: #555;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.14);
    color: #111;
  }
}

.al-summary-fs-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

// ===== 全屏遮罩过渡动画 =====
.al-fs-fade-enter-active,
.al-fs-fade-leave-active {
  transition: opacity 0.2s ease;

  .al-summary-fs-box {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.al-fs-fade-enter,
.al-fs-fade-leave-to {
  opacity: 0;

  .al-summary-fs-box {
    transform: scale(0.94);
    opacity: 0;
  }
}

.al-summary-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: $text-hint;
  font-size: 13px;
}

// ===== 骨架屏 =====
.al-loading-placeholder {
  padding: 8px 0;
}

.al-skeleton {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: al-shimmer 1.5s infinite;

  &:nth-child(2) { width: 85%; }
  &:nth-child(3) { width: 70%; }
  &:nth-child(4) { width: 90%; }
}

// ===================================================================
// 右侧 AI 问答面板
// ===================================================================
.al-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $white;
  min-width: 0;
}

// ===== AI问答 Header =====
.al-chat-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 13px;
  border-bottom: 1px solid $border;
  flex-shrink: 0;

  .al-chat-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-main;
  }

  .al-chat-hd-btns {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .al-hd-btn {
    width: 30px;
    height: 30px;
    border: 1.5px dashed #CCC;
    border-radius: 6px;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      color: $primary;
    }

    svg {
      flex-shrink: 0;
    }
  }

  .al-hd-close-btn {
    border-color: #DDD;

    &:hover {
      border-color: #FF5252;
      color: #FF5252;
    }
  }
}

// ===== Chat Body =====
.al-chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

// 欢迎状态
.al-welcome-area {
  padding: 16px 4px;
}

.al-welcome-greeting {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;

  .al-welcome-emoji {
    font-size: 24px;
  }

  .al-welcome-text {
    font-size: 18px;
    font-weight: 700;
    color: $text-main;
  }
}

.al-scope-hint {
  font-size: 14px;
  color: $text-hint;
  margin: 21px 0 16px;
  line-height: 1.6;
  word-break: break-all;
}

.al-quick-questions {
  display: inline-flex;
  flex-direction: column;
  gap: 30px;
  margin-top: 30px;
}

.al-quick-btn {
  display: block;
  text-align: left;
  padding: 10px 23px;
  box-sizing: border-box;
 background: linear-gradient( 90deg, #DFF6FF 0%, rgba(255,255,255,0) 71.63%);
border-radius: 48px 48px 48px 48px;
  border: none;
  font-size: 16px;
  color: $text-main;
  cursor: pointer;
  transition: background 0.2s;
  line-height: 1.5;

}

.al-quick-btn2 {
  display: block;
  text-align: left;
  padding: 10px 23px;
  box-sizing: border-box;
 background:#F3F4F8;
border-radius: 48px 48px 48px 48px;
  border: none;
  font-size: 16px;
  color: $text-main;
  cursor: pointer;
  transition: background 0.2s;
  line-height: 1.5;
  margin-bottom: 13px;

}
// 消息列表
.al-msg-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.al-msg-item {
  &.msg-user {
    display: flex;
    justify-content: flex-end;
  }

  &.msg-ai {
    display: flex;
    justify-content: flex-start;
  }
}

// 用户消息气泡
.al-msg-user-wrap {
  max-width: 80%;
}

.al-bubble-user {
  display: inline-block;
  background: #F3F4F8;
  color: #333333;
  padding: 8px 12px;
  border-radius:16px 16px 8px 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

// AI消息
.al-msg-ai-wrap {
  max-width: 100%;
  width: 100%;
}

.al-thinking-label {
  font-size: 14px;
  color:#333333;
  margin-bottom: 6px;
}

.al-bubble-ai {
  font-size: 13.5px;
  color: $text-main;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.al-typing-cursor::after {
  content: '|';
  animation: al-blink 1s step-end infinite;
  margin-left: 1px;
}

// 消息操作按钮
.al-msg-ops {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 21px;
}

.al-op-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: $text-hint;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;

  &:hover {
    color: $primary;
  }
}

.al-op-divider {
  color: #DDD;
  font-size: 12px;
  margin: 0 2px;
}

// AI 加载中
.al-ai-loading {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.al-dot-loader {
  display: flex;
  gap: 5px;

  span {
    width: 7px;
    height: 7px;
    background: #CCC;
    border-radius: 50%;
    animation: al-bounce 1.2s infinite ease-in-out;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

// 继续提问区域
.al-followup-area {
  margin-top: 25px;
  border-top: 1px solid  #D9D9D9;
  padding-top: 25px;
}

.al-followup-title {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 15px;
}

// ===== Chat Footer =====
.al-chat-ft {
  flex-shrink: 0;
  padding:21px 21px 18px 21px;
  box-sizing: border-box;
  background: #FFFFFF;
border-radius: 24px 24px 24px 24px;
border: 2px solid #D9D9D9;
margin:0 28px
}

.al-input-box {
  // background: #F7F8FA;
  // border-radius: 10px;
  // padding: 10px 12px;
  margin-bottom: 8px;
  // border: 1px solid transparent;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: $primary;
    background: $white;
  }

  .al-textarea {
    width: 100%;
    background: none;
    border: none;
    outline: none;
    resize: none;
    font-size: 16px;
    color: #666666;
    line-height: 1.6;
    font-family: inherit;
    min-height: 40px;
    max-height: 120px;
    overflow-y: auto;

    &::placeholder {
      color: $text-hint;
    }

    &::-webkit-scrollbar {
      width: 3px;
    }
  }
}

.al-ft-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.al-ft-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12.5px;
  color: $text-sub;
  transition: all 0.2s;

  &:hover {
    background: $bg-hover;
    color: $text-main;
  }
}

.al-ft-attach {
  width: 30px;
  height: 30px;
  padding: 0;
  justify-content: center;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 300;
}

.al-deep-think-btn {
  border: 1px solid $border;

  &.active {
    background: $primary-light;
    color: $primary;
    border-color: lighten($primary, 20%);
  }
}

.al-ft-spacer {
  flex: 1;
}

.al-send-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: #E5E5E5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: not-allowed;
  color: #AAA;
  transition: all 0.2s;

  &.enabled {
    background: $primary;
    color: $white;
    cursor: pointer;

    &:hover {
      background: darken($primary, 8%);
    }
  }

  &:disabled {
    cursor: not-allowed;
  }
}

// ===================================================================
// 过渡动画
// ===================================================================
.al-fade-enter-active,
.al-fade-leave-active {
  transition: opacity 0.2s;
}

.al-fade-enter,
.al-fade-leave-to {
  opacity: 0;
}

// ===================================================================
// Keyframes
// ===================================================================
@keyframes al-spin {
  to { transform: rotate(360deg); }
}

@keyframes al-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes al-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes al-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
</style>
