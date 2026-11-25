// お知らせと最新の版を、ゲームと同じ Supabase の表から読む（読むだけの公開用の鍵）。
const SUPABASE_URL = "https://tgosemvsfdukbptounnl.supabase.co";
const SUPABASE_KEY = "sb_publishable_s4jqzye2zqxlVo00lfdrVQ_-huuTyRn";

async function get(path) {
  const res = await fetch(SUPABASE_URL + path, { headers: { apikey: SUPABASE_KEY } });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function loadVersion() {
  try {
    const rows = await get("/rest/v1/vof_app_version?select=version,url&id=eq.1");
    if (!rows.length) return;
    const v = rows[0];
    document.querySelectorAll(".js-version").forEach(e => (e.textContent = "最新 " + v.version));
    if (v.url && /^https?:\/\//.test(v.url)) document.querySelectorAll(".js-download").forEach(a => (a.href = v.url));
  } catch (e) { /* 読めなければ、そのまま */ }
}

async function loadNews() {
  const box = document.getElementById("news-list");
  try {
    const rows = await get("/rest/v1/vof_notices?select=id,kind,version,title,body,published_at&visible=eq.true&order=published_at.desc,id.desc&limit=20");
    if (!rows.length) { box.innerHTML = '<p class="note">まだありません。</p>'; return; }
    box.innerHTML = rows.map(n => {
      const head = n.kind === "update" && n.version ? "バージョン " + n.version : n.title;
      const lines = String(n.body || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      return `<div class="card news-item">
        <h3><span>${esc(head)}</span><span class="date">${esc(n.published_at || "")}</span></h3>
        ${n.kind === "update" && n.title ? `<p class="title">${esc(n.title)}</p>` : ""}
        <ul>${lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>
      </div>`;
    }).join("");
  } catch (e) {
    box.innerHTML = '<p class="note">お知らせを読めませんでした。</p>';
  }
}

loadVersion();
loadNews();
