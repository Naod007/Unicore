// PUBLIC read-only endpoint. ?since=<updatedAt> returns a tiny reply when nothing changed.
const L = require('./_lib');
module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return L.json(res, 405, { error: 'Method not allowed' });
    const d = await L.load();
    if (String(req.query.since) === String(d.updatedAt)) return L.json(res, 200, { unchanged: true });
    L.json(res, 200, d);
  } catch (e) { console.error(e); L.json(res, 500, { error: 'Server error' }); }
};
