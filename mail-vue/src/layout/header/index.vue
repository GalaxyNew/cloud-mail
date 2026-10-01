<template>
  <div class="header" :class="!hasPerm('email:send') ? 'not-send' : ''">
    <div class="header-btn">
      <hanburger @click="changeAside"></hanburger>
      <span class="breadcrumb-item">{{ $t(route.meta.title) }}</span>
      <div class="hud-telemetry-badge">
        <span class="pulse-emerald"></span>
        <span class="telemetry-label">CF-EDGE // ARMED</span>
      </div>
    </div>
    <div v-perm="'email:send'" class="writer-box" @click="openSend" title="COMPOSE / 新建邮件">
      <div class="writer">
        <Icon icon="solar:pen-new-square-bold" width="20" height="20"/>
      </div>
    </div>
    <div class="toolbar">
      <!-- Dual Style Switcher: Toggle between 科幻 and 淡雅 -->
      <div 
        class="theme-mode-switch" 
        :class="uiStore.dark ? 'is-scifi' : 'is-white'" 
        @click="openDark($event)"
        :title="uiStore.dark ? '科幻' : '淡雅'"
      >
        <div class="switch-inner">
          <span class="status-indicator"></span>
          <Icon v-if="uiStore.dark" icon="solar:planet-bold" class="mode-icon" width="16" height="16" />
          <Icon v-else icon="solar:sun-2-bold" class="mode-icon" width="16" height="16" />
          <span class="mode-title">{{ uiStore.dark ? '科幻' : '淡雅' }}</span>
        </div>
      </div>
      <div class="notice icon-item" @click="openNotice" title="Broadcast Notice">
        <Icon icon="streamline-plump:announcement-megaphone"/>
      </div>
      <el-dropdown ref="userinfoRef" @visible-change="e => userInfoShow = e" :teleported="false" popper-class="detail-dropdown">
        <div class="avatar" @click="userInfoHide" >
          <div class="avatar-text">
            <div>{{ formatName(userStore.user.email) }}</div>
          </div>
          <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
        </div>
        <template #dropdown>
          <div class="user-details">
            <div class="details-avatar">
              {{ formatName(userStore.user.email) }}
            </div>
            <div class="user-name">
              {{ userStore.user.name }}
            </div>
            <div class="detail-email" @click="copyEmail(userStore.user.email)" title="Click to copy">
              {{ userStore.user.email }}
            </div>
            <div class="detail-user-type">
              <el-tag>{{ userStore.user.role.name }}</el-tag>
            </div>
            <div class="action-info">
              <div class="info-row">
                <span class="info-label">{{ $t('sendCount') }}</span>
                <div class="info-val">
                  <span v-if="sendCount" style="margin-right: 5px">{{ sendCount }}</span>
                  <el-tag v-if="!hasPerm('email:send')" size="small">{{ sendType }}</el-tag>
                  <el-tag v-else size="small">{{ sendType }}</el-tag>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">{{ $t('accountCount') }}</span>
                <div class="info-val">
                  <el-tag size="small" v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail">
                    {{ $t('disabled') }}
                  </el-tag>
                  <span v-else-if="accountCount && hasPerm('account:add')"
                        style="margin-right: 5px">{{ $t('totalUserAccount', {msg: accountCount}) }}</span>
                  <el-tag size="small" v-else-if="!accountCount && hasPerm('account:add')">{{ $t('unlimited') }}</el-tag>
                  <el-tag size="small" v-else-if="!hasPerm('account:add')">{{ $t('unauthorized') }}</el-tag>
                </div>
              </div>
            </div>
            <div class="logout">
              <el-button type="primary" :loading="logoutLoading" @click="clickLogout">{{ $t('logOut') }}</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import hanburger from '@/components/hamburger/index.vue'
import {logout} from "@/request/login.js";
import {Icon} from "@iconify/vue";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {useRoute} from "vue-router";
import {computed, ref} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {setExtend} from "@/utils/day.js"

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const logoutLoading = ref(false)
const userInfoShow = ref(false)
const userinfoRef = ref({})

const accountCount = computed(() => {
  return userStore.user?.role?.accountCount || 0
})

const sendType = computed(() => {
  if (settingStore.settings.send === 1) {
    return t('disabled')
  }

  if (!hasPerm('email:send')) {
    return t('unauthorized')
  }

  if (userStore.user?.role?.sendType === 'ban') {
    return t('sendBanned')
  }

  if (userStore.user?.role?.sendType === 'internal') {
    return t('sendInternal')
  }

  if (!userStore.user?.role?.sendCount) {
    return t('unlimited')
  }

  if (userStore.user?.role?.sendType === 'day') {
    return t('daily')
  }

  if (userStore.user?.role?.sendType === 'count') {
    return t('total')
  }
  return t('unlimited')
})

const sendCount = computed(() => {
  if (!hasPerm('email:send')) {
    return null
  }

  if (userStore.user?.role?.sendType === 'ban') {
    return null
  }

  if (userStore.user?.role?.sendType === 'internal') {
    return null
  }

  if (!userStore.user?.role?.sendCount) {
    return null
  }

  if (userStore.user?.role?.sendType === 'day') {
    let now = setExtend(new Date())
    let count = userStore.user?.daySendCountMap?.[now] || 0
    return (userStore.user.role.sendCount || 0) - count
  }

  if (userStore.user?.role?.sendType === 'count') {
    let count = userStore.user?.account?.sendCount || 0
    return (userStore.user.role.sendCount || 0) - count
  }
  return null
})

function openNotice() {
  uiStore.noticeShow = true
}

function openDark(event) {
  uiStore.toggleDarkWithTransition(event)
}

function changeAside() {
  uiStore.asideShow = !uiStore.asideShow
}

function openSend() {
  uiStore.writerRef.openSend()
}

function userInfoHide() {
  if (userInfoShow.value) {
    userinfoRef.value.handleClose()
  } else {
    userinfoRef.value.handleOpen()
  }
}

function copyEmail(email) {
  navigator.clipboard.writeText(email).then(() => {
    ElMessage({
      message: t('copySuccess'),
      type: 'success',
      plain: true,
    })
  })
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('oauthProvider')
    router.replace({name: 'login'})
  }).finally(() => {
    logoutLoading.value = false
  })
}

function formatName(email) {
  return email ? email[0]?.toUpperCase() : 'U'
}
</script>

<style>
.detail-dropdown {
  color: var(--el-text-color-primary) !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
</style>

<style lang="scss" scoped>
.header {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: relative;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 14px;
}

.breadcrumb-item {
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 1px;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(0, 242, 254, 0.4);
}

.hud-telemetry-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(0, 255, 157, 0.08);
  border: 1px solid rgba(0, 255, 157, 0.25);
  font-family: 'Rajdhani', monospace;
  font-size: 10px;
  font-weight: 700;
  color: #00ff9d;
  letter-spacing: 0.8px;

  .pulse-emerald {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #00ff9d;
    box-shadow: 0 0 6px #00ff9d;
    animation: pulseDot 1.8s infinite;
  }

  @media (max-width: 640px) {
    display: none;
  }
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.8); }
}

.writer-box {
  cursor: pointer;
  display: flex;
  align-items: center;
  margin: 0 10px;

  .writer {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    color: #ffffff;
    background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
    border: 1px solid #00f2fe;
    box-shadow: 0 0 16px rgba(0, 198, 255, 0.45);
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      box-shadow: 0 0 25px rgba(0, 242, 254, 0.8);
      transform: translateY(-1px) scale(1.05);
    }
  }
}

/* Theme Mode Switch */
.theme-mode-switch {
  display: inline-flex;
  align-items: center;
  align-self: center;
  height: 32px;
  padding: 0 10px;
  border-radius: 20px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 12px;
  letter-spacing: 0.5px;
  margin-right: 4px;

  .switch-inner {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &.is-scifi {
    background: rgba(0, 242, 254, 0.08);
    border: 1px solid rgba(0, 242, 254, 0.4);
    color: #00f2fe;
    box-shadow: 0 0 12px rgba(0, 242, 254, 0.15);

    &:hover {
      background: rgba(0, 242, 254, 0.18);
      box-shadow: 0 0 18px rgba(0, 242, 254, 0.35);
      transform: translateY(-1px);
    }

    .status-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00f2fe;
      box-shadow: 0 0 8px #00f2fe;
      animation: pulseCyan 2s infinite;
    }

    .mode-title {
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
  }

  &.is-white {
    background: #f0f5ff;
    border: 1px solid #adc6ff;
    color: #1d39c4;
    box-shadow: 0 2px 6px rgba(24, 144, 255, 0.12);

    &:hover {
      background: #e6f7ff;
      border-color: #1890ff;
      box-shadow: 0 2px 10px rgba(24, 144, 255, 0.22);
      transform: translateY(-1px);
    }

    .status-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fa8c16;
      box-shadow: 0 0 6px rgba(250, 140, 22, 0.5);
    }

    .mode-title {
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
  }
}

@keyframes pulseCyan {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* Light theme overrides for header */
html:not(.dark) {
  .header {
    background: #ffffff;
    border-bottom: 1px solid #ebeef5;
  }
  .breadcrumb-item {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #303133;
    text-shadow: none;
  }
  .hud-telemetry-badge {
    background: #f6ffed;
    border-color: #b7eb8f;
    color: #52c41a;
    .pulse-emerald {
      background: #52c41a;
      box-shadow: 0 0 4px #52c41a;
    }
  }
  .writer-box .writer {
    background: linear-gradient(135deg, #1890ff, #3a80dd);
    border: none;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.35);
  }
  .toolbar .icon-item {
    background: #f0f2f5;
    border: 1px solid #e4e7ed;
    color: #606266;
    &:hover {
      background: #e6f7ff;
      color: #1890ff;
      border-color: #91d5ff;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
    }
  }
  .toolbar .avatar .avatar-text {
    background: #e6f7ff;
    color: #1890ff;
    border-color: #91d5ff;
    box-shadow: none;
    font-family: -apple-system, sans-serif;
  }
  .user-details {
    background: #ffffff !important;
    border: 1px solid #ebeef5 !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
    color: #303133 !important;
    .user-name { color: #303133 !important; }
    .details-avatar {
      background: #f0f2f5 !important;
      color: #1890ff !important;
      border-color: #d9d9d9 !important;
      box-shadow: none !important;
    }
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;

  .icon-item {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(0, 242, 254, 0.2);
    color: #00f2fe;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 242, 254, 0.15);
      border-color: #00f2fe;
      box-shadow: 0 0 12px rgba(0, 242, 254, 0.35);
      transform: translateY(-1px);
    }
  }

  .avatar {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;

    .avatar-text {
      background: rgba(0, 242, 254, 0.15);
      color: #00f2fe;
      height: 34px;
      width: 34px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8px;
      border: 1px solid rgba(0, 242, 254, 0.5);
      box-shadow: 0 0 12px rgba(0, 242, 254, 0.25);
      font-family: 'Orbitron', sans-serif;
      font-weight: 700;
    }

    .setting-icon {
      color: #94a3b8;
    }
  }
}

/* User Details Dropdown */
.user-details {
  width: 270px;
  background: #091024 !important;
  border: 1px solid rgba(0, 242, 254, 0.35);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 242, 254, 0.2);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .details-avatar {
    width: 48px;
    height: 48px;
    background: rgba(0, 242, 254, 0.15);
    color: #00f2fe;
    border: 1px solid rgba(0, 242, 254, 0.6);
    box-shadow: 0 0 15px rgba(0, 242, 254, 0.35);
    font-family: 'Orbitron', sans-serif;
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
  }

  .user-name {
    font-weight: 700;
    font-size: 15px;
    color: #ffffff;
    margin-top: 10px;
    letter-spacing: 0.5px;
  }

  .detail-email {
    font-size: 12px;
    color: #00f2fe;
    cursor: pointer;
    margin-top: 4px;
    font-family: 'Rajdhani', monospace;
    letter-spacing: 0.5px;
    &:hover {
      text-decoration: underline;
    }
  }

  .detail-user-type {
    margin-top: 10px;
  }

  .action-info {
    width: 100%;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
    color: #94a3b8;

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .info-label {
      color: #94a3b8;
      font-weight: 500;
    }

    .info-val {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .logout {
    margin-top: 18px;
    width: 100%;

    .el-button {
      width: 100%;
      height: 34px;
      border-radius: 6px;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      letter-spacing: 1px;
    }
  }
}
</style>
