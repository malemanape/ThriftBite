import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'thriftbite-theme'
const listeners = new Set<() => void>()
const deviceDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

/** The theme on screen. public/theme-init.js sets it before the app draws. */
function current(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  listeners.forEach((listener) => listener())
}

function saved(): Theme | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** Picking a theme remembers it; until then the device's setting decides, and changes with it. */
export function setTheme(theme: Theme) {
  try { localStorage.setItem(KEY, theme) } catch { /* storage blocked: it still applies for this visit */ }
  apply(theme)
}

window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (!saved()) apply(deviceDark() ? 'dark' : 'light')
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, current, () => 'light')
}
