// Thin fetch wrapper. Throws Error with .status so callers can handle 401 (session expired).
async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch(path, {
    method, credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {}, body: body && JSON.stringify(body),
  });
  let data = null; try { data = await r.json(); } catch {}
  if (!r.ok) { const e = new Error(data?.error || 'Request failed'); e.status = r.status; throw e; }
  return data;
}
