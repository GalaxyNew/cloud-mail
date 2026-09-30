<template>
  <div class="content-box" ref="contentBox">
    <div ref="container" class="content-html"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUiStore } from "@/store/ui.js"

const props = defineProps({
  html: {
    type: String,
    required: true
  }
})

const uiStore = useUiStore()
const container = ref(null)
const contentBox = ref(null)
let shadowRoot = null

function updateContent() {
  if (!shadowRoot) return;

  const bodyStyleRegex = /<body[^>]*style="([^"]*)"[^>]*>/i;
  const bodyStyleMatch = props.html.match(bodyStyleRegex);
  const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : '';

  const cleanedHtml = props.html.replace(/<\/?body[^>]*>/gi, '');

  const isDark = uiStore.dark;
  const themeCss = isDark ? `
      :host {
        all: initial;
        width: 100%;
        height: 100%;
        font-family: 'Rajdhani', Inter, 'Helvetica Neue', Arial, sans-serif;
        font-size: 15px;
        line-height: 1.6;
        color: #cbd5e1;
        word-break: break-word;
      }

      h1, h2, h3, h4 {
        font-family: 'Orbitron', 'Rajdhani', sans-serif;
        font-size: 18px;
        font-weight: 700;
        color: #00f2fe;
        letter-spacing: 0.5px;
      }

      p {
        margin: 0;
      }

      a {
        text-decoration: none;
        color: #00f2fe;
        text-shadow: 0 0 8px rgba(0, 242, 254, 0.3);
      }

      .shadow-content {
        background: rgba(9, 16, 36, 0.85);
        color: #cbd5e1;
        width: fit-content;
        height: fit-content;
        min-width: 100%;
        border-radius: 8px;
        padding: 20px 24px;
        box-sizing: border-box;
        border: 1px solid rgba(0, 242, 254, 0.25);
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0, 242, 254, 0.05);
        ${bodyStyle ? bodyStyle : ''}
      }
  ` : `
      :host {
        all: initial;
        width: 100%;
        height: 100%;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #13181D;
        word-break: break-word;
      }

      h1, h2, h3, h4 {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }

      p {
        margin: 0;
      }

      a {
        text-decoration: none;
        color: #1890ff;
      }

      .shadow-content {
        background: #FFFFFF;
        color: #13181D;
        width: fit-content;
        height: fit-content;
        min-width: 100%;
        border-radius: 8px;
        padding: 18px 24px;
        box-sizing: border-box;
        border: 1px solid #ebeef5;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        ${bodyStyle ? bodyStyle : ''}
      }
  `;

  shadowRoot.innerHTML = `
    <style>
      ${themeCss}

      img:not(table img) {
        max-width: 100%;
        height: auto !important;
      }

    </style>
    <div class="shadow-content">
      ${cleanedHtml}
    </div>
  `;
}

function autoScale() {
  if (!shadowRoot || !contentBox.value) return

  const parent = contentBox.value
  const shadowContent = shadowRoot.querySelector('.shadow-content')

  if (!shadowContent) return

  const parentWidth = parent.offsetWidth
  const childWidth = shadowContent.scrollWidth

  if (childWidth === 0) return

  const scale = parentWidth / childWidth

  const hostElement = shadowRoot.host
  hostElement.style.zoom = scale
}

onMounted(() => {
  shadowRoot = container.value.attachShadow({ mode: 'open' })
  updateContent()
  autoScale()
})

watch(() => [props.html, uiStore.dark], () => {
  updateContent()
  autoScale()
})
</script>

<style scoped>
.content-box {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: Inter, "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

.content-html {
  width: 100%;
  height: 100%;
}
</style>
