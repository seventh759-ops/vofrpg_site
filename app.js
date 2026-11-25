// 日本語・英語の切り替えと、お知らせ・最新の版（ゲームと同じ Supabase の表を、読むだけの公開用の鍵で読む）。
const SUPABASE_URL = "https://tgosemvsfdukbptounnl.supabase.co";
const SUPABASE_KEY = "sb_publishable_s4jqzye2zqxlVo00lfdrVQ_-huuTyRn";

// ---- 言語：はじめはブラウザの言語（日本語なら日本語、それ以外は英語）。選んだ方を覚えておく ----
function initialLang() {
  try {
    const saved = localStorage.getItem("vof_lang");
    if (saved === "ja" || saved === "en") return saved;
  } catch (e) { /* 使えなければ、ブラウザの言語で */ }
  return (navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en";
}
let lang = initialLang();
const T = (ja, en) => (lang === "en" ? en : ja);

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-en]").forEach(el => {
    if (el.dataset.ja === undefined) el.dataset.ja = el.innerHTML; // 日本語（もとの中身）を覚えておく
    el.innerHTML = lang === "en" ? el.dataset.en : el.dataset.ja;
  });
  document.querySelectorAll(".lang").forEach(b => (b.innerHTML = lang === "en" ? "JA / <b>EN</b>" : "<b>JA</b> / EN"));
  renderVersion();
  renderNews();
}

document.querySelectorAll(".lang").forEach(b => b.addEventListener("click", () => {
  lang = lang === "en" ? "ja" : "en";
  try { localStorage.setItem("vof_lang", lang); } catch (e) { /* 覚えられなくても切り替えはできる */ }
  applyLang();
}));

// ---- Supabase ----
async function get(path) {
  const res = await fetch(SUPABASE_URL + path, { headers: { apikey: SUPABASE_KEY } });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let version = null;    // { version, url }
let news = null;       // お知らせの行（読めなければ "error"）

function renderVersion() {
  document.querySelectorAll(".js-version").forEach(e => (e.textContent = version ? T("最新 ", "Latest ") + version.version : T("最新版", "Latest")));
  if (version && version.url && /^https?:\/\//.test(version.url)) document.querySelectorAll(".js-download").forEach(a => (a.href = version.url));
}

function renderNews() {
  const box = document.getElementById("news-list");
  if (!box) return;
  if (news === null) { box.innerHTML = `<p class="note">${T("読み込み中…", "Loading…")}</p>`; return; }
  if (news === "error") { box.innerHTML = `<p class="note">${T("お知らせを読めませんでした。", "Could not load the news.")}</p>`; return; }
  if (!news.length) { box.innerHTML = `<p class="note">${T("まだありません。", "Nothing yet.")}</p>`; return; }
  box.innerHTML = news.map(n => {
    const head = n.kind === "update" && n.version ? T("バージョン ", "Version ") + n.version : n.title;
    const lines = String(n.body || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    return `<div class="card news-item">
      <h3><span>${esc(head)}</span><span class="date">${esc(n.published_at || "")}</span></h3>
      ${n.kind === "update" && n.title ? `<p class="title">${esc(n.title)}</p>` : ""}
      <ul>${lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>
    </div>`;
  }).join("") + (lang === "en" ? `<p class="note">The news is written in Japanese.</p>` : "");
}

async function load() {
  try {
    const rows = await get("/rest/v1/vof_app_version?select=version,url&id=eq.1");
    version = rows.length ? rows[0] : null;
  } catch (e) { version = null; }
  renderVersion();
  try {
    news = await get("/rest/v1/vof_notices?select=id,kind,version,title,body,published_at&visible=eq.true&order=published_at.desc,id.desc&limit=20");
  } catch (e) { news = "error"; }
  renderNews();
}

applyLang();
load();
