/* =========================================================
   ADMIN — HOSPITALS MANAGER
   Adds a "Hospitals" page to the dashboard.
   Writes to `medicare_hospitals_v1` — the same key
   hospitals.html reads, so the public page stays in sync.
========================================================= */
(function () {
  'use strict';

  if (!document.getElementById('appContainer')) return;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const uid = (p) => p + '-' + Date.now().toString(36).toUpperCase()
                  + Math.random().toString(36).slice(2, 5).toUpperCase();

  const KEY = 'medicare_hospitals_v1';
  const SEED_FLAG = 'medicare_hosp_seed_v1';

  const read  = (fb) => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v == null ? fb : v; } catch { return fb; } };
  const write = (v) => {
    localStorage.setItem(KEY, JSON.stringify(v));
    try { window.dispatchEvent(new CustomEvent('medicare:changed', { detail: { key: KEY } })); } catch (e) {}
  };

  /* ---------- seed on first run ---------- */
  function seed() {
    if (localStorage.getItem(SEED_FLAG)) return;
    if (!read(null)) {
      write([
        { id:'HSP-1', name:'City Care Hospital', city:'Karachi', country:'Pakistan',
          beds:320, rating:4.5, phone:'+92-21-111-222',
          address:'Main Clifton Road', email:'info@citycare.pk',
          specialties:['Cardiology','Neurology'] },
        { id:'HSP-2', name:'Aga Khan University Hospital', city:'Karachi', country:'Pakistan',
          beds:700, rating:4.8, phone:'+92-21-111-911',
          address:'Stadium Road', email:'info@aku.edu',
          specialties:['Oncology','Cardiology'] },
        { id:'HSP-3', name:'Shaukat Khanum Memorial', city:'Lahore', country:'Pakistan',
          beds:200, rating:4.7, phone:'+92-42-3590-5000',
          address:'Johar Town', email:'info@skm.org.pk',
          specialties:['Oncology'] },
        { id:'HSP-4', name:'Apollo Hospital', city:'Delhi', country:'India',
          beds:900, rating:4.6, phone:'+91-11-2692-5858',
          address:'Sarita Vihar', email:'info@apollo.in',
          specialties:['Transplant','Cardiology'] },
        { id:'HSP-5', name:'Mount Sinai Hospital', city:'New York', country:'USA',
          beds:1100, rating:4.4, phone:'+1-212-241-6500',
          address:'5th Avenue', email:'info@mountsinai.org',
          specialties:['Emergency','Pediatrics'] }
      ]);
    }
    localStorage.setItem(SEED_FLAG, '1');
  }

  /* ---------- inject nav item under Operations ---------- */
  function injectNav() {
    let ops = null;
    document.querySelectorAll('.nav-section').forEach(s => {
      const lbl = s.querySelector('.nav-label');
      if (lbl && lbl.textContent.trim() === 'Operations') ops = s;
    });
    if (!ops || ops.querySelector('[data-page="hospitals"]')) return;

    ops.insertAdjacentHTML('beforeend', `
      <a class="nav-item" data-page="hospitals">
        <i class="fas fa-hospital"></i> Hospitals
      </a>
    `);
  }

  /* ---------- inject page ---------- */
  function injectPage() {
    const main = document.querySelector('.main-content');
    if (!main || $('page-hospitals')) return;

    const el = document.createElement('div');
    el.className = 'page';
    el.id = 'page-hospitals';
    el.innerHTML = pageHTML();

    const settings = $('page-settings');
    if (settings && settings.parentNode) settings.parentNode.insertBefore(el, settings);
    else main.appendChild(el);
  }

  function pageHTML() {
    return `
      <div class="stats-grid" id="hospStats"></div>

      <div class="card">
        <div class="card-header">
          <h2><i class="fas fa-hospital"></i> Hospital Directory</h2>
          <button class="btn btn-primary btn-sm" id="addHospBtn">
            <i class="fas fa-plus"></i> Add Hospital
          </button>
        </div>

        <div class="mp-filters">
          <div class="mp-search">
            <i class="fas fa-search"></i>
            <input type="text" id="hospSearch" placeholder="Search name, city, country…">
          </div>
          <select id="hospCityFilter"
                  style="padding:10px 14px; border-radius:12px; border:1px solid var(--border); font-family:inherit; font-size:13.5px; color:var(--dark); background:#fff; cursor:pointer;">
            <option value="">All Cities</option>
          </select>
          <select id="hospCountryFilter"
                  style="padding:10px 14px; border-radius:12px; border:1px solid var(--border); font-family:inherit; font-size:13.5px; color:var(--dark); background:#fff; cursor:pointer;">
            <option value="">All Countries</option>
          </select>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>City</th><th>Country</th><th>Beds</th>
                <th>Rating</th><th>Phone</th><th>Specialties</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="hospTableBody"></tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ---------- render ---------- */
  let hospQuery = '';

  function render() {
    const all = read([]);

    const cities    = [...new Set(all.map(h => h.city).filter(Boolean))];
    const countries = [...new Set(all.map(h => h.country).filter(Boolean))];
    const avgRating = all.length
      ? (all.reduce((s, h) => s + Number(h.rating || 0), 0) / all.length).toFixed(1)
      : '0.0';
    const totalBeds = all.reduce((s, h) => s + Number(h.beds || 0), 0);

    const stats = $('hospStats');
    if (stats) stats.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon blue"><i class="fas fa-hospital"></i></div>
        <div class="stat-content"><p>Total Hospitals</p><h3>${all.length}</h3>
          <div class="stat-trend"><i class="fas fa-check"></i> In directory</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple"><i class="fas fa-city"></i></div>
        <div class="stat-content"><p>Cities Covered</p><h3>${cities.length}</h3>
          <div class="stat-trend"><i class="fas fa-map-marker-alt"></i> Across ${countries.length} countries</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-bed"></i></div>
        <div class="stat-content"><p>Total Beds</p><h3>${totalBeds}</h3>
          <div class="stat-trend"><i class="fas fa-arrow-up"></i> Combined capacity</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><i class="fas fa-star"></i></div>
        <div class="stat-content"><p>Avg Rating</p><h3>${avgRating}</h3>
          <div class="stat-trend"><i class="fas fa-star"></i> Out of 5.0</div></div>
      </div>
    `;

    const citySel    = $('hospCityFilter');
    const countrySel = $('hospCountryFilter');
    if (citySel) {
      const keep = citySel.value;
      citySel.innerHTML = `<option value="">All Cities</option>` +
        cities.sort().map(c => `<option${keep === c ? ' selected' : ''}>${esc(c)}</option>`).join('');
    }
    if (countrySel) {
      const keep = countrySel.value;
      countrySel.innerHTML = `<option value="">All Countries</option>` +
        countries.sort().map(c => `<option${keep === c ? ' selected' : ''}>${esc(c)}</option>`).join('');
    }

    const q       = hospQuery.toLowerCase();
    const cityF   = citySel ? citySel.value : '';
    const countryF= countrySel ? countrySel.value : '';

    const list = all.filter(h => {
      if (cityF && h.city !== cityF) return false;
      if (countryF && h.country !== countryF) return false;
      if (q) {
        const blob = [h.name, h.city, h.country, h.address, h.phone, (h.specialties || []).join(' ')]
          .join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    const tbody = $('hospTableBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="mp-empty"><i class="fas fa-hospital"></i>
          <h3>No hospitals found</h3>
          <p>Click <strong>Add Hospital</strong> to create one.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(h => `
      <tr>
        <td><strong>${esc(h.name)}</strong>
          ${h.address ? `<div style="font-size:12px;color:var(--gray);">${esc(h.address)}</div>` : ''}
        </td>
        <td>${esc(h.city || '—')}</td>
        <td>${esc(h.country || '—')}</td>
        <td>${h.beds ?? '—'}</td>
        <td>⭐ ${Number(h.rating || 0).toFixed(1)}</td>
        <td>${esc(h.phone || '—')}</td>
        <td>
          ${(h.specialties || []).slice(0, 2).map(s =>
            `<span class="mp-badge info">${esc(s)}</span>`).join(' ')}
          ${(h.specialties || []).length > 2
            ? `<span class="mp-badge info">+${h.specialties.length - 2}</span>` : ''}
          ${!h.specialties || !h.specialties.length ? '<span style="color:var(--gray);">—</span>' : ''}
        </td>
        <td>
          <button class="btn btn-outline btn-sm" data-hosp-edit="${esc(h.id)}" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" data-hosp-del="${esc(h.id)}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  /* ---------- modal ---------- */
  function openHospModal(editId) {
    const h = editId ? read([]).find(x => x.id === editId) : null;

    showModal(`
      <div class="modal-header">
        <h2>${h ? 'Edit Hospital' : 'Add Hospital'}</h2>
        <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="hospForm">
        <div class="form-group"><label>Hospital Name *</label>
          <input type="text" id="hName" required value="${h ? esc(h.name) : ''}"
                 placeholder="e.g. City Care Hospital"></div>

        <div class="mp-form-grid">
          <div class="form-group"><label>City *</label>
            <input type="text" id="hCity" required value="${h ? esc(h.city || '') : ''}"
                   placeholder="Karachi"></div>
          <div class="form-group"><label>Country *</label>
            <input type="text" id="hCountry" required value="${h ? esc(h.country || '') : ''}"
                   placeholder="Pakistan"></div>
          <div class="form-group"><label>Phone</label>
            <input type="text" id="hPhone" value="${h ? esc(h.phone || '') : ''}"
                   placeholder="+92-21-111-222"></div>
          <div class="form-group"><label>Email</label>
            <input type="email" id="hEmail" value="${h ? esc(h.email || '') : ''}"
                   placeholder="info@hospital.com"></div>
          <div class="form-group"><label>Beds</label>
            <input type="number" min="0" id="hBeds" value="${h ? (h.beds ?? 0) : 0}"></div>
          <div class="form-group"><label>Rating (0–5)</label>
            <input type="number" min="0" max="5" step="0.1" id="hRating"
                   value="${h ? (h.rating ?? 0) : 0}"></div>
        </div>

        <div class="form-group"><label>Address</label>
          <input type="text" id="hAddress" value="${h ? esc(h.address || '') : ''}"
                 placeholder="Street, area, landmark"></div>

        <div class="form-group">
          <label>Specialties (comma-separated)</label>
          <input type="text" id="hSpecialties"
                 value="${h && h.specialties ? esc(h.specialties.join(', ')) : ''}"
                 placeholder="Cardiology, Neurology, Oncology">
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> ${h ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    `);

    $('hospForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const specialties = $('hSpecialties').value
        .split(',').map(s => s.trim()).filter(Boolean);

      const payload = {
        name:        $('hName').value.trim(),
        city:        $('hCity').value.trim(),
        country:     $('hCountry').value.trim(),
        phone:       $('hPhone').value.trim(),
        email:       $('hEmail').value.trim(),
        beds:        Number($('hBeds').value) || 0,
        rating:      Math.min(5, Math.max(0, Number($('hRating').value) || 0)),
        address:     $('hAddress').value.trim(),
        specialties: specialties
      };

      if (!payload.name || !payload.city || !payload.country) return;

      const list = read([]);
      if (h) {
        const i = list.findIndex(x => x.id === h.id);
        list[i] = { ...list[i], ...payload };
      } else {
        list.push({ id: uid('HSP'), ...payload });
      }
      write(list);

      showToast(h ? 'Hospital updated' : 'Hospital added', 'success');
      closeModal();
      render();
    });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#addHospBtn')) { openHospModal(); return; }

    const editBtn = e.target.closest('[data-hosp-edit]');
    if (editBtn) { openHospModal(editBtn.dataset.hospEdit); return; }

    const delBtn = e.target.closest('[data-hosp-del]');
    if (delBtn) {
      if (!confirm('Delete this hospital from the directory?')) return;
      const list = read([]).filter(x => x.id !== delBtn.dataset.hospDel);
      write(list);
      showToast('Hospital removed', 'success');
      render();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'hospSearch') {
      hospQuery = e.target.value.trim();
      render();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'hospCityFilter' || e.target.id === 'hospCountryFilter') {
      render();
    }
  });

  /* ---------- update page title when navigated ---------- */
  function watchPage() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName !== 'class') return;
        const el = m.target;
        if (!el.classList || !el.classList.contains('page') || !el.classList.contains('active')) return;

        if (el.id === 'page-hospitals') {
          const t = document.getElementById('pageTitle');
          const s = document.getElementById('pageSubtitle');
          if (t) t.textContent = 'Hospitals';
          if (s) s.textContent = 'Directory of hospitals shown on the public website';
          render();
        }
      });
    });
    document.querySelectorAll('.page').forEach(p => observer.observe(p, { attributes: true, attributeFilter: ['class'] }));
  }

  /* ---------- init ---------- */
  function init() {
    seed();
    injectNav();
    injectPage();
    watchPage();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();