// Teacher management: views + actions. Every mutation returns fresh full data from the server.
const TEACHER_API = '/api/teachers';
const move = (arr, id, dir) => { const ids = arr.map((x) => x.id), i = ids.indexOf(id), j = i + dir; if (j < 0 || j >= ids.length) return null; [ids[i], ids[j]] = [ids[j], ids[i]]; return ids; };

function viewStatus() {
  const { teachers, statuses } = DATA, by = Object.fromEntries(statuses.map((s) => [s.id, s]));
  const stats = statuses.map((s) => `<div class="stat"><b>${teachers.filter((t) => t.statusId === s.id).length}</b><span>${esc(s.icon)} ${esc(s.name)}</span></div>`).join('');
  return `<div class="head"><h1>Class Status</h1></div>
  <div class="stats"><div class="stat"><b>${teachers.length}</b><span>Teachers</span></div>${stats}</div>
  ${teachers.length ? teachers.map((t) => `<div class="row"><div class="n">${esc(t.name)}</div><div class="muted">${esc(t.subject)} · ${esc(t.room)}</div>
   <button class="btn" data-a="pick" data-id="${t.id}">${pill(by[t.statusId])} ▾</button></div>`).join('') : '<div class="state"><h3>No teachers yet.</h3>Add one in Teachers.</div>'}`;
}

function viewTeachers() {
  return `<div class="head"><h1>Teachers</h1><button class="btn primary" data-a="addT">Add teacher</button></div>
  ${DATA.teachers.length ? DATA.teachers.map((t) => `<div class="row"><div class="n">${esc(t.name)}</div><div class="muted">${esc(t.subject)} · ${esc(t.room)}</div>
   <div class="acts"><button class="btn sm" data-a="upT" data-id="${t.id}" aria-label="Move up">↑</button><button class="btn sm" data-a="dnT" data-id="${t.id}" aria-label="Move down">↓</button>
   <button class="btn sm" data-a="editT" data-id="${t.id}">Edit</button><button class="btn sm danger" data-a="delT" data-id="${t.id}">Delete</button></div></div>`).join('')
   : '<div class="state"><h3>No teachers yet.</h3>Add your first teacher.</div>'}`;
}

function openDialog(html, onSubmit) {
  const f = $('#dlgForm'); f.innerHTML = html + '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" value="cancel" formnovalidate>Cancel</button><button class="btn primary" value="ok">Save</button></div>';
  f.onsubmit = async (e) => { if (e.submitter?.value !== 'ok') return; e.preventDefault(); if (await onSubmit(new FormData(f)) !== false) $('#dlg').close(); };
  $('#dlg').showModal();
}
function teacherDialog(t) {
  const opts = DATA.statuses.map((s) => `<option value="${s.id}" ${t?.statusId === s.id ? 'selected' : ''}>${esc(s.icon)} ${esc(s.name)}</option>`).join('');
  openDialog(`<label>Name<input name="name" required value="${esc(t?.name)}"></label><label>Subject<input name="subject" value="${esc(t?.subject)}"></label>
   <label>Room<input name="room" value="${esc(t?.room)}"></label><label>Status<select name="statusId">${opts}</select></label>`,
   async (f) => { const body = Object.fromEntries(f); if (t) body.id = t.id;
     const d = await guarded(() => api(TEACHER_API, { method: t ? 'PUT' : 'POST', body })); if (!d) return false; DATA = d; render(); toast(t ? 'Teacher updated' : 'Teacher added'); });
}

// Fast status change: menu -> optimistic update -> save -> toast
function statusMenu(btn, id) {
  closeMenu(); const m = document.createElement('div'); m.className = 'menu'; m.id = 'menu';
  m.innerHTML = DATA.statuses.map((s) => `<button data-s="${s.id}">${esc(s.icon)} ${esc(s.name)}</button>`).join('');
  const r = btn.getBoundingClientRect(); m.style.top = r.bottom + scrollY + 4 + 'px'; m.style.left = Math.max(8, Math.min(r.left + scrollX, innerWidth - 200)) + 'px';
  m.onclick = async (e) => { const b = e.target.closest('[data-s]'); if (!b) return; closeMenu();
    const d = await guarded(() => api(TEACHER_API, { method: 'PUT', body: { id, statusId: b.dataset.s } })); if (d) { DATA = d; render(); toast('Updated successfully'); } };
  document.body.append(m);
}
const closeMenu = () => $('#menu')?.remove();

async function teacherAction(a, id) {
  const t = DATA.teachers.find((x) => x.id === id);
  if (a === 'pick') return statusMenu($(`[data-id="${id}"]`), id);
  if (a === 'addT') return teacherDialog();
  if (a === 'editT') return teacherDialog(t);
  if (a === 'delT') { if (!confirm(`Delete ${t.name}?`)) return; const d = await guarded(() => api(`${TEACHER_API}?id=${id}`, { method: 'DELETE' })); if (d) { DATA = d; render(); toast('Teacher deleted'); } }
  if (a === 'upT' || a === 'dnT') { const ids = move(DATA.teachers, id, a === 'upT' ? -1 : 1); if (!ids) return;
    const d = await guarded(() => api(TEACHER_API, { method: 'PATCH', body: { ids } })); if (d) { DATA = d; render(); } }
}
