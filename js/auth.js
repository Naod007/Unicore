// Admin authentication UI. The real gate is server-side: every /api write requires the signed cookie.
let ME = null;
function showLogin(msg) { ME = null; $('#app').classList.add('hidden'); $('#login').classList.remove('hidden'); $('#loginErr').textContent = msg || ''; }
async function guarded(fn) {  // wraps admin calls: handles expired sessions + errors uniformly
  try { return await fn(); }
  catch (e) { if (e.status === 401) showLogin('Session expired. Please sign in again.'); else toast(e.message || 'Failed to update. Try again.', true); return null; }
}
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault(); const f = new FormData(e.target); $('#loginErr').textContent = '';
  try { const r = await api('/api/auth', { method: 'POST', body: { username: f.get('username'), password: f.get('password') } }); e.target.reset(); await startApp(r.user); }
  catch (err) { $('#loginErr').textContent = err.message; }
});
$('#logout').addEventListener('click', async () => { await api('/api/auth', { method: 'DELETE' }); showLogin(); });
