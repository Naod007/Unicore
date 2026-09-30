// ADMIN ONLY. POST create · PUT update (incl. statusId) · DELETE ?id= · PATCH {ids} reorder
const L = require('./_lib');
module.exports = async (req, res) => {
  try {
    if (!L.requireAdmin(req, res)) return;
    const d = await L.load(), b = req.body || {};
    const validStatus = (id) => d.statuses.some((s) => s.id === id);
    if (req.method === 'POST') {
      if (!L.clean(b.name)) return L.json(res, 400, { error: 'Name is required.' });
      d.teachers.push({ id: L.uid(), name: L.clean(b.name), subject: L.clean(b.subject), room: L.clean(b.room),
        statusId: validStatus(b.statusId) ? b.statusId : d.statuses[0]?.id, updatedAt: Date.now() });
    } else if (req.method === 'PUT') {
      const t = d.teachers.find((x) => x.id === b.id);
      if (!t) return L.json(res, 404, { error: 'Teacher not found.' });
      for (const k of ['name', 'subject', 'room']) if (b[k] !== undefined) t[k] = L.clean(b[k]);
      if (!t.name) return L.json(res, 400, { error: 'Name is required.' });
      if (b.statusId !== undefined) { if (!validStatus(b.statusId)) return L.json(res, 400, { error: 'Unknown status.' }); t.statusId = b.statusId; }
      t.updatedAt = Date.now();
    } else if (req.method === 'DELETE') {
      d.teachers = d.teachers.filter((t) => t.id !== req.query.id);
    } else if (req.method === 'PATCH') {
      d.teachers = L.reorder(d.teachers, Array.isArray(b.ids) ? b.ids : []);
    } else return L.json(res, 405, { error: 'Method not allowed' });
    L.json(res, 200, await L.save(d));
  } catch (e) { console.error(e); L.json(res, 500, { error: 'Server error' }); }
};
