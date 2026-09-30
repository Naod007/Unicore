// ADMIN ONLY. Same verbs as teachers. Deleting a status moves its teachers to the first remaining one.
const L = require('./_lib');
module.exports = async (req, res) => {
  try {
    if (!L.requireAdmin(req, res)) return;
    const d = await L.load(), b = req.body || {};
    const color = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#9ca3af');
    if (req.method === 'POST') {
      if (!L.clean(b.name)) return L.json(res, 400, { error: 'Name is required.' });
      d.statuses.push({ id: L.uid(), name: L.clean(b.name), icon: L.clean(b.icon).slice(0, 8) || '⚪', color: color(b.color), order: d.statuses.length, createdAt: Date.now() });
    } else if (req.method === 'PUT') {
      const s = d.statuses.find((x) => x.id === b.id);
      if (!s) return L.json(res, 404, { error: 'Status not found.' });
      if (b.name !== undefined) { if (!L.clean(b.name)) return L.json(res, 400, { error: 'Name is required.' }); s.name = L.clean(b.name); }
      if (b.icon !== undefined) s.icon = L.clean(b.icon).slice(0, 8) || '⚪';
      if (b.color !== undefined) s.color = color(b.color);
    } else if (req.method === 'DELETE') {
      if (d.statuses.length <= 1) return L.json(res, 400, { error: 'Keep at least one status.' });
      d.statuses = d.statuses.filter((s) => s.id !== req.query.id);
      d.teachers.forEach((t) => { if (!d.statuses.some((s) => s.id === t.statusId)) { t.statusId = d.statuses[0].id; t.updatedAt = Date.now(); } });
    } else if (req.method === 'PATCH') {
      d.statuses = L.reorder(d.statuses, Array.isArray(b.ids) ? b.ids : []);
    } else return L.json(res, 405, { error: 'Method not allowed' });
    L.json(res, 200, await L.save(d));
  } catch (e) { console.error(e); L.json(res, 500, { error: 'Server error' }); }
};
