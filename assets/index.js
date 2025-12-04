// assets/index.js
// Script para registrar el Service Worker de la PWA

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.error('Fallo en el registro del Service Worker:', error);
      });
  });
} else {
    console.log('El navegador no soporta Service Workers.');
}
