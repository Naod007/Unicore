// GET = who am I, POST = login, DELETE = logout
const L = require('./_lib');
module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const s = L.session(req);
      return s ? L.json(res, 200, { user: s.u }) : L.json(res, 401, { error: 'Not signed in' });
    }
    if (req.method === 'DELETE') { res.setHeader('Set-Cookie', L.clearCookie()); return L.json(res, 200, { ok: true }); }
    if (req.method !== 'POST') return L.json(res, 405, { error: 'Method not allowed' });
    const U = process.env.ADMIN_USERNAME, P = process.env.ADMIN_PASSWORD;
    if (!U || !P) return L.json(res, 500, { error: 'Server is missing ADMIN_USERNAME / ADMIN_PASSWORD.' });
    const { username, password } = req.body || {};
    const ok = L.safeEq(username ?? '', U) & L.safeEq(password ?? '', P); // no short-circuit
    if (!ok) { await new Promise((r) => setTimeout(r, 800)); return L.json(res, 401, { error: 'Incorrect username or password.' }); }
    res.setHeader('Set-Cookie', L.makeCookie(U));
    L.json(res, 200, { user: U });
  } catch (e) { console.error(e); L.json(res, 500, { error: 'Server error' }); }
};
