<template>
  <div class="generator-page" :class="uiStore.dark ? 'dark-theme' : 'light-theme'">
    <!-- Ambient Sci-Fi Starfield / Glow (Dark Mode Only) -->
    <div class="ambient-bg" v-if="uiStore.dark">
      <div class="stars-layer"></div>
      <div class="glow-orb cyan"></div>
      <div class="glow-orb purple"></div>
    </div>

    <!-- Header Navigation -->
    <header class="page-header">
      <div class="brand" @click="router.push('/login')">
        <div class="brand-icon">
          <Icon icon="solar:letter-bold-duotone" width="22" height="22" />
        </div>
        <div class="brand-text">CLOUD MAIL // GENERATOR</div>
        <span class="badge">tv987.shop</span>
      </div>

      <div class="header-actions">
        <!-- Theme Mode Switcher -->
        <div 
          class="theme-mode-switch" 
          :class="uiStore.dark ? 'is-scifi' : 'is-white'"
          @click="toggleTheme"
          :title="uiStore.dark ? '切换为原版白色风格' : '切换为新版科幻风格'"
        >
          <div class="switch-inner">
            <span class="status-indicator"></span>
            <Icon :icon="uiStore.dark ? 'solar:planet-3-bold-duotone' : 'solar:sun-2-bold-duotone'" width="16" height="16" />
            <span class="mode-title">{{ uiStore.dark ? '新版科幻风' : '原版白色风' }}</span>
            <span class="mode-tag">{{ uiStore.dark ? '切原版白' : '切科幻版' }}</span>
          </div>
        </div>

        <button class="nav-btn" @click="goToLogin">
          <Icon icon="solar:login-2-bold" width="16" height="16" />
          <span>{{ hasToken ? '进入邮箱控制台' : '返回登录界面' }}</span>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="page-main">
      <div class="generator-container">
        
        <!-- Top Creator Card -->
        <div class="cyber-card creator-card">
          <div class="card-glow-bar"></div>
          
          <div class="card-header">
            <div class="title-wrap">
              <div class="card-icon">
                <Icon icon="solar:magic-stick-3-bold-duotone" width="24" height="24" />
              </div>
              <div>
                <h1 class="card-title">快速生成新邮箱</h1>
                <p class="card-subtitle">无需身份验证 · 即开即用 · 固定后缀 @tv987.shop</p>
              </div>
            </div>
            <div class="rule-tag">
              <Icon icon="solar:shield-check-bold" width="14" height="14" />
              <span>格式：igor + 时间戳后4位 + 2位随机字母</span>
            </div>
          </div>

          <div class="card-body">
            <div class="input-form">
              <label class="form-label">
                <span>邮箱前缀 // MAILBOX PREFIX</span>
                <span class="suffix-tip">固定域名：<strong>@tv987.shop</strong></span>
              </label>

              <div class="input-row">
                <div class="prefix-input-wrap">
                  <el-input
                    v-model="emailPrefix"
                    placeholder="请输入或随机生成前缀，如：igor8824xk"
                    class="prefix-input"
                    clearable
                    @keyup.enter="handleCreate"
                  >
                    <template #prefix>
                      <Icon icon="solar:letter-linear" width="18" height="18" class="input-prefix-icon" />
                    </template>
                    <template #append>
                      <div class="fixed-domain-badge">
                        <span>@tv987.shop</span>
                      </div>
                    </template>
                  </el-input>
                </div>

                <button class="action-btn random-btn" type="button" @click="generateRandomEmail" title="按格式随机生成新前缀">
                  <Icon icon="solar:refresh-bold-duotone" width="18" height="18" :class="{ 'spinning': isGenerating }" />
                  <span>随机生成</span>
                </button>
              </div>

              <!-- Create Button -->
              <button 
                class="action-btn create-btn" 
                type="button" 
                @click="handleCreate"
                :disabled="!emailPrefix.trim()"
              >
                <Icon icon="solar:add-circle-bold" width="20" height="20" />
                <span>立即创建并加入今日列表</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Today Created List Card -->
        <div class="cyber-card list-card">
          <div class="list-header">
            <div class="list-title-wrap">
              <div class="card-icon mini">
                <Icon icon="solar:history-bold-duotone" width="18" height="18" />
              </div>
              <h2 class="list-title">今日创建的邮箱列表</h2>
              <span class="count-badge">今日共 {{ todayList.length }} 个</span>
            </div>

            <div class="list-actions" v-if="todayList.length > 0">
              <button class="list-tool-btn copy-all" @click="copyAllToday" title="复制今日所有邮箱（换行分隔）">
                <Icon icon="solar:clipboard-list-bold-duotone" width="16" height="16" />
                <span>复制全部今日邮箱</span>
              </button>
              <button class="list-tool-btn clear-btn" @click="clearTodayList" title="清空今日记录">
                <Icon icon="solar:trash-bin-trash-bold-duotone" width="15" height="15" />
                <span>清空记录</span>
              </button>
            </div>
          </div>

          <!-- Email Item List -->
          <div class="list-body">
            <transition-group name="list-anim" tag="div" class="items-wrap" v-if="todayList.length > 0">
              <div class="email-item" v-for="(item, index) in todayList" :key="item.id || item.email">
                <div class="item-left">
                  <span class="item-index">#{{ todayList.length - index }}</span>
                  <div class="item-icon-box">
                    <Icon icon="solar:mailbox-bold-duotone" width="20" height="20" />
                  </div>
                  <div class="item-info">
                    <div class="item-email">{{ item.email }}</div>
                    <div class="item-meta">
                      <span class="item-time">
                        <Icon icon="solar:clock-circle-linear" width="12" height="12" />
                        {{ item.time || '今日创建' }}
                      </span>
                      <span class="item-domain-tag">@tv987.shop</span>
                      <span class="item-user-tag" v-if="item.assignedUser">
                        <Icon icon="solar:user-bold" width="11" height="11" />
                        归属: {{ item.assignedUser }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="item-right">
                  <button 
                    class="copy-btn" 
                    :class="{ 'copied': item.justCopied }"
                    @click="copyEmailItem(item)"
                    title="复制完整邮箱号"
                  >
                    <Icon :icon="item.justCopied ? 'solar:check-circle-bold' : 'solar:copy-bold-duotone'" width="16" height="16" />
                    <span>{{ item.justCopied ? '已复制 ✓' : '复制邮箱' }}</span>
                  </button>

                  <button class="delete-btn" @click="deleteItem(index)" title="从列表中移除">
                    <Icon icon="solar:close-circle-bold" width="16" height="16" />
                  </button>
                </div>
              </div>
            </transition-group>

            <!-- Empty State -->
            <div class="empty-state" v-else>
              <div class="empty-icon">
                <Icon icon="solar:inbox-line-linear" width="48" height="48" />
              </div>
              <div class="empty-text">今日暂无创建的邮箱记录</div>
              <div class="empty-sub">点击上方【随机生成】并【立即创建】，生成的邮箱号将实时列在下方</div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- Footer -->
    <footer class="page-footer">
      <div>CLOUD MAIL // MATRIX EDGE · INSTANT DISPATCH ENGINE</div>
      <div class="footer-note">DOMAINS: @tv987.shop · ENCRYPTION READY</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUiStore } from '@/store/ui.js';
import { generatorCreate } from '@/request/account.js';

const router = useRouter();
const uiStore = useUiStore();

const emailPrefix = ref('');
const isGenerating = ref(false);
const todayList = ref([]);
const STORAGE_KEY = 'cloudmail_today_created_tv987';

const hasToken = computed(() => !!localStorage.getItem('token'));

// Get current date string formatted as YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get current time string formatted as HH:mm:ss
function getCurrentTimeString() {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Generate 2 random lowercase English letters [a-z]
function getRandomLetters(len = 2) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let res = '';
  for (let i = 0; i < len; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// Random email generator format: igor + timestamp last 4 digits + 2 random letters
function generateRandomEmail() {
  isGenerating.value = true;
  const timestampStr = String(Date.now());
  const last4Digits = timestampStr.slice(-4);
  const random2Letters = getRandomLetters(2);
  const newPrefix = `igor${last4Digits}${random2Letters}`;

  emailPrefix.value = newPrefix;
  setTimeout(() => {
    isGenerating.value = false;
  }, 250);

  ElMessage({
    message: `已随机生成前缀：${newPrefix}`,
    type: 'success',
    duration: 1500,
    plain: true
  });
}

// Create email handler
async function handleCreate() {
  let prefix = emailPrefix.value.trim().toLowerCase();
  // If user pasted full email with @, strip the domain part
  if (prefix.includes('@')) {
    prefix = prefix.split('@')[0];
  }

  if (!prefix) {
    ElMessage({
      message: '请输入或点击随机生成邮箱前缀',
      type: 'warning',
      plain: true
    });
    return;
  }

  // Validate prefix format: alphanumeric and valid email prefix characters
  if (!/^[a-zA-Z0-9._-]+$/.test(prefix)) {
    ElMessage({
      message: '邮箱前缀只支持英文字母、数字、点号和下划线',
      type: 'error',
      plain: true
    });
    return;
  }

  const fullEmail = `${prefix}@tv987.shop`;
  const todayStr = getTodayDateString();
  const timeStr = getCurrentTimeString();

  // Check if this email was already created today
  const exists = todayList.value.some(item => item.email.toLowerCase() === fullEmail.toLowerCase());
  if (exists) {
    ElMessage({
      message: `该邮箱今日已在列表中：${fullEmail}`,
      type: 'warning',
      plain: true
    });
    return;
  }

  // Call public generatorCreate API to register email under the assigned target account
  let assignedUserEmail = '';
  try {
    const res = await generatorCreate(fullEmail);
    if (res && res.targetUserEmail) {
      assignedUserEmail = res.targetUserEmail;
    }
  } catch (e) {
    console.warn('Backend generatorCreate notice:', e);
    // If backend returned a clear validation error, alert user
    if (e && e.message && !e.message.includes('Network Error')) {
      ElMessage({
        message: e.message,
        type: 'warning',
        plain: true
      });
    }
  }

  const record = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    email: fullEmail,
    prefix: prefix,
    suffix: '@tv987.shop',
    date: todayStr,
    time: timeStr,
    assignedUser: assignedUserEmail,
    createTimestamp: Date.now(),
    justCopied: false
  };

  // Prepend to top of today's list
  todayList.value.unshift(record);
  saveToStorage();

  // Automatically copy created email to clipboard
  try {
    await navigator.clipboard.writeText(fullEmail);
    ElMessage({
      message: assignedUserEmail
        ? `🎉 邮箱创建成功并已复制！已归属于账号：${assignedUserEmail}`
        : `🎉 邮箱创建成功并已复制：${fullEmail}`,
      type: 'success',
      duration: 3500,
      plain: true
    });
  } catch (err) {
    fallbackCopy(fullEmail);
  }

  // Clear input box so user can enter another or click random generate
  emailPrefix.value = '';
}

// Copy single item
async function copyEmailItem(item) {
  try {
    await navigator.clipboard.writeText(item.email);
    item.justCopied = true;
    setTimeout(() => {
      item.justCopied = false;
    }, 1800);
    ElMessage({
      message: `已复制邮箱：${item.email}`,
      type: 'success',
      duration: 1800,
      plain: true
    });
  } catch (err) {
    fallbackCopy(item.email);
  }
}

// Copy text utility
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage({
      message: `已复制：${text}`,
      type: 'success',
      duration: 1500,
      plain: true
    });
  } catch (err) {
    fallbackCopy(text);
  }
}

// Fallback copy using textarea
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  ElMessage({
    message: `已复制：${text}`,
    type: 'success',
    duration: 1500,
    plain: true
  });
}

// Copy all today's emails joined by newline
async function copyAllToday() {
  if (todayList.value.length === 0) return;
  const allEmails = todayList.value.map(item => item.email).join('\n');
  try {
    await navigator.clipboard.writeText(allEmails);
    ElMessage({
      message: `已复制今日全部 ${todayList.value.length} 个邮箱！`,
      type: 'success',
      duration: 2500,
      plain: true
    });
  } catch (err) {
    fallbackCopy(allEmails);
  }
}

// Delete single record
function deleteItem(index) {
  todayList.value.splice(index, 1);
  saveToStorage();
}

// Clear today's list
function clearTodayList() {
  ElMessageBox.confirm('确定要清空今日创建的所有邮箱记录吗？', '清空提示', {
    confirmButtonText: '确定清空',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    todayList.value = [];
    saveToStorage();
    ElMessage({
      message: '今日邮箱记录已清空',
      type: 'info',
      plain: true
    });
  });
}

// Save list to localStorage (filter out non-today records)
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todayList.value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// Load today list from localStorage
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const todayStr = getTodayDateString();
    // Filter strictly for today's records
    todayList.value = Array.isArray(parsed) 
      ? parsed.filter(item => item && item.date === todayStr)
      : [];
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
  }
}

function toggleTheme(event) {
  uiStore.toggleDarkWithTransition(event);
}

function goToLogin() {
  if (hasToken.value) {
    router.push('/inbox');
  } else {
    router.push('/login');
  }
}

onMounted(() => {
  loadFromStorage();
});
</script>

<style lang="scss" scoped>
.generator-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: background-color 0.35s ease, color 0.35s ease;
}

/* ================= Sci-Fi Dark Mode ================= */
.dark-theme {
  background-color: #060814;
  color: #e2e8f0;

  .ambient-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;

    .stars-layer {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(1px 1px at 30px 40px, #ffffff, rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 120px 150px, #00f2fe, rgba(0,0,0,0)),
        radial-gradient(1px 1px at 300px 250px, #b026ff, rgba(0,0,0,0)),
        radial-gradient(1.5px 1.5px at 600px 450px, #4facfe, rgba(0,0,0,0));
      background-size: 500px 500px;
      opacity: 0.45;
    }

    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(140px);
      opacity: 0.35;

      &.cyan {
        top: -10%;
        right: 15%;
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, #00f2fe 0%, rgba(0, 242, 254, 0) 70%);
      }

      &.purple {
        bottom: 5%;
        left: 10%;
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, #7928ca 0%, rgba(121, 40, 202, 0) 70%);
      }
    }
  }

  .page-header {
    background: rgba(9, 14, 30, 0.85);
    border-bottom: 1px solid rgba(0, 242, 254, 0.18);
    backdrop-filter: blur(16px);
  }

  .brand .brand-icon {
    background: rgba(0, 242, 254, 0.15);
    border: 1px solid rgba(0, 242, 254, 0.4);
    color: #00f2fe;
    box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
  }

  .brand .brand-text {
    background: linear-gradient(90deg, #ffffff, #00f2fe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .brand .badge {
    color: #00ff9d;
    background: rgba(0, 255, 157, 0.12);
    border: 1px solid rgba(0, 255, 157, 0.4);
  }

  .nav-btn {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(0, 242, 254, 0.25);
    color: #00f2fe;

    &:hover {
      background: rgba(0, 242, 254, 0.15);
      border-color: #00f2fe;
      box-shadow: 0 0 12px rgba(0, 242, 254, 0.3);
    }
  }

  .cyber-card {
    background: rgba(10, 16, 36, 0.85);
    border: 1px solid rgba(0, 242, 254, 0.22);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 242, 254, 0.08);
    backdrop-filter: blur(16px);

    .card-glow-bar {
      background: linear-gradient(90deg, #00f2fe, #7928ca, #00ff9d);
    }

    .card-icon {
      background: rgba(0, 242, 254, 0.12);
      border: 1px solid rgba(0, 242, 254, 0.35);
      color: #00f2fe;
    }

    .card-title {
      color: #ffffff;
      text-shadow: 0 0 12px rgba(0, 242, 254, 0.4);
    }

    .card-subtitle {
      color: #94a3b8;
    }

    .rule-tag {
      background: rgba(0, 255, 157, 0.08);
      border: 1px solid rgba(0, 255, 157, 0.25);
      color: #00ff9d;
    }

    .form-label {
      color: #cbd5e1;
      .suffix-tip strong { color: #00f2fe; }
    }

    .prefix-input {
      :deep(.el-input__wrapper) {
        background: rgba(11, 19, 38, 0.95);
        border: 1px solid rgba(0, 242, 254, 0.3);
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);

        &.is-focus, &:hover {
          border-color: #00f2fe;
          box-shadow: 0 0 14px rgba(0, 242, 254, 0.3) !important;
        }

        .el-input__inner {
          color: #ffffff;
          font-family: 'Rajdhani', monospace;
          font-weight: 700;
          font-size: 16px;
        }
      }

      :deep(.el-input-group__append) {
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(0, 242, 254, 0.3);
        border-left: none;
      }
    }

    .fixed-domain-badge {
      color: #00f2fe;
      font-weight: 700;
      text-shadow: 0 0 8px rgba(0, 242, 254, 0.4);
    }

    .random-btn {
      background: rgba(0, 242, 254, 0.1);
      border: 1px solid rgba(0, 242, 254, 0.4);
      color: #00f2fe;

      &:hover {
        background: rgba(0, 242, 254, 0.22);
        box-shadow: 0 0 16px rgba(0, 242, 254, 0.4);
      }
    }

    .preview-box {
      background: rgba(0, 242, 254, 0.06);
      border: 1px dashed rgba(0, 242, 254, 0.35);

      .preview-label { color: #94a3b8; }
      .preview-email { color: #00f2fe; text-shadow: 0 0 8px rgba(0, 242, 254, 0.4); }
      .preview-copy-btn {
        background: rgba(0, 242, 254, 0.15);
        border: 1px solid rgba(0, 242, 254, 0.4);
        color: #00f2fe;
        &:hover { background: #00f2fe; color: #060814; }
      }
    }

    .create-btn {
      background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
      border: 1px solid #00f2fe;
      color: #ffffff;
      box-shadow: 0 0 20px rgba(0, 198, 255, 0.45);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #00f2fe 0%, #0052d4 100%);
        box-shadow: 0 0 30px rgba(0, 242, 254, 0.7);
      }
    }

    .list-header {
      border-bottom: 1px solid rgba(0, 242, 254, 0.15);
    }

    .list-title { color: #ffffff; }
    .count-badge {
      background: rgba(0, 242, 254, 0.12);
      border: 1px solid rgba(0, 242, 254, 0.3);
      color: #00f2fe;
    }

    .list-tool-btn {
      &.copy-all {
        background: rgba(0, 255, 157, 0.1);
        border: 1px solid rgba(0, 255, 157, 0.35);
        color: #00ff9d;
        &:hover { background: rgba(0, 255, 157, 0.2); box-shadow: 0 0 12px rgba(0, 255, 157, 0.3); }
      }
      &.clear-btn {
        background: rgba(244, 63, 94, 0.1);
        border: 1px solid rgba(244, 63, 94, 0.3);
        color: #fb7185;
        &:hover { background: rgba(244, 63, 94, 0.2); }
      }
    }

    .email-item {
      background: rgba(11, 19, 38, 0.75);
      border: 1px solid rgba(0, 242, 254, 0.15);

      &:hover {
        border-color: rgba(0, 242, 254, 0.4);
        box-shadow: 0 0 16px rgba(0, 242, 254, 0.15);
      }

      .item-index { color: #64748b; }
      .item-icon-box {
        background: rgba(0, 242, 254, 0.1);
        border: 1px solid rgba(0, 242, 254, 0.25);
        color: #00f2fe;
      }

      .item-email { color: #f1f5f9; }
      .item-time { color: #94a3b8; }
      .item-domain-tag {
        background: rgba(0, 242, 254, 0.08);
        border: 1px solid rgba(0, 242, 254, 0.2);
        color: #7dd3fc;
      }
      .item-user-tag {
        display: flex;
        align-items: center;
        gap: 3px;
        background: rgba(0, 255, 157, 0.1);
        border: 1px solid rgba(0, 255, 157, 0.3);
        color: #00ff9d;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 11px;
      }

      .copy-btn {
        background: rgba(0, 242, 254, 0.12);
        border: 1px solid rgba(0, 242, 254, 0.35);
        color: #00f2fe;

        &:hover {
          background: #00f2fe;
          color: #060814;
          box-shadow: 0 0 14px rgba(0, 242, 254, 0.5);
        }

        &.copied {
          background: #00ff9d !important;
          border-color: #00ff9d !important;
          color: #060814 !important;
          box-shadow: 0 0 14px rgba(0, 255, 157, 0.6) !important;
        }
      }

      .delete-btn {
        color: #64748b;
        &:hover { color: #f43f5e; }
      }
    }

    .empty-state {
      color: #64748b;
      .empty-icon { color: #334155; }
    }
  }

  .page-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    color: #475569;
  }
}

/* ================= Original White Theme ================= */
.light-theme {
  background-color: #f2f3f5;
  color: #303133;

  .page-header {
    background: #ffffff;
    border-bottom: 1px solid #ebeef5;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .brand .brand-icon {
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    color: #1890ff;
  }

  .brand .brand-text {
    background: linear-gradient(90deg, #1890ff, #096dd9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .brand .badge {
    color: #1890ff;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
  }

  .nav-btn {
    background: #f0f2f5;
    border: 1px solid #d9d9d9;
    color: #606266;

    &:hover {
      background: #e6f7ff;
      border-color: #91d5ff;
      color: #1890ff;
    }
  }

  .cyber-card {
    background: #ffffff;
    border: 1px solid #ebeef5;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

    .card-glow-bar {
      background: linear-gradient(90deg, #1890ff, #40a9ff, #69c0ff);
    }

    .card-icon {
      background: #e6f7ff;
      border: 1px solid #91d5ff;
      color: #1890ff;
    }

    .card-title {
      color: #303133;
    }

    .card-subtitle {
      color: #909399;
    }

    .rule-tag {
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      color: #52c41a;
    }

    .form-label {
      color: #606266;
      .suffix-tip strong { color: #1890ff; }
    }

    .prefix-input {
      :deep(.el-input__wrapper) {
        background: #ffffff;
        border: 1px solid #d9d9d9;

        &.is-focus, &:hover {
          border-color: #1890ff;
          box-shadow: 0 0 0 1px #1890ff !important;
        }

        .el-input__inner {
          color: #303133;
          font-family: inherit;
          font-weight: 600;
          font-size: 15px;
        }
      }

      :deep(.el-input-group__append) {
        background: #fafafa;
        border: 1px solid #d9d9d9;
        border-left: none;
      }
    }

    .fixed-domain-badge {
      color: #1890ff;
      font-weight: 700;
    }

    .random-btn {
      background: #f0f7ff;
      border: 1px solid #adc6ff;
      color: #1890ff;

      &:hover {
        background: #e6f7ff;
        border-color: #1890ff;
      }
    }

    .preview-box {
      background: #f0f7ff;
      border: 1px dashed #91d5ff;

      .preview-label { color: #909399; }
      .preview-email { color: #1890ff; }
      .preview-copy-btn {
        background: #e6f7ff;
        border: 1px solid #91d5ff;
        color: #1890ff;
        &:hover { background: #1890ff; color: #ffffff; }
      }
    }

    .create-btn {
      background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
      border: none;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.35);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
        box-shadow: 0 6px 18px rgba(24, 144, 255, 0.5);
      }
    }

    .list-header {
      border-bottom: 1px solid #f0f0f0;
    }

    .list-title { color: #303133; }
    .count-badge {
      background: #e6f7ff;
      border: 1px solid #91d5ff;
      color: #1890ff;
    }

    .list-tool-btn {
      &.copy-all {
        background: #f6ffed;
        border: 1px solid #b7eb8f;
        color: #52c41a;
        &:hover { background: #d9f7be; }
      }
      &.clear-btn {
        background: #fff1f0;
        border: 1px solid #ffa39e;
        color: #ff4d4f;
        &:hover { background: #ffccc7; }
      }
    }

    .email-item {
      background: #ffffff;
      border: 1px solid #ebeef5;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

      &:hover {
        border-color: #91d5ff;
        box-shadow: 0 2px 10px rgba(24, 144, 255, 0.1);
      }

      .item-index { color: #909399; }
      .item-icon-box {
        background: #e6f7ff;
        border: 1px solid #bae7ff;
        color: #1890ff;
      }

      .item-email { color: #303133; }
      .item-time { color: #909399; }
      .item-domain-tag {
        background: #f0f2f5;
        border: 1px solid #e4e7ed;
        color: #606266;
      }
      .item-user-tag {
        display: flex;
        align-items: center;
        gap: 3px;
        background: #f6ffed;
        border: 1px solid #b7eb8f;
        color: #52c41a;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 11px;
      }

      .copy-btn {
        background: #e6f7ff;
        border: 1px solid #91d5ff;
        color: #1890ff;

        &:hover {
          background: #1890ff;
          color: #ffffff;
        }

        &.copied {
          background: #52c41a !important;
          border-color: #52c41a !important;
          color: #ffffff !important;
        }
      }

      .delete-btn {
        color: #c0c4cc;
        &:hover { color: #ff4d4f; }
      }
    }

    .empty-state {
      color: #909399;
      .empty-icon { color: #dcdfe6; }
    }
  }

  .page-footer {
    border-top: 1px solid #e4e7ed;
    color: #909399;
  }
}

/* ================= Common Layout & Components ================= */
.page-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  transition: all 0.3s ease;

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    .brand-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-text {
      font-family: 'Orbitron', sans-serif;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Rajdhani', monospace;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
}

/* Theme Switch */
.theme-mode-switch {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 10px;
  border-radius: 20px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 12px;
  letter-spacing: 0.5px;

  .switch-inner {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &.is-scifi {
    background: rgba(0, 242, 254, 0.08);
    border: 1px solid rgba(0, 242, 254, 0.4);
    color: #00f2fe;

    &:hover {
      background: rgba(0, 242, 254, 0.18);
      box-shadow: 0 0 14px rgba(0, 242, 254, 0.3);
    }

    .status-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00f2fe;
      box-shadow: 0 0 8px #00f2fe;
    }

    .mode-title {
      font-family: 'Orbitron', sans-serif;
      font-weight: 700;
      font-size: 11px;
    }

    .mode-tag {
      background: rgba(0, 242, 254, 0.15);
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 10px;
      color: #7dd3fc;
    }
  }

  &.is-white {
    background: #f0f5ff;
    border: 1px solid #adc6ff;
    color: #1d39c4;

    &:hover {
      background: #e6f7ff;
      border-color: #1890ff;
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
    }

    .mode-tag {
      background: #bae7ff;
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 10px;
      color: #0958d9;
    }
  }
}

.page-main {
  flex: 1;
  position: relative;
  z-index: 1;
  padding: 30px 20px;
  display: flex;
  justify-content: center;
}

.generator-container {
  width: 100%;
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Cards */
.cyber-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;

  .card-glow-bar {
    height: 3px;
    width: 100%;
  }
}

.creator-card {
  padding: 24px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .card-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.mini {
        width: 32px;
        height: 32px;
        border-radius: 6px;
      }
    }

    .card-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }

    .card-subtitle {
      font-size: 12px;
      margin: 4px 0 0;
    }

    .rule-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  }

  .form-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .input-row {
    display: flex;
    gap: 12px;
    align-items: center;

    .prefix-input-wrap {
      flex: 1;
      min-width: 0;
    }

    .prefix-input {
      :deep(.el-input__wrapper) {
        height: 44px;
        border-radius: 8px 0 0 8px;
      }

      :deep(.el-input-group__append) {
        border-radius: 0 8px 8px 0;
        padding: 0 16px;
      }
    }

    .fixed-domain-badge {
      font-size: 14px;
      letter-spacing: 0.5px;
    }
  }

  .preview-box {
    margin-top: 14px;
    padding: 10px 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    .preview-left {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .preview-email {
      font-family: 'Rajdhani', monospace;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .preview-copy-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
  }

  .action-btn {
    height: 44px;
    border-radius: 8px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &.random-btn {
      padding: 0 18px;
      flex-shrink: 0;

      .spinning {
        animation: spin 0.4s linear;
      }
    }

    &.create-btn {
      width: 100%;
      height: 46px;
      margin-top: 14px;
      font-family: 'Orbitron', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.list-card {
  padding: 20px 24px;

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding-bottom: 14px;

    .list-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .list-title {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
    }

    .count-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .list-actions {
      display: flex;
      gap: 8px;
    }

    .list-tool-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
  }

  .list-body {
    padding-top: 14px;

    .items-wrap {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .email-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 8px;
      transition: all 0.25s ease;

      .item-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .item-index {
        font-family: 'Rajdhani', monospace;
        font-size: 13px;
        font-weight: 700;
        min-width: 24px;
      }

      .item-icon-box {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .item-info {
        min-width: 0;
      }

      .item-email {
        font-family: 'Rajdhani', monospace;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .item-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
        font-size: 11px;

        .item-time {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .item-domain-tag {
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 600;
        }
      }

      .item-right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .copy-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 30px;
        padding: 0 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .delete-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        cursor: pointer;
        background: transparent;
        transition: all 0.2s ease;
      }
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;

      .empty-icon {
        margin-bottom: 6px;
      }

      .empty-text {
        font-size: 15px;
        font-weight: 600;
      }

      .empty-sub {
        font-size: 12px;
        max-width: 360px;
      }
    }
  }
}

/* Animations */
.list-anim-enter-active,
.list-anim-leave-active {
  transition: all 0.3s ease;
}
.list-anim-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.list-anim-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.page-footer {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px 24px;
  font-family: 'Rajdhani', monospace;
  font-size: 11px;
  letter-spacing: 1px;
}

@media (max-width: 640px) {
  .page-header {
    padding: 0 14px;
    height: 52px;
    .brand .brand-text { display: none; }
  }

  .creator-card {
    padding: 16px;

    .input-row {
      flex-direction: column;
      align-items: stretch;

      .action-btn.random-btn {
        height: 38px;
      }
    }
  }

  .list-card {
    padding: 16px;

    .email-item {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;

      .item-right {
        justify-content: flex-end;
      }
    }
  }
}
</style>
