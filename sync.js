"use strict";
/* ============ Đồng bộ qua mạng (Supabase) ============
   Sổ vẫn nằm trên máy như cũ để mở nhanh và dùng được khi mất mạng.
   Khi đã đăng nhập, mỗi thay đổi được gửi lên mạng, và sổ được kéo về khi mở app, khi quay lại app, và mỗi phút. */
const SYNC_CFG = {
  url: 'https://bluwnjfdqfsvivqzhbqo.supabase.co',   // Project URL của Supabase, ví dụ https://xxxx.supabase.co
  key: 'sb_publishable_Yhnimkd_9KGxxKbihJEI-A_Dx5uYqr9'    // khóa anon / publishable (được phép nằm trong app; quyền đọc ghi do chính sách của bảng quyết định)
};
const TalentaSync = (() => {
  const META_KEY = 'talenta-sync', BACKUP_KEY = 'talenta-ban-truoc-dong-bo';
  let sb = null, user = null, busy = false, pushT = null, status = 'off', lastErr = '';
  let meta = {}; try { meta = JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch (_) {}
  const saveMeta = () => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (_) {} };
  const pending = () => (S.updatedAt || 0) > (meta.lastSynced || 0);
  const btn = () => document.getElementById('syncBtn');
  const when = t => t ? new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'chưa lần nào';

  function paint(s) {
    if (s) status = s;
    const b = btn(); if (!b) return;
    if (!sb) { b.hidden = true; return; }
    b.hidden = false;
    const map = {
      out: ['Đồng bộ', ''],
      ok: ['Đã đồng bộ', 'ok'],
      busy: ['Đang gửi…', ''],
      wait: ['Chờ gửi', 'warn'],
      fail: ['Lỗi đồng bộ', 'bad']
    };
    const [txt, cls] = map[user ? status : 'out'] || map.out;
    b.innerHTML = `<svg class="sync-ic ${cls}" width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18.5h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.2 9.6 4.5 4.5 0 0 0 7 18.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span class="hide-sm">${txt}</span>`;
    b.title = user ? `${user.email} · lần đồng bộ gần nhất: ${when(meta.lastSynced)}${lastErr ? ' · ' + lastErr : ''}` : 'Đăng nhập để dùng chung sổ trên máy tính và điện thoại';
    b.setAttribute('aria-label', txt);
  }

  function loadLib() {
    return new Promise((ok, no) => {
      if (window.supabase) return ok();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.js';
      s.onload = ok; s.onerror = () => no(new Error('Không tải được thư viện đồng bộ'));
      document.head.appendChild(s);
    });
  }

  async function init() {
    if (!SYNC_CFG.url || !SYNC_CFG.key) return paint();
    try { await loadLib(); } catch (e) { console.warn('Talenta sync', e); lastErr = 'mất mạng'; return; }
    sb = window.supabase.createClient(SYNC_CFG.url, SYNC_CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'talenta-auth' } });
    const { data } = await sb.auth.getSession();
    user = data.session ? data.session.user : null;
    sb.auth.onAuthStateChange((_ev, session) => { user = session ? session.user : null; paint(); });
    paint(pending() ? 'wait' : 'ok');
    if (user) pull();
    setInterval(pull, 60000);
    addEventListener('focus', pull);
    addEventListener('online', pull);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
  }

  function adopt(data, t) {
    S = data; S.updatedAt = t;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {}
    meta.lastSynced = t; saveMeta();
    const y = scrollY; try { route(); scrollTo(0, y); } catch (e) { console.warn('Talenta: lỗi vẽ lại trang', e); }
  }

  async function push() {
    if (!user) return;
    const t = S.updatedAt || Date.now();
    paint('busy');
    const { error } = await sb.from('notebooks').upsert({ user_id: user.id, data: S, updated_at: new Date(t).toISOString() });
    if (error) { lastErr = error.message; return paint('fail'); }
    lastErr = ''; meta.lastSynced = t; meta.user = user.id; saveMeta();
    paint(pending() ? 'wait' : 'ok');
  }

  async function pull(force) {
    if (!user || busy) return;
    if (dlg.open && !force) return; // đang nhập dở thì không thay sổ dưới tay người dùng
    busy = true; paint('busy');
    try {
      const { data: row, error } = await sb.from('notebooks').select('data,updated_at').eq('user_id', user.id).maybeSingle();
      if (error) { lastErr = error.message; return paint('fail'); }
      lastErr = '';
      if (meta.user !== user.id) {               // lần đầu đăng nhập trên máy này
        if (!row) return await push();
        return askFirst(row);
      }
      if (!row) return await push();
      const rt = Date.parse(row.updated_at);
      if (rt > (meta.lastSynced || 0)) {
        if (pending() && (S.updatedAt || 0) > rt) return await push();   // cả hai cùng sửa: bản mới hơn thắng
        if (pending()) { try { localStorage.setItem(BACKUP_KEY, JSON.stringify(S)); } catch (_) {} }
        adopt(row.data, rt); toast('Đã cập nhật sổ từ máy khác');
        return paint('ok');
      }
      if (pending()) return await push();
      paint('ok');
    } catch (e) { console.warn('Talenta sync', e); lastErr = 'mất mạng'; paint(pending() ? 'wait' : 'fail'); }
    finally { busy = false; }
  }

  function askFirst(row) {
    const d = row.data || {};
    const cnt = o => `${(o.tx || []).length} giao dịch, ${(o.journal || []).length} dòng nhật ký`;
    pendingRow = row;
    open('sync', `<p style="margin:0">Tài khoản này đã có một cuốn sổ trên mạng. Bạn muốn dùng cuốn nào trên máy này?</p>
      <div class="chips" style="flex-direction:column;align-items:stretch">
        <button type="button" class="btn primary" data-act="sync-take-remote">Dùng sổ trên mạng (${cnt(d)}, sửa lúc ${when(Date.parse(row.updated_at))})</button>
        <button type="button" class="btn" data-act="sync-keep-local">Dùng sổ trên máy này (${cnt(S)}) và ghi đè sổ trên mạng</button>
      </div>
      <p class="muted" style="margin:0;font-size:12.5px">Cuốn không chọn được cất lại một bản trên máy này để phòng khi cần.</p>`, 'Chọn cuốn sổ');
    paint('wait');
  }
  let pendingRow = null;

  function openDialog() {
    if (!sb) return toast('Phần đồng bộ chưa được bật');
    if (!user) {
      open('sync', `<p class="muted" style="margin:0">Đăng nhập để dùng chung một cuốn sổ trên máy tính và điện thoại. Lần đầu dùng, hãy bấm <b>Tạo tài khoản</b> rồi mở email để xác nhận.</p>
        ${fld('s_email', 'Email', '<input type="email" id="s_email" autocomplete="username" required>')}
        ${fld('s_pass', 'Mật khẩu (ít nhất 8 ký tự)', '<input type="password" id="s_pass" autocomplete="current-password" minlength="8" required>')}
        <div class="err" id="s_err" hidden></div>
        <div class="chips"><button class="btn primary" type="submit">Đăng nhập</button><button type="button" class="btn" data-act="sync-signup">Tạo tài khoản</button><button type="button" class="btn ghost" data-act="sync-forgot">Quên mật khẩu</button></div>`, 'Đồng bộ sổ');
      setTimeout(() => { const e = document.getElementById('s_email'); if (e) e.focus(); }, 30);
    } else {
      open('sync', `<p style="margin:0">Đang đăng nhập: <b>${esc(user.email)}</b></p>
        <p class="muted" style="margin:0">Lần đồng bộ gần nhất: ${when(meta.lastSynced)}.${pending() ? ' Có thay đổi trên máy này chưa gửi lên mạng.' : ''}${lastErr ? ' Lỗi gần nhất: ' + esc(lastErr) : ''}</p>
        <p class="muted" style="margin:0;font-size:12.5px">Mỗi thay đổi được gửi lên mạng sau vài giây. Khi mất mạng, sổ vẫn dùng bình thường và sẽ gửi khi có mạng lại.</p>
        <div class="chips"><button type="button" class="btn primary" data-act="sync-now">Đồng bộ ngay</button><button type="button" class="btn danger" data-act="sync-out">Đăng xuất</button></div>`, 'Đồng bộ sổ');
    }
  }
  const sErr = m => { const e = document.getElementById('s_err'); if (e) { e.textContent = m; e.hidden = !m; } };
  const viErr = m => /Invalid login/i.test(m) ? 'Email hoặc mật khẩu chưa đúng.' : /not confirmed/i.test(m) ? 'Email chưa được xác nhận. Hãy mở thư Supabase gửi tới và bấm vào đường dẫn xác nhận.' : /already registered/i.test(m) ? 'Email này đã có tài khoản. Hãy bấm Đăng nhập.' : /Password/i.test(m) ? 'Mật khẩu cần ít nhất 8 ký tự.' : m;

  async function submit() {
    const email = val('s_email'), pass = val('s_pass');
    if (!email || !pass) return sErr('Nhập email và mật khẩu.');
    sErr('');
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) return sErr(viErr(error.message));
    user = data.user; dlg.close(); toast('Đã đăng nhập'); pull(true);
  }

  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'sync') openDialog();
    else if (a === 'sync-signup') {
      const email = val('s_email'), pass = val('s_pass');
      if (!email || pass.length < 8) return sErr('Nhập email và mật khẩu ít nhất 8 ký tự.');
      const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: location.origin + location.pathname } });
      if (error) return sErr(viErr(error.message));
      if (data.session) { user = data.user; dlg.close(); toast('Đã tạo tài khoản'); pull(true); }
      else sErr('Đã tạo tài khoản. Hãy mở email, bấm đường dẫn xác nhận, rồi quay lại đây bấm Đăng nhập.');
    }
    else if (a === 'sync-forgot') {
      const email = val('s_email'); if (!email) return sErr('Nhập email trước.');
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      sErr(error ? viErr(error.message) : 'Đã gửi email đặt lại mật khẩu.');
    }
    else if (a === 'sync-now') { dlg.close(); await pull(true); if (status === 'ok') toast('Đã đồng bộ'); }
    else if (a === 'sync-out') { await sb.auth.signOut(); user = null; delete meta.user; saveMeta(); dlg.close(); paint(); toast('Đã đăng xuất. Sổ vẫn còn trên máy này.'); }
    else if (a === 'sync-take-remote' && pendingRow) {
      try { localStorage.setItem(BACKUP_KEY, JSON.stringify(S)); } catch (_) {}
      meta.user = user.id; const r = pendingRow; pendingRow = null; dlg.close();
      adopt(r.data, Date.parse(r.updated_at)); paint('ok'); toast('Đang dùng sổ trên mạng');
    }
    else if (a === 'sync-keep-local' && pendingRow) {
      try { localStorage.setItem(BACKUP_KEY, JSON.stringify(pendingRow.data)); } catch (_) {}
      pendingRow = null; meta.user = user.id; S.updatedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {}
      dlg.close(); await push(); toast('Đã gửi sổ trên máy này lên mạng');
    }
  });

  function changed() {
    if (!user) return;
    paint('wait');
    clearTimeout(pushT); pushT = setTimeout(push, 1500);
  }

  return { init, changed, submit, pull };
})();
if (window.TALENTA_DATA) TalentaSync.init();
