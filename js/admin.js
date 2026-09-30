// Admin shell: routing (hash), rendering, event delegation.
let DATA = null;
const VIEWS = { status: viewStatus, teachers: viewTeachers, statuses: viewStatuses, settings: () =>
  `<div class="head"><h1>Settings</h1></div><div class="row" style="grid-template-columns:1fr auto"><div><div class="n">Signed in as ${esc(ME)}</div>
   <div class="muted">Credentials are set with ADMIN_USERNAME and ADMIN_PASSWORD in your Vercel environment variables.</div></div><a class="btn" href="/" target="_blank">View student page</a></div>` };

function render() {
  if (!DATA) return;
  const v = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'status';
  document.querySelectorAll('.side a[href^="#"],.mobbar a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + v));
  if (document.activeElement?.closest('#view') && v === 'statuses' && document.activeElement.tagName === 'INPUT') return;
  $('#view').innerHTML = VIEWS[v]();
}

async function startApp(user) {
  ME = user; $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
  $('#view').innerHTML = '<div class="skel"></div><div class="skel"></div>';
  try { DATA = await api('/api/data'); render(); } catch { $('#view').innerHTML = '<div class="state"><h3>Unable to load teacher statuses.</h3>Please try again.</div>'; }
}

$('#view').addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]'); if (!b) return; e.stopPropagation();
  const a = b.dataset.a; (a.endsWith('S') ? statusAction : teacherAction)(a, b.dataset.id);
});
$('#view').addEventListener('change', (e) => { if (e.target.dataset.f) statusFieldChange(e.target); });
document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) closeMenu(); });
window.addEventListener('hashchange', () => { closeMenu(); render(); });
// Refresh admin data when returning to the tab (another admin may have edited).
document.addEventListener('visibilitychange', async () => { if (!document.hidden && ME) { const d = await guarded(() => api('/api/data')); if (d) { DATA = d; render(); } } });

(async () => { try { startApp((await api('/api/auth')).user); } catch { showLogin(); } })();
