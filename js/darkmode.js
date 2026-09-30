function toggleDarkMode() {
  const body = document.body;
  const isDark = body.classList.toggle('dark');
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    const icon = toggle.querySelector('i');
    if (icon) {
      icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    const label = toggle.querySelector('span');
    if (label) {
      label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }
  }
  saveTheme(isDark ? 'dark' : 'light');
}

function applyTheme() {
  const theme = loadTheme();
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  const icon = toggle.querySelector('i');
  const label = toggle.querySelector('span');
  if (icon) {
    icon.className = document.body.classList.contains('dark') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
  if (label) {
    label.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
  }
}

window.addEventListener('DOMContentLoaded', applyTheme);
