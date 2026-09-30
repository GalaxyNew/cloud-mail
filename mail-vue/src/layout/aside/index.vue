<template>
  <el-scrollbar class="scroll">
    <div class="aside-container">
      <div class="title">
        <div class="brand-holo-icon">
          <Icon icon="solar:letter-bold-duotone" width="22" height="22" class="mail-core" />
        </div>
        <div class="brand-text">{{settingStore.settings.title || 'CLOUD MAIL'}}</div>
        <span class="brand-version">EDGE</span>
      </div>
      <el-menu :collapse="false" :text-color="uiStore.dark ? '#cbd5e1' : '#606266'" :active-text-color="uiStore.dark ? '#00f2fe' : '#1890ff'" style="margin-top: 10px">
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon icon="hugeicons:mailbox-01" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('inbox')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon icon="cil:send" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('sent')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon icon="ep:document" width="19" height="19" />
          <span class="menu-name" style="margin-left: 17px">{{$t('drafts')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon icon="solar:star-line-duotone" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('starred')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon icon="fluent:settings-48-regular" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('settings')}}</span>
        </el-menu-item>
        <div class="manage-title" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <span class="matrix-tag">// MATRIX_MANAGEMENT</span>
        </div>
        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon icon="fluent:data-pie-20-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 14px">{{$t('analytics')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="user" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon icon="si:user-alt-2-line" width="20" height="20" />
          <span class="menu-name" style="margin-left: 16px">{{$t('allUsers')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon icon="fluent:mail-list-28-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 15px">{{$t('allMail')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="role" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon icon="fluent:lock-closed-16-regular" width="22" height="22" />
          <span class="menu-name" style="margin-left: 15px">{{$t('permissions')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon icon="fluent:fingerprint-20-filled" width="22" height="22" />
          <span class="menu-name" style="margin-left: 15px">{{$t('inviteCode')}}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" style="margin-left: 2px" />
          <span class="menu-name" style="margin-left: 17px">{{$t('SystemSettings')}}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";
import {useUiStore} from "@/store/ui.js";

const settingStore = useSettingStore();
const uiStore = useUiStore();
const route = useRoute();
</script>

<style lang="scss" scoped>
.aside-container {
  padding-bottom: 20px;
}

.title {
  margin: 16px 12px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  position: relative;
  align-items: center;
  gap: 10px;
  color: #ffffff;
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(121, 40, 202, 0.2) 100%);
  border: 1px solid rgba(0, 242, 254, 0.35);
  box-shadow: 0 0 16px rgba(0, 242, 254, 0.15), inset 0 0 10px rgba(0, 242, 254, 0.05);
  transition: all 0.3s ease;
  max-width: 240px;
  padding: 0 12px;

  .brand-holo-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: rgba(0, 242, 254, 0.2);
    border: 1px solid rgba(0, 242, 254, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 10px rgba(0, 242, 254, 0.4);

    .mail-core {
      color: #00f2fe;
    }
  }

  .brand-text {
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 1px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    background: linear-gradient(90deg, #ffffff, #00f2fe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .brand-version {
    font-family: 'Rajdhani', monospace;
    font-size: 9px;
    font-weight: 700;
    color: #00ff9d;
    background: rgba(0, 255, 157, 0.12);
    border: 1px solid rgba(0, 255, 157, 0.4);
    border-radius: 3px;
    padding: 1px 4px;
    margin-left: auto;
  }
}

.manage-title {
  margin: 18px 12px 6px 16px;
  display: flex;
  align-items: center;

  .matrix-tag {
    font-family: 'Rajdhani', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: rgba(0, 242, 254, 0.6);
  }
}

.el-menu-item {
  margin: 4px 10px !important;
  border-radius: 6px;
  height: 38px;
  padding: 0 12px !important;
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 242, 254, 0.08) !important;
    color: #00f2fe !important;
    border-color: rgba(0, 242, 254, 0.2);
  }
}

.dark .choose-item {
  background: linear-gradient(90deg, rgba(0, 242, 254, 0.18) 0%, rgba(121, 40, 202, 0.12) 100%) !important;
  color: #00f2fe !important;
  border-left: 3px solid #00f2fe !important;
  border-color: rgba(0, 242, 254, 0.3) !important;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.12), inset 0 0 10px rgba(0, 242, 254, 0.05);
}

html:not(.dark) {
  .title {
    background: #ffffff !important;
    border: 1px solid #ebeef5 !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04) !important;
  }
  .brand-holo-icon {
    background: #e6f7ff !important;
    border: 1px solid #91d5ff !important;
    box-shadow: none !important;
    .mail-core { color: #1890ff !important; }
  }
  .brand-text {
    background: linear-gradient(90deg, #1890ff, #096dd9) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    font-family: inherit !important;
    font-weight: 700 !important;
  }
  .brand-version {
    color: #1890ff !important;
    background: #e6f7ff !important;
    border: 1px solid #91d5ff !important;
  }
  .matrix-tag {
    color: #909399 !important;
    font-family: inherit !important;
  }
  .el-menu-item {
    font-family: inherit !important;
    &:hover {
      background: #f5f7fa !important;
      color: #1890ff !important;
      border-color: transparent !important;
    }
  }
  .choose-item {
    background: #e6f7ff !important;
    color: #1890ff !important;
    border-left: 3px solid #1890ff !important;
    border-color: #91d5ff !important;
    box-shadow: none !important;
  }
}

.menu-name {
  user-select: none;
}

:deep(.el-scrollbar__wrap--hidden-default) {
  background: var(--aside-backgound) !important;
}

:deep(.el-menu) {
  background: var(--aside-backgound);
  border-right: 0;
  width: 250px;
}
</style>
