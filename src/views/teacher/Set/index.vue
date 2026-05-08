<template>
  <div class="set-page">
    <!-- ── 左侧导航栏 ─────────────────── -->
    <aside class="set-sidebar">
      <!-- 用户信息头部 -->
      <div class="sidebar-user">
        <div class="su-avatar">思雅</div>
        <!-- <img src="" class="su-avatar_head" alt=""> -->
        <div class="su-meta">
          <div class="su-name">思雅</div>
          <div class="su-account">fjlsjy思雅老师</div>
        </div>
      </div>

      <!-- 菜单列表 -->
      <nav class="set-nav">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="set-nav-item"
          :class="{ active: currentMenu === item.key }"
          @click="switchMenu(item.key)"
        >
          <img :src="currentMenu === item.key ? item.activeImg : item.img" class="item-icon" alt="" />
          <div class="item-label">{{ item.label }}</div>
          <img v-if="currentMenu === item.key" src="@/assets/images/set/right.png" class="set_nav_item_right" alt="">
        </div>
      </nav>

      <!-- 退出登录 -->
      <div class="set-logout" @click="handleLogout">
        <i class="el-icon-s-promotion" />
        <span>退出登录</span>
      </div>
    </aside>

    <!-- ── 右侧内容区 ─────────────────── -->
    <main class="set-content">

      <!-- ─── 我的信息 ─── -->
      <section  v-if="currentMenu === 'info' && !showVerifyPhone  && !showChangePhone">
        <div class="section_top">
          <div class="section_top_left">
            <div class="section_top_left_text">我的信息</div>
          </div>
          <div class="section_top_right"></div>
        </div>

        <div class="section_last" style="width:664px">
          <!-- 用户信息卡片 -->
          <div class="white-card user-top-card">
            <div class="utc-left">
              <div class="utc-avatar">思雅</div>
              <!-- <img src="" class="utc-avatar_head" alt=""> -->
              <div class="utc-info">
                <div class="utc-name">思雅老师</div>
                <div class="utc-role">教师 · fjlsjy思雅老师</div>
              </div>
            </div>
            <div class="utc-right">
              <template v-if="!isEditing">
                <el-button type="primary" @click="isEditing = true">
                  <i class="el-icon-edit" /> 编辑信息
                </el-button>
              </template>
              <template v-else>
                <el-button @click="isEditing = false">
                  <i class="el-icon-close" /> 取消
                </el-button>
                <el-button type="primary" @click="handleSave">
                  <i class="el-icon-check" /> 保存
                </el-button>
              </template>
            </div>
          </div>

          <!-- 基本信息表单 -->
          <div class="white-card form-card">
            <p class="section-label">基本信息</p>

            <div class="form-field">
              <label>姓名</label>
              <el-input v-model="form.name" :disabled="!isEditing" />
            </div>

            <div class="form-field">
              <label>手机号码</label>
              <div class="phone-row">
                <el-input :value="'+86 ' + form.phone" disabled />
                <span class="inline-link" @click="openVerifyPhone">修改</span>
              </div>
            </div>

            <div class="form-field">
              <label>邮箱</label>
              <el-input v-model="form.email" :disabled="!isEditing" placeholder="请输入邮箱地址" />
            </div>
          </div>

          <!-- 提示信息 -->
          <div class="info-notice">
            <i class="el-icon-info notice-icon" />
            <span>个人信息仅用于平台内部展示，修改后实时生效。如需修改手机号码，请点击"修改"并完成验证。</span>
          </div>
        </div>
      </section>

      <!-- ─── 我的教研组 列表 ─── -->
      <section v-else-if="currentMenu === 'group' && !showGroupDetail && !showVerifyPhone && !showChangePhone">
        <div class="section_top">
          <div class="section_top_left">
            <div class="section_top_left_text">我的教研组</div>
          </div>
          <div class="section_top_right"></div>
        </div>

        <div class="section_last">
          <!-- 统计卡片 -->
          <div class="group-summary-card">
            <img src="@/assets/images/set/jyz.png" class="group-summary-icon" alt="" onerror="this.style.display='none'" />
            <span class="group-summary-text">
              已加入 <b>{{ groupList.length }}</b> 个教研组 · 共 <b>{{ totalGroupMembers }}</b> 位成员
            </span>
          </div>

          <!-- 教研组卡片列表 -->
          <div class="group-grid">
            <div
              v-for="group in groupList"
              :key="group.id"
               @click="viewGroupDetail(group)"
              class="group-card"
            >
              <!-- 卡片左侧彩色条 -->
              <div class="group-card-stripe" :style="{ background: group.color }"></div>

              <div class="group-card-body">
                <!-- 顶部：组名 + 角色 + 学科图标 -->
                <div class="group-card-top">
                  <div class="group-card-top_left">
                      <div class="group-card-title-wrap">
                        <span class="group-card-name">{{ group.name }}</span>
                        <span class="group-role-badge" :class="group.role === '组长' ? 'role-leader' : 'role-member'">{{ group.role }}</span>
                      </div>
                    <!-- 学科描述 -->
                      <div class="group-card-desc">{{ group.subject }}</div>
                  </div>
                   <div class="group-subject-tag" >{{ group.subjectShort }}</div>
                </div>
                

               

                

                <!-- 底部：成员头像 + 查看详情 -->
                <div class="group-card-bottom">
                  <div class="group-members-row">
                    <div
                      v-for="(member, idx) in group.members.slice(0, 4)"
                      :key="idx"
                      class="member-avatar"
                      :style="{ background: member.color, marginLeft: idx === 0 ? '0' : '-8px', zIndex: group.members.length - idx }"
                    >{{ member.name }}</div>
                    <span class="group-member-count">共 {{ group.memberCount }} 人</span>
                  </div>
                    <div class="group-card-bottom_xq">
                      <div class="group-card-bottom_xq_text">
                        查看详情
                      </div>
                      <img class="group-card-bottom_xq_icon" src="@/assets/images/set/xq.png" alt="">
                    </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部总数 -->
          <div class="group-total-tip">
            <div class="group-total-tip_hx"></div>
            <div>共 {{ groupList.length }} 个教研组</div>
            <div class="group-total-tip_hx"></div>
          </div>
        </div>
      </section>

      <!-- ─── 我的教研组 详情 ─── -->
      <section v-else-if="currentMenu === 'group' && showGroupDetail && currentGroup && !showVerifyPhone && !showChangePhone">
        <!-- 顶部导航 -->
        <div class="section_top">
          <div class="section_top_left">
            <span class="gd-back-btn" @click="backToGroupList">
              <i class="el-icon-arrow-left" />
              <span>返回</span>
            </span>
            <div class="section_top_left_text gd-title">{{ currentGroup.name }}</div>
          </div>
        </div>

        <div class="section_last">
          <!-- 顶部 Banner 卡片 -->
          <div class="gd-banner-card" :style="{ background: currentGroup.color }">
            <div class="gd-banner-tag">{{ currentGroup.subjectShort }}</div>
            <div class="gd-banner-info">
              <div class="gd-banner-name">{{ currentGroup.name }}</div>
              <div class="gd-banner-desc">
                {{ currentGroup.subject }} · 共 {{ currentGroup.memberCount }} 人 · 我的角色：{{ currentGroup.role }}
              </div>
            </div>
          </div>

          <!-- 人数统计卡片 -->
          <div class="gd-stats-card">
            <div class="gd-stats-num">{{ currentGroup.memberCount }} 人</div>
            <div class="gd-stats-label">组内成员</div>
          </div>

          <!-- 成员列表卡片 -->
          <div class="gd-member-card">
            <div class="gd-member-card-title">组内成员</div>
            <div
              v-for="(member, idx) in currentGroup.members"
              :key="idx"
              class="gd-member-item"
            >
              <div class="gd-member-avatar" :style="{ background: member.color }">{{ member.avatarName }}</div>
              <div class="gd-member-info">
                <div class="gd-member-name-row">
                  <span class="gd-member-name">{{ member.fullName }}</span>
                  <span v-if="member.isSelf" class="gd-member-self-badge">我</span>
                </div>
                <div class="gd-member-role">{{ member.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── 其他菜单占位 ─── -->
      <section v-else-if="currentMenu !== 'info' && currentMenu !== 'group' && !showVerifyPhone && !showChangePhone" class="placeholder-section">
        <div class="placeholder-inner">
          <i class="el-icon-s-grid placeholder-icon" />
          <p>{{ currentMenuLabel }}</p>
        </div>
      </section>

      <!-- ─── 修改手机号 ─── -->
      <section v-if="showChangePhone" class="verify-section">
        <div class="verify-header">
          <span class="back-btn" @click="backToVerify">
            <i class="el-icon-arrow-left" /> 返回
          </span>
          <span class="verify-page-title">修改手机号</span>
        </div>

        <div class="white-card verify-card">
          <h3 class="verify-sub">请输入新手机号码</h3>

          <div class="phone-input-row">
           
            <el-input v-model="changePhoneForm.phone" placeholder="请输入手机号" class="phone-number-input" />
          </div>

          <div class="code-row">
            <el-input v-model="changePhoneForm.code" placeholder="请输入验证码" />
            <span
              class="get-code-btn"
              :class="{ counting: changeCounting }"
              @click="startChangeCountdown"
            >{{ changeCounting ? `${changeCountdown}s 后重发` : '获取验证码' }}</span>
          </div>

          <el-button
            type="primary"
            class="next-btn"
            :disabled="!changePhoneForm.phone || !changePhoneForm.code"
            @click="handleConfirmChangePhone"
          >确定</el-button>
        </div>
      </section>

      <!-- ─── 身份验证 ─── -->
      <section v-if="showVerifyPhone" class="verify-section">
        <div class="verify-header">
          <span class="back-btn" @click="showVerifyPhone = false">
            <i class="el-icon-arrow-left" /> 返回
          </span>
          <span class="verify-page-title">身份验证</span>
        </div>

        <div class="white-card verify-card">
          <h3 class="verify-sub">请先验证已绑定的手机号码</h3>

          <el-input v-model="verifyForm.phone" disabled class="verify-input" />

          <div class="code-row">
            <el-input v-model="verifyForm.code" placeholder="请输入验证码" />
            <span
              class="get-code-btn"
              :class="{ counting }"
              @click="startCountdown"
            >{{ counting ? `${countdown}s 后重发` : '获取验证码' }}</span>
          </div>

          <el-button
            type="primary"
            class="next-btn"
            :disabled="!verifyForm.code"
            @click="goToChangePhone"
          >下一步</el-button>

          <p class="verify-note">如原手机号无法获取验证码，请联系老师修改</p>
        </div>
      </section>

    </main>
  </div>
</template>

<script>
export default {
  name: 'TeacherSet',
  data() {
    return {
      currentMenu: 'info',
      isEditing: false,
      showVerifyPhone: false,
      form: {
        name: '思雅',
        phone: '19859650891',
        email: ''
      },
      verifyForm: {
        phone: '19859650891',
        code: ''
      },
      showChangePhone: false,
      changePhoneForm: {
        prefix: '+86',
        phone: '',
        code: ''
      },
      counting: false,
      countdown: 60,
      countdownTimer: null,
      changeCounting: false,
      changeCountdown: 60,
      changeCountdownTimer: null,
      menuItems: [
        { key: 'info',     label: '我的信息',      img: require('@/assets/images/set/wdxx.png'),     activeImg: require('@/assets/images/set/wdxx_yes.png') },
        { key: 'group',    label: '我的教研组',    img: require('@/assets/images/set/wdjyz.png'),    activeImg: require('@/assets/images/set/wdjyz_yes.png') },
        { key: 'schedule', label: '我的课表',      img: require('@/assets/images/set/wdkb.png'),     activeImg: require('@/assets/images/set/wdkb_yes.png') },
        { key: 'device',   label: '设备和网络检测', img: require('@/assets/images/set/sbhwljc.png'), activeImg: require('@/assets/images/set/sbhwljc.png') },
        { key: 'settings', label: '设置',          img: require('@/assets/images/set/sz.png'),       activeImg: require('@/assets/images/set/sz.png') }
      ],
      showGroupDetail: false,
      currentGroup: null,
      groupList: [
        {
          id: 1,
          name: '技术教研组',
          role: '组长',
          subject: '信息技术',
          subjectShort: '技术',
          color: 'linear-gradient(135deg, #0049FF 0%, #71A0FF 100%)',
          memberCount: 3,
          members: [
            { avatarName: '思', fullName: '思雅', role: '组长', isSelf: true,  color: 'linear-gradient(135deg, #0049FF 0%, #71A0FF 100%)' },
            { avatarName: '李', fullName: '李老师', role: '成员', isSelf: false, color: 'linear-gradient(135deg, #6C63FF 0%, #A78BFA 100%)' },
            { avatarName: '王', fullName: '王老师', role: '成员', isSelf: false, color: 'linear-gradient(135deg, #FF6B6B 0%, #FFB347 100%)' }
          ]
        },
        {
          id: 2,
          name: '英语教研组',
          role: '成员',
          subject: '英语',
          subjectShort: '英语',
          color: 'linear-gradient(135deg, #6C63FF 0%, #A78BFA 100%)',
          memberCount: 7,
          members: [
            { avatarName: '陈', fullName: '陈老师', role: '组长', isSelf: false, color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { avatarName: '李', fullName: '李老师', role: '成员', isSelf: false, color: 'linear-gradient(135deg, #FF6B6B 0%, #FFB347 100%)' },
            { avatarName: '王', fullName: '王老师', role: '成员', isSelf: false, color: 'linear-gradient(135deg, #6C63FF 0%, #A78BFA 100%)' },
            { avatarName: '思', fullName: '思雅',   role: '成员', isSelf: true,  color: 'linear-gradient(135deg, #0049FF 0%, #71A0FF 100%)' }
          ]
        }
      ]
    }
  },
  computed: {
    currentMenuLabel() {
      const item = this.menuItems.find(m => m.key === this.currentMenu)
      return item ? item.label : ''
    },
    totalGroupMembers() {
      return this.groupList.reduce((sum, g) => sum + g.memberCount, 0)
    }
  },
  methods: {
    switchMenu(key) {
      this.currentMenu = key
      this.showVerifyPhone = false
      this.isEditing = false
      this.showGroupDetail = false
      this.currentGroup = null
    },
    openVerifyPhone() {
      this.showVerifyPhone = true
    },
    handleSave() {
      this.isEditing = false
    },
    handleLogout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('user/logout').then(() => {
          this.$router.push('/login')
        })
      }).catch(() => {})
    },
    startCountdown() {
      if (this.counting) return
      this.counting = true
      this.countdown = 60
      this.countdownTimer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.counting = false
          clearInterval(this.countdownTimer)
        }
      }, 1000)
    },
    goToChangePhone() {
      this.showVerifyPhone = false
      this.showChangePhone = true
      this.changePhoneForm = { prefix: '+86', phone: '', code: '' }
    },
    backToVerify() {
      this.showChangePhone = false
      this.showVerifyPhone = true
    },
    startChangeCountdown() {
      if (this.changeCounting) return
      this.changeCounting = true
      this.changeCountdown = 60
      this.changeCountdownTimer = setInterval(() => {
        this.changeCountdown--
        if (this.changeCountdown <= 0) {
          this.changeCounting = false
          clearInterval(this.changeCountdownTimer)
        }
      }, 1000)
    },
    handleConfirmChangePhone() {
      // TODO: 调用修改手机号接口
      this.showChangePhone = false
      this.form.phone = this.changePhoneForm.phone
    },
    viewGroupDetail(group) {
      this.currentGroup = group
      this.showGroupDetail = true
    },
    backToGroupList() {
      this.showGroupDetail = false
      this.currentGroup = null
    }
  },
  beforeDestroy() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    if (this.changeCountdownTimer) clearInterval(this.changeCountdownTimer)
  }
}
</script>

<style lang="scss" scoped>

// ─── 整体布局 ────────────────────────────────────────────────
.set-page {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #F0F3F6;
}

// ─── 左侧导航栏 ─────────────────────────────────────────────
.set-sidebar {
  width: 213px;
  flex-shrink: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-y: auto;
}

// 用户头部
.sidebar-user {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  padding: 18px;
  box-sizing: border-box;
  border-bottom: 1px solid #F2F3F7;
  cursor: pointer;
}

.su-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient( 45deg, #0049FF 0%, #71A0FF 100%);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.su-avatar_head{
  width: 44px;
  height: 44px;
  border-radius: 14px;
}

.su-meta {
  flex: 1;
  width: 0;
}

.su-name {
  width: 100%;
  font-weight: bold;
font-size: 13px;
color: #333333;
word-break: break-all;
}
.su-account{
  font-weight: 400;
font-size: 11px;
color: #999999;
margin-top: 5px;
}

.su-arrow {
  font-size: 12px;
  color: #C0C4CC;
  flex-shrink: 0;
}

// 菜单
.set-nav {
  height: 0;
  width: 100%;
  flex: 1;
  padding: 11px;
  box-sizing: border-box;

}

.set-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px;
  border-radius: 13px;
  cursor: pointer;
  transition: background $transition-fast;
  position: relative;
  margin-bottom: 2px;

  .item-icon {
    width: 15px;
    height: 15px;
  }

  .item-label {
    flex: 1;
    font-size: 13px;
    color: #666666;
    font-weight: 500;
    transition: color $transition-fast;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-arrow {
    font-size: 12px;
    color: #C0C4CC;
    flex-shrink: 0;
    transition: color $transition-fast;
  }

  &:hover:not(.active) {
    background: #F5F7FF;

    .item-icon,
    .item-label { color: $color-primary; }
  }

  &.active {
    background: #EEF3FF;

    .item-icon,
    .item-label {
      color: #0049FF;
      font-weight: bold;
    }

    .item-arrow { color: $color-primary; }

    
  }
  .set_nav_item_right{

    width: 13px;
    height: 13px;
  }
}

// 退出登录
.set-logout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px;
  border-top: 1px solid #F2F3F7;
  cursor: pointer;
  font-size: 14px;
  color: $text-secondary;
  transition: color $transition-fast;

  i { font-size: 16px; }

  &:hover { color: $color-danger; }
}

// ─── 右侧内容区 ─────────────────────────────────────────────
.set-content {
  flex: 1;
  // padding: 24px 28px;
  // overflow-y: auto;
  width: 0;
  height: 100%;
  min-width: 0;
  section{
    width: 100%;
     height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
}
.section_top{
  width: 100%;
  display: flex;
  height: 56px;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px 0 32px;
  box-sizing: border-box;
  background: #ffffff;
  
}
.section_top_left{
  flex: 1;
  width: 0;
 display: flex;
 justify-content: flex-start;
 align-items: center;
}
.section_top_left_text{
   font-weight: bold;
font-size: 15px;
color: #333333;
}
.section_top_right{

}
.section_last{
  width: 100%;
  flex: 1;
  height: 0;
  overflow-y: auto;
  padding: 32px;
  box-sizing: border-box;
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 18px;
}

// 通用白卡
.white-card {
  background: #fff;
  border-radius: $border-radius-lg;
  padding: 20px 24px;
  margin-bottom: 14px;
}

// 用户信息顶部卡片
.user-top-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
  box-sizing: border-box;
}

.utc-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.utc-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
background: linear-gradient( 45deg, #0049FF 0%, #71A0FF 100%);
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.utc-avatar_head{
width: 56px;
  height: 56px;
  border-radius: 14px;
}
.utc-name {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 5px;
}

.utc-role {
  font-size: 12px;
  color: #999999;
}

.utc-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

// 基本信息表单
.form-card {
  .section-label {
    font-size: 13px;
    color: $text-secondary;
    margin: 0 0 18px;
  }
}

.form-field {
  margin-bottom: 20px;

  &:last-child { margin-bottom: 0; }

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: 8px;
  }
}

.phone-row {
  display: flex;
  align-items: center;
  position: relative;

  .el-input { flex: 1; }

  .inline-link {
    position: absolute;
    right: 14px;
    font-size: 14px;
    color: $color-primary;
    cursor: pointer;
    font-weight: 500;
    z-index: 1;

    &:hover { opacity: 0.8; }
  }
}

// 提示信息
.info-notice {
  padding: 15px 17px;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 10px;
background: #EEF3FF;
border-radius: 13px 13px 13px 13px;
border: 1px solid #CAD9FF;

  .notice-icon {
    font-size: 16px;
    color: $color-primary;
    margin-top: 1px;
    flex-shrink: 0;
  }

  span {
    font-size: 13px;
    color: #4D6FD1;
    line-height: 1.7;
  }
}

// 占位区域
.placeholder-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.placeholder-inner {
  text-align: center;
  color: $text-secondary;

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;
    opacity: 0.4;
  }

  p {
    font-size: 14px;
    margin: 0;
    opacity: 0.5;
  }
}

// ─── 身份验证 ────────────────────────────────────────────────
.verify-header {
height: 56px;
background: #FFFFFF;
border-radius: 0px 0px 0px 0px;
// border: 1px solid #EDEEF3;
  display: flex;
  align-items: center;
 padding: 0 24px;
 box-sizing: border-box;
  position: relative;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: $text-regular;
  cursor: pointer;
  transition: color $transition-fast;

  i { font-size: 14px; }

  &:hover { color: $color-primary; }
}

.verify-page-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 15px;
  font-weight: bold;
  color: #333333;
  white-space: nowrap;
}

.verify-card {
  width: 664px;
  padding: 40px;
  // margin: 40px auto 0;
  // box-sizing: border-box;
  background: none;

  .verify-sub {
    font-size: 15px;
    font-weight: bold;
    color: #333333;
    margin: 0 0 26px;
  }

  .verify-input {
    margin-bottom: 14px;
  }
}

.code-row {
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 22px;

  .el-input { flex: 1; }

  .get-code-btn {
    position: absolute;
    right: 14px;
    font-size: 14px;
    color: $color-primary;
    cursor: pointer;
    font-weight: 500;
    transition: color $transition-fast;
    white-space: nowrap;
    z-index: 1;

    &.counting {
      color: $text-secondary;
      cursor: default;
    }

    &:not(.counting):hover { opacity: 0.8; }
  }
}

.next-btn {
  width: 100%;
  margin-bottom: 16px;
  font-size: 15px;
  height: 42px;
  border-radius: 12px 12px 12px 12px;

  &.is-disabled {
    background: #CAD9FF !important;
    border-color: #CAD9FF !important;
    color: #fff !important;
    cursor: not-allowed;
    opacity: 1 !important;
  }
}

.verify-note {
  text-align: center;
  font-size: 13px;
  color: #999999;
  margin: 0;
}

.phone-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  gap: 0;

  .phone-prefix-select {
    width: 90px;
    flex-shrink: 0;

    ::v-deep .el-input__inner {
      border-right: none !important;
      border-radius: 4px 0 0 4px !important;
      padding-right: 20px;
    }

    ::v-deep .el-input__suffix {
      right: 4px;
    }
  }

  .phone-number-input {
    flex: 1;

    
  }
}

.confirm-btn {
  background: #5ECEC8 !important;
  border-color: #5ECEC8 !important;

  &:not(.is-disabled):hover {
    opacity: 0.85;
  }

  &.is-disabled {
    background: #A8E6E3 !important;
    border-color: #A8E6E3 !important;
  }
}
// ─── 我的教研组 ────────────────────────────────────────────
.group-summary-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 13px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-sizing: border-box;

  .group-summary-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }

  .group-summary-icon-fallback {
    font-size: 20px;
    color: #0049FF;
    flex-shrink: 0;
  }

  .group-summary-text {
    font-size: 13px;
    color: #666;

    b {
      color: #333;
      font-weight: bold;
    }
  }
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.group-card {
  background: #fff;
  border-radius: 13px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 1px 4px rgba(0, 73, 255, 0.04);
  cursor: pointer;
}

.group-card-stripe {
  height: 4px;
  flex-shrink: 0;
  border-radius: 13px 0 0 13px;
  background: linear-gradient( 90deg, #0049FF 0%, #CAD9FF 100%);
}

.group-card-body {
  flex: 1;
  padding: 19px 22px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-card-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-card-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.group-role-badge {
  width: 36px;
height: 19px;
background: #EEF3FF;
border-radius: 20px 20px 20px 20px;
display: flex;
justify-content: center;
align-items: center;

  &.role-leader {
    font-weight: bold;
font-size: 10px;
color: #0049FF;
  }

  &.role-member {
    font-weight: normal;
font-size: 10px;
color: #71A0FF;
  }
}

.group-subject-tag {
  width: 40px;
  height: 40px;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
background: linear-gradient( 45deg, #0049FF 0%, #71A0FF 100%);
border-radius: 13px 13px 13px 13px;
}

.group-card-desc {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.group-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.group-members-row {
  display: flex;
  align-items: center;
  gap: 0;

  .group-member-count {
    font-size: 12px;
    color: #666666;
    margin-left: 10px;
  }
}
.group-card-bottom_xq{
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 3px;
}
.group-card-bottom_xq_text{
font-weight: bold;
font-size: 12px;
color: #71A0FF;
}
.group-card-bottom_xq_icon{
  width: 13px;
  height: 13px;
}
.member-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  flex-shrink: 0;
  position: relative;
}

.group-detail-link {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;

  i {
    font-size: 12px;
  }

  &:hover {
    color: #0049FF;
  }
}

.group-total-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  text-align: center;
  font-size: 12px;
  color: #D9D9D9;
  padding: 8px 0;
}
.group-total-tip_hx{
  flex: 1;
  width: 0;
  height: 1px;
  background: #EDEEF3;
}

// ─── 教研组详情页 ─────────────────────────────────────────
.gd-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  background: #F3F4F8;
  border-radius: 13px;
  padding: 9px 12px;
  margin-right: 12px;
  transition: color 0.2s;
  flex-shrink: 0;

  i { font-size: 13px; }

  &:hover { color: #0049FF; }
}

.gd-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.gd-banner-card {
  border-radius: 14px;
  padding: 24px 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  box-sizing: border-box;
}

.gd-banner-tag {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gd-banner-info {
  flex: 1;
}

.gd-banner-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 6px;
}

.gd-banner-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.gd-stats-card {
  background: #fff;
  border-radius: 13px;
  padding: 20px 22px;
  margin-bottom: 14px;
  box-sizing: border-box;
}

.gd-stats-num {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}

.gd-stats-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.gd-member-card {
  background: #fff;
  border-radius: 13px;
  padding: 20px 22px;
  box-sizing: border-box;
}

.gd-member-card-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.gd-member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;

  & + & {
    border-top: 1px solid #F5F6FA;
  }
}

.gd-member-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gd-member-info {
  flex: 1;
}

.gd-member-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.gd-member-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.gd-member-self-badge {
  font-size: 11px;
  color: #0049FF;
  background: #EEF3FF;
  border: 1px solid #CAD9FF;
  border-radius: 20px;
  padding: 1px 7px;
  line-height: 1.5;
}

.gd-member-role {
  font-size: 12px;
  color: #999;
}

::v-deep .el-input__inner{

border: 1px solid #CAD9FF!important;
}
::v-deep .el-input__inner:hover{

border: 1px solid #0049FF!important;
}
::v-deep .el-input.is-disabled .el-input__inner{
background-color:#F8F9FB!important;
border: 1px solid #EDEEF3!important;
color: #999999!important;
}
</style>
