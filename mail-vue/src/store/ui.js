import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
    state: () => ({
        asideShow: window.innerWidth > 1024,
        accountShow: false,
        backgroundLoading: true,
        changeNotice: 0,
        writerRef: null,
        changePreview: 0,
        previewData: {},
        key: 0,
        dark: true,
        asideCount: {
            email: 0,
            send: 0,
            sysEmail: 0
        }
    }),
    actions: {
        showNotice() {
            this.changeNotice ++
        },
        previewNotice(data) {
            this.previewData = data
            this.changePreview ++
        },
        toggleDark(e) {
            const nextIsDark = !this.dark
            const root = document.documentElement

            const applyTheme = (isDark) => {
                this.dark = isDark
                if (isDark) {
                    root.classList.add('dark')
                } else {
                    root.classList.remove('dark')
                }
                const metaTag = document.getElementById('theme-color-meta')
                if (metaTag) {
                    metaTag.setAttribute('content', isDark ? '#060814' : '#FFFFFF')
                }
            }

            if (!document.startViewTransition || !e) {
                applyTheme(nextIsDark)
                return
            }

            const x = e.clientX || window.innerWidth / 2
            const y = e.clientY || 0
            const maxX = Math.max(x, window.innerWidth - x)
            const maxY = Math.max(y, window.innerHeight - y)
            const endRadius = Math.hypot(maxX, maxY)

            root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light')
            root.style.setProperty('--vt-x', `${x}px`)
            root.style.setProperty('--vt-y', `${y}px`)
            root.style.setProperty('--vt-end-radius', `${endRadius + 10}px`)

            const transition = document.startViewTransition(() => {
                applyTheme(nextIsDark)
            })

            transition.finished.finally(() => {
                root.removeAttribute('data-theme-to')
            })
        },
        toggleDarkWithTransition(e) {
            this.toggleDark(e)
        }
    },
    persist: {
        pick: ['accountShow','dark'],
    },
})
