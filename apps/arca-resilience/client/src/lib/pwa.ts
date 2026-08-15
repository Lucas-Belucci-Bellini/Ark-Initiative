/** ARCA PWA registration: only public shell and public risk packets are cached. */
export function registerArcaServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(error => {
      console.warn("[ARCA PWA] Service worker registration failed", error);
    });
  }, { once: true });
}
