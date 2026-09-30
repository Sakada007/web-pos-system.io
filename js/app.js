// This script powers the Mini Mart app by initializing the shared UI, theme, navigation, and startup behavior.
// Initializes the app when the page loads.
function initializeApp() {
  seedDefaultData();
  setupNavigation();
  setupMobileMenu();
  setupThemeToggle();
  setupKeyboardShortcuts();
  setupModalEvents();
  hideLoadingScreen();
  document.body.classList.add('loaded');
}

// Highlights the active navigation link based on the current page.
function setupNavigation() {
  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const linkPath = link.getAttribute('href');
    if (linkPath && path.endsWith(linkPath.toLowerCase())) {
      document.querySelectorAll('[data-nav]').forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

// Opens and closes the responsive sidebar menu on mobile devices.
function setupMobileMenu() {
  const mobileToggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');
  if (!mobileToggle || !sidebar) return;
  mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// Connects the theme toggle button to the dark mode switcher.
function setupThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  toggle.addEventListener('click', toggleDarkMode);
}

// Adds keyboard shortcuts for quick navigation and theme switching.
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      window.location.href = 'sales.html';
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      toggleDarkMode();
    }

    if (event.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      event.preventDefault();
      const searchField = document.querySelector('input[type="search"], input[id*="Search"], input[id*="search"]');
      if (searchField) {
        searchField.focus();
      }
    }
  });
}

// Closes modals when the user clicks outside the modal content.
function setupModalEvents() {
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}

// Hides the startup loading screen after a short delay.
function hideLoadingScreen() {
  const screen = document.getElementById('loadingScreen');
  if (!screen) return;
  setTimeout(() => {
    screen.classList.add('hidden');
  }, 650);
}

// Opens a modal by its HTML element id.
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('active');
}

// Closes a modal by its HTML element id.
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
}

window.addEventListener('DOMContentLoaded', initializeApp);
