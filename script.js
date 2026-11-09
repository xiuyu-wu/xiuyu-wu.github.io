const themeToggle = document.querySelector('.cosmic-sun');
function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
  themeToggle.setAttribute('aria-label', label);
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.title = label;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#15141d' : '#fcfcfe';
}
applyTheme(document.documentElement.dataset.theme === 'dark');
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.add('theme-transitions');
  const dark = document.documentElement.dataset.theme !== 'dark';
  applyTheme(dark);
  try { localStorage.setItem('homepage-theme', dark ? 'dark' : 'light'); } catch {}
});

const navigationLinks = [...document.querySelectorAll('.navigation a')];
const sections = [...document.querySelectorAll('main > section[id]')];
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebarBackdrop = document.querySelector('.sidebar-backdrop');
const mobileLayout = window.matchMedia('(max-width: 740px)');
const wechatDialog = document.querySelector('#wechat-dialog');
const wechatTrigger = document.querySelector('.wechat-trigger');
wechatTrigger.addEventListener('click', () => {
  wechatDialog.showModal();
  document.body.classList.add('wechat-open');
});
document.querySelector('.wechat-close').addEventListener('click', () => wechatDialog.close());
wechatDialog.addEventListener('click', event => {
  const bounds = wechatDialog.getBoundingClientRect();
  if (event.target === wechatDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) {
    wechatDialog.close();
  }
});
wechatDialog.addEventListener('close', () => {
  document.body.classList.remove('wechat-open');
  wechatTrigger.focus({ preventScroll: true });
});
let scrollPending = false;

function setSidebarCollapsed(collapsed, animate = true) {
  document.body.classList.toggle('sidebar-motion', animate);
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  document.body.classList.toggle('drawer-open', mobileLayout.matches && !collapsed);
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  sidebarToggle.setAttribute('aria-label', label);
  sidebarToggle.title = label;
  sidebarBackdrop.hidden = collapsed || !mobileLayout.matches;
  window.requestAnimationFrame(updateNavigation);
}

sidebarToggle.addEventListener('click', () => {
  setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed'));
});
sidebarBackdrop.addEventListener('click', () => {
  setSidebarCollapsed(true);
  sidebarToggle.focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !wechatDialog.open && !document.body.classList.contains('sidebar-collapsed')) {
    setSidebarCollapsed(true);
    sidebarToggle.focus();
  }
});
document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', () => {
    if (mobileLayout.matches) setSidebarCollapsed(true);
  });
});
mobileLayout.addEventListener('change', () => setSidebarCollapsed(mobileLayout.matches, false));

function updateNavigation() {
  let currentSection = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 65) currentSection = section;
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
    currentSection = sections[sections.length - 1];
  }
  navigationLinks.forEach(link => {
    const active = link.getAttribute('href') === `#${currentSection.id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollPending = false;
}

window.addEventListener('scroll', () => {
  if (!scrollPending) {
    window.requestAnimationFrame(updateNavigation);
    scrollPending = true;
  }
}, { passive: true });
window.addEventListener('resize', updateNavigation);
setSidebarCollapsed(mobileLayout.matches, false);

// The landscape owns its clock, visibility and character choreography.
import './planet-day.js?v=planet-day-5';
