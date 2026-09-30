// Public student dashboard: read-only, filters instantly in-browser, polls politely.
const POLL_MS = 20000;
let data = null, filter = 'all', query = '', prev = {}, failed = false;

function render() {
  const list = $('#list'), meta = $('#meta');
  if (!data) {
    if (failed) list.innerHTML = '<div class="state"><h3>Unable to load teacher statuses.</h3>Please try again.</div>';
    return;
  }
  const byId = Object.fromEntries(data.statuses.map((s) => [s.id, s]));
  // Filter chips are built from the admin-defined statuses, only if some teacher uses them.
  const used = data.statuses.filter((s) => data.teachers.some((t) => t.statusId === s.id));
  if (filter !== 'all' && !used.some((s) => s.id === filter)) filter = 'all';
  $('#chips').innerHTML = [{ id: 'all', name: 'All' }, ...used].map((s) =>
    `<button class="chip ${filter === s.id ? 'on' : ''}" data-f="${esc(s.id)}">${esc(s.name)}</button>`).join('');

  const q = query.trim().toLowerCase();
  const rows = data.teachers.filter((t) => (filter === 'all' || t.statusId === filter) &&
    (!q || [t.name, t.subject, t.room].some((v) => v.toLowerCase().includes(q))));

  meta.textContent = `Last updated ${timeAgo(data.updatedAt)}`;
  if (!data.teachers.length) list.innerHTML = '<div class="state"><h3>No teachers yet.</h3>Check back soon.</div>';
  else if (!rows.length) list.innerHTML = '<div class="state"><h3>No teachers found.</h3>Try a different search or filter.</div>';
  else list.innerHTML = rows.map((t) => {
    const changed = prev[t.id] && prev[t.id] !== t.statusId;
    return `<article class="card ${changed ? 'flash' : ''}"><div><h2>${esc(t.name)}</h2>
      <p>${esc(t.subject)}${t.room ? ` · Room ${esc(t.room)}` : ''}</p></div>
      <div class="r">${pill(byId[t.statusId])}<small>Updated ${timeAgo(t.updatedAt)}</small></div></article>`;
  }).join('');
  prev = Object.fromEntries(data.teachers.map((t) => [t.id, t.statusId]));
}

// Ask for changes only: server replies {unchanged:true} when nothing is new (tiny response).
async function load(manual) {
  try {
    const d = await api('/api/data' + (data && !manual ? `?since=${data.updatedAt}` : ''));
    failed = false;
    if (!d.unchanged) data = d;
  } catch { failed = true; if (!data) { render(); return; } $('#meta').textContent = 'Connection problem — showing last known statuses.'; return; }
  render();
}

$('#q').addEventListener('input', (e) => { query = e.target.value; render(); });
$('#chips').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; render(); } });
$('#refresh').addEventListener('click', () => load(true));
setInterval(() => { if (!document.hidden) load(); }, POLL_MS);       // no requests while tab is hidden
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
setInterval(() => data && render(), 60000);                          // keep "x min ago" fresh
load(true);
