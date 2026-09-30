// Status management: add / rename / recolor / change icon / reorder / delete.
const STATUS_API = '/api/statuses';

function viewStatuses() {
  return `<div class="head"><h1>Statuses</h1><button class="btn primary" data-a="addS">Add status</button></div>
  ${DATA.statuses.map((s) => `<div class="row st" data-sid="${s.id}"><input data-f="icon" value="${esc(s.icon)}" maxlength="4" aria-label="Icon" style="text-align:center">
   <input data-f="name" value="${esc(s.name)}" aria-label="Name"><input data-f="color" type="color" value="${esc(s.color)}" aria-label="Color" style="padding:2px;height:36px">
   <div class="acts"><button class="btn sm" data-a="upS" data-id="${s.id}" aria-label="Move up">↑</button><button class="btn sm" data-a="dnS" data-id="${s.id}" aria-label="Move down">↓</button>
   <button class="btn sm danger" data-a="delS" data-id="${s.id}">Delete</button></div></div>`).join('')}
  <p class="muted" style="font-size:13px">Changes save automatically. Deleting a status moves its teachers to the first remaining status.</p>`;
}

// Inline edits save on change (blur / picker close).
async function statusFieldChange(input) {
  const id = input.closest('[data-sid]').dataset.sid;
  const d = await guarded(() => api(STATUS_API, { method: 'PUT', body: { id, [input.dataset.f]: input.value } }));
  if (d) { DATA = d; toast('Updated successfully'); } else render();
}

async function statusAction(a, id) {
  if (a === 'addS') { const d = await guarded(() => api(STATUS_API, { method: 'POST', body: { name: 'New status', icon: '⚪', color: '#9ca3af' } })); if (d) { DATA = d; render(); toast('Status added'); } }
  if (a === 'delS') { const s = DATA.statuses.find((x) => x.id === id); if (!confirm(`Delete "${s.name}"? Teachers using it will move to another status.`)) return;
    const d = await guarded(() => api(`${STATUS_API}?id=${id}`, { method: 'DELETE' })); if (d) { DATA = d; render(); toast('Status deleted'); } }
  if (a === 'upS' || a === 'dnS') { const ids = move(DATA.statuses, id, a === 'upS' ? -1 : 1); if (!ids) return;
    const d = await guarded(() => api(STATUS_API, { method: 'PATCH', body: { ids } })); if (d) { DATA = d; render(); } }
}
