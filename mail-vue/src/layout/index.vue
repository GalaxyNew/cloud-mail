<template>
  <el-container class="layout" :class="uiStore.dark ? 'scifi-layout' : 'white-layout'">
    <!-- Ambient cyber background only in dark sci-fi mode -->
    <div class="scifi-app-bg" v-if="uiStore.dark">
      <div class="stars-layer"></div>
      <div class="ambient-glow cyan"></div>
      <div class="ambient-glow purple"></div>
    </div>

    <el-aside
        class="aside"
        :class="uiStore.asideShow ? 'aside-show' : 'el-aside-hide'">
      <Aside />
    </el-aside>
    <div
        :class="(uiStore.asideShow && isMobile)? 'overlay-show':'overlay-hide'"
        @click="uiStore.asideShow = false"
    ></div>
    <el-container class="main-container">
      <el-main>
        <el-header>
            <Header />
        </el-header>
        <Main />
      </el-main>
    </el-container>
  </el-container>
  <writer ref="writerRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {useUiStore} from "@/store/ui.js";
import writer from '@/layout/write/index.vue'

const uiStore = useUiStore();
const writerRef = ref({})
const isMobile = ref(window.innerWidth < 1025)
const handleResize = () => {
  isMobile.value = window.innerWidth < 1025
  uiStore.asideShow = window.innerWidth > 1024;
}

onMounted(() => {
  uiStore.writerRef = writerRef

  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.scifi-layout {
  position: relative;
  background-color: #060814;
}

.white-layout {
  position: relative;
  background-color: #f2f3f5;

  .el-aside {
    background: #ffffff !important;
    border-right: 1px solid #ebeef5 !important;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.03);
  }
}

.scifi-app-bg {
  position: absolute;
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
    opacity: 0.4;
  }

  .ambient-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(140px);
    opacity: 0.35;

    &.cyan {
      top: -10%;
      right: 10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #00f2fe 0%, rgba(0, 242, 254, 0) 70%);
    }

    &.purple {
      bottom: -10%;
      left: 10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #7928ca 0%, rgba(121, 40, 202, 0) 70%);
    }
  }
}

.el-aside-hide {
  position: fixed;
  left: 0;
  height: 100%;
  z-index: 100;
  transform: translateX(-100%);
  transition: all 120ms ease;
}

.aside-show {
  box-shadow: 1px 0 20px rgba(0, 242, 254, 0.15);
  transform: translateX(0);
  transition: all 120ms ease;
  z-index: 101;
  border-right: 1px solid rgba(0, 242, 254, 0.18);
  @media (max-width: 1025px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 101;
    height: 100%;
    background: #070b1a;
  }
}

.el-aside {
  width: auto;
  transition: all 120ms ease;
  background: var(--aside-backgound);
  position: relative;
  z-index: 2;
}

.layout {
  height: 100%;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
}

.main-container {
  min-height: 100%;
  background: transparent;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
  z-index: 1;
}

.el-main {
  padding: 0;
  background: transparent;
}

.el-header {
  padding: 0;
  position: relative;
  z-index: 10;
  transition: all 0.3s ease;
}

.scifi-layout .el-header {
  background: rgba(9, 14, 30, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0, 242, 254, 0.18);
}

.white-layout .el-header {
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.overlay-show {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(6, 8, 20, 0.7);
  backdrop-filter: blur(4px);
  z-index: 99;
  transition: all 0.3s;
}

.overlay-hide {
  display: flex;
  pointer-events: none;
  opacity: 0;
}
</style>
