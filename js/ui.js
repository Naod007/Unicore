// UI utilities shared by public + admin pages.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} hr ago`;
  return new Date(ts).toLocaleDateString();
}
const pill = (s) => s ? `<span class="pill" style="--c:${esc(s.color)}">${esc(s.icon)} ${esc(s.name)}</span>` : '<span class="pill">Unknown</span>';

let toastTimer;
function toast(msg, isErr) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t); }
  t.className = 'toast show' + (isErr ? ' err' : ''); t.textContent = msg;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
