/**
 * Security utilities to protect the frontend from unauthorized inspection.
 * Note: Frontend security is never 100% foolproof as the browser must execute the code.
 * These measures are intended to deter casual inspection and reverse engineering.
 */

export const initializeSecurity = () => {
  // Temporarily disabled for debugging
  return;

  if (process.env.NODE_ENV === 'development') return;

  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Disable common developer tool shortcuts
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
    }
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
      e.preventDefault();
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
    }
    // Ctrl+S (Save Page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
    }
  });

  // Clear console periodically to hide any logs
  setInterval(() => {
    console.clear();
    console.log('%cSystem Protected', 'color: green; font-size: 10px;');
  }, 5000);
};

/**
 * Basic string obfuscation helper (simple Base64)
 * Use this for non-sensitive strings you want to hide from simple text searches.
 */
export const obfuscate = (str: string) => btoa(str);
export const deobfuscate = (str: string) => atob(str);
