// ==========================================================
// НАСТРОЙКИ. Заполни всё ниже своими значениями.
// ==========================================================

// 1) Supabase-проект (Project Settings → API)
const SUPABASE_URL = "https://iuafxfltuxhxjjtdisjz.supabase.co"; // например https://xxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YWZ4Zmx0dXhoeGpqdGRpc2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NzUyODgsImV4cCI6MjA5OTU1MTI4OH0.cQMeUm9aSQHtK4Fgtz_axS1SxLN_2SbLJ62AK9RHlX8"; // "anon public" ключ, НЕ service_role

// 2) Топик в ntfy.sh — придумай длинную случайную строку, известную только вам двоим.
//    Оба ставите приложение ntfy (App Store) и подписываетесь на этот же топик.
const NTFY_TOPIC = "claude-status-x7k2m9qp4v"; // например antonamir-claude-8f2k1x

// 3) Кто есть кто в этом приложении. "me" — за кем из двух закреплено это устройство.
//    На телефоне Антона поставь "anton", на телефоне Амира — "amir".
const ME = "anton"; // "anton" | "amir"
