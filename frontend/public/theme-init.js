// Sets the colour theme before the app draws, so a dark-mode visitor never sees a light flash.
// The visitor's own choice wins; without one, the device's setting decides.
(function () {
  var theme = null
  try { theme = localStorage.getItem('thriftbite-theme') } catch (e) { /* storage blocked: follow the device */ }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  document.documentElement.dataset.theme = theme
})()
