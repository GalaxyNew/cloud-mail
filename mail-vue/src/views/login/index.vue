<template>
  <div id="login-box" class="scifi-theme" v-loading="oauthLoading" :element-loading-text="$t('loginLoading') || 'INITIALIZING QUANTUM LINK...'">
    <!-- Sci-Fi Canvas Background: Cyber Grid, Stars, Scanlines, Hologram Aurora -->
    <div class="scifi-bg-container" v-if="!settingStore.settings.background">
      <div class="stars-layer"></div>
      <div class="cyber-grid-floor"></div>
      <div class="cyber-scanner-line"></div>
      <div class="ambient-glow cyan"></div>
      <div class="ambient-glow purple"></div>
      <div class="ambient-glow blue"></div>
    </div>
    <div v-else class="custom-bg-layer" :style="background">
      <div class="cyber-overlay"></div>
    </div>

    <!-- HUD Telemetry / Corner Decors -->
    <div class="hud-frame">
      <div class="hud-corner top-left">
        <span class="hud-bracket">┌</span>
        <div class="hud-telemetry">
          <span class="pulse-dot"></span>
          <span class="hud-text">SYS.NODE // CF-EDGE ONLINE</span>
        </div>
      </div>
      <div class="hud-corner top-right">
        <span class="hud-telemetry-alt">QUANTUM SECURE PROTOCOL v3.4</span>
        <span class="hud-bracket">┐</span>
      </div>
      <div class="hud-corner bottom-left">
        <span class="hud-bracket">└</span>
        <span class="hud-telemetry-dim">ENCRYPT: SHA-256 / WEBAUTHN READY</span>
      </div>
      <div class="hud-corner bottom-right">
        <span class="hud-telemetry-dim">STATUS: ARMED // LATENCY: &lt;15ms</span>
        <span class="hud-bracket">┘</span>
      </div>
    </div>

    <!-- Main Content Wrapper: Dual Terminal Layout -->
    <div class="scifi-main-wrapper">
      <div class="scifi-terminal-card">
        <!-- Hologram Corner Brackets on the Card -->
        <div class="card-bracket tl"></div>
        <div class="card-bracket tr"></div>
        <div class="card-bracket bl"></div>
        <div class="card-bracket br"></div>
        <div class="card-scanline-fx"></div>

        <!-- Left Showcase Panel (Cyber Hero Info) -->
        <div class="terminal-left-panel">
          <div class="brand-hologram">
            <div class="holo-core-rings">
              <div class="ring ring-outer"></div>
              <div class="ring ring-middle"></div>
              <div class="ring ring-inner"></div>
              <div class="core-icon-box">
                <Icon icon="solar:letter-bold-duotone" width="46" height="46" class="core-icon" />
              </div>
            </div>
            <div class="brand-titles">
              <div class="brand-badge">
                <span class="badge-dot"></span>
                <span>SERVERLESS MATRIX MAIL</span>
              </div>
              <h1 class="brand-name">{{ settingStore.settings.title || 'CLOUD MAIL' }}</h1>
              <p class="brand-sub">NEXT-GEN CYBERNETIC SECURE EMAIL PLATFORM</p>
            </div>
          </div>

          <!-- Feature Matrix List -->
          <div class="cyber-feature-list">
            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <Icon icon="solar:shield-check-bold" width="18" height="18" />
              </div>
              <div class="feature-text">
                <div class="feature-title">Quantum Edge Security</div>
                <div class="feature-desc">Cloudflare D1 & R2 Decentralized Storage</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <Icon icon="solar:bolt-bold" width="18" height="18" />
              </div>
              <div class="feature-text">
                <div class="feature-title">Rust-WASM Parser</div>
                <div class="feature-desc">Sub-millisecond MIME engine with zero cold start</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <Icon icon="solar:ghost-bold" width="18" height="18" />
              </div>
              <div class="feature-text">
                <div class="feature-title">Dynamic Aliases & Encryption</div>
                <div class="feature-desc">End-to-end credential isolation & anti-tracking</div>
              </div>
            </div>
          </div>

          <!-- Waveform / Cyber Audio Indicator -->
          <div class="cyber-audio-status">
            <div class="audio-bars">
              <span class="bar b1"></span>
              <span class="bar b2"></span>
              <span class="bar b3"></span>
              <span class="bar b4"></span>
              <span class="bar b5"></span>
              <span class="bar b6"></span>
              <span class="bar b7"></span>
              <span class="bar b8"></span>
            </div>
            <span class="status-msg">NEURAL TELEMETRY SYNCHRONIZED</span>
          </div>
        </div>

        <!-- Right Interaction Panel (Auth Form Terminal) -->
        <div class="terminal-right-panel">
          <!-- Terminal Header Bar -->
          <div class="terminal-hud-header">
            <div class="hud-pill">
              <span class="pill-dot"></span>
              <span>CONSOLE // AUTH_GATEWAY</span>
            </div>
            <div class="hud-mode-switch" v-if="settingStore.settings.register === 0">
              <button 
                class="mode-btn" 
                :class="{ active: show === 'login' }" 
                @click="show = 'login'"
              >
                {{ $t('loginBtn') || 'LOGIN' }}
              </button>
              <button 
                class="mode-btn" 
                :class="{ active: show === 'register' }" 
                @click="show = 'register'"
              >
                {{ $t('regBtn') || 'REGISTER' }}
              </button>
            </div>
          </div>

          <div class="auth-header-copy">
            <h2 class="auth-title">
              {{ show === 'login' ? ($t('loginTitle') || 'ACCESS TERMINAL') : ($t('regTitle') || 'CREATE IDENTITY') }}
            </h2>
            <p class="auth-subtitle">
              {{ show === 'login' ? 'Enter credentials to authorize session' : 'Initialize a new encrypted mailbox account' }}
            </p>
          </div>

          <!-- LOGIN MODE -->
          <div v-show="show === 'login'" class="form-content">
            <div class="input-group">
              <label class="scifi-label">MAIL IDENTIFIER // 邮箱账号</label>
              <el-input 
                :class="!hideLoginDomain ? 'email-input' : ''" 
                v-model="form.email"
                type="text" 
                :placeholder="$t('emailAccount') || 'Enter username'" 
                autocomplete="off" 
                @keyup.enter="submit"
              >
                <template #prefix>
                  <Icon icon="solar:user-bold" class="input-icon" width="18" height="18" />
                </template>
                <template #append v-if="!hideLoginDomain">
                  <div class="domain-select-wrapper" @click.stop="openSelect">
                    <el-select
                      v-if="show === 'login'"
                      ref="mySelect"
                      v-model="suffix"
                      :placeholder="$t('select')"
                      class="hidden-select"
                    >
                      <el-option
                        v-for="item in domainList"
                        :key="item"
                        :label="item"
                        :value="item"
                      />
                    </el-select>
                    <div class="domain-tag">
                      <span>{{ suffix }}</span>
                      <Icon class="setting-icon" icon="mingcute:down-small-fill" width="16" height="16"/>
                    </div>
                  </div>
                </template>
              </el-input>
            </div>

            <div class="input-group">
              <label class="scifi-label">SECURITY KEY // 访问密码</label>
              <el-input 
                v-model="form.password" 
                :placeholder="$t('password') || 'Enter password'" 
                type="password" 
                show-password
                autocomplete="off" 
                @keyup.enter="submit"
              >
                <template #prefix>
                  <Icon icon="solar:lock-keyhole-bold" class="input-icon" width="18" height="18" />
                </template>
              </el-input>
            </div>

            <!-- Submit Button with Cyber Glow -->
            <button class="scifi-btn-primary" @click="submit" :disabled="loginLoading">
              <span class="btn-glitch-layer"></span>
              <span class="btn-text">
                <Icon v-if="loginLoading" icon="eos-icons:loading" class="spin-icon" width="18" height="18" />
                <Icon v-else icon="solar:login-2-bold" width="18" height="18" />
                {{ loginLoading ? 'AUTHORIZING...' : ($t('loginBtn') || 'INITIALIZE SESSION') }}
              </span>
              <span class="btn-corner tl"></span>
              <span class="btn-corner br"></span>
            </button>

            <!-- OAuth Options -->
            <div class="oauth-section" v-if="oauthProviders.length > 0">
              <div class="scifi-divider">
                <span>OR AUTH VIA FEDERATED CIPHER</span>
              </div>
              <div class="oauth-grid">
                <button 
                  v-for="p in oauthProviders" 
                  :key="p.key" 
                  class="oauth-card-btn" 
                  @click="oauthLogin(p.key)"
                >
                  <el-avatar v-if="p.iconType === 'image'" :src="p.icon" :size="20" class="oauth-icon" />
                  <Icon v-else :icon="p.icon" width="20" height="20" class="oauth-icon" />
                  <span>{{ p.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- REGISTER MODE -->
          <div v-show="show !== 'login'" class="form-content">
            <div class="input-group">
              <label class="scifi-label">DESIRED ADDRESS // 注册邮箱</label>
              <el-input 
                :class="!hideLoginDomain ? 'email-input' : ''" 
                v-model="registerForm.email" 
                type="text" 
                :placeholder="$t('emailAccount') || 'New username'"
                autocomplete="off" 
                @keyup.enter="submitRegister"
              >
                <template #prefix>
                  <Icon icon="solar:user-plus-bold" class="input-icon" width="18" height="18" />
                </template>
                <template #append v-if="!hideLoginDomain">
                  <div class="domain-select-wrapper" @click.stop="openSelect">
                    <el-select
                      v-if="show !== 'login'"
                      ref="mySelect"
                      v-model="suffix"
                      :placeholder="$t('select')"
                      class="hidden-select"
                    >
                      <el-option
                        v-for="item in domainList"
                        :key="item"
                        :label="item"
                        :value="item"
                      />
                    </el-select>
                    <div class="domain-tag">
                      <span>{{ suffix }}</span>
                      <Icon class="setting-icon" icon="mingcute:down-small-fill" width="16" height="16"/>
                    </div>
                  </div>
                </template>
              </el-input>
            </div>

            <div class="input-group">
              <label class="scifi-label">PRIMARY PASSPHRASE // 设置密码</label>
              <el-input 
                v-model="registerForm.password" 
                :placeholder="$t('password') || 'Min 6 characters'" 
                type="password" 
                show-password
                autocomplete="off" 
                @keyup.enter="submitRegister"
              >
                <template #prefix>
                  <Icon icon="solar:key-minimalistic-square-bold" class="input-icon" width="18" height="18" />
                </template>
              </el-input>
            </div>

            <div class="input-group">
              <label class="scifi-label">CONFIRM PASSPHRASE // 确认密码</label>
              <el-input 
                v-model="registerForm.confirmPassword" 
                :placeholder="$t('confirmPwd') || 'Repeat passphrase'" 
                type="password"
                show-password
                autocomplete="off" 
                @keyup.enter="submitRegister"
              >
                <template #prefix>
                  <Icon icon="solar:shield-keyhole-bold" class="input-icon" width="18" height="18" />
                </template>
              </el-input>
            </div>

            <div class="input-group" v-if="settingStore.settings.regKey === 0 || settingStore.settings.regKey === 2">
              <label class="scifi-label">REGISTRATION ACCESS KEY // 注册密钥</label>
              <el-input 
                v-model="registerForm.code" 
                :placeholder="settingStore.settings.regKey === 0 ? ($t('regKey') || 'Required Key') : ($t('regKeyOptional') || 'Optional Key')"
                type="text" 
                autocomplete="off" 
                @keyup.enter="submitRegister"
              >
                <template #prefix>
                  <Icon icon="solar:ticket-bold" class="input-icon" width="18" height="18" />
                </template>
              </el-input>
            </div>

            <div v-show="verifyShow"
                 class="register-turnstile"
                 :data-sitekey="settingStore.settings.siteKey"
                 data-callback="onTurnstileSuccess"
                 data-error-callback="onTurnstileError"
                 data-after-interactive-callback="loadAfter"
                 data-before-interactive-callback="loadBefore"
            >
              <span style="font-size: 12px;color: #F56C6C" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
            </div>

            <button class="scifi-btn-primary" @click="submitRegister" :disabled="registerLoading">
              <span class="btn-glitch-layer"></span>
              <span class="btn-text">
                <Icon v-if="registerLoading" icon="eos-icons:loading" class="spin-icon" width="18" height="18" />
                <Icon v-else icon="solar:user-check-bold" width="18" height="18" />
                {{ registerLoading ? 'GENERATING IDENTITY...' : ($t('regBtn') || 'INITIALIZE IDENTITY') }}
              </span>
              <span class="btn-corner tl"></span>
              <span class="btn-corner br"></span>
            </button>

            <!-- OAuth Options for Register -->
            <div class="oauth-section" v-if="oauthProviders.length > 0">
              <div class="scifi-divider">
                <span>OR REGISTER WITH IDENTITY PROVIDER</span>
              </div>
              <div class="oauth-grid">
                <button 
                  v-for="p in oauthProviders" 
                  :key="p.key" 
                  class="oauth-card-btn" 
                  @click="oauthLogin(p.key)"
                >
                  <el-avatar v-if="p.iconType === 'image'" :src="p.icon" :size="20" class="oauth-icon" />
                  <Icon v-else :icon="p.icon" width="20" height="20" class="oauth-icon" />
                  <span>{{ p.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Toggle Link -->
          <div class="auth-footer-toggle" v-if="settingStore.settings.register === 0">
            <template v-if="show === 'login'">
              <span class="toggle-hint">{{ $t('noAccount') || "Need a quantum mailbox?" }}</span>
              <a class="toggle-link" @click="show = 'register'">
                {{ $t('regSwitch') || "Initialize new account" }} →
              </a>
            </template>
            <template v-else>
              <span class="toggle-hint">{{ $t('hasAccount') || "Already enrolled?" }}</span>
              <a class="toggle-link" @click="show = 'login'">
                ← {{ $t('loginSwitch') || "Return to authorization" }}
              </a>
            </template>
          </div>

          <!-- Fast Generator Link -->
          <div class="generator-entry-wrap">
            <a class="generator-entry-link" @click="router.push('/generator')">
              <Icon icon="solar:magic-stick-3-bold-duotone" width="16" height="16" />
              <span>快速生成 @tv987.shop 邮箱（免验证通道）→</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Bind Dialog for OAuth users -->
    <el-dialog class="scifi-dialog bind-dialog" v-model="showBindForm" title="ENROLL MAIL IDENTIFIER // 绑定邮箱">
      <div class="bind-container">
        <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="bindForm.email" type="text" :placeholder="$t('emailAccount')" autocomplete="off" @keyup.enter="bind">
          <template #append v-if="!hideLoginDomain">
            <div @click.stop="openSelect">
              <el-select
                  ref="mySelect"
                  v-model="suffix"
                  :placeholder="$t('select')"
                  class="hidden-select"
              >
                <el-option
                    v-for="item in domainList"
                    :key="item"
                    :label="item"
                    :value="item"
                />
              </el-select>
              <div class="domain-tag">
                <span>{{ suffix }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="16" height="16"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-input v-if="settingStore.settings.regKey === 0" v-model="bindForm.code" :placeholder="$t('regKey')"
                  type="text" autocomplete="off" @keyup.enter="bind"/>
        <el-input v-if="settingStore.settings.regKey === 2" v-model="bindForm.code"
                  :placeholder="$t('regKeyOptional')" type="text" autocomplete="off" @keyup.enter="bind"/>
        <button class="scifi-btn-primary" @click="bind" :disabled="bindLoading">
          <span class="btn-text">{{ bindLoading ? 'BINDING...' : 'CONFIRM BINDING // 确认绑定' }}</span>
        </button>
      </div>
    </el-dialog>


  </div>
</template>

<script setup>
import router from "@/router";
import {useRoute} from "vue-router";
import {computed, nextTick, reactive, ref} from "vue";
import {login} from "@/request/login.js";
import {register} from "@/request/login.js";
import {websiteConfig} from "@/request/setting.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useUserStore} from "@/store/user.js";
import {useUiStore} from "@/store/ui.js";
import {Icon} from "@iconify/vue";
import {cvtR2Url} from "@/utils/convert.js";
import {loginUserInfo} from "@/request/my.js";
import {permsToRouter} from "@/perm/perm.js";
import {useI18n} from "vue-i18n";
import {oauthBindUser, oauthLinuxDoLogin, oauthGithubLogin, oauthGoogleLogin} from "@/request/ouath.js";
import {ElMessage} from "element-plus";

const {t} = useI18n();
const accountStore = useAccountStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const route = useRoute();
const loginLoading = ref(false);
const bindLoading = ref(false);
const oauthLoading = ref(false);
const showBindForm = ref(false);
const show = ref('login');

const oauthKeys = ['linuxdo', 'github', 'google'];

const oauthProvider = computed(() => {
  const fromState = route.query.state;
  if (oauthKeys.includes(fromState)) return fromState;
  const fromStore = sessionStorage.getItem('oauthProvider');
  return oauthKeys.includes(fromStore) ? fromStore : null;
});

const oauthProviders = computed(() => {
  const allProviders = [
    { key: 'google', label: 'Google', icon: 'devicon:google', iconType: 'iconify' },
    { key: 'github', label: 'GitHub', icon: 'codicon:github-inverted', iconType: 'iconify' },
    { key: 'linuxdo', label: 'LinuxDo', icon: '/image/linuxdo.webp', iconType: 'image' },
  ];
  return allProviders.filter(p => settingStore.settings[p.key + 'Switch'] === 0);
});

const bindForm = reactive({
  email: '',
  oauthUserId: '',
  code: ''
});

const form = reactive({
  email: '',
  password: '',
});

const mySelect = ref();
const suffix = ref('');
const registerForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  code: null
});

const domainList = settingStore.domainList;
const registerLoading = ref(false);
suffix.value = domainList && domainList.length > 0 ? domainList[0] : '';
const verifyShow = ref(false);
let verifyToken = '';
let turnstileId = null;
let botJsError = ref(false);
let verifyErrorCount = 0;

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) return;
  verifyErrorCount++;
  console.warn('人机验证加载失败', e);
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.register-turnstile');
      } else {
        window.turnstile.reset(turnstileId);
      }
    });
  }, 1500);
};

window.loadAfter = (e) => {
  console.log('loadAfter');
};

window.loadBefore = (e) => {
  console.log('loadBefore');
};

const hideLoginDomain = computed(() => settingStore.settings.loginDomain === 1);

const background = computed(() => {
  return settingStore.settings.background ? {
    'background-image': `url(${cvtR2Url(settingStore.settings.background)})`,
    'background-repeat': 'no-repeat',
    'background-size': 'cover',
    'background-position': 'center'
  } : '';
});

const openSelect = () => {
  if (mySelect.value) {
    mySelect.value.toggleMenu();
  }
};

const getFullEmail = (email) => {
  return hideLoginDomain.value ? email : email + suffix.value;
};

const getEmailName = (email) => {
  return email.split('@')[0];
};

function oauthLogin(provider) {
  const clientId = settingStore.settings[provider + 'ClientId'];
  const redirectUri = encodeURIComponent(window.location.origin + '/login');
  sessionStorage.setItem('oauthProvider', provider);
  const authorizeUrls = {
    linuxdo: `https://connect.linux.do/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email&state=${provider}`,
    github: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${provider}`,
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email&state=${provider}`,
  };
  window.location.href = authorizeUrls[provider];
}

const loginFns = {
  linuxdo: oauthLinuxDoLogin,
  github: oauthGithubLogin,
  google: oauthGoogleLogin,
};

oauthGetUser();

async function oauthGetUser() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code || !oauthProvider.value) return;

  const provider = oauthProvider.value;
  oauthLoading.value = true;
  sessionStorage.removeItem('oauthProvider');
  window.history.replaceState({}, '', window.location.origin + window.location.pathname);

  loginFns[provider](code, window.location.origin + '/login').then(data => {
    bindForm.oauthUserId = data.userInfo.oauthUserId;

    if (!data.token) {
      showBindForm.value = true;
      oauthLoading.value = false;
      ElMessage({
        message: '请注册绑定一个邮箱',
        type: 'warning',
        duration: 4000,
        plain: true,
      });
      return;
    }

    saveToken(data.token);
  }).catch(() => {
    oauthLoading.value = false;
  });
}

function bind() {
  if (bindLoading.value) return;

  if (!bindForm.email) {
    ElMessage({
      message: t('emptyEmailMsg') || '请输入邮箱账号',
      type: 'error',
      plain: true,
    });
    return;
  }

  if (getEmailName(bindForm.email).length < (settingStore.settings.minEmailPrefix || 1)) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}) || '邮箱前缀过短',
      type: 'error',
      plain: true,
    });
    return;
  }

  let email = getFullEmail(bindForm.email);

  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg') || '邮箱格式不正确',
      type: 'error',
      plain: true,
    });
    return;
  }

  if (settingStore.settings.regKey === 0) {
    if (!bindForm.code) {
      ElMessage({
        message: t('emptyRegKeyMsg') || '请输入注册码',
        type: 'error',
        plain: true,
      });
      return;
    }
  }

  const payload = {email, oauthUserId: bindForm.oauthUserId, code: bindForm.code};

  bindLoading.value = true;
  oauthBindUser(payload).then(data => {
    saveToken(data.token);
  }).catch(() => {
    bindLoading.value = false;
  });
}

const submit = () => {
  if (loginLoading.value) return;

  if (!form.email) {
    ElMessage({
      message: t('emptyEmailMsg') || '请输入邮箱账号',
      type: 'error',
      plain: true,
    });
    return;
  }
  if (!form.password) {
    ElMessage({
      message: t('emptyPasswordMsg') || '请输入密码',
      type: 'error',
      plain: true,
    });
    return;
  }

  const email = getFullEmail(form.email);
  loginLoading.value = true;
  login(email, form.password).then(async data => {
    if (data?.token) {
      await saveToken(data.token);
    }
  }).finally(() => {
    loginLoading.value = false;
  });
};

async function saveToken(token) {
  localStorage.setItem('token', token);
  refreshWebsiteConfig();
  const user = await loginUserInfo();
  accountStore.currentAccountId = user.account.accountId;
  accountStore.currentAccount = user.account;
  userStore.user = user;
  const routers = permsToRouter(user.permKeys);
  routers.forEach(routerData => {
    router.addRoute('layout', routerData);
  });
  await router.replace({name: 'layout'});
  uiStore.showNotice();
  oauthLoading.value = false;
  bindLoading.value = false;
}

function refreshWebsiteConfig() {
  websiteConfig().then(setting => {
    settingStore.settings = setting;
    settingStore.domainList = setting.domainList;
    if (!suffix.value && setting.domainList && setting.domainList.length > 0) {
      suffix.value = setting.domainList[0];
    }
    document.title = setting.title;
  }).catch(e => {
    console.error(e);
  });
}

function submitRegister() {
  if (registerLoading.value) return;

  if (!registerForm.email) {
    ElMessage({
      message: t('emptyEmailMsg') || '请输入邮箱账号',
      type: 'error',
      plain: true,
    });
    return;
  }

  if (getEmailName(registerForm.email).length < (settingStore.settings.minEmailPrefix || 1)) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}) || '邮箱前缀过短',
      type: 'error',
      plain: true,
    });
    return;
  }

  const email = getFullEmail(registerForm.email);

  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg') || '邮箱格式不正确',
      type: 'error',
      plain: true,
    });
    return;
  }

  if (!registerForm.password) {
    ElMessage({
      message: t('emptyPwdMsg') || '请输入密码',
      type: 'error',
      plain: true,
    });
    return;
  }

  if (registerForm.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg') || '密码不能少于6位',
      type: 'error',
      plain: true,
    });
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage({
      message: t('confirmPwdFailMsg') || '两次密码输入不一致',
      type: 'error',
      plain: true,
    });
    return;
  }

  if (settingStore.settings.regKey === 0) {
    if (!registerForm.code) {
      ElMessage({
        message: t('emptyRegKeyMsg') || '请输入注册码',
        type: 'error',
        plain: true,
      });
      return;
    }
  }

  if (!verifyToken && (settingStore.settings.registerVerify === 0 || (settingStore.settings.registerVerify === 2 && settingStore.settings.regVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true;
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.register-turnstile');
          } catch (e) {
            botJsError.value = true;
            console.log('人机验证js加载失败');
          }
        } else {
          window.turnstile.reset('.register-turnstile');
        }
      });
    } else if (!botJsError.value) {
      ElMessage({
        message: t('botVerifyMsg') || '请完成人机验证',
        type: "error",
        plain: true
      });
    }
    return;
  }

  registerLoading.value = true;

  const payload = {
    email,
    password: registerForm.password,
    token: verifyToken,
    code: registerForm.code
  };

  register(payload).then(({regVerifyOpen}) => {
    show.value = 'login';
    registerForm.email = '';
    registerForm.password = '';
    registerForm.confirmPassword = '';
    registerForm.code = '';
    registerLoading.value = false;
    verifyToken = '';
    settingStore.settings.regVerifyOpen = regVerifyOpen;
    verifyShow.value = false;
    ElMessage({
      message: t('regSuccessMsg') || '注册成功，请登录',
      type: 'success',
      plain: true,
    });
  }).catch(res => {
    registerLoading.value = false;
    if (res && res.code === 400) {
      verifyToken = '';
      settingStore.settings.regVerifyOpen = true;
      if (turnstileId) {
        window.turnstile.reset(turnstileId);
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.register-turnstile');
        });
      }
      verifyShow.value = true;
    }
  });
}
</script>

<style lang="scss">
/* Global dropdown overrides for scifi theme */
.scifi-theme {
  .el-select-dropdown__item {
    padding: 0 15px;
    background: #091024 !important;
    color: #94a3b8 !important;
    font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace !important;
    letter-spacing: 0.5px;
    
    &:hover, &.is-hovering, &.is-selected {
      background: rgba(0, 242, 254, 0.15) !important;
      color: #00f2fe !important;
    }
  }

  .el-select__popper.el-popper {
    background: #091024 !important;
    border: 1px solid rgba(0, 242, 254, 0.3) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 242, 254, 0.2) !important;
  }
}
</style>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800;900&family=Rajdhani:wght@500;600;700&display=swap');

#login-box.scifi-theme {
  position: relative;
  width: 100vw;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  background-color: #060814;
  color: #e2e8f0;
  font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

/* ================= Sci-Fi Canvas Background ================= */
.scifi-bg-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.custom-bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  .cyber-overlay {
    position: absolute;
    inset: 0;
    background: rgba(6, 8, 20, 0.82);
    backdrop-filter: blur(4px);
  }
}

.stars-layer {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
    radial-gradient(1px 1px at 40px 70px, #4facfe, rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 150px 180px, #00f2fe, rgba(0,0,0,0)),
    radial-gradient(1px 1px at 280px 220px, #b026ff, rgba(0,0,0,0)),
    radial-gradient(2px 2px at 350px 400px, #ffffff, rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 500px 320px, #00ff9d, rgba(0,0,0,0)),
    radial-gradient(1px 1px at 700px 150px, #4facfe, rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 850px 500px, #b026ff, rgba(0,0,0,0));
  background-size: 550px 550px;
  opacity: 0.6;
}

/* 3D Perspective Cyber Grid Floor */
.cyber-grid-floor {
  position: absolute;
  bottom: -40%;
  left: -50%;
  width: 200%;
  height: 100%;
  background-image: 
    linear-gradient(to right, rgba(0, 242, 254, 0.12) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 242, 254, 0.12) 1px, transparent 1px);
  background-size: 60px 60px;
  transform: perspective(600px) rotateX(65deg);
  transform-origin: center bottom;
  mask-image: linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 80%);
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { background-position: 0 0; }
  100% { background-position: 0 600px; }
}

/* Cyber Scanning Line */
.cyber-scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.8), #00ff9d, transparent);
  box-shadow: 0 0 15px #00f2fe;
  opacity: 0.4;
  animation: scanSweep 8s ease-in-out infinite;
}

@keyframes scanSweep {
  0% { top: -2%; opacity: 0; }
  15% { opacity: 0.7; }
  85% { opacity: 0.7; }
  100% { top: 102%; opacity: 0; }
}

/* Ambient Radial Glows */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  opacity: 0.45;

  &.cyan {
    top: 10%;
    left: 15%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #00f2fe 0%, rgba(0, 242, 254, 0) 70%);
  }

  &.purple {
    bottom: 10%;
    right: 15%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #7928ca 0%, rgba(121, 40, 202, 0) 70%);
  }

  &.blue {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0) 70%);
  }
}

/* ================= HUD Telemetry & Decors ================= */
.hud-frame {
  position: absolute;
  inset: 18px;
  pointer-events: none;
  z-index: 2;
  font-family: 'Rajdhani', monospace;

  .hud-corner {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(0, 242, 254, 0.6);
    font-size: 12px;
    letter-spacing: 1.5px;
    text-shadow: 0 0 8px rgba(0, 242, 254, 0.5);

    .hud-bracket {
      font-size: 20px;
      line-height: 1;
      font-weight: 300;
      color: #00f2fe;
    }
  }

  .top-left { top: 0; left: 0; }
  .top-right { top: 0; right: 0; }
  .bottom-left { bottom: 0; left: 0; }
  .bottom-right { bottom: 0; right: 0; }

  .hud-telemetry {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #00ff9d;
    box-shadow: 0 0 10px #00ff9d;
    animation: pulse 1.8s infinite;
  }

  .hud-telemetry-dim {
    color: rgba(148, 163, 184, 0.45);
    font-size: 11px;
  }

  .hud-telemetry-alt {
    color: rgba(0, 242, 254, 0.55);
  }

  @media (max-width: 900px) {
    .hud-telemetry-alt, .hud-telemetry-dim {
      display: none;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.85); }
}

/* ================= Main Container & Hologram Terminal Card ================= */
.scifi-main-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1160px;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.scifi-terminal-card {
  position: relative;
  width: 100%;
  background: rgba(9, 14, 30, 0.78);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(0, 242, 254, 0.22);
  border-radius: 16px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.75),
    0 0 40px rgba(0, 242, 254, 0.12),
    inset 0 0 30px rgba(0, 242, 254, 0.04);
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  overflow: hidden;
  transition: all 0.3s ease;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    max-width: 480px;
  }
}

/* High-Tech Card Corner Brackets */
.card-bracket {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  z-index: 5;

  &.tl {
    top: 6px;
    left: 6px;
    border-top: 2px solid #00f2fe;
    border-left: 2px solid #00f2fe;
  }
  &.tr {
    top: 6px;
    right: 6px;
    border-top: 2px solid #00f2fe;
    border-right: 2px solid #00f2fe;
  }
  &.bl {
    bottom: 6px;
    left: 6px;
    border-bottom: 2px solid #00f2fe;
    border-left: 2px solid #00f2fe;
  }
  &.br {
    bottom: 6px;
    right: 6px;
    border-bottom: 2px solid #00f2fe;
    border-right: 2px solid #00f2fe;
  }
}

.card-scanline-fx {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 242, 254, 0.015) 2px,
    rgba(0, 242, 254, 0.015) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* ================= Left Showcase Panel ================= */
.terminal-left-panel {
  position: relative;
  z-index: 2;
  padding: 48px 44px;
  background: linear-gradient(135deg, rgba(13, 21, 46, 0.7) 0%, rgba(6, 10, 24, 0.5) 100%);
  border-right: 1px solid rgba(0, 242, 254, 0.14);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;

  @media (max-width: 960px) {
    display: none;
  }
}

.brand-hologram {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* Holographic Rotating Rings */
.holo-core-rings {
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .ring {
    position: absolute;
    border-radius: 50%;

    &.ring-outer {
      width: 100%;
      height: 100%;
      border: 1.5px dashed rgba(0, 242, 254, 0.4);
      animation: rotateRing 24s linear infinite;
    }

    &.ring-middle {
      width: 78%;
      height: 78%;
      border: 1px solid rgba(176, 38, 255, 0.5);
      border-left-color: transparent;
      border-right-color: transparent;
      animation: rotateRingRev 16s linear infinite;
    }

    &.ring-inner {
      width: 58%;
      height: 58%;
      border: 1px dotted rgba(0, 255, 157, 0.6);
      animation: rotateRing 10s linear infinite;
    }
  }

  .core-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, rgba(6, 10, 24, 0.8) 100%);
    border: 1px solid rgba(0, 242, 254, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);

    .core-icon {
      color: #00f2fe;
      filter: drop-shadow(0 0 8px #00f2fe);
    }
  }
}

@keyframes rotateRing {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes rotateRingRev {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

.brand-titles {
  display: flex;
  flex-direction: column;

  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(0, 242, 254, 0.1);
    border: 1px solid rgba(0, 242, 254, 0.3);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #00f2fe;
    margin-bottom: 6px;

    .badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #00ff9d;
      box-shadow: 0 0 6px #00ff9d;
    }
  }

  .brand-name {
    font-family: 'Orbitron', sans-serif;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 2px;
    margin: 0;
    background: linear-gradient(135deg, #ffffff 0%, #4facfe 50%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 25px rgba(0, 242, 254, 0.3);
  }

  .brand-sub {
    font-size: 11px;
    letter-spacing: 1px;
    color: #64748b;
    margin: 4px 0 0 0;
  }
}

/* Feature Matrix Items */
.cyber-feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .feature-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    transition: all 0.25s ease;

    &:hover {
      background: rgba(0, 242, 254, 0.08);
      border-color: rgba(0, 242, 254, 0.3);
      transform: translateX(4px);
    }

    .feature-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(0, 242, 254, 0.12);
      border: 1px solid rgba(0, 242, 254, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #00f2fe;
      flex-shrink: 0;
    }

    .feature-text {
      .feature-title {
        font-size: 13px;
        font-weight: 700;
        color: #f1f5f9;
        letter-spacing: 0.5px;
      }
      .feature-desc {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 2px;
      }
    }
  }
}

/* Audio Status Wave */
.cyber-audio-status {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);

  .audio-bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 18px;

    .bar {
      width: 3px;
      border-radius: 2px;
      background: #00f2fe;
      box-shadow: 0 0 6px #00f2fe;
      animation: audioAnim 1.2s ease-in-out infinite alternate;

      &.b1 { height: 40%; animation-delay: 0.1s; }
      &.b2 { height: 75%; animation-delay: 0.3s; }
      &.b3 { height: 30%; animation-delay: 0.5s; }
      &.b4 { height: 90%; animation-delay: 0.2s; }
      &.b5 { height: 60%; animation-delay: 0.6s; }
      &.b6 { height: 100%; animation-delay: 0.4s; }
      &.b7 { height: 45%; animation-delay: 0.7s; }
      &.b8 { height: 70%; animation-delay: 0.15s; }
    }
  }

  .status-msg {
    font-size: 11px;
    letter-spacing: 1px;
    color: rgba(0, 242, 254, 0.7);
    font-weight: 600;
  }
}

@keyframes audioAnim {
  0% { transform: scaleY(0.3); opacity: 0.4; }
  100% { transform: scaleY(1); opacity: 1; }
}

/* ================= Right Interaction Panel ================= */
.terminal-right-panel {
  position: relative;
  z-index: 2;
  padding: 40px 38px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 600px) {
    padding: 30px 20px;
  }
}

.terminal-hud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;

  .hud-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    letter-spacing: 1.2px;
    font-weight: 700;
    color: #00f2fe;

    .pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00f2fe;
      box-shadow: 0 0 8px #00f2fe;
    }
  }

  .hud-mode-switch {
    display: flex;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(0, 242, 254, 0.2);
    border-radius: 6px;
    padding: 2px;

    .mode-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-family: 'Rajdhani', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 4px 14px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;

      &.active {
        background: linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(121, 40, 202, 0.25) 100%);
        color: #00f2fe;
        box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
      }
    }
  }
}

.auth-header-copy {
  margin-bottom: 24px;

  .auth-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 1px;
    margin: 0;
    color: #ffffff;
  }

  .auth-subtitle {
    font-size: 12px;
    color: #94a3b8;
    margin: 5px 0 0 0;
    letter-spacing: 0.5px;
  }
}

/* Sci-Fi Input Fields & Labels */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .scifi-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #94a3b8;
    text-transform: uppercase;
  }

  :deep(.el-input) {
    height: 42px;
    width: 100%;

    .el-input__wrapper {
      background: rgba(11, 19, 38, 0.85);
      border: 1px solid rgba(0, 242, 254, 0.25);
      border-radius: 6px;
      box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.5);
      padding: 0 12px;
      transition: all 0.25s ease;

      &:hover {
        border-color: rgba(0, 242, 254, 0.5);
        box-shadow: 0 0 12px rgba(0, 242, 254, 0.15);
      }

      &.is-focus {
        border-color: #00f2fe;
        box-shadow: 0 0 16px rgba(0, 242, 254, 0.35);
      }

      .el-input__inner {
        color: #f1f5f9;
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
        letter-spacing: 0.5px;
        height: 40px;

        &::placeholder {
          color: #475569;
        }
      }

      .input-icon {
        color: #00f2fe;
        margin-right: 6px;
      }
    }

    &.email-input {
      .el-input__wrapper {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
    }
  }

  :deep(.el-input-group__append) {
    background: rgba(11, 19, 38, 0.95);
    border: 1px solid rgba(0, 242, 254, 0.25);
    border-left: none;
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
    padding: 0 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 242, 254, 0.15);
    }
  }
}

.domain-select-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;

  .domain-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #00f2fe;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .hidden-select {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    pointer-events: none;
  }
}

/* ================= Sci-Fi Primary Button ================= */
.scifi-btn-primary {
  position: relative;
  width: 100%;
  height: 46px;
  margin-top: 8px;
  background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
  border: 1px solid #00f2fe;
  color: #ffffff;
  font-family: 'Orbitron', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 0 24px rgba(0, 198, 255, 0.45);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 0 32px rgba(0, 242, 254, 0.7);
    background: linear-gradient(135deg, #00f2fe 0%, #0052d4 100%);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }

  .btn-text {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn-glitch-layer {
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transform: skewX(-25deg);
    animation: btnShine 4s infinite;
  }

  .btn-corner {
    position: absolute;
    width: 6px;
    height: 6px;
    border-color: #ffffff;
    pointer-events: none;

    &.tl {
      top: 2px;
      left: 2px;
      border-top: 2px solid #fff;
      border-left: 2px solid #fff;
    }
    &.br {
      bottom: 2px;
      right: 2px;
      border-bottom: 2px solid #fff;
      border-right: 2px solid #fff;
    }
  }
}

@keyframes btnShine {
  0% { left: -100%; }
  20% { left: 150%; }
  100% { left: 150%; }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ================= OAuth Section ================= */
.oauth-section {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .scifi-divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: #475569;
    font-size: 10px;
    letter-spacing: 1px;
    font-weight: 700;

    &::before, &::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    span {
      padding: 0 10px;
    }
  }

  .oauth-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 10px;

    .oauth-card-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 38px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      color: #cbd5e1;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(0, 242, 254, 0.12);
        border-color: rgba(0, 242, 254, 0.4);
        color: #00f2fe;
        transform: translateY(-1px);
        box-shadow: 0 0 12px rgba(0, 242, 254, 0.2);
      }
    }
  }
}

/* ================= Auth Footer Toggle ================= */
.auth-footer-toggle {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  letter-spacing: 0.5px;

  .toggle-hint {
    color: #64748b;
  }

  .toggle-link {
    color: #00f2fe;
    font-weight: 700;
    cursor: pointer;
    text-shadow: 0 0 8px rgba(0, 242, 254, 0.4);
    transition: all 0.2s ease;

    &:hover {
      color: #38bdf8;
      text-decoration: underline;
    }
  }
}

/* Turnstile Container */
.register-turnstile {
  margin: 6px 0;
  display: flex;
  justify-content: center;
}


/* Dialog Styles */
:deep(.scifi-dialog) {
  background: #091024 !important;
  border: 1px solid rgba(0, 242, 254, 0.4) !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 242, 254, 0.2) !important;

  .el-dialog__title {
    color: #00f2fe !important;
    font-family: 'Orbitron', sans-serif !important;
    font-size: 16px !important;
    letter-spacing: 1px !important;
  }

  .el-dialog__headerbtn .el-dialog__close {
    color: #94a3b8 !important;
    &:hover {
      color: #00f2fe !important;
    }
  }

  .bind-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 10px;
  }
}

.generator-entry-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;

  .generator-entry-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 20px;
    background: rgba(0, 242, 254, 0.08);
    border: 1px solid rgba(0, 242, 254, 0.3);
    color: #00f2fe;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: rgba(0, 242, 254, 0.18);
      border-color: #00f2fe;
      box-shadow: 0 0 14px rgba(0, 242, 254, 0.35);
      transform: translateY(-1px);
    }
  }
}
</style>
