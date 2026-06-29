const BASE_URL = import.meta.env.VITE_API_URL || '';

// ---------------------------------------------------------------------------
// Core request helper – throws a plain Error on non-2xx responses.
// ---------------------------------------------------------------------------
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Normalise any thrown value into a consistent { error: string } shape so
// every caller can do:  if (result.error) { /* handle */ }
// ---------------------------------------------------------------------------
function toErrorShape(err) {
  return { error: err instanceof Error ? err.message : String(err) };
}

// ---------------------------------------------------------------------------
// Stable session/user IDs for the browser session
// ---------------------------------------------------------------------------
const SESSION_ID = (() => {
  const key = 'devassist_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
})();
const USER_ID = 'default-user';

// ---------------------------------------------------------------------------
// Typed endpoint wrappers
// ---------------------------------------------------------------------------

/**
 * POST /api/chat
 * Sends a chat message. session_id and user_id are managed internally.
 * @param {string} message
 * @returns {Promise<{ reply, model, tokens, cost, latency }|{error:string}>}
 */
export async function postChat(message) {
  try {
    const raw = await request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: SESSION_ID,
        user_id:    USER_ID,
      }),
    });
    // Normalise backend field names → what Chat.jsx expects
    return {
      reply:   raw.response   ?? raw.reply   ?? JSON.stringify(raw),
      model:   raw.model_used ?? raw.model   ?? null,
      tokens:  raw.tokens     ?? null,
      cost:    raw.estimated_cost != null
                 ? parseFloat(String(raw.estimated_cost).replace('$', ''))
                 : null,
      latency: raw.latency != null ? String(raw.latency).replace('ms', '').trim() : null,
    };
  } catch (err) {
    return toErrorShape(err);
  }
}

/**
 * GET /api/stats  (exposed as getDashboardSummary for Dashboard.jsx)
 * @returns {Promise<object|{error:string}>}
 */
export async function getDashboardSummary() {
  try {
    const raw = await request('/api/stats');
    // Normalise backend field names → what Dashboard.jsx CARD_CONFIG keys expect
    return {
      total_sessions:   raw.total_sessions        ?? null,
      total_cost_today: raw.estimated_cost_saved   ?? null,
      most_used_model:  raw.most_used_model        ?? null,
      avg_latency:      raw.avg_latency            ?? null,
    };
  } catch (err) {
    return toErrorShape(err);
  }
}

/**
 * GET /api/memory/search?q=<query>
 * @param {string} query
 * @returns {Promise<object|{error:string}>}
 */
export async function searchMemory(query) {
  try {
    return await request(`/api/memory/search?q=${encodeURIComponent(query)}`);
  } catch (err) {
    return toErrorShape(err);
  }
}

/**
 * GET /api/sessions
 * @returns {Promise<object|{error:string}>}
 */
export async function getSessions() {
  try {
    return await request('/api/sessions');
  } catch (err) {
    return toErrorShape(err);
  }
}

/**
 * GET /api/chat/:id  – returns the message history for a session
 * @param {string|number} sessionId
 * @returns {Promise<object|{error:string}>}
 */
export async function getSessionDetail(sessionId) {
  try {
    const raw = await request(`/api/chat/${encodeURIComponent(sessionId)}`);
    // Normalise → what SessionHistory.jsx expects: { messages: [...] }
    return {
      messages: raw.messages ?? (Array.isArray(raw) ? raw : []),
    };
  } catch (err) {
    return toErrorShape(err);
  }
}

/**
 * GET /api/costs/timeseries?range=<range>
 * Backend endpoint not yet implemented – returns empty stub so the UI
 * renders gracefully with "No data" rather than crashing.
 * @param {string} range  e.g. '7d' | '30d' | '90d'
 * @returns {Promise<object|{error:string}>}
 */
export async function getCostTimeseries(range) {
  try {
    return await request(`/api/costs/timeseries?range=${encodeURIComponent(range)}`);
  } catch {
    // Return empty data shape so CostAnalytics renders the "no data" state
    return { timeseries: [], by_model: [], total: 0 };
  }
}

// ---------------------------------------------------------------------------
// Generic low-level helpers (kept for ad-hoc use)
// ---------------------------------------------------------------------------
export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)  => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
};
