/**
 * Security utilities to protect the frontend from unauthorized inspection.
 * Note: Frontend security is never 100% foolproof as the browser must execute the code.
 * These measures are intended to deter casual inspection and reverse engineering.
 */

export const initializeSecurity = () => {
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

  /**
   * Anti-debugging loop.
   * This creates a debugger statement that pauses execution if DevTools is open.
   */
  const antiDebug = () => {
    const start = new Date().getTime();
    // eslint-disable-next-line no-debugger
    debugger;
    const end = new Date().getTime();
    if (end - start > 100) {
      // If execution was paused for more than 100ms, DevTools is likely open
      // We can take action here, like clearing the body or redirecting
      console.clear();
      console.log('%cSecurity Alert: Unauthorized inspection detected.', 'color: red; font-size: 20px; font-weight: bold;');
      console.log('%cAccess to developer tools is restricted on this platform.', 'color: orange; font-size: 14px;');
    }
    setTimeout(antiDebug, 1000);
  };

  // Clear console periodically to hide any logs
  setInterval(() => {
    console.clear();
    console.log('%cSystem Protected', 'color: green; font-size: 10px;');
  }, 5000);

  // Enable the anti-debugging loop
  antiDebug();
};

/**
 * Basic string obfuscation helper (simple Base64)
 * Use this for non-sensitive strings you want to hide from simple text searches.
 */
export const obfuscate = (str: string) => btoa(str);
export const deobfuscate = (str: string) => atob(str);
