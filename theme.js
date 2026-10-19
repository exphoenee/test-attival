// Téma (világos/sötét). A <head>-ben töltődik be, hogy ne villanjon fel rossz téma.
const THEME_KEY = 'munkaora-theme';
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function storedTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    const dark = theme === 'dark';
    btn.textContent = dark ? '☀ Világos' : '☾ Sötét';
    btn.setAttribute('aria-label', dark ? 'Váltás világos módra' : 'Váltás sötét módra');
  }
}

applyTheme(storedTheme() || (darkQuery.matches ? 'dark' : 'light'));

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(document.documentElement.dataset.theme);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    applyTheme(next);
  });
});

// Amíg a felhasználó nem választott, a rendszerbeállítást követjük.
darkQuery.addEventListener('change', e => {
  if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light');
});
