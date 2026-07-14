/* claude-status — realtime presence between two people, no build step. */

const OTHER = ME === "anton" ? "amir" : "anton";
const NAMES = { anton: "Антон", amir: "Амир" };

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const els = {
  conn: document.getElementById("conn"),
  history: document.getElementById("history"),
  tile: { anton: document.getElementById("tile-anton"), amir: document.getElementById("tile-amir") },
  line: { anton: document.getElementById("line-anton"), amir: document.getElementById("line-amir") },
  btn: document.getElementById(`btn-${ME}`),
};

let state = { anton: null, amir: null };
let tickHandle = null;

// ---------- initial load ----------

async function loadInitial() {
  const { data: rows, error } = await sb.from("presence").select("*");
  if (error) {
    console.error(error);
    els.conn.textContent = "offline";
    return;
  }
  rows.forEach((row) => (state[row.id] = row));
  render();

  const { data: sessions } = await sb
    .from("sessions")
    .select("*")
    .order("start", { ascending: false })
    .limit(15);
  renderHistory(sessions || []);
}

// ---------- realtime ----------

sb.channel("presence-sync")
  .on("postgres_changes", { event: "*", schema: "public", table: "presence" }, (payload) => {
    if (payload.new) state[payload.new.id] = payload.new;
    render();
  })
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "sessions" }, (payload) => {
    prependHistory(payload.new);
  })
  .subscribe((status) => {
    const live = status === "SUBSCRIBED";
    els.conn.textContent = live ? "online" : "offline";
    els.conn.classList.toggle("live", live);
  });

loadInitial();

// ---------- rendering ----------

function render() {
  ["anton", "amir"].forEach((who) => {
    const data = state[who];
    const tile = els.tile[who];
    const line = els.line[who];
    const active = !!(data && data.active);
    tile.classList.toggle("active", active);
    tile.classList.toggle(`who-${who}`, true);

    if (active && data.since) {
      line.dataset.since = new Date(data.since).getTime();
    } else {
      delete line.dataset.since;
      line.textContent = "простаивает";
    }
  });

  if (els.btn) {
    const mine = state[ME];
    const active = !!(mine && mine.active);
    els.btn.textContent = active ? "Я закончил" : "Я сел за Claude";
    els.btn.classList.toggle("stop", active);
  }

  if (!tickHandle) tickHandle = setInterval(tick, 1000);
  tick();
}

function tick() {
  ["anton", "amir"].forEach((who) => {
    const line = els.line[who];
    const since = line.dataset.since;
    if (!since) return;
    const secs = Math.floor((Date.now() - Number(since)) / 1000);
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    line.textContent = `в Claude · ${h}:${m}:${s}`;
  });
}

function renderHistory(rows) {
  els.history.innerHTML = "";
  rows.forEach((row) => appendHistoryEl(row, "append"));
}

function prependHistory(row) {
  appendHistoryEl(row, "prepend");
}

function appendHistoryEl(row, position) {
  if (!row || !row.start || !row.end) return;
  const mins = Math.max(1, Math.round((new Date(row.end) - new Date(row.start)) / 60000));
  const dt = new Date(row.start);
  const dateStr = dt.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  const timeStr = dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const el = document.createElement("div");
  el.className = "log-entry";
  el.innerHTML = `<span><b>${NAMES[row.user] || row.user}</b> · ${dateStr} ${timeStr}</span><span>${mins} мин</span>`;
  els.history[position](el);
}

// ---------- toggle action ----------

if (els.btn) {
  els.btn.addEventListener("click", async () => {
    els.btn.disabled = true;
    try {
      const mine = state[ME] || {};
      const turningOn = !mine.active;

      if (turningOn) {
        const since = new Date().toISOString();
        const { error } = await sb
          .from("presence")
          .update({ active: true, since, name: NAMES[ME] })
          .eq("id", ME);
        if (error) throw error;
        state[ME] = { ...state[ME], active: true, since };
        notifyOther(`${NAMES[ME]} сел за Claude`);
      } else {
        const endedAt = new Date().toISOString();
        const startedAt = mine.since || endedAt;
        const { error: e1 } = await sb
          .from("sessions")
          .insert({ user: ME, start: startedAt, end: endedAt });
        if (e1) throw e1;
        const { error: e2 } = await sb.from("presence").update({ active: false }).eq("id", ME);
        if (e2) throw e2;
      }
    } catch (e) {
      console.error(e);
      alert("Не получилось обновить статус. Проверь config.js и SQL-политики в Supabase.");
    } finally {
      els.btn.disabled = false;
    }
  });
}

// ---------- push через ntfy.sh (без бэкенда) ----------

async function notifyOther(text) {
  if (!NTFY_TOPIC || NTFY_TOPIC.includes("ВСТАВЬ_СЮДА")) return;
  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(NTFY_TOPIC)}`, {
      method: "POST",
      body: text, // кириллица идёт в теле запроса, не в заголовке — так UTF-8 не ломается
    });
  } catch (e) {
    console.warn("ntfy push failed", e);
  }
}
