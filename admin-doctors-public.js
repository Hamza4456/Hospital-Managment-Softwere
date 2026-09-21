/* =========================================================
   ADMIN — PUBLIC DOCTORS MANAGER
   Adds a "Public Doctors" page that writes to
   `medicare_public_doctors_v1` (read by doctor1.html /
   doctorbook2.html via public-doctors.js).
========================================================= */
(function () {
  'use strict';
  if (!document.getElementById('appContainer')) return;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = (p) => p + '-' + Date.now().toString(36).toUpperCase()
                  + Math.random().toString(36).slice(2, 5).toUpperCase();

  const KEY     = 'medicare_public_doctors_v1';
  const DEL_KEY = 'medicare_public_doctors_deleted_v1';
  const SEED    = 'medicare_public_doctors_seeded_v1';

  const read  = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch { return fb; } };
  const write = (k, v) => {
    localStorage.setItem(k, JSON.stringify(v));
    try { window.dispatchEvent(new CustomEvent('medicare:changed', { detail:{ key:k } })); } catch(e) {}
  };

  /* ---- seed once so the admin sees the existing doctors ---- */
  function seed() {
    if (localStorage.getItem(SEED)) return;
    if (!read(KEY, null)) {
      write(KEY, [
        { id:'D-1',  name:'Dr. A. Sharma',      initials:'AS', dept:'Cardiology',   specialty:'Interventional Cardiology', experience:'15 years', patients:1240, rating:4.9, reviews:312, available:true,  degree:'MD, DM (Cardiology)',      languages:'English, Hindi',           expertise:['Angioplasty & Stenting','Heart Failure','Coronary Imaging','Preventive Cardiology'], schedule:[true,true,true,true,true,false,false] },
        { id:'D-2',  name:'Dr. M. Costa',       initials:'MC', dept:'Neurology',    specialty:'Neurology Specialist',      experience:'12 years', patients:980,  rating:4.8, reviews:245, available:true,  degree:'MD, DM (Neurology)',       languages:'English, Spanish',         expertise:['Epilepsy','Stroke Care','Movement Disorders','Migraine'],                       schedule:[true,true,false,true,true,true,false] },
        { id:'D-3',  name:'Dr. L. Wong',        initials:'LW', dept:'Orthopedics',  specialty:'Orthopedic Surgeon',        experience:'18 years', patients:1560, rating:4.9, reviews:428, available:false, degree:'MS (Ortho), FRCS',         languages:'English, Mandarin',        expertise:['Joint Replacement','Sports Injuries','Spine Surgery','Arthroscopy'],            schedule:[true,true,true,true,true,true,false] },
        { id:'D-4',  name:'Dr. S. Patel',       initials:'SP', dept:'Pediatrics',   specialty:'Pediatrician',              experience:'10 years', patients:1120, rating:4.9, reviews:380, available:true,  degree:'MD (Pediatrics)',          languages:'English, Hindi, Gujarati', expertise:['Newborn Care','Vaccination','Child Nutrition','Growth Monitoring'],             schedule:[true,true,true,true,true,true,true] },
        { id:'D-5',  name:'Dr. K. Mensah',      initials:'KM', dept:'Pulmonology',  specialty:'Pulmonologist',             experience:'14 years', patients:890,  rating:4.8, reviews:198, available:true,  degree:'MD (Pulmonology)',         languages:'English, French',          expertise:['Asthma & COPD','Sleep Medicine','Bronchoscopy','Lung Function'],                schedule:[true,true,true,false,true,true,false] },
        { id:'D-6',  name:'Dr. J. Rivera',      initials:'JR', dept:'Emergency',    specialty:'Emergency Medicine',        experience:'9 years',  patients:2100, rating:4.7, reviews:456, available:true,  degree:'MD (Emergency Med)',       languages:'English, Spanish',         expertise:['Trauma Care','Cardiac Emergencies','Toxicology','Critical Care'],               schedule:[true,true,true,true,true,true,true] },
        { id:'D-7',  name:'Dr. R. Nakamura',    initials:'RN', dept:'Oncology',     specialty:'Medical Oncologist',        experience:'20 years', patients:720,  rating:5.0, reviews:289, available:true,  degree:'MD, DM (Oncology)',        languages:'English, Japanese',        expertise:['Chemotherapy','Immunotherapy','Targeted Therapy','Breast Cancer'],              schedule:[true,false,true,true,true,false,false] },
        { id:'D-8',  name:'Dr. E. Okafor',      initials:'EO', dept:'Cardiology',   specialty:'Cardiac Surgeon',           experience:'16 years', patients:640,  rating:4.9, reviews:210, available:false, degree:'MS, MCh (CVTS)',           languages:'English, Igbo',            expertise:['CABG Surgery','Valve Replacement','Aortic Surgery'],                             schedule:[true,true,true,false,true,false,false] },
        { id:'D-9',  name:'Dr. P. Silva',       initials:'PS', dept:'Dermatology',  specialty:'Dermatologist',             experience:'11 years', patients:1450, rating:4.8, reviews:512, available:true,  degree:'MD (Dermatology)',         languages:'English, Portuguese',      expertise:['Cosmetic Dermatology','Skin Cancer','Eczema & Psoriasis','Acne'],               schedule:[true,true,true,true,true,true,false] },
        { id:'D-10', name:'Dr. N. Haddad',      initials:'NH', dept:'Neurology',    specialty:'Neurosurgeon',              experience:'17 years', patients:580,  rating:4.9, reviews:178, available:true,  degree:'MS, MCh (Neurosurgery)',   languages:'English, Arabic',          expertise:['Brain Tumor','Spinal Surgery','Epilepsy Surgery'],                              schedule:[true,false,true,true,false,true,false] },
        { id:'D-11', name:'Dr. T. Andersson',   initials:'TA', dept:'Orthopedics',  specialty:'Sports Medicine',           experience:'13 years', patients:1340, rating:4.8, reviews:398, available:true,  degree:'MD, PhD (Sports Med)',     languages:'English, Swedish',         expertise:['ACL Reconstruction','Shoulder Surgery','Cartilage Repair'],                     schedule:[true,true,true,true,true,false,false] },
        { id:'D-12', name:'Dr. H. Tanaka',      initials:'HT', dept:'Pediatrics',   specialty:'Pediatric Neurologist',     experience:'15 years', patients:790,  rating:4.9, reviews:265, available:true,  degree:'MD, DM (Ped Neuro)',       languages:'English, Japanese',        expertise:['Childhood Epilepsy','Developmental Disorders','Autism','Cerebral Palsy'],      schedule:[true,true,false,true,true,true,false] },
        { id:'D-13', name:'Dr. F. Rossi',       initials:'FR', dept:'Pulmonology',  specialty:'Critical Care Specialist',  experience:'12 years', patients:1120, rating:4.7, reviews:224, available:false, degree:'MD (Critical Care)',       languages:'English, Italian',         expertise:['ICU Management','Mechanical Ventilation','Sepsis Care'],                        schedule:[true,true,true,true,true,true,true] },
        { id:'D-14', name:'Dr. L. Fernández',   initials:'LF', dept:'Emergency',    specialty:'Trauma Surgeon',            experience:'14 years', patients:1680, rating:4.8, reviews:342, available:true,  degree:'MS (Trauma Surgery)',      languages:'English, Spanish',         expertise:['Polytrauma','Emergency Surgery','Burn Management'],                             schedule:[true,true,true,true,true,false,true] },
        { id:'D-15', name:'Dr. A. Ivanova',     initials:'AI', dept:'Oncology',     specialty:'Radiation Oncologist',      experience:'16 years', patients:660,  rating:4.9, reviews:201, available:true,  degree:'MD (Radiation Oncology)',  languages:'English, Russian',         expertise:['IMRT & IGRT','Stereotactic Radiosurgery','Proton Therapy'],                     schedule:[true,false,true,true,false,true,false] }
      ]);
    }
    localStorage.setItem(SEED, '1');
  }

  /* ---- inject nav item ---- */
  function injectNav() {
    let ops = null;
    document.querySelectorAll('.nav-section').forEach(s => {
      const lbl = s.querySelector('.nav-label');
      if (lbl && lbl.textContent.trim() === 'Operations') ops = s;
    });
    if (!ops || ops.querySelector('[data-page="public-doctors"]')) return;

    ops.insertAdjacentHTML('beforeend', `
      <a class="nav-item" data-page="public-doctors">
        <i class="fas fa-user-md"></i> Public Doctors
      </a>
    `);
  }

  /* ---- inject page ---- */
  function injectPage() {
    const main = document.querySelector('.main-content');
    if (!main || $('page-public-doctors')) return;

    const el = document.createElement('div');
    el.className = 'page';
    el.id = 'page-public-doctors';
    el.innerHTML = `
      <div class="stats-grid" id="pdStats"></div>

      <div class="card">
        <div class="card-header">
          <h2><i class="fas fa-user-md"></i> Doctors Shown on Website</h2>
          <button class="btn btn-primary btn-sm" id="addPdBtn">
            <i class="fas fa-plus"></i> Add Doctor
          </button>
        </div>

        <div class="mp-filters">
          <div class="mp-search">
            <i class="fas fa-search"></i>
            <input type="text" id="pdSearch" placeholder="Search name, department, specialty…">
          </div>
          <select id="pdDeptFilter" style="padding:10px 14px;border-radius:12px;border:1px solid var(--border);font-family:inherit;font-size:13.5px;color:var(--dark);background:#fff;cursor:pointer;">
            <option value="">All Departments</option>
          </select>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Doctor</th><th>Department</th><th>Specialty</th>
                <th>Experience</th><th>Rating</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="pdTableBody"></tbody>
          </table>
        </div>
      </div>
    `;

    const settings = $('page-settings');
    if (settings && settings.parentNode) settings.parentNode.insertBefore(el, settings);
    else main.appendChild(el);
  }

  /* ---- render ---- */
  let pdQuery = '';

  function render() {
    const all = read(KEY, []);
    const deleted = read(DEL_KEY, []);
    const visible = all.filter(d => !deleted.includes(d.id));

    const available = visible.filter(d => d.available).length;
    const avgRating = visible.length
      ? (visible.reduce((s, d) => s + Number(d.rating || 0), 0) / visible.length).toFixed(1)
      : '0.0';
    const depts = [...new Set(visible.map(d => d.dept).filter(Boolean))];

    const stats = $('pdStats');
    if (stats) stats.innerHTML = `
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-user-md"></i></div>
        <div class="stat-content"><p>Total Doctors</p><h3>${visible.length}</h3>
          <div class="stat-trend"><i class="fas fa-check"></i> On public site</div></div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
        <div class="stat-content"><p>Available</p><h3>${available}</h3>
          <div class="stat-trend"><i class="fas fa-clock"></i> Currently active</div></div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-building"></i></div>
        <div class="stat-content"><p>Departments</p><h3>${depts.length}</h3>
          <div class="stat-trend"><i class="fas fa-list"></i> Covered</div></div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-star"></i></div>
        <div class="stat-content"><p>Avg Rating</p><h3>${avgRating}</h3>
          <div class="stat-trend"><i class="fas fa-star"></i> Out of 5.0</div></div></div>
    `;

    const deptSel = $('pdDeptFilter');
    if (deptSel) {
      const keep = deptSel.value;
      deptSel.innerHTML = `<option value="">All Departments</option>` +
        depts.sort().map(d => `<option${keep === d ? ' selected' : ''}>${esc(d)}</option>`).join('');
    }

    const q = pdQuery.toLowerCase();
    const deptF = deptSel ? deptSel.value : '';
    const list = visible.filter(d => {
      if (deptF && d.dept !== deptF) return false;
      if (q) {
        const blob = [d.name, d.dept, d.specialty, d.degree, (d.expertise||[]).join(' ')]
          .join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    const tbody = $('pdTableBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="mp-empty"><i class="fas fa-user-md"></i>
          <h3>No doctors found</h3>
          <p>Click <strong>Add Doctor</strong> to create one.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(d => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;">
              ${esc(d.initials || (d.name||'?').replace('Dr. ','').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase())}
            </div>
            <div>
              <strong>${esc(d.name)}</strong>
              <div style="font-size:12px;color:var(--gray);">${esc(d.degree || '')}</div>
            </div>
          </div>
        </td>
        <td>${esc(d.dept || '—')}</td>
        <td>${esc(d.specialty || '—')}</td>
        <td>${esc(d.experience || '—')}</td>
        <td>⭐ ${Number(d.rating || 0).toFixed(1)} <span style="color:var(--gray);font-size:12px;">(${d.reviews || 0})</span></td>
        <td>${d.available
          ? '<span class="mp-badge ok">Available</span>'
          : '<span class="mp-badge warn">Busy</span>'}</td>
        <td>
          <button class="btn btn-outline btn-sm" data-pd-edit="${esc(d.id)}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" data-pd-del="${esc(d.id)}"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  /* ---- modal ---- */
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function openModal(editId) {
    const all = read(KEY, []);
    const d = editId ? all.find(x => x.id === editId) : null;
    const sched = d && Array.isArray(d.schedule) && d.schedule.length === 7
      ? d.schedule : [true,true,true,true,true,false,false];

    showModal(`
      <div class="modal-header">
        <h2>${d ? 'Edit Doctor' : 'Add Doctor'}</h2>
        <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="pdForm">
        <div class="form-group"><label>Full Name *</label>
          <input type="text" id="pdName" required value="${d ? esc(d.name) : ''}"
                 placeholder="Dr. John Doe"></div>

        <div class="mp-form-grid">
          <div class="form-group"><label>Department *</label>
            <input type="text" id="pdDept" required value="${d ? esc(d.dept || '') : ''}"
                   placeholder="Cardiology"></div>
          <div class="form-group"><label>Specialty</label>
            <input type="text" id="pdSpecialty" value="${d ? esc(d.specialty || '') : ''}"
                   placeholder="Interventional Cardiology"></div>
          <div class="form-group"><label>Experience</label>
            <input type="text" id="pdExp" value="${d ? esc(d.experience || '') : ''}"
                   placeholder="15 years"></div>
          <div class="form-group"><label>Qualification</label>
            <input type="text" id="pdDegree" value="${d ? esc(d.degree || '') : ''}"
                   placeholder="MD, DM (Cardiology)"></div>
          <div class="form-group"><label>Languages</label>
            <input type="text" id="pdLang" value="${d ? esc(d.languages || '') : ''}"
                   placeholder="English, Hindi"></div>
          <div class="form-group"><label>Patients Treated</label>
            <input type="number" min="0" id="pdPatients" value="${d ? (d.patients ?? 0) : 0}"></div>
          <div class="form-group"><label>Rating (0–5)</label>
            <input type="number" min="0" max="5" step="0.1" id="pdRating"
                   value="${d ? (d.rating ?? 4.5) : 4.5}"></div>
          <div class="form-group"><label>Reviews Count</label>
            <input type="number" min="0" id="pdReviews" value="${d ? (d.reviews ?? 0) : 0}"></div>
          <div class="form-group"><label>Availability</label>
            <select id="pdAvail">
              <option value="true"${d && d.available ? ' selected' : ''}>Available</option>
              <option value="false"${d && !d.available ? ' selected' : ''}>Busy</option>
            </select>
          </div>
        </div>

        <div class="form-group"><label>Areas of Expertise (comma-separated)</label>
          <input type="text" id="pdExpertise"
                 value="${d && d.expertise ? esc(d.expertise.join(', ')) : ''}"
                 placeholder="Angioplasty, Heart Failure, Preventive Cardiology"></div>

        <div class="form-group"><label>Weekly Schedule</label>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:6px;">
            ${DAYS.map((day, i) => `
              <label style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:1.5px solid var(--border);border-radius:9px;cursor:pointer;font-size:11.5px;font-weight:700;color:var(--dark);background:#f9fcfd;">
                <input type="checkbox" data-sched="${i}" ${sched[i] ? 'checked' : ''}>
                ${day}
              </label>
            `).join('')}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> ${d ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    `);

    $('pdForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const name = $('pdName').value.trim();
      if (!name) return;

      const initials = name.replace(/^Dr\.?\s*/i, '')
        .split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

      const schedule = [];
      document.querySelectorAll('[data-sched]').forEach(cb => {
        schedule[Number(cb.dataset.sched)] = cb.checked;
      });

      const payload = {
        name,
        initials,
        dept:        $('pdDept').value.trim(),
        specialty:   $('pdSpecialty').value.trim(),
        experience:  $('pdExp').value.trim(),
        degree:      $('pdDegree').value.trim(),
        languages:   $('pdLang').value.trim(),
        patients:    Number($('pdPatients').value) || 0,
        rating:      Math.min(5, Math.max(0, Number($('pdRating').value) || 0)),
        reviews:     Number($('pdReviews').value) || 0,
        available:   $('pdAvail').value === 'true',
        expertise:   $('pdExpertise').value.split(',').map(s => s.trim()).filter(Boolean),
        schedule
      };

      const list = read(KEY, []);
      if (d) {
        const i = list.findIndex(x => x.id === d.id);
        list[i] = { ...list[i], ...payload };
      } else {
        list.push({ id: uid('D'), ...payload });
      }
      write(KEY, list);

      /* if this doctor was previously "deleted", un-delete it */
      const del = read(DEL_KEY, []).filter(x => x !== (d ? d.id : null));
      write(DEL_KEY, del);

      showToast(d ? 'Doctor updated' : 'Doctor added', 'success');
      closeModal();
      render();
    });
  }

  /* ---- events ---- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('#addPdBtn')) { openModal(); return; }

    const editBtn = e.target.closest('[data-pd-edit]');
    if (editBtn) { openModal(editBtn.dataset.pdEdit); return; }

    const delBtn = e.target.closest('[data-pd-del]');
    if (delBtn) {
      if (!confirm('Remove this doctor from the public website?')) return;
      const id = delBtn.dataset.pdDel;
      const all = read(KEY, []).filter(x => x.id !== id);
      write(KEY, all);
      const del = read(DEL_KEY, []);
      if (!del.includes(id)) del.push(id);
      write(DEL_KEY, del);
      showToast('Doctor removed', 'success');
      render();
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'pdSearch') {
      pdQuery = e.target.value.trim();
      render();
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'pdDeptFilter') render();
  });

  /* ---- title when navigated ---- */
  function watchPage() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName !== 'class') return;
        const el = m.target;
        if (!el.classList || !el.classList.contains('page') || !el.classList.contains('active')) return;
        if (el.id === 'page-public-doctors') {
          const t = document.getElementById('pageTitle');
          const s = document.getElementById('pageSubtitle');
          if (t) t.textContent = 'Public Doctors';
          if (s) s.textContent = 'Doctors shown on the public website';
          render();
        }
      });
    });
    document.querySelectorAll('.page').forEach(p => observer.observe(p, { attributes:true, attributeFilter:['class'] }));
  }

  /* ---- init ---- */
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