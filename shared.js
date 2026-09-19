/* =====================================================
   MEDICARE — SHARED HEADER + FOOTER + AUTH + POPUP
   - Sticky header AND sticky footer
   - Patient + staff sessions coexist (separate keys)
   - Forced auth popup on index.html
   - Admin pages are protected (staff session required)
   Just include:  <script src="shared.js"></script>
===================================================== */
(function () {
  'use strict';

  /* =====================================================
     SECTION 0 — VIEWPORT META SAFEGUARD
  ===================================================== */
  (function ensureViewport() {
    let vp = document.querySelector('meta[name="viewport"]');
    if (!vp) {
      vp = document.createElement('meta');
      vp.setAttribute('name', 'viewport');
      document.head.appendChild(vp);
    }
    const content = vp.getAttribute('content') || '';
    if (!/width\s*=\s*device-width/i.test(content)) {
      vp.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    }
  })();

  /* =====================================================
     SECTION A — PATIENT AUTH
  ===================================================== */
  const UserAuth = (function () {
    const DB_KEY = 'medicare_users';
    const SESSION_KEY = 'medicare_user_session';
    const BOOKINGS_KEY = 'medicare_user_bookings';
    const SALT = 'medicare::user::v1';

    const loadUsers = () => {
      try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
      catch (e) { return []; }
    };
    const saveUsers = list => localStorage.setItem(DB_KEY, JSON.stringify(list));

    async function hash(password) {
      const input = SALT + '|' + password;
      if (window.crypto && window.crypto.subtle && window.isSecureContext) {
        try {
          const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
          return 'sha256:' + Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {}
      }
      let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
      for (let i = 0; i < input.length; i++) {
        const ch = input.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return 'fnv:' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
    }

    const publicUser = u => ({
      id: u.id, name: u.name, email: u.email, phone: u.phone,
      initials: u.initials, createdAt: u.createdAt
    });

    return {
      validateEmail: e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e),
      validatePassword: p => {
        if (!p || p.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Za-z]/.test(p)) return 'Password must contain a letter.';
        if (!/\d/.test(p)) return 'Password must contain a number.';
        return null;
      },
      async signup({ name, email, phone, password }) {
        const users = loadUsers();
        const emailLower = email.trim().toLowerCase();
        if (users.some(u => u.email === emailLower)) {
          return { ok: false, error: 'An account with this email already exists.' };
        }
        const passwordHash = await hash(password);
        const initials = (name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2) || 'U').toUpperCase();
        const user = {
          id: 'U-' + Date.now().toString(36).toUpperCase(),
          name: name.trim(),
          email: emailLower,
          phone: phone.trim(),
          passwordHash,
          initials,
          createdAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        return { ok: true, user: publicUser(user) };
      },
      async login(email, password) {
        const users = loadUsers();
        const user = users.find(u => u.email === String(email).trim().toLowerCase());
        if (!user) return { ok: false, error: 'No account found with this email.' };
        if ((await hash(password)) !== user.passwordHash) {
          return { ok: false, error: 'Incorrect password.' };
        }
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, t: Date.now() }));
        return { ok: true, user: publicUser(user) };
      },
      logout() { sessionStorage.removeItem(SESSION_KEY); },
      current() {
        try {
          const raw = sessionStorage.getItem(SESSION_KEY);
          if (!raw) return null;
          const s = JSON.parse(raw);
          const user = loadUsers().find(u => u.id === s.id);
          return user ? publicUser(user) : null;
        } catch (e) { return null; }
      },
      isLoggedIn() { return !!this.current(); },
      async changePassword(current, next) {
        const me = this.current();
        if (!me) return { ok: false, error: 'Not signed in.' };
        const users = loadUsers();
        const idx = users.findIndex(u => u.id === me.id);
        if ((await hash(current)) !== users[idx].passwordHash) {
          return { ok: false, error: 'Current password is incorrect.' };
        }
        users[idx].passwordHash = await hash(next);
        saveUsers(users);
        return { ok: true };
      },
      updateProfile({ name, phone }) {
        const me = this.current();
        if (!me) return { ok: false, error: 'Not signed in.' };
        const users = loadUsers();
        const idx = users.findIndex(u => u.id === me.id);
        users[idx].name = name.trim();
        users[idx].phone = phone.trim();
        users[idx].initials = (name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2) || 'U').toUpperCase();
        saveUsers(users);
        return { ok: true, user: publicUser(users[idx]) };
      },
      getBookings() {
        const me = this.current();
        if (!me) return [];
        try {
          const all = JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
          return all.filter(b => b.userId === me.id);
        } catch (e) { return []; }
      },
      addBooking(data) {
        const me = this.current();
        if (!me) return null;
        const all = JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
        const entry = {
          ...data,
          id: 'BK-' + Date.now().toString(36).toUpperCase(),
          userId: me.id,
          userName: me.name,
          userEmail: me.email,
          createdAt: new Date().toISOString(),
          status: 'Pending'
        };
        all.push(entry);
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
        return entry;
      },
      cancelBooking(id) {
        const me = this.current();
        if (!me) return;
        const all = JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
        const idx = all.findIndex(b => b.id === id && b.userId === me.id);
        if (idx >= 0) {
          all[idx].status = 'Cancelled';
          localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
        }
      }
    };
  })();

  window.UserAuth = UserAuth;

  /* =====================================================
     SECTION B — STAFF (ADMIN) SESSION HELPER
  ===================================================== */
  const StaffAuth = {
    SESSION_KEY: 'medicare_session',
    DB_KEY: 'medicare_hms',
    isLoggedIn() {
      try {
        const raw = sessionStorage.getItem(this.SESSION_KEY);
        if (!raw) return false;
        const s = JSON.parse(raw);
        const db = JSON.parse(localStorage.getItem(this.DB_KEY) || '{}');
        return !!(s && db.user && db.user.username && s.u === db.user.username);
      } catch (e) { return false; }
    },
    current() {
      try {
        const db = JSON.parse(localStorage.getItem(this.DB_KEY) || '{}');
        return db.user || null;
      } catch (e) { return null; }
    },
    logout() { sessionStorage.removeItem(this.SESSION_KEY); }
  };

  window.StaffAuth = StaffAuth;

  /* =====================================================
     SECTION C — PAGE INFO + ADMIN GUARD
  ===================================================== */
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const ADMIN_PAGES = ['dashboard.html', '1.html'];
  const isHome = (path === 'index.html' || path === '');

  if (ADMIN_PAGES.indexOf(path) !== -1) {
    if (!StaffAuth.isLoggedIn()) {
      location.replace('admin-login.html');
    }
    return;
  }

  /* =====================================================
     SECTION D — INJECT SHARED CSS
  ===================================================== */
  if (!document.querySelector('style[data-shared-css]')) {
    const css = document.createElement('style');
    css.setAttribute('data-shared-css', 'true');
    css.textContent = `
      /* ============================================================
         GLOBAL RESET
      ============================================================ */
      *, *::before, *::after { box-sizing: border-box; }

      /* ============================================================
         STICKY LAYOUT  (sticky-safe: uses \`clip\`, not \`hidden\`)
      ============================================================ */
      html {
        height: 100%;
        max-width: 100%;
        overflow-x: clip;
      }

      body {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        min-height: 100dvh;
        margin: 0;
        max-width: 100%;
        overflow-x: clip;
      }

      body > *:not(#site-footer) { flex-shrink: 0; }

      #site-header {
        position: sticky;
        top: 0;
        z-index: 100;
        width: 100%;
        max-width: 100%;
        flex-shrink: 0;
      }

      #site-footer {
        margin-top: auto;
        flex-shrink: 0;
        width: 100%;
        max-width: 100%;
      }

      /* ============================================================
         DESKTOP (default)
      ============================================================ */

      /* ===== NAVBAR ===== */
      .navbar {
        background: #fff;
        box-shadow: 0 2px 16px rgba(0,30,45,0.06);
        position: relative;
        width: 100%;
        max-width: 100%;
      }
      .navbar-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 16px 28px;
        gap: 20px;
      }

      /* Logo */
      .nav-logo { display: flex; align-items: center; gap: 12px; flex-shrink: 0; min-width: 0; text-decoration: none; }
      .nav-logo .logo-icon {
        background: var(--primary, #0d6e9e); color: #fff;
        width: 46px; height: 46px; border-radius: 13px;
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; flex-shrink: 0;
        box-shadow: 0 8px 16px -4px rgba(13,110,158,0.3);
      }
      .nav-logo h1 { font-size: 20px; font-weight: 800; color: var(--dark, #0b3b4b); line-height: 1; margin: 0; }
      .nav-logo p  { font-size: 11px; color: var(--gray, #5e7e8c); font-weight: 500; margin: 3px 0 0; }

      /* Desktop nav links */
      .nav-links { display: flex; align-items: center; gap: 6px; list-style: none; margin: 0 auto; padding: 0; }
      .nav-links a {
        padding: 12px 20px;
        border-radius: 11px;
        font-size: 14.5px;
        font-weight: 600;
        color: var(--gray, #5e7e8c);
        text-decoration: none;
        transition: all 0.15s;
        display: inline-block;
      }
      .nav-links a:hover, .nav-links a.active { background: var(--primary-light, #e1f0f8); color: var(--primary, #0d6e9e); }

      .nav-cta { display: flex; gap: 12px; align-items: center; flex-shrink: 0; }

      /* ===== STAFF CHIP + DROPDOWN ===== */
      .nav-staff { position: relative; }
      .nav-staff-chip {
        display: inline-flex; align-items: center; gap: 9px;
        padding: 11px 16px;
        border-radius: 40px;
        background: #fff0e0; color: #c96f1e;
        font-size: 12.5px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.4px;
        cursor: pointer; user-select: none; transition: all 0.15s;
        white-space: nowrap;
        min-height: 48px;
      }
      .nav-staff-chip:hover { background: #ffe4c8; }
      .nav-staff-chip .dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #c96f1e; box-shadow: 0 0 0 3px rgba(201,111,30,0.2);
      }
      .nav-staff-chip .chev { font-size: 10px; margin-left: 3px; opacity: 0.75; }
      .nav-staff-menu {
        position: absolute; top: calc(100% + 10px); right: 0;
        min-width: 230px; background: #fff; border-radius: 16px;
        padding: 8px; border: 1px solid var(--border, #e6f0f5);
        box-shadow: 0 20px 50px -12px rgba(0,80,110,0.2);
        opacity: 0; visibility: hidden; transform: translateY(-6px);
        transition: all 0.18s; z-index: 200;
      }
      .nav-staff-menu.open { opacity: 1; visibility: visible; transform: translateY(0); }
      .nav-staff-menu a {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 15px;
        border-radius: 10px;
        font-size: 14px; font-weight: 500;
        color: var(--dark, #0b3b4b); cursor: pointer; text-decoration: none;
      }
      .nav-staff-menu a i { width: 16px; text-align: center; font-size: 13px; color: var(--gray, #5e7e8c); }
      .nav-staff-menu a:hover { background: #fff5e8; color: #c96f1e; }
      .nav-staff-menu a:hover i { color: #c96f1e; }
      .nav-staff-menu a.danger:hover { background: #fdecef; color: var(--danger, #e84a5f); }
      .nav-staff-menu a.danger:hover i { color: var(--danger, #e84a5f); }
      .nav-staff-menu hr { border: 0; border-top: 1px solid var(--border, #e6f0f5); margin: 6px 4px; }

      /* ===== USER CHIP ===== */
      .nav-user { position: relative; }
      .nav-user-chip {
        display: flex; align-items: center; gap: 10px;
        background: #fff; border: 1.5px solid var(--border, #e6f0f5);
        border-radius: 40px; padding: 5px 16px 5px 5px;
        cursor: pointer; transition: all 0.18s; user-select: none;
        min-height: 48px;
      }
      .nav-user-chip:hover { border-color: var(--primary, #0d6e9e); background: #f9fcfd; }
      .nav-user-avatar {
        width: 38px; height: 38px; border-radius: 50%;
        background: linear-gradient(135deg, #0d6e9e, #0e8b5e); color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 13.5px; flex-shrink: 0;
      }
      .nav-user-name { font-size: 14px; font-weight: 600; color: var(--dark, #0b3b4b); line-height: 1.1; }
      .nav-user-role { font-size: 11px; color: var(--gray, #5e7e8c); margin-top: 1px; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 500; }
      .nav-user-chip .chev { font-size: 11px; color: var(--gray, #5e7e8c); }
      .nav-user-menu {
        position: absolute; top: calc(100% + 10px); right: 0;
        min-width: 240px; background: #fff; border-radius: 16px;
        padding: 8px; border: 1px solid var(--border, #e6f0f5);
        box-shadow: 0 20px 50px -12px rgba(0,80,110,0.2);
        opacity: 0; visibility: hidden; transform: translateY(-6px);
        transition: all 0.18s; z-index: 200;
      }
      .nav-user-menu.open { opacity: 1; visibility: visible; transform: translateY(0); }
      .nav-user-menu a {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 15px;
        border-radius: 10px;
        font-size: 14px; font-weight: 500;
        color: var(--dark, #0b3b4b); cursor: pointer; text-decoration: none;
      }
      .nav-user-menu a i { width: 16px; text-align: center; font-size: 13px; color: var(--gray, #5e7e8c); }
      .nav-user-menu a:hover { background: var(--primary-light, #e1f0f8); color: var(--primary, #0d6e9e); }
      .nav-user-menu a:hover i { color: var(--primary, #0d6e9e); }
      .nav-user-menu a.staff-link:hover { background: #fff5e8; color: #c96f1e; }
      .nav-user-menu a.staff-link:hover i { color: #c96f1e; }
      .nav-user-menu a.danger:hover { background: #fdecef; color: var(--danger, #e84a5f); }
      .nav-user-menu a.danger:hover i { color: var(--danger, #e84a5f); }
      .nav-user-menu hr { border: 0; border-top: 1px solid var(--border, #e6f0f5); margin: 6px 4px; }

      /* ===== BUTTONS (desktop) ===== */
      .btn {
        padding: 13px 26px;
        border-radius: 12px; border: none;
        font-family: inherit; font-size: 15px; font-weight: 600;
        cursor: pointer; transition: all 0.2s;
        display: inline-flex; align-items: center; justify-content: center;
        gap: 9px; text-decoration: none; white-space: nowrap;
        min-height: 48px;
      }
      .btn-primary { background: var(--primary, #0d6e9e); color: #fff; box-shadow: 0 8px 16px -4px rgba(13,110,158,0.3); }
      .btn-primary:hover { background: var(--primary-dark, #0a5578); transform: translateY(-1px); }
      .btn-outline { background: #fff; color: var(--primary, #0d6e9e); border: 1.5px solid var(--border, #e6f0f5); }
      .btn-outline:hover { background: var(--primary-light, #e1f0f8); border-color: var(--primary, #0d6e9e); }
      .btn-white { background: #fff; color: var(--primary, #0d6e9e); }
      .btn-white:hover { background: #f0f7fb; transform: translateY(-1px); }
      .btn-lg { padding: 16px 32px; font-size: 16px; border-radius: 14px; min-height: 54px; }

      /* ===== FOOTER (desktop) ===== */
      .footer { background: #0b3b4b; color: #c5d8e2; padding: 50px 0 22px; }
      .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.4fr; gap: 36px; margin-bottom: 32px; }
      .footer-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      .footer-brand .logo-icon {
        background: var(--primary, #0d6e9e); color: #fff;
        width: 40px; height: 40px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center; font-size: 20px;
      }
      .footer-brand h1 { font-size: 17px; color: #fff; font-weight: 800; margin: 0; }
      .footer-brand p  { font-size: 10.5px; opacity: 0.7; margin: 2px 0 0; }
      .footer-col p { font-size: 13.5px; line-height: 1.7; opacity: 0.8; }
      .footer-col h4 { color: #fff; font-size: 14.5px; font-weight: 700; margin: 0 0 14px; }
      .footer-links { list-style: none; padding: 0; margin: 0; }
      .footer-links li { margin-bottom: 8px; }
      .footer-links a { font-size: 13.5px; opacity: 0.75; transition: all 0.15s; color: inherit; text-decoration: none; }
      .footer-links a:hover { opacity: 1; color: #7dd3fc; padding-left: 4px; }
      .footer-contact-item { display: flex; gap: 12px; margin-bottom: 12px; font-size: 13.5px; opacity: 0.85; }
      .footer-contact-item i { color: #7dd3fc; margin-top: 3px; width: 16px; }
      .footer-bottom {
        border-top: 1px solid rgba(255,255,255,0.1); padding-top: 18px;
        display: flex; justify-content: space-between; align-items: center;
        flex-wrap: wrap; gap: 14px; font-size: 13px; opacity: 0.7;
      }
      .footer-bottom p { margin: 0; }
      .footer-socials { display: flex; gap: 12px; }
      .footer-socials a {
        width: 36px; height: 36px; border-radius: 10px;
        background: rgba(255,255,255,0.08); color: inherit; text-decoration: none;
        display: flex; align-items: center; justify-content: center; transition: all 0.15s;
      }
      .footer-socials a:hover { background: var(--primary, #0d6e9e); color: #fff; transform: translateY(-2px); }

      /* ===== AUTH POPUP ===== */
      .auth-popup-overlay {
        position: fixed; inset: 0;
        background: rgba(11, 59, 75, 0.65);
        -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
        display: flex; align-items: flex-start; justify-content: center;
        z-index: 9998; padding: 24px;
        opacity: 0; visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s;
        overflow-y: auto;
      }
      .auth-popup-overlay.show { opacity: 1; visibility: visible; }
      .auth-popup {
        background: #fff; border-radius: 22px;
        width: 100%; max-width: 440px;
        box-shadow: 0 40px 80px -20px rgba(0,0,0,0.5);
        position: relative;
        transform: translateY(20px) scale(0.97);
        transition: transform 0.35s cubic-bezier(.2,.9,.3,1.2);
        overflow: hidden; margin: auto;
      }
      .auth-popup-overlay.show .auth-popup { transform: translateY(0) scale(1); }
      .auth-popup-close {
        position: absolute; top: 14px; right: 14px;
        width: 34px; height: 34px; border-radius: 10px;
        border: none; background: rgba(0,0,0,0.04);
        color: #5e7e8c; cursor: pointer; font-size: 15px;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.15s; z-index: 10;
      }
      .auth-popup-close:hover { background: #fdecef; color: #e84a5f; }
      .auth-popup-hero {
        background: linear-gradient(135deg, #0d6e9e 0%, #0b3b4b 100%);
        padding: 26px 26px 22px; text-align: center; color: #fff;
        position: relative; overflow: hidden;
      }
      .auth-popup-hero::before { content: ''; position: absolute; width: 240px; height: 240px; background: rgba(255,255,255,0.08); border-radius: 50%; top: -100px; right: -80px; }
      .auth-popup-hero::after  { content: ''; position: absolute; width: 170px; height: 170px; background: rgba(255,255,255,0.05); border-radius: 50%; bottom: -80px; left: -60px; }
      .auth-popup-logo {
        width: 52px; height: 52px; border-radius: 14px;
        background: rgba(255,255,255,0.15);
        border: 1.5px solid rgba(255,255,255,0.2);
        color: #fff; display: flex; align-items: center; justify-content: center;
        font-size: 24px; margin: 0 auto 12px;
        position: relative; z-index: 2;
      }
      .auth-popup-hero h2 { font-size: 21px; font-weight: 800; margin: 0 0 5px; letter-spacing: -0.4px; position: relative; z-index: 2; }
      .auth-popup-hero p  { font-size: 13.5px; opacity: 0.85; max-width: 320px; margin: 0 auto; position: relative; z-index: 2; }
      .auth-popup-tabs { display: flex; padding: 18px 26px 0; gap: 4px; background: #fff; border-bottom: 1px solid #e6f0f5; position: relative; }
      .auth-popup-tab {
        flex: 1; padding: 11px 8px; text-align: center;
        font-family: inherit; font-size: 14px; font-weight: 700;
        color: #5e7e8c; background: transparent; border: none;
        cursor: pointer; position: relative; transition: color 0.15s;
        border-radius: 10px 10px 0 0;
      }
      .auth-popup-tab:hover { color: #0d6e9e; }
      .auth-popup-tab.active { color: #0d6e9e; }
      .auth-popup-tab.active::after {
        content: ''; position: absolute;
        left: 12px; right: 12px; bottom: -1px; height: 3px;
        background: #0d6e9e; border-radius: 3px 3px 0 0;
      }
      .auth-popup-body { padding: 22px 26px 24px; }
      .auth-popup-pane { display: none; }
      .auth-popup-pane.active { display: block; animation: popupFade 0.25s ease; }
      @keyframes popupFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .auth-popup .form-group { margin-bottom: 13px; }
      .auth-popup .form-group label { display: block; font-size: 12px; font-weight: 700; color: #0b3b4b; margin-bottom: 5px; }
      .auth-popup .form-group input {
        width: 100%; padding: 11px 13px;
        border: 1.5px solid #e6f0f5; border-radius: 11px;
        font-family: inherit; font-size: 14px; color: #0b3b4b;
        background: #f9fcfd; outline: none; transition: all 0.15s;
      }
      .auth-popup .form-group input:focus { border-color: #0d6e9e; background: #fff; box-shadow: 0 0 0 4px rgba(13,110,158,0.08); }
      .auth-popup .form-group.error label { color: #e84a5f; }
      .auth-popup .form-group.error input { border-color: #e84a5f; background: #fff7f8; }
      .auth-popup .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .auth-popup .pass-wrap { position: relative; }
      .auth-popup .pass-wrap input { padding-right: 44px; }
      .auth-popup .pass-toggle {
        position: absolute; right: 5px; top: 50%; transform: translateY(-50%);
        width: 32px; height: 32px; border: none; background: transparent;
        color: #5e7e8c; cursor: pointer; border-radius: 9px;
        font-size: 13px; display: flex; align-items: center; justify-content: center;
      }
      .auth-popup .pass-toggle:hover { background: #e1f0f8; color: #0d6e9e; }
      .auth-popup .alert {
        display: none; align-items: flex-start; gap: 9px;
        padding: 10px 13px; border-radius: 11px;
        font-size: 13px; font-weight: 500; margin-bottom: 13px;
        background: #fdecef; color: #e84a5f;
      }
      .auth-popup .alert.show { display: flex; }
      .auth-popup .alert i { margin-top: 2px; }
      .auth-popup .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 22px; border-radius: 11px; border: none; font-family: inherit; font-size: 14.5px; font-weight: 700; cursor: pointer; text-decoration: none; transition: all 0.2s; min-height: 46px; }
      .auth-popup .btn-primary { width: 100%; background: #0d6e9e; color: #fff; box-shadow: 0 8px 16px -4px rgba(13,110,158,0.4); }
      .auth-popup .btn-primary:hover { background: #0a5578; transform: translateY(-1px); }
      .auth-popup .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      .auth-popup .terms { display: flex; align-items: flex-start; gap: 9px; margin: 11px 0 14px; font-size: 12.5px; color: #5e7e8c; line-height: 1.5; }
      .auth-popup .terms input { width: auto; margin-top: 3px; accent-color: #0d6e9e; }
      .auth-popup .strength { height: 5px; border-radius: 5px; background: #e6f0f5; margin-top: 7px; overflow: hidden; }
      .auth-popup .strength-fill { height: 100%; width: 0; transition: width 0.25s, background 0.25s; }
      .auth-popup .strength-text { font-size: 11.5px; font-weight: 600; margin-top: 5px; color: #5e7e8c; }
      .auth-popup-foot { text-align: center; font-size: 12.5px; color: #5e7e8c; margin-top: 13px; padding-top: 13px; border-top: 1px solid #e6f0f5; }
      .auth-popup-foot a { color: #0d6e9e; font-weight: 600; cursor: pointer; }
      .auth-popup-foot a:hover { text-decoration: underline; }

      /* ============================================================
         BASE HELPERS FOR MOBILE NAV
      ============================================================ */
      .nav-toggle { display: none; }
      .nav-collapse {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        min-width: 0;
      }

      /* ================= TABLET (≤1024px) ================= */
      @media (max-width: 1024px) {
        .footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
        .footer { padding: 40px 0 18px; }

        .nav-user-name, .nav-user-role { display: none; }
        .nav-user-chip { padding: 5px; gap: 0; min-height: 0; }
        .nav-user-chip .chev { display: none; }
      }

      /* ================= MOBILE NAV (≤960px) — comfortable ================= */
      @media (max-width: 960px) {
        .navbar-inner { padding: 12px 16px; gap: 10px; }
        .nav-logo { min-width: 0; gap: 8px; }
        .nav-logo .logo-icon { width: 36px; height: 36px; font-size: 16px; border-radius: 10px; }
        .nav-logo h1 { font-size: 16px; }
        .nav-logo p  { font-size: 9.5px; margin-top: 1px; }

        .nav-toggle {
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; flex-shrink: 0;
          border: 1.5px solid var(--border, #e6f0f5);
          background: #fff; color: var(--dark, #0b3b4b);
          border-radius: 10px; font-size: 16px; cursor: pointer;
          transition: all 0.15s;
        }
        .nav-toggle:hover,
        .nav-toggle.open {
          background: var(--primary-light, #e1f0f8);
          color: var(--primary, #0d6e9e);
          border-color: var(--primary, #0d6e9e);
        }

        .nav-collapse {
          position: absolute;
          top: 100%; left: 0; right: 0;
          display: none;
          flex-direction: column;
          align-items: stretch;
          gap: 0;
          background: #fff;
          padding: 12px 14px 16px;
          border-top: 1px solid var(--border, #e6f0f5);
          box-shadow: 0 20px 36px -18px rgba(0,60,90,0.28);
          max-height: calc(100vh - 60px);
          max-height: calc(100dvh - 60px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          z-index: 150;
        }
        .nav-collapse.open { display: flex; animation: navDrop 0.2s ease; }
        @keyframes navDrop {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nav-links {
          flex-direction: column;
          align-items: stretch;
          gap: 0;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        .nav-links li { margin: 0; }
        .nav-links a {
          display: block;
          padding: 13px 14px;
          font-size: 15px;
          border-radius: 10px;
        }

        .nav-cta {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
          width: 100%;
          margin-top: 10px;
          padding-top: 12px;
          border-top: 1px solid var(--border, #e6f0f5);
        }
        .nav-cta > .btn {
          width: 100%;
          padding: 13px 16px;
          font-size: 14.5px;
          border-radius: 10px;
          min-height: 48px;
        }

        .nav-staff, .nav-user { position: relative; width: 100%; }
        .nav-staff-chip,
        .nav-user-chip {
          width: 100%;
          justify-content: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          min-height: 48px;
        }
        .nav-user-avatar { width: 32px; height: 32px; font-size: 12px; }
        .nav-user-name { font-size: 14px; }
        .nav-user-role { font-size: 10px; }
        .nav-user-name, .nav-user-role { display: block; }
        .nav-user-chip .chev,
        .nav-staff-chip .chev { display: inline-block; margin-left: auto; font-size: 11px; opacity: 0.7; }

        .nav-staff-menu,
        .nav-user-menu {
          position: static;
          opacity: 1; visibility: visible; transform: none; transition: none;
          min-width: 0; width: 100%;
          margin-top: 6px; padding: 6px;
          border: none; border-radius: 10px;
          background: #f7fbfd; box-shadow: none;
          display: none;
        }
        .nav-staff-menu.open,
        .nav-user-menu.open { display: block; }

        .nav-staff-menu a,
        .nav-user-menu a {
          padding: 11px 14px;
          font-size: 14px;
          gap: 10px;
          border-radius: 9px;
        }
        .nav-staff-menu a i,
        .nav-user-menu a i { font-size: 13px; width: 15px; }
      }

      /* ================= PHONES (≤768px) ================= */
      @media (max-width: 768px) {
        .footer { padding: 28px 0 16px; }
        .footer-grid { grid-template-columns: 1fr; gap: 20px; margin-bottom: 22px; }
        .footer-bottom { flex-direction: column; text-align: center; gap: 10px; }
      }

      /* ================= SMALL PHONES (≤520px) ================= */
      @media (max-width: 520px) {
        .navbar-inner { padding: 10px 14px; gap: 8px; }
        .nav-toggle { width: 38px; height: 38px; font-size: 15px; border-radius: 10px; }
        .nav-logo .logo-icon { width: 34px; height: 34px; font-size: 15px; border-radius: 10px; }
        .nav-logo h1 { font-size: 15px; }
        .nav-logo p  { font-size: 9px; }

        .nav-collapse { padding: 10px 12px 14px; }

        .nav-links a { padding: 12px 12px; font-size: 14.5px; }
        .nav-cta { gap: 7px; margin-top: 8px; padding-top: 10px; }
        .nav-cta > .btn { padding: 12px 14px; font-size: 14px; min-height: 46px; }
        .nav-staff-chip, .nav-user-chip { padding: 11px 12px; font-size: 13px; min-height: 46px; }
        .nav-user-avatar { width: 30px; height: 30px; font-size: 11px; }
        .nav-staff-menu a,
        .nav-user-menu a { padding: 10px 12px; font-size: 13.5px; }

        .auth-popup-overlay { padding: 10px; }
        .auth-popup { border-radius: 16px; }
        .auth-popup-hero { padding: 18px 18px 14px; }
        .auth-popup-hero h2 { font-size: 17px; }
        .auth-popup-tabs { padding: 12px 18px 0; }
        .auth-popup-body { padding: 14px 18px 18px; }
        .auth-popup .form-row { grid-template-columns: 1fr; gap: 0; }
        .auth-popup .form-group input { font-size: 16px; }
      }

      /* ============ SHORT DEVICES (landscape phones) ============ */
      @media (max-height: 700px) {
        .navbar-inner { padding: 10px 16px; }
        .nav-logo .logo-icon { width: 34px; height: 34px; font-size: 15px; }
        .nav-logo h1 { font-size: 15px; }
        .nav-logo p  { font-size: 9px; }

        .nav-toggle { width: 36px; height: 36px; font-size: 15px; }

        .nav-collapse { padding: 10px 12px 12px; }

        .nav-links a { padding: 11px 12px; font-size: 14px; }
        .nav-cta { gap: 6px; margin-top: 8px; padding-top: 10px; }
        .nav-cta > .btn { padding: 11px 12px; font-size: 13.5px; min-height: 44px; }
        .nav-staff-chip, .nav-user-chip { padding: 10px 12px; font-size: 13px; min-height: 44px; }
        .nav-staff-menu a,
        .nav-user-menu a { padding: 10px 12px; font-size: 13px; }
      }

      @media (max-height: 560px) {
        .nav-links a { padding: 9px 11px; font-size: 13.5px; }
        .nav-cta { gap: 5px; margin-top: 7px; padding-top: 8px; }
        .nav-cta > .btn { padding: 10px 11px; font-size: 13px; min-height: 42px; }
        .nav-staff-chip, .nav-user-chip { padding: 9px 11px; }
        .nav-staff-menu a,
        .nav-user-menu a { padding: 9px 11px; font-size: 12.5px; }
      }

      /* ============ AUTH POPUP ON SHORT SCREENS ============ */
      @media (max-height: 640px) {
        .auth-popup-hero { padding: 16px 18px 12px; }
        .auth-popup-hero h2 { font-size: 17px; }
        .auth-popup-hero p { display: none; }
        .auth-popup-logo { width: 40px; height: 40px; font-size: 18px; margin-bottom: 8px; }
      }

      /* ============ ULTRA-WIDE (≥1600px) ============ */
      @media (min-width: 1600px) {
        .navbar-inner { padding: 16px 36px; gap: 24px; }
        .nav-links a { padding: 13px 24px; font-size: 15px; }
        .btn { padding: 14px 28px; font-size: 15px; min-height: 50px; }
        .nav-user-chip { padding: 5px 18px 5px 5px; min-height: 50px; }
        .nav-user-avatar { width: 40px; height: 40px; font-size: 14px; }
        .nav-staff-chip { padding: 12px 18px; min-height: 50px; }
      }

      /* ============ EXTRA SAFETY ============ */
      @media (max-width: 960px) {
        .nav-cta .btn,
        .nav-links a { white-space: normal; text-align: left; }
      }
    `;
    document.head.appendChild(css);
  }

  /* =====================================================
     SECTION E — NAV ITEMS
  ===================================================== */
  const navItems = [
    { href: 'index.html',    label: 'Home' },
    { href: 'about.html',    label: 'About' },
    { href: 'services.html', label: 'Services' },
    { href: 'doctor1.html',  label: 'Doctors' },
    { href: 'contact.html',  label: 'Contact' }
  ];

  function isActive(href) {
    if (href === 'doctor1.html') {
      return ['doctor1.html', 'doctors.html', 'doctorbook2.html'].indexOf(path) !== -1;
    }
    return path === href;
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  /* =====================================================
     SECTION F — HEADER + FOOTER HTML
  ===================================================== */
  const headerHTML = `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a href="index.html" class="nav-logo">
          <div class="logo-icon"><i class="fas fa-hospital"></i></div>
          <div><h1>MediCare</h1><p>Hospital</p></div>
        </a>

        <button type="button" class="nav-toggle" id="navToggle"
                aria-label="Toggle navigation" aria-expanded="false" aria-controls="navCollapse">
          <i class="fas fa-bars"></i>
        </button>

        <div class="nav-collapse" id="navCollapse">
          <ul class="nav-links">
            ${navItems.map(item =>
              `<li><a href="${item.href}"${isActive(item.href) ? ' class="active"' : ''}>${item.label}</a></li>`
            ).join('')}
          </ul>
          <div class="nav-cta" id="navAuthSlot"></div>
        </div>
      </div>
    </nav>
  `;

  const footerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <div class="footer-brand">
              <div class="logo-icon"><i class="fas fa-hospital"></i></div>
              <div><h1>MediCare</h1><p>Hospital Management</p></div>
            </div>
            <p>Providing exceptional healthcare services with compassion and cutting-edge medical technology.</p>
          </div>
          <div class="footer-col">
            <h4>Quick Links</h4>
            <ul class="footer-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="about.html">About Us</a></li>
              <li><a href="services.html">Services</a></li>
              <li><a href="doctor1.html">Doctors</a></li>
              <li><a href="doctorbook2.html">Book Appointment</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Patient</h4>
            <ul class="footer-links">
              <li><a href="profile-user.html">My Profile</a></li>
              <li><a href="user-booking.html">My Appointments</a></li>
              <li><a href="doctorbook2.html">Book Appointment</a></li>
              <li><a href="admin-login.html" target="_blank" rel="noopener noreferrer">Staff Login</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Contact Info</h4>
            <div class="footer-contact-item"><i class="fas fa-map-marker-alt"></i><span>123 Health Ave, Medical District</span></div>
            <div class="footer-contact-item"><i class="fas fa-phone"></i><span>+1 (555) 123-4567</span></div>
            <div class="footer-contact-item"><i class="fas fa-envelope"></i><span>info@medicare.com</span></div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2025 MediCare Hospital. All rights reserved.</p>
          <div class="footer-socials">
            <a href="#"><i class="fab fa-facebook-f"></i></a>
            <a href="#"><i class="fab fa-twitter"></i></a>
            <a href="#"><i class="fab fa-instagram"></i></a>
            <a href="#"><i class="fab fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>
    </footer>
  `;

  /* =====================================================
     SECTION G — RENDER AUTH SLOT
  ===================================================== */
  function closeAllMenus() {
    const userMenu = document.getElementById('navUserMenu');
    const staffMenu = document.getElementById('navStaffMenu');
    if (userMenu) userMenu.classList.remove('open');
    if (staffMenu) staffMenu.classList.remove('open');
  }

  function closeNavCollapse() {
    const collapse = document.getElementById('navCollapse');
    const toggle = document.getElementById('navToggle');
    if (!collapse || !toggle) return;
    collapse.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<i class="fas fa-bars"></i>';
  }

  function bindNavToggle() {
    const toggle = document.getElementById('navToggle');
    const collapse = document.getElementById('navCollapse');
    if (!toggle || !collapse) return;
    if (toggle.dataset.bound === '1') return;
    toggle.dataset.bound = '1';

    toggle.addEventListener('click', e => {
      e.stopPropagation();
      const willOpen = !collapse.classList.contains('open');
      if (willOpen) {
        collapse.classList.add('open');
        toggle.classList.add('open');
        toggle.innerHTML = '<i class="fas fa-times"></i>';
      } else {
        closeNavCollapse();
        closeAllMenus();
      }
      toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    collapse.addEventListener('click', e => {
      const link = e.target.closest('a[href]');
      if (link) closeNavCollapse();
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) closeNavCollapse();
  });

  function bindStaffMenu() {
    const chip = document.getElementById('navStaffChip');
    const menu = document.getElementById('navStaffMenu');
    if (!chip || !menu) return;
    if (chip.dataset.bound === '1') return;
    chip.dataset.bound = '1';

    chip.addEventListener('click', e => {
      e.stopPropagation();
      const willOpen = !menu.classList.contains('open');
      closeAllMenus();
      if (willOpen) menu.classList.add('open');
    });

    const logoutBtn = document.getElementById('navStaffLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (!confirm('Logout from your staff session?\n\n(Your patient session, if any, will stay logged in.)')) return;
        StaffAuth.logout();
        location.reload();
      });
    }
  }

  function bindUserMenu() {
    const chip = document.getElementById('navUserChip');
    const menu = document.getElementById('navUserMenu');
    if (!chip || !menu) return;
    if (chip.dataset.bound === '1') return;
    chip.dataset.bound = '1';

    chip.addEventListener('click', e => {
      e.stopPropagation();
      const willOpen = !menu.classList.contains('open');
      closeAllMenus();
      if (willOpen) menu.classList.add('open');
    });

    const logoutBtn = document.getElementById('navUserLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (!confirm('Logout from your patient account?\n\n(Your staff session, if any, will stay logged in.)')) return;
        UserAuth.logout();
        location.reload();
      });
    }
  }

  document.addEventListener('click', e => {
    closeAllMenus();

    const collapse = document.getElementById('navCollapse');
    const toggle = document.getElementById('navToggle');
    if (
      collapse && toggle &&
      collapse.classList.contains('open') &&
      !collapse.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      closeNavCollapse();
    }
  });

  function renderAuthSlot() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;

    const user = UserAuth.current();
    const isStaff = StaffAuth.isLoggedIn();

    let html = '';

    if (isStaff) {
      html += `
        <div class="nav-staff">
          <div class="nav-staff-chip" id="navStaffChip" title="Staff menu">
            <span class="dot"></span>
            Staff
            <i class="fas fa-chevron-down chev"></i>
          </div>
          <div class="nav-staff-menu" id="navStaffMenu">
            <a href="dashboard.html" target="_blank" rel="noopener noreferrer">
              <i class="fas fa-columns"></i> Dashboard
            </a>
            <hr>
            <a id="navStaffLogout" class="danger">
              <i class="fas fa-sign-out-alt"></i> Staff Logout
            </a>
          </div>
        </div>
      `;
    } else {
      html += `<a href="admin-login.html" target="_blank" rel="noopener noreferrer" class="btn btn-outline"><i class="fas fa-user-md"></i> Staff Login</a>`;
    }

    if (!user) {
      html += `
        <button type="button" class="btn btn-outline" data-open-popup="login">
          <i class="fas fa-sign-in-alt"></i> Login
        </button>
        <button type="button" class="btn btn-primary" data-open-popup="signup">
          <i class="fas fa-user-plus"></i> Sign Up
        </button>
      `;
      slot.innerHTML = html;
      slot.querySelectorAll('[data-open-popup]').forEach(btn => {
        btn.addEventListener('click', () => openAuthPopup(btn.dataset.openPopup));
      });
      bindStaffMenu();
      return;
    }

    html += `
      <a href="doctorbook2.html" class="btn btn-primary"><i class="fas fa-calendar-plus"></i> Book</a>
      <div class="nav-user">
        <div class="nav-user-chip" id="navUserChip">
          <div class="nav-user-avatar">${esc(user.initials)}</div>
          <div>
            <div class="nav-user-name">${esc(user.name.split(' ')[0])}</div>
            <div class="nav-user-role">Patient</div>
          </div>
          <i class="fas fa-chevron-down chev"></i>
        </div>
        <div class="nav-user-menu" id="navUserMenu">
          <a href="profile-user.html"><i class="fas fa-user"></i> My Profile</a>
          <a href="user-booking.html"><i class="fas fa-calendar-check"></i> My Appointments</a>
          <a href="doctorbook2.html"><i class="fas fa-calendar-plus"></i> Book Appointment</a>
          ${isStaff ? `
            <hr>
            <a href="dashboard.html" target="_blank" rel="noopener noreferrer" class="staff-link">
              <i class="fas fa-columns"></i> Staff Dashboard
            </a>
          ` : ''}
          <hr>
          <a id="navUserLogout" class="danger"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
      </div>
    `;
    slot.innerHTML = html;

    bindUserMenu();
    bindStaffMenu();
  }

  /* =====================================================
     SECTION H — POPUP HTML
  ===================================================== */
  const popupHTML = `
    <div class="auth-popup-overlay" id="authPopupOverlay" role="dialog" aria-modal="true">
      <div class="auth-popup">
        <button class="auth-popup-close" id="authPopupClose" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>

        <div class="auth-popup-hero">
          <div class="auth-popup-logo"><i class="fas fa-hospital"></i></div>
          <h2>Welcome to MediCare</h2>
          <p>Sign in or create an account to access appointments, records, and personalised care.</p>
        </div>

        <div class="auth-popup-tabs">
          <button type="button" class="auth-popup-tab active" data-tab="login">Sign In</button>
          <button type="button" class="auth-popup-tab" data-tab="signup">Create Account</button>
        </div>

        <div class="auth-popup-body">
          <!-- LOGIN -->
          <div class="auth-popup-pane active" data-pane="login">
            <div class="alert" id="popupLoginErr"><i class="fas fa-exclamation-circle"></i><span></span></div>
            <form id="popupLoginForm" novalidate>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" id="popupLoginEmail" placeholder="you@example.com" autocomplete="email" required>
              </div>
              <div class="form-group">
                <label>Password</label>
                <div class="pass-wrap">
                  <input type="password" id="popupLoginPass" placeholder="••••••••" autocomplete="current-password" required>
                  <button type="button" class="pass-toggle" data-target="popupLoginPass"><i class="fas fa-eye"></i></button>
                </div>
              </div>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-sign-in-alt"></i> Sign In
              </button>
            </form>
            <div class="auth-popup-foot">
              Don't have an account? <a data-switch="signup">Create one</a>
            </div>
          </div>

          <!-- SIGNUP -->
          <div class="auth-popup-pane" data-pane="signup">
            <div class="alert" id="popupSignupErr"><i class="fas fa-exclamation-circle"></i><span></span></div>
            <form id="popupSignupForm" novalidate>
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="popupSuName" placeholder="Jane Doe" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" id="popupSuEmail" placeholder="you@example.com" required>
                </div>
                <div class="form-group">
                  <label>Phone</label>
                  <input type="tel" id="popupSuPhone" placeholder="+1 555-0100" required>
                </div>
              </div>
              <div class="form-group">
                <label>Password</label>
                <div class="pass-wrap">
                  <input type="password" id="popupSuPass" placeholder="At least 8 characters" autocomplete="new-password" required>
                  <button type="button" class="pass-toggle" data-target="popupSuPass"><i class="fas fa-eye"></i></button>
                </div>
                <div class="strength"><div class="strength-fill" id="popupSuStrength"></div></div>
                <div class="strength-text" id="popupSuStrengthText">Use 8+ characters with letters & numbers</div>
              </div>
              <div class="form-group">
                <label>Confirm Password</label>
                <div class="pass-wrap">
                  <input type="password" id="popupSuPass2" placeholder="Repeat password" autocomplete="new-password" required>
                  <button type="button" class="pass-toggle" data-target="popupSuPass2"><i class="fas fa-eye"></i></button>
                </div>
              </div>
              <div class="terms">
                <input type="checkbox" id="popupSuTerms" required>
                <label for="popupSuTerms">I agree to the Terms of Service and Privacy Policy.</label>
              </div>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-user-plus"></i> Create Account
              </button>
            </form>
            <div class="auth-popup-foot">
              Already have an account? <a data-switch="login">Sign in</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  /* =====================================================
     SECTION I — POPUP CONTROL
  ===================================================== */
  function isAuthLocked() {
    return isHome && !UserAuth.isLoggedIn();
  }

  function openAuthPopup(tab) {
    const overlay = document.getElementById('authPopupOverlay');
    if (!overlay) return;
    if (tab) switchPopupTab(tab);

    closeNavCollapse();
    closeAllMenus();

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    const closeBtn = document.getElementById('authPopupClose');
    if (closeBtn) closeBtn.style.display = isAuthLocked() ? 'none' : '';

    setTimeout(() => {
      const active = overlay.querySelector('.auth-popup-pane.active input');
      if (active) active.focus();
    }, 300);
  }

  function closeAuthPopup(force) {
    const overlay = document.getElementById('authPopupOverlay');
    if (!overlay) return;
    if (!force && isAuthLocked()) return;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  function switchPopupTab(name) {
    document.querySelectorAll('.auth-popup-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === name)
    );
    document.querySelectorAll('.auth-popup-pane').forEach(p =>
      p.classList.toggle('active', p.dataset.pane === name)
    );
  }

  function showPopupErr(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.querySelector('span').textContent = msg;
    el.classList.add('show');
  }

  /* =====================================================
     SECTION J — BIND POPUP EVENTS
  ===================================================== */
  function bindPopupEvents() {
    const overlay = document.getElementById('authPopupOverlay');
    if (!overlay) return;

    const closeBtn = document.getElementById('authPopupClose');
    closeBtn.addEventListener('click', () => closeAuthPopup());

    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeAuthPopup();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('show')) closeAuthPopup();
    });

    document.querySelectorAll('.auth-popup-tab').forEach(tab => {
      tab.addEventListener('click', () => switchPopupTab(tab.dataset.tab));
    });

    document.querySelectorAll('[data-switch]').forEach(link => {
      link.addEventListener('click', () => switchPopupTab(link.dataset.switch));
    });

    document.querySelectorAll('.auth-popup .pass-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.innerHTML = `<i class="fas fa-eye${show ? '-slash' : ''}"></i>`;
      });
    });

    const suPass = document.getElementById('popupSuPass');
    if (suPass) {
      suPass.addEventListener('input', () => {
        const pw = suPass.value;
        let s = 0;
        if (pw.length >= 8) s++;
        if (pw.length >= 12) s++;
        if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
        if (/\d/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        s = Math.min(s, 4);
        const map = [
          { w: '0%',   c: 'transparent', t: 'Use 8+ characters with letters & numbers', col: '#5e7e8c' },
          { w: '25%',  c: '#e84a5f',     t: 'Weak password',   col: '#e84a5f' },
          { w: '50%',  c: '#e8a33d',     t: 'Fair password',   col: '#e8a33d' },
          { w: '75%',  c: '#0d6e9e',     t: 'Good password',   col: '#0d6e9e' },
          { w: '100%', c: '#0e8b5e',     t: 'Strong password', col: '#0e8b5e' }
        ][s];
        const bar = document.getElementById('popupSuStrength');
        const txt = document.getElementById('popupSuStrengthText');
        bar.style.width = map.w;
        bar.style.background = map.c;
        txt.textContent = map.t;
        txt.style.color = map.col;
      });
    }

    /* ---------- Login submit ---------- */
    document.getElementById('popupLoginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const errBox = document.getElementById('popupLoginErr');
      errBox.classList.remove('show');

      const email = document.getElementById('popupLoginEmail').value.trim();
      const pw = document.getElementById('popupLoginPass').value;

      if (!email) return showPopupErr('popupLoginErr', 'Please enter your email.');
      if (!pw) return showPopupErr('popupLoginErr', 'Please enter your password.');

      const btn = e.target.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

      const res = await UserAuth.login(email, pw);

      btn.disabled = false;
      btn.innerHTML = orig;

      if (!res.ok) {
        document.getElementById('popupLoginPass').value = '';
        return showPopupErr('popupLoginErr', res.error);
      }

      closeAuthPopup(true);
      location.reload();
    });

    /* ---------- Signup submit ---------- */
    document.getElementById('popupSignupForm').addEventListener('submit', async e => {
      e.preventDefault();
      const errBox = document.getElementById('popupSignupErr');
      errBox.classList.remove('show');

      const name  = document.getElementById('popupSuName').value.trim();
      const email = document.getElementById('popupSuEmail').value.trim();
      const phone = document.getElementById('popupSuPhone').value.trim();
      const pw    = document.getElementById('popupSuPass').value;
      const pw2   = document.getElementById('popupSuPass2').value;
      const termsOk = document.getElementById('popupSuTerms').checked;

      if (name.length < 2)                return showPopupErr('popupSignupErr', 'Please enter your full name.');
      if (!UserAuth.validateEmail(email)) return showPopupErr('popupSignupErr', 'Please enter a valid email address.');
      if (phone.length < 6)               return showPopupErr('popupSignupErr', 'Please enter a valid phone number.');
      const pwErr = UserAuth.validatePassword(pw);
      if (pwErr)                          return showPopupErr('popupSignupErr', pwErr);
      if (pw !== pw2)                     return showPopupErr('popupSignupErr', 'Passwords do not match.');
      if (!termsOk)                       return showPopupErr('popupSignupErr', 'Please accept the Terms to continue.');

      const btn = e.target.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

      const res = await UserAuth.signup({ name, email, phone, password: pw });

      btn.disabled = false;
      btn.innerHTML = orig;

      if (!res.ok) return showPopupErr('popupSignupErr', res.error);

      await UserAuth.login(email, pw);
      closeAuthPopup(true);
      location.reload();
    });
  }

  /* =====================================================
     SECTION K — INJECT ALL
  ===================================================== */
  function injectHeaderFooter() {
    const headerHost = document.getElementById('site-header');
    const footerHost = document.getElementById('site-footer');
    if (headerHost) headerHost.innerHTML = headerHTML;
    if (footerHost) footerHost.innerHTML = footerHTML;
    renderAuthSlot();
    bindNavToggle();
  }

  function injectPopup() {
    if (document.getElementById('authPopupOverlay')) return;

    const host = document.createElement('div');
    host.innerHTML = popupHTML;
    document.body.appendChild(host.firstElementChild);

    bindPopupEvents();

    window.openAuthPopup = openAuthPopup;
    window.closeAuthPopup = closeAuthPopup;

    if (isAuthLocked()) {
      setTimeout(() => openAuthPopup(), 400);
    }
  }

  /* =====================================================
     SECTION L — INIT
  ===================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    injectHeaderFooter();
    injectPopup();
  });

  window.refreshAuthChip = renderAuthSlot;
})();
