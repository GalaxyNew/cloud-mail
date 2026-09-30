<template>
  <div class="account-box">
    <div class="head-opt">
      <div class="opt-left">
        <Icon v-perm="'account:add'" class="icon add" icon="ion:add-outline" width="22" height="22" @click="add"/>
        <Icon class="icon refresh" icon="ion:reload" width="17" height="17" @click="refresh"/>
      </div>
      <div class="search-wrap">
        <el-input
            v-model="searchKey"
            class="account-search-input"
            size="small"
            :placeholder="$t('searchEmail')"
            clearable
        >
          <template #prefix>
            <Icon icon="ion:search-outline" width="14" height="14" class="search-icon"/>
          </template>
        </el-input>
      </div>
    </div>
    <el-scrollbar class="scrollbar" ref="scrollbarRef">
      <div v-infinite-scroll="getAccountList" :infinite-scroll-distance="600" :infinite-scroll-immediate="false">
        <el-card class="item" :class="itemBg(item.accountId)" v-for="(item, index) in displayAccounts" :key="item.accountId"
                 @click="changeAccount(item)">
          <div class="account">
            {{ item.email }}
          </div>
          <div class="opt">
            <div class="send-email" @click.stop>
              <Icon @click="setAllReceive(item)" v-if="!item.allReceive" icon="eva:email-fill" width="22" height="22" color="#fccb1a"/>
              <Icon @click="setAllReceive(item)" v-else icon="flat-color-icons:folder" width="22" height="22" color="#23c4f1" />
            </div>
            <div class="settings" @click.stop>
              <Icon icon="fluent-color:clipboard-24" width="22" height="22" @click.stop="copyAccount(item.email)"/>
              <Icon icon="fluent:settings-24-filled" width="21" height="21" color="#909399"
                    v-if="showNullSetting(item)"/>
              <el-dropdown v-else>
                <Icon icon="fluent:settings-24-filled" width="21" height="21" color="#909399"/>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="hasPerm('email:send')" @click="openSetName(item)">{{ $t('rename') }}</el-dropdown-item>
                    <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId" @click="setAsTop(item, index)">{{ $t('pin') }}</el-dropdown-item>
                    <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId && hasPerm('account:delete')"
                                      @click="remove(item)">{{ $t('delete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-card>

        <!-- Initial Loading Skeleton -->
        <template v-if="loading">
          <el-skeleton v-for="i in skeletonRows" :key="i" animated>
            <template #template>
              <el-card class="item">
                <el-skeleton-item variant="p" style="width: 70%; height: 20px; margin-bottom: 25px"/>
                <div style="display: flex; justify-content: space-between">
                  <el-skeleton-item variant="text" style="width: 20px"/>
                  <el-skeleton-item variant="text" style="width: 20px"/>
                </div>
              </el-card>
            </template>
          </el-skeleton>
        </template>

        <!-- Follow Loading Skeleton -->
        <template v-if="accounts.length > 0 && !noLoading">
          <el-skeleton animated>
            <template #template>
              <el-card class="item">
                <el-skeleton-item variant="p" style="width: 70%; height: 20px; margin-bottom: 20px"/>
                <div style="display: flex; justify-content: space-between">
                  <el-skeleton-item variant="text" style="width: 20px"/>
                  <el-skeleton-item variant="text" style="width: 20px"/>
                </div>
              </el-card>
            </template>
          </el-skeleton>
        </template>

        <div class="noLoading" v-if="noLoading && displayAccounts.length > 0 && !searchKey">
          <div>{{ $t('noMoreData') }}</div>
        </div>
        <div class="empty" v-if="(noLoading && accounts.length === 0) || (searchKey && displayAccounts.length === 0)">
          <el-empty :image-size="70" :description="$t('noMessagesFound')"/>
        </div>
      </div>

    </el-scrollbar>
    <el-dialog
        v-model="showAdd"
        :title="$t('addAccount')"
        append-to-body
        align-center
        class="add-account-dialog"
        width="480px"
    >
      <div class="container">
        <el-input v-model="addForm.email" ref="addRef" type="text" :placeholder="$t('emailAccount')" autocomplete="off" @keyup.enter="submit">
          <template #append>
            <div @click.stop="openSelect" class="suffix-select-box">
              <el-select
                  ref="mySelect"
                  v-model="addForm.suffix"
                  :placeholder="$t('select')"
                  class="select"
              >
                <el-option
                    v-for="item in domainList"
                    :key="item"
                    :label="item"
                    :value="item"
                />
              </el-select>
              <div class="suffix-content">
                <span>{{ addForm.suffix }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-button class="btn" type="primary" @click="submit" :loading="addLoading"
        >{{ $t('add') }}
        </el-button>
      </div>
      <div
          class="add-email-turnstile"
          :class="verifyShow ? 'turnstile-show' : 'turnstile-hide'"
          :data-sitekey="settingStore.settings.siteKey"
          data-callback="onTurnstileSuccess"
          data-error-callback="onTurnstileError"
      >
        <span style="font-size: 12px;color: #F56C6C" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
      </div>
    </el-dialog>
    <el-dialog
        v-model="setNameShow"
        :title="$t('changeUserName')"
        append-to-body
        align-center
        class="add-account-dialog set-name-dialog"
        width="420px"
    >
      <div class="container">
        <el-input v-model="accountName" type="text" :placeholder="$t('username')" autocomplete="off" @keyup.enter="setName">
        </el-input>
        <el-button class="btn" type="primary" @click="setName" :loading="setNameLoading"
        >{{ $t('save') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import {Icon} from "@iconify/vue";
import {computed, nextTick, reactive, ref, watch} from "vue";
import {
  accountList,
  accountAdd,
  accountDelete,
  accountSetName,
  accountSetAllReceive,
  accountSetAsTop
} from "@/request/account.js";
import {sleep} from "@/utils/time-utils.js"
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {useUserStore} from "@/store/user.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {AccountAllReceiveEnum} from "@/enums/account-enum.js";

const {t} = useI18n();
const userStore = useUserStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const emailStore = useEmailStore();
const showAdd = ref(false)
const addLoading = ref(false);
const domainList = computed(() => settingStore.domainList)
const accounts = reactive([])
const searchKey = ref(new URLSearchParams(window.location.search).get('accountSearch') || '')

const displayAccounts = computed(() => {
  if (!searchKey.value || !searchKey.value.trim()) {
    return accounts
  }
  const q = searchKey.value.trim().toLowerCase()
  return accounts.filter(item => {
    const emailMatch = item.email && item.email.toLowerCase().includes(q)
    const nameMatch = item.name && item.name.toLowerCase().includes(q)
    return emailMatch || nameMatch
  })
})
const noLoading = ref(false)
const loading = ref(false)
const followLoading = ref(false);
const verifyShow = ref(false)
const setNameShow = ref(false)
const setNameLoading = ref(false)
const accountName = ref(null)
const addRef = ref({})
const scrollbarRef = ref({})
let account = null
let turnstileId = null
const botJsError = ref(false)
let verifyToken = ''
let verifyErrorCount = 0
let first = true
const addForm = reactive({
  email: '',
  suffix: settingStore.domainList[0]
})
let skeletonRows = 10
const queryParams = {
  size: 30
}

const mySelect = ref()

if (hasPerm('account:query')) {
  getAccountList()
}

watch(() => accountStore.changeUserAccountName, () => {
  accounts[0].name = accountStore.changeUserAccountName
})

watch(() => settingStore.domainList, (list) => {
  if (!addForm.suffix && list.length > 0) {
    addForm.suffix = list[0]
  }
}, {immediate: true})


const openSelect = () => {
  mySelect.value.toggleMenu()
}

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) {
    return
  }
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.add-email-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

function getSkeletonRows() {
  if (accounts.length > 20) return skeletonRows = 20
  if (accounts.length === 0) return skeletonRows = 1
  skeletonRows = accounts.length
}

function setName() {

  if (setNameLoading.value) return

  let name = accountName.value

  if (name === account.name) {
    setNameShow.value = false
    return
  }

  if (!name) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameLoading.value = true
  accountSetName(account.accountId, name).then(() => {
    account.name = name
    setNameShow.value = false

    if (account.accountId === userStore.user.account.accountId) {
      userStore.user.name = name
    }

    ElMessage({
      message: t('saveSuccessMsg'),
      type: "success",
      plain: true
    })
  }).finally(() => {
    setNameLoading.value = false
  })
}

function openSetName(accountItem) {
  accountName.value = accountItem.name
  account = accountItem
  setNameShow.value = true
}

function setAllReceive(account) {
  let allReceiveAccount = accounts.find(account => account.allReceive === AccountAllReceiveEnum.ENABLED);
  if (allReceiveAccount && allReceiveAccount.accountId !== account.accountId) allReceiveAccount.allReceive = AccountAllReceiveEnum.DISABLED;
  account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
  accountSetAllReceive(account.accountId).catch(() => {
    account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
    if (allReceiveAccount) allReceiveAccount.allReceive = AccountAllReceiveEnum.ENABLED;
  }).then(() => {
    if (account.allReceive === AccountAllReceiveEnum.ENABLED) {
      ElMessage({
        message: t('setSuccess'),
        type: 'success',
        plain: true,
      })
    }
    changeAccount(account);
    emailStore.emailScroll?.refreshList();
    emailStore.sendScroll?.refreshList();
  })
}


function showNullSetting(item) {
  return !hasPerm('email:send') && !(item.accountId !== userStore.user.account.accountId && hasPerm('account:delete'))
}

function itemBg(accountId) {
  return accountStore.currentAccountId === accountId ? 'item-choose' : ''
}



function remove(account) {
  ElMessageBox.confirm(t('delConfirm', {msg: account.email}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    accountDelete(account.accountId).then(() => {
      const index = accounts.findIndex(item => item.accountId === account.accountId);
      accounts.splice(index, 1);
      if (accounts.length < queryParams.size) {
        getAccountList()
      }
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  });
}

function refresh() {
  if (loading.value) {
    return
  }
  loading.value = false
  followLoading.value = false
  noLoading.value = false
  queryParams.accountId = 0
  queryParams.lastSort = null
  getSkeletonRows();
  scrollbarRef.value.setScrollTop(0)
  accounts.splice(0, accounts.length)
  getAccountList()
}

function changeAccount(account) {
  accountStore.currentAccountId = account.accountId
  accountStore.currentAccount = account
}

function add() {
  addForm.suffix = addForm.suffix || settingStore.domainList[0]
  showAdd.value = true
  setTimeout(() => {
    addRef.value.focus()
  }, 100)
}

function setAsTop(account, index) {
  accountSetAsTop(account.accountId).then(() => {
    ElMessage({
      message: t('setSuccess'),
      type: 'success',
      plain: true,
    })

    const [item] = accounts.splice(index, 1);
    accounts.splice(1, 0, item);

  });
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      ElMessage({
        message: t('copySuccessMsg'),
        type: 'success',
        plain: true,
      });
    } else {
      throw new Error('execCommand failed');
    }
  } catch (e) {
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true,
    });
  } finally {
    document.body.removeChild(textarea);
  }
}

async function copyAccount(account) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(account);
      ElMessage({
        message: t('copySuccessMsg'),
        type: 'success',
        plain: true,
      });
      return;
    } catch (err) {
      fallbackCopy(account);
      return;
    }
  }
  fallbackCopy(account);
}

function getAccountList() {

  if (loading.value || followLoading.value || noLoading.value) return;

  if (accounts.length === 0) {
    loading.value = true
  } else {
    followLoading.value = true
  }

  let start = Date.now();

  const accountId = accounts.length > 0 ? accounts.at(-1).accountId : 0;
  const lastSort = accounts.length > 0 ? accounts.at(-1).sort : null;

  accountList(accountId, queryParams.size, lastSort).then(async list => {

    let end = Date.now();
    let duration = end - start;
    if (duration < 300) {
      await sleep(300 - duration)
    }

    if (list.length < queryParams.size) {
      noLoading.value = true
    }
    if (accounts.length === 0) {
      accountStore.currentAccount = list[0]
    }

    accounts.push(...list)

    loading.value = false
    followLoading.value = false
    first = false
  }).catch(() => {
    loading.value = false
    followLoading.value = false
  })
}


function submit() {

  if (addLoading.value) return

  if (!addForm.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (addForm.email.length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!isEmail(addForm.email + addForm.suffix)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (!verifyToken && (settingStore.settings.addEmailVerify === 0 || (settingStore.settings.addEmailVerify === 2 && settingStore.settings.addVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.add-email-turnstile')
          } catch (e) {
            botJsError.value = true
            console.log('人机验证js加载失败')
          }
        } else {
          window.turnstile.reset('.add-email-turnstile')
        }
      })
    } else if (!botJsError.value) {
      ElMessage({
        message: t('botVerifyMsg'),
        type: "error",
        plain: true
      })
    }
    return;
  }

  addLoading.value = true
  accountAdd(addForm.email + addForm.suffix, verifyToken).then(account => {
    addLoading.value = false
    addForm.email = ''
    accounts.push(account)
    verifyToken = ''
    settingStore.settings.addVerifyOpen = account.addVerifyOpen
    ElMessage({
      message: t('addSuccessMsg'),
      type: "success",
      plain: true
    })
    verifyShow.value = false
    showAdd.value = false
    userStore.refreshUserInfo()
  }).catch(res => {
    if (res.code === 400) {
      verifyToken = ''
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.add-email-turnstile')
        })
      }
      verifyShow.value = true
    }
    addLoading.value = false
  })
}
</script>
<style>
path[fill="#ffdda1"] {
  fill: #ffdd7d;
}

/* 全屏完全居中、加宽一倍的添加邮箱弹窗样式 */
.add-account-dialog.el-dialog {
  width: 480px !important;
  max-width: calc(100vw - 32px) !important;
  border-radius: 14px !important;
  margin: 0 auto !important;
  overflow: hidden;
}

.add-account-dialog .el-dialog__header {
  padding: 18px 24px 14px 24px !important;
  margin-right: 0 !important;
}

.add-account-dialog .el-dialog__title {
  font-size: 16px !important;
  font-weight: 600 !important;
  white-space: nowrap !important;
}

.add-account-dialog .el-dialog__body {
  padding: 20px 24px 24px 24px !important;
}

.add-account-dialog .container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-account-dialog .el-input {
  width: 100%;
  height: 42px;
}

.add-account-dialog .el-input__wrapper {
  padding-left: 12px;
  font-size: 14px;
}

.add-account-dialog .suffix-select-box {
  display: flex;
  align-items: center;
  padding: 0 10px;
  cursor: pointer;
}

.add-account-dialog .suffix-content {
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.add-account-dialog .btn {
  width: 100% !important;
  height: 42px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  margin-top: 6px !important;
}

/* 科幻暗黑主题样式 */
.dark .add-account-dialog.el-dialog {
  background: #091024 !important;
  border: 1px solid rgba(0, 242, 254, 0.4) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 242, 254, 0.25) !important;
}

.dark .add-account-dialog .el-dialog__header {
  border-bottom: 1px solid rgba(0, 242, 254, 0.15);
}

.dark .add-account-dialog .el-dialog__title {
  color: #00f2fe !important;
}

.dark .add-account-dialog .el-input-group__append {
  background: rgba(14, 23, 42, 0.9) !important;
  border-color: rgba(0, 242, 254, 0.3) !important;
  color: #00f2fe !important;
}
</style>
<style scoped lang="scss">
.account-box {
  height: 100%;
  overflow: hidden;
  transition: all 0.3s ease;

  .head-opt {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 38px;
    padding-left: 8px;
    padding-right: 8px;
    gap: 6px;
    transition: all 0.3s ease;

    .opt-left {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .icon {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .refresh {
      margin-left: 0;
    }

    .add {
      margin-left: 0;
    }

    .search-wrap {
      flex: 1;
      min-width: 0;

      .account-search-input {
        width: 100%;

        :deep(.el-input__wrapper) {
          border-radius: 6px;
          height: 26px;
          line-height: 26px;
          padding: 0 6px;
          box-shadow: none;
          transition: all 0.2s ease;
        }

        :deep(.el-input__inner) {
          height: 26px;
          font-size: 12px;
        }

        :deep(.el-input__prefix) {
          margin-right: 4px;
        }

        .search-icon {
          display: flex;
          align-items: center;
        }
      }
    }
  }

  .scrollbar {
    width: 100%;
    height: calc(100% - 38px);
    overflow: auto;
    @media (max-width: 767px) {
      height: calc(100% - 98px);
    }

    .empty {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .noLoading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px 0;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
  }

  .btn {
    width: 100%;
    margin-top: 15px;
  }

  .item {
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 11px;
    margin-left: 10px;
    margin-right: 10px;
    cursor: pointer;
    transition: all 0.25s ease;

    .account {
      font-size: 14px;
      margin-bottom: 16px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      letter-spacing: 0.5px;
    }

    .opt {
      display: flex;
      justify-content: space-between;
      font-size: 12px;

      .settings {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .send-email {
        display: flex;
        align-items: center;
      }
    }

    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .item:first-child {
    margin-top: 10px;
  }

  /* Dark Sci-Fi Mode */
  .dark & {
    border-right: 1px solid rgba(0, 242, 254, 0.18) !important;
    background: rgba(7, 11, 26, 0.85);
    backdrop-filter: blur(16px);

    .head-opt {
      border-bottom: 1px solid rgba(0, 242, 254, 0.15);
      .icon {
        color: #00f2fe;
        &:hover {
          filter: drop-shadow(0 0 8px #00f2fe);
          transform: scale(1.1);
        }
      }

      .account-search-input {
        :deep(.el-input__wrapper) {
          background: rgba(11, 19, 38, 0.85);
          border: 1px solid rgba(0, 242, 254, 0.25);
          color: #e2e8f0;

          &.is-focus, &:hover {
            border-color: #00f2fe;
            box-shadow: 0 0 10px rgba(0, 242, 254, 0.25) !important;
          }
        }

        :deep(.el-input__inner) {
          color: #e2e8f0;
          font-family: 'Rajdhani', monospace;
          letter-spacing: 0.5px;
          &::placeholder {
            color: rgba(148, 163, 184, 0.6);
            font-family: inherit;
          }
        }

        .search-icon {
          color: #00f2fe;
        }
      }
    }

    .scrollbar {
      .empty, .noLoading {
        color: #64748b;
      }
    }

    .item {
      background: rgba(11, 19, 38, 0.85);
      border: 1px solid rgba(0, 242, 254, 0.15);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);

      &:hover {
        border-color: rgba(0, 242, 254, 0.4);
        box-shadow: 0 0 15px rgba(0, 242, 254, 0.15);
        transform: translateY(-1px);
      }

      .account {
        font-family: 'Rajdhani', monospace;
        font-weight: 700;
        color: #f1f5f9;
      }

      .opt {
        color: #94a3b8;
      }
    }

    .item-choose {
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(121, 40, 202, 0.15) 100%) !important;
      border: 1px solid #00f2fe !important;
      box-shadow: 0 0 18px rgba(0, 242, 254, 0.25), inset 0 0 10px rgba(0, 242, 254, 0.05) !important;

      .account {
        color: #00f2fe !important;
        text-shadow: 0 0 10px rgba(0, 242, 254, 0.4);
      }
    }
  }

  /* Original White Mode */
  html:not(.dark) & {
    border-right: 1px solid #ebeef5 !important;
    background: #ffffff !important;
    backdrop-filter: none;

    .head-opt {
      border-bottom: 1px solid #ebeef5;
      .icon {
        color: #606266;
        &:hover {
          color: #1890ff;
          filter: none;
          transform: scale(1.08);
        }
      }

      .account-search-input {
        :deep(.el-input__wrapper) {
          background: #f5f7fa;
          border: 1px solid #e4e7ed;
          color: #303133;

          &.is-focus, &:hover {
            border-color: #1890ff;
            background: #ffffff;
            box-shadow: 0 0 0 1px #1890ff !important;
          }
        }

        :deep(.el-input__inner) {
          color: #303133;
          font-family: inherit;
          &::placeholder {
            color: #a8abb2;
          }
        }

        .search-icon {
          color: #909399;
        }
      }
    }

    .scrollbar {
      .empty, .noLoading {
        color: #909399;
      }
    }

    .item {
      background: #ffffff !important;
      border: 1px solid #ebeef5 !important;
      color: #303133 !important;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04) !important;

      &:hover {
        border-color: #d9d9d9 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
      }

      .account {
        color: #303133 !important;
        font-family: inherit !important;
        font-weight: 500;
        text-shadow: none !important;
      }

      .opt {
        color: #909399;
      }
    }

    .item-choose {
      background: #e6f7ff !important;
      border: 1px solid #91d5ff !important;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15) !important;

      .account {
        color: #1890ff !important;
        text-shadow: none !important;
        font-weight: 700;
        font-family: inherit !important;
      }
    }
  }
}

.setting-icon {
  position: relative;
  top: 6px;
}

:deep(.el-input-group__append) {
  padding: 0 !important;
  padding-left: 8px !important;
  background: var(--base-fill);
  border: 1px solid var(--base-border-color);
}

.dark :deep(.el-dialog) {
  width: 400px !important;
  background: #091024 !important;
  border: 1px solid rgba(0, 242, 254, 0.4) !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 242, 254, 0.2) !important;

  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.select {
  position: absolute;
  right: 30px;
  width: 100px;
  opacity: 0;
  pointer-events: none;
}

:deep(.el-pagination .el-select) {
  width: 100px;
  background: #091024;
}

.add-email-turnstile {
  margin-top: 15px;
}

.turnstile-show {
  opacity: 1;
}

.turnstile-hide {
  opacity: 0;
  pointer-events: none;
  position: fixed;
}

</style>
