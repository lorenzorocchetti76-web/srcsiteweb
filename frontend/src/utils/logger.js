const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const KEY = "sr_log_queue";
let queue = [];
try { queue = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { queue = []; }
let timer = null;

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(queue.slice(-200))); } catch (e) { /* pieno */ }
}

export function logEvent(level, message, extra = {}) {
  queue.push({
    level,
    message: String(message).slice(0, 2000),
    url: window.location.href,
    ua: navigator.userAgent,
    ts: new Date().toISOString(),
    ...extra,
  });
  persist();
  if (!timer) timer = setTimeout(flush, 4000);
}

export async function flush() {
  timer = null;
  if (!queue.length || !navigator.onLine) return;
  const batch = queue;
  queue = [];
  try {
    const res = await fetch(`${API}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: batch }),
    });
    if (!res.ok) throw new Error(String(res.status));
    persist();
  } catch (e) {
    queue = batch.concat(queue).slice(-200);
    persist();
  }
}

export function initLogger() {
  window.addEventListener("error", (e) => {
    logEvent("error", e.message, {
      stack: (e.error && e.error.stack) || "",
      src: e.filename || "",
      line: e.lineno || 0,
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    logEvent("error", "unhandledrejection: " + ((r && (r.stack || r.message)) || r));
  });
  window.addEventListener("online", flush);
  flush();
}
