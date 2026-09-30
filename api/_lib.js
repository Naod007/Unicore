// Shared server helpers: storage (Upstash Redis REST), session cookies, validation.
const crypto = require('crypto');

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'unicore:data';
let mem = null; // local-dev fallback when no database is configured (resets on restart)

const uid = () => crypto.randomBytes(6).toString('hex');
const json = (res, code, body) => res.status(code).json(body);

// ---- Example data: edit this to seed your real teachers (only used on first run) ----
function seed() {
  const st = [
    ['Coming', '🟢', '#16a34a'], ['On the way', '🟡', '#ca8a04'], ['Not coming', '🔴', '#dc2626'],
    ['In class', '🔵', '#2563eb'], ['Pending', '⚪', '#9ca3af'], ['Delayed', '🟠', '#ea580c'],
    ['Substitute', '🟣', '#9333ea'], ['Cancelled', '⚫', '#374151'],
  ].map(([name, icon, color], i) => ({ id: 's' + i, name, icon, color, order: i, createdAt: Date.now() }));
  const t = [
    ['Abebe Kebede', 'Mathematics', 'B204', 's0'], ['Hana Tesfaye', 'Physics', 'C102', 's2'],
    ['Daniel Alemu', 'English', 'A201', 's1'], ['Meron Yohannes', 'Biology', 'C203', 's4'],
    ['Samuel Tadesse', 'Chemistry', 'B105', 's3'],
  ].map(([name, subject, room, statusId], i) => ({ id: 't' + i, name, subject, room, statusId, updatedAt: Date.now() }));
  return { statuses: st, teachers: t, updatedAt: Date.now() };
}

async function redis(cmd) {
  const r = await fetch(REST_URL, {
    method: 'POST', headers: { Authorization: `Bearer ${REST_TOKEN}` }, body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error('Database error ' + r.status);
  return (await r.json()).result;
}
async function load() {
  if (!REST_URL) return mem || (mem = seed());
  const raw = await redis(['GET', KEY]);
  if (raw) return JSON.parse(raw);
  const s = seed(); await save(s); return s;
}
async function save(d) {
  d.updatedAt = Date.now();
  d.statuses.forEach((s, i) => (s.order = i));
  if (!REST_URL) { mem = d; return d; }
  await redis(['SET', KEY, JSON.stringify(d)]);
  return d;
}

// ---- Auth: stateless HMAC-signed session in an HttpOnly cookie ----
const SECRET = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
const sign = (p) => crypto.createHmac('sha256', SECRET()).update(p).digest('base64url');
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEq = (a, b) => crypto.timingSafeEqual(sha(a), sha(b)); // constant-time compare

function makeCookie(user) {
  const p = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + 12 * 3600e3 })).toString('base64url');
  const secure = process.env.VERCEL ? '; Secure' : '';
  return `uc_session=${p}.${sign(p)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure}`;
}
const clearCookie = () => 'uc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0';

function session(req) {
  if (!SECRET()) return null;
  const m = /(?:^|;\s*)uc_session=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [p, sig] = m[1].split('.');
  if (!p || !sig || !safeEq(sig, sign(p))) return null;
  try { const d = JSON.parse(Buffer.from(p, 'base64url')); return d.exp > Date.now() ? d : null; } catch { return null; }
}
// Call at the top of every admin endpoint. Returns null (and responds 401) if not signed in.
function requireAdmin(req, res) {
  const s = session(req);
  if (!s) { json(res, 401, { error: 'Session expired. Please sign in again.' }); return null; }
  return s;
}
const clean = (v) => String(v ?? '').trim().slice(0, 80);
const reorder = (arr, ids) => [...ids.map((id) => arr.find((x) => x.id === id)).filter(Boolean), ...arr.filter((x) => !ids.includes(x.id))];

module.exports = { uid, json, load, save, session, requireAdmin, makeCookie, clearCookie, safeEq, clean, reorder };
