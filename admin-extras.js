/* =========================================================
   ADMIN EXTRAS — Pharmacy (stock / purchases / prescriptions)
                + Patient Bills
   Injected at runtime. Does NOT modify any existing code.
   Include AFTER the main admin <script>:
     <script src="admin-extras.js"></script>
========================================================= */
(function () {
  'use strict';

  /* Only run on the admin dashboard */
  if (!document.getElementById('appContainer')) return;

  /* ---------- tiny helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const uid = (p) => p + '-' + Date.now().toString(36).toUpperCase()
                  + Math.random().toString(36).slice(2, 5).toUpperCase();

  /* currency-aware money() — falls back to USD if GlobalSupport isn't loaded */
  const money = (n) => (window.GlobalSupport && window.GlobalSupport.money)
    ? window.GlobalSupport.money(n)
    : ('$' + (Number(n) || 0).toFixed(2));

  /* ---------- storage keys ---------- */
  const KEYS = {
    MEDICINES:     'medicare_medicines_v1',
    PURCHASES:     'medicare_purchases_v1',
    PRESCRIPTIONS: 'medicare_prescriptions_v1',
    PATIENT_BILLS: 'medicare_patient_bills_v1',
    SEEDED:        'medicare_extras_seeded_v1',
    USERS:         'medicare_users'   /* from shared.js UserAuth */
  };

  const read  = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch { return fb; } };
  const write = (k, v) => {
    localStorage.setItem(k, JSON.stringify(v));
    try { window.dispatchEvent(new CustomEvent('medicare:changed', { detail: { key: k } })); } catch (e) {}
  };

  /* =========================================================
     PATIENT ACCOUNTS HELPERS (read from shared.js store)
  ========================================================= */
  function getPatientAccounts() {
    try {
      const raw = read(KEYS.USERS, []) || [];
      return raw
        .filter(u => u && u.email)
        .map(u => ({
          id:    u.id || '',
          name:  String(u.name || '').trim(),
          email: String(u.email || '').trim().toLowerCase()
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) { return []; }
  }

  function findAccountByEmail(email) {
    const e = String(email || '').trim().toLowerCase();
    if (!e) return null;
    return getPatientAccounts().find(a => a.email === e) || null;
  }

  /* Build options for the patient picker dropdown */
  function patientOptionsHTML(selectedEmail) {
    const accounts = getPatientAccounts();
    const sel = String(selectedEmail || '').trim().toLowerCase();
    const inList = accounts.some(a => a.email === sel);

    const opts = accounts.map(a =>
      `<option value="${esc(a.email)}"${a.email === sel ? ' selected' : ''}>` +
      `${esc(a.name || '(no name)')} — ${esc(a.email)}</option>`
    ).join('');

    const otherSelected = (sel && !inList) ? ' selected' : '';

    return `
      <option value="">— Select patient —</option>
      ${opts}
      <option value="__other__"${otherSelected}>— Other / type manually —</option>
    `;
  }

  /* ---------- seed on first run ---------- */
  function seedOnce() {
    if (localStorage.getItem(KEYS.SEEDED)) return;

    if (!read(KEYS.MEDICINES, null)) write(KEYS.MEDICINES, [
      { id:'MED-1', name:'Paracetamol', genericName:'Acetaminophen', category:'Tablet',
        batchNo:'PCM-001', expiryDate:'2026-12-31', unit:'tablet',
        stockQty:120, reorderLevel:30, purchasePrice:0.10, sellingPrice:0.25, supplier:'PharmaCo' },
      { id:'MED-2', name:'Amoxicillin', genericName:'Amoxicillin', category:'Capsule',
        batchNo:'AMX-114', expiryDate:'2025-11-15', unit:'capsule',
        stockQty:18, reorderLevel:25, purchasePrice:0.40, sellingPrice:0.90, supplier:'PharmaCo' },
      { id:'MED-3', name:'Ibuprofen', genericName:'Ibuprofen', category:'Tablet',
        batchNo:'IBU-220', expiryDate:'2027-04-30', unit:'tablet',
        stockQty:80, reorderLevel:20, purchasePrice:0.15, sellingPrice:0.30, supplier:'MediSupply' },
      { id:'MED-4', name:'Cough Syrup', genericName:'Dextromethorphan', category:'Syrup',
        batchNo:'CS-009', expiryDate:'2026-08-20', unit:'bottle',
        stockQty:12, reorderLevel:15, purchasePrice:1.80, sellingPrice:3.50, supplier:'MediSupply' }
    ]);

    if (!read(KEYS.PURCHASES, null))     write(KEYS.PURCHASES, []);
    if (!read(KEYS.PRESCRIPTIONS, null)) write(KEYS.PRESCRIPTIONS, []);
    if (!read(KEYS.PATIENT_BILLS, null)) write(KEYS.PATIENT_BILLS, []);

    localStorage.setItem(KEYS.SEEDED, '1');
  }

  /* =========================================================
     INJECT NAV ITEMS
  ========================================================= */
  function injectNav() {
    const sections = document.querySelectorAll('.nav-section');
    let ops = null;
    sections.forEach(s => {
      const lbl = s.querySelector('.nav-label');
      if (lbl && lbl.textContent.trim() === 'Operations') ops = s;
    });
    if (!ops || ops.querySelector('[data-page="pharmacy"]')) return;

    ops.insertAdjacentHTML('beforeend', `
      <a class="nav-item" data-page="pharmacy">
        <i class="fas fa-pills"></i> Pharmacy
        <span class="badge-count" id="navPharmCount" style="display:none;">0</span>
      </a>
      <a class="nav-item" data-page="patient-bills">
        <i class="fas fa-receipt"></i> Patient Bills
      </a>
    `);
  }

  /* =========================================================
     INJECT PAGES
  ========================================================= */
  function injectPages() {
    const main = document.querySelector('.main-content');
    if (!main || $('page-pharmacy')) return;

    const settings = $('page-settings');
    const rx = document.createElement('div');
    rx.className = 'page';
    rx.id = 'page-pharmacy';
    rx.innerHTML = pharmacyHTML();

    const bills = document.createElement('div');
    bills.className = 'page';
    bills.id = 'page-patient-bills';
    bills.innerHTML = patientBillsHTML();

    if (settings && settings.parentNode) {
      settings.parentNode.insertBefore(rx, settings.nextSibling);
      settings.parentNode.insertBefore(bills, rx.nextSibling);
    } else {
      main.appendChild(rx);
      main.appendChild(bills);
    }
  }

  /* =========================================================
     PHARMACY PAGE HTML
  ========================================================= */
  function pharmacyHTML() {
    return `
      <div class="mp-tabs">
        <button class="mp-tab active" data-ptab="stock"><i class="fas fa-boxes-stacked"></i> Stock</button>
        <button class="mp-tab" data-ptab="purchases"><i class="fas fa-truck-medical"></i> Purchases</button>
        <button class="mp-tab" data-ptab="prescriptions">
          <i class="fas fa-prescription"></i> Prescriptions
          <span class="cnt" id="ptabRxCnt">0</span>
        </button>
      </div>

      <!-- ============ STOCK ============ -->
      <div class="mp-tabpane active" data-pane="stock">
        <div class="stats-grid" id="pharmStats"></div>

        <div class="card">
          <div class="card-header">
            <h2><i class="fas fa-pills"></i> Medicine Stock</h2>
            <button class="btn btn-primary btn-sm" id="addMedicineBtn">
              <i class="fas fa-plus"></i> Add Medicine
            </button>
          </div>
          <div class="mp-filters">
            <div class="mp-search">
              <i class="fas fa-search"></i>
              <input type="text" id="medSearch" placeholder="Search medicine…">
            </div>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--gray);cursor:pointer;">
              <input type="checkbox" id="medLowOnly"> Low stock only
            </label>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th><th>Category</th><th>Batch</th><th>Expiry</th>
                  <th>Stock</th><th>Purchase</th><th>Selling</th><th>Actions</th>
                </tr>
              </thead>
              <tbody id="medTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============ PURCHASES ============ -->
      <div class="mp-tabpane" data-pane="purchases">
        <div class="card">
          <div class="card-header">
            <h2><i class="fas fa-cart-plus"></i> New Purchase</h2>
          </div>
          <form id="purchaseForm">
            <div class="mp-form-grid">
              <div class="form-group"><label>Invoice No</label>
                <input type="text" id="purInv" placeholder="auto if blank"></div>
              <div class="form-group"><label>Supplier</label>
                <input type="text" id="purSup"></div>
              <div class="form-group"><label>Payment</label>
                <select id="purPay">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div class="form-group"><label>Tax %</label>
                <input type="number" min="0" step="0.01" id="purTax" value="0"></div>
            </div>

            <div class="table-wrap" style="margin-top:16px;">
              <table>
                <thead><tr><th>Medicine</th><th>Qty</th><th>Unit Cost</th><th>Amount</th><th></th></tr></thead>
                <tbody id="purItems"></tbody>
              </table>
            </div>
            <div style="margin-top:12px;">
              <button type="button" class="btn btn-outline btn-sm" id="purAddRow">
                <i class="fas fa-plus"></i> Add Row
              </button>
            </div>

            <div class="stats-grid" style="margin-top:16px;">
              <div class="stat-card"><div class="stat-content">
                <p>Subtotal</p><h3 id="purSub" style="font-size:20px;">$0.00</h3>
              </div></div>
              <div class="stat-card"><div class="stat-content">
                <p>Tax</p><h3 id="purTaxAmt" style="font-size:20px;">$0.00</h3>
              </div></div>
              <div class="stat-card"><div class="stat-content">
                <p>Total</p><h3 id="purTotal" style="font-size:20px;color:var(--success);">$0.00</h3>
              </div></div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Save Purchase &amp; Add to Stock
              </button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="card-header"><h2><i class="fas fa-history"></i> Purchase History</h2></div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Invoice</th><th>Date</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody id="purHistoryBody"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============ PRESCRIPTIONS ============ -->
      <div class="mp-tabpane" data-pane="prescriptions">
        <div class="card">
          <div class="card-header">
            <h2><i class="fas fa-prescription"></i> Doctor Prescriptions</h2>
            <button class="btn btn-primary btn-sm" id="addRxBtn">
              <i class="fas fa-plus"></i> New Prescription
            </button>
          </div>
          <div class="mp-filters">
            <div class="chips" id="rxChips" style="display:flex; gap:8px; flex-wrap:wrap; flex:1;">
              <button class="chip active" data-rxfilter="all">All <span class="count" id="rxCntAll">0</span></button>
              <button class="chip" data-rxfilter="Pending">Pending <span class="count" id="rxCntPending">0</span></button>
              <button class="chip" data-rxfilter="Fulfilled">Fulfilled <span class="count" id="rxCntFulfilled">0</span></button>
              <button class="chip" data-rxfilter="Cancelled">Cancelled <span class="count" id="rxCntCancelled">0</span></button>
            </div>
          </div>
          <div id="rxList"></div>
        </div>
      </div>
    `;
  }

  /* =========================================================
     PATIENT BILLS PAGE HTML
  ========================================================= */
  function patientBillsHTML() {
    return `
      <div class="stats-grid" id="pbStats"></div>

      <div class="card">
        <div class="card-header">
          <h2><i class="fas fa-receipt"></i> Patient Bills</h2>
          <button class="btn btn-primary btn-sm" id="addBillBtn">
            <i class="fas fa-plus"></i> Create Bill
          </button>
        </div>
        <div class="mp-filters">
          <div class="mp-search">
            <i class="fas fa-search"></i>
            <input type="text" id="pbSearch" placeholder="Search patient, email…">
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bill No</th><th>Patient</th><th>Email</th><th>Items</th>
                <th>Total</th><th>Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody id="pbTableBody"></tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* =========================================================
     PHARMACY — STOCK RENDER
  ========================================================= */
  let medQuery   = '';
  let medLowOnly = false;

  function renderPharmacyStock() {
    const all = read(KEYS.MEDICINES, []);

    const lowList = all.filter(m => Number(m.stockQty) <= Number(m.reorderLevel));
    const outList = all.filter(m => Number(m.stockQty) <= 0);
    const totalValue = all.reduce((s, m) =>
      s + Number(m.stockQty || 0) * Number(m.purchasePrice || 0), 0);

    const stats = $('pharmStats');
    if (stats) stats.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon blue"><i class="fas fa-pills"></i></div>
        <div class="stat-content"><p>Total Medicines</p><h3>${all.length}</h3>
          <div class="stat-trend"><i class="fas fa-check"></i> In catalog</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><i class="fas fa-triangle-exclamation"></i></div>
        <div class="stat-content"><p>Low Stock</p><h3>${lowList.length}</h3>
          <div class="stat-trend down"><i class="fas fa-arrow-down"></i> Reorder soon</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i class="fas fa-ban"></i></div>
        <div class="stat-content"><p>Out of Stock</p><h3>${outList.length}</h3>
          <div class="stat-trend down"><i class="fas fa-exclamation"></i> Needs restocking</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-dollar-sign"></i></div>
        <div class="stat-content"><p>Stock Value</p><h3>${money(totalValue)}</h3>
          <div class="stat-trend"><i class="fas fa-arrow-up"></i> At purchase price</div>
        </div>
      </div>
    `;

    const q = medQuery.toLowerCase();
    const list = all.filter(m => {
      if (medLowOnly && !(Number(m.stockQty) <= Number(m.reorderLevel))) return false;
      if (!q) return true;
      return (m.name + ' ' + (m.genericName||'') + ' ' + (m.batchNo||'') + ' ' + (m.category||''))
        .toLowerCase().includes(q);
    });

    const tbody = $('medTableBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="mp-empty"><i class="fas fa-pills"></i>
        <h3>No medicines found</h3><p>Try a different search or add a new medicine.</p></div>
      </td></tr>`;
    } else {
      tbody.innerHTML = list.map(m => {
        const qty = Number(m.stockQty) || 0;
        const rl  = Number(m.reorderLevel) || 0;
        const out = qty <= 0;
        const low = !out && qty <= rl;
        const expired = m.expiryDate && new Date(m.expiryDate) < new Date();
        const rowCls = out ? 'row-out' : low ? 'row-low' : '';

        return `
          <tr class="${rowCls}">
            <td><strong>${esc(m.name)}</strong>
              ${m.genericName ? `<div style="font-size:12px;color:var(--gray);">${esc(m.genericName)}</div>` : ''}
            </td>
            <td>${esc(m.category || '—')}</td>
            <td>${esc(m.batchNo || '—')}</td>
            <td ${expired ? 'style="color:var(--danger);font-weight:700;"' : ''}>
              ${m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : '—'}
            </td>
            <td>
              <strong>${qty}</strong> ${esc(m.unit || '')}
              ${out ? '<span class="mp-badge out">OUT</span>'
                    : low ? '<span class="mp-badge low">LOW</span>' : ''}
            </td>
            <td>${money(m.purchasePrice)}</td>
            <td>${money(m.sellingPrice)}</td>
            <td>
              <button class="btn btn-outline btn-sm" data-med-adj="${m.id}" data-delta="-1" title="Decrease">−</button>
              <button class="btn btn-outline btn-sm" data-med-adj="${m.id}" data-delta="1" title="Increase">+</button>
              <button class="btn btn-outline btn-sm" data-med-edit="${m.id}" title="Edit"><i class="fas fa-edit"></i></button>
              <button class="btn btn-danger btn-sm" data-med-del="${m.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
          </tr>`;
      }).join('');
    }

    const navCount = $('navPharmCount');
    if (navCount) {
      if (lowList.length + outList.length > 0) {
        navCount.textContent = lowList.length + outList.length;
        navCount.style.display = '';
      } else {
        navCount.style.display = 'none';
      }
    }
  }

  /* =========================================================
     PHARMACY — PURCHASES RENDER
  ========================================================= */
  let purRows = [{ medicineId: '', name: '', qty: 1, unitCost: 0 }];

  function renderPurchaseRows() {
    const meds = read(KEYS.MEDICINES, []);
    const tbody = $('purItems');
    if (!tbody) return;

    tbody.innerHTML = purRows.map((r, idx) => `
      <tr>
        <td>
          <select data-pi="${idx}" data-pk="medicineId"
                  style="width:100%; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;">
            <option value="">Select medicine…</option>
            ${meds.map(m => `<option value="${esc(m.id)}"${r.medicineId === m.id ? ' selected' : ''}>
              ${esc(m.name)} (${m.stockQty} in stock)
            </option>`).join('')}
          </select>
        </td>
        <td>
          <input type="number" min="1" data-pi="${idx}" data-pk="qty"
                 value="${r.qty}" style="width:80px; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;">
        </td>
        <td>
          <input type="number" min="0" step="0.01" data-pi="${idx}" data-pk="unitCost"
                 value="${r.unitCost}" style="width:110px; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;">
        </td>
        <td>${money((Number(r.qty) || 0) * (Number(r.unitCost) || 0))}</td>
        <td>
          ${purRows.length > 1
            ? `<button type="button" class="btn btn-danger btn-sm" data-pur-remove="${idx}"><i class="fas fa-times"></i></button>`
            : ''}
        </td>
      </tr>
    `).join('');

    computePurchaseTotals();
  }

  function computePurchaseTotals() {
    const sub = purRows.reduce((s, r) =>
      s + (Number(r.qty) || 0) * (Number(r.unitCost) || 0), 0);
    const taxPct = Number($('purTax') && $('purTax').value) || 0;
    const taxAmt = (sub * taxPct) / 100;
    const total = sub + taxAmt;
    if ($('purSub'))    $('purSub').textContent    = money(sub);
    if ($('purTaxAmt')) $('purTaxAmt').textContent = money(taxAmt);
    if ($('purTotal'))  $('purTotal').textContent  = money(total);
  }

  function renderPurchaseHistory() {
    const list = read(KEYS.PURCHASES, []).slice().sort(
      (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

    const tbody = $('purHistoryBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="mp-empty"><i class="fas fa-truck-medical"></i>
        <h3>No purchases yet</h3><p>Purchases you save will appear here.</p></div>
      </td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(p => `
      <tr>
        <td><strong>${esc(p.invoiceNo)}</strong></td>
        <td>${new Date(p.purchaseDate).toLocaleDateString()}</td>
        <td>${esc(p.supplier || '—')}</td>
        <td>${p.items.length}</td>
        <td><strong>${money(p.totalAmount)}</strong></td>
        <td><span class="mp-badge ${p.paymentStatus}">${esc(p.paymentStatus)}</span></td>
      </tr>
    `).join('');
  }

  /* =========================================================
     PHARMACY — PRESCRIPTIONS RENDER
  ========================================================= */
  let rxFilter = 'all';

  function renderPrescriptions() {
    const all = read(KEYS.PRESCRIPTIONS, []).slice().sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const c = { Pending: 0, Fulfilled: 0, Cancelled: 0 };
    all.forEach(r => { if (c[r.status] !== undefined) c[r.status]++; });
    if ($('rxCntAll'))       $('rxCntAll').textContent       = all.length;
    if ($('rxCntPending'))   $('rxCntPending').textContent   = c.Pending;
    if ($('rxCntFulfilled')) $('rxCntFulfilled').textContent = c.Fulfilled;
    if ($('rxCntCancelled')) $('rxCntCancelled').textContent = c.Cancelled;
    if ($('ptabRxCnt'))      $('ptabRxCnt').textContent      = c.Pending;

    const list = rxFilter === 'all' ? all : all.filter(r => r.status === rxFilter);
    const host = $('rxList');
    if (!host) return;

    if (!list.length) {
      host.innerHTML = `<div class="mp-empty"><i class="fas fa-prescription"></i>
        <h3>No prescriptions</h3><p>Prescriptions written by doctors will show here.</p></div>`;
      return;
    }

    host.innerHTML = list.map(r => {
      const canFulfill = r.status === 'Pending';
      const canCancel  = r.status === 'Pending';
      return `
        <div class="mp-rx-card" data-status="${esc(r.status)}">
          <div class="mp-rx-top">
            <div>
              <div class="mp-rx-patient">${esc(r.patientName)}</div>
              <div class="mp-rx-sub">
                ${esc(r.patientEmail || '—')}${r.patientPhone ? ' · ' + esc(r.patientPhone) : ''}
              </div>
            </div>
            <span class="mp-badge ${r.status === 'Fulfilled' ? 'ok'
                                 : r.status === 'Cancelled' ? 'out' : 'warn'}">
              ${esc(r.status)}
            </span>
          </div>

          <div class="mp-rx-grid">
            <div class="mp-rx-cell"><div class="lbl">Doctor</div><div class="val">${esc(r.doctorName || '—')}</div></div>
            <div class="mp-rx-cell"><div class="lbl">Department</div><div class="val">${esc(r.department || '—')}</div></div>
            <div class="mp-rx-cell"><div class="lbl">Rx ID</div><div class="val">${esc(r.id)}</div></div>
            <div class="mp-rx-cell"><div class="lbl">Date</div><div class="val">${new Date(r.createdAt).toLocaleDateString()}</div></div>
          </div>

          <div class="mp-rx-items">
            <strong style="font-size:12px;color:var(--gray);text-transform:uppercase;letter-spacing:.4px;">Medicines</strong>
            <ul>${(r.medicines || []).map(m =>
              `<li><strong>${esc(m.name)}</strong> — Qty: ${m.qty}
                 ${m.dose ? ` · Dose: ${esc(m.dose)}` : ''}
                 ${m.duration ? ` · ${esc(m.duration)}` : ''}</li>`).join('')}
            </ul>
          </div>

          ${r.notes ? `<div style="padding:8px 0; font-size:13px; color:var(--gray);">
            <i class="fas fa-comment-medical" style="color:var(--primary);"></i> ${esc(r.notes)}
          </div>` : ''}

          <div class="mp-rx-actions">
            ${canFulfill ? `<button class="btn btn-success btn-sm" data-rx-act="fulfill" data-id="${esc(r.id)}">
              <i class="fas fa-check"></i> Fulfill &amp; Deduct Stock</button>` : ''}
            ${canCancel  ? `<button class="btn btn-danger btn-sm" data-rx-act="cancel" data-id="${esc(r.id)}">
              <i class="fas fa-times"></i> Cancel</button>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  /* =========================================================
     PATIENT BILLS RENDER
  ========================================================= */
  let pbQuery = '';

  function renderPatientBills() {
    const all = read(KEYS.PATIENT_BILLS, []).slice().sort(
      (a, b) => new Date(b.date) - new Date(a.date));

    const total   = all.reduce((s, b) => s + Number(b.total || 0), 0);
    const paid    = all.filter(b => b.status === 'Paid').reduce((s, b) => s + Number(b.total || 0), 0);
    const pending = all.filter(b => b.status !== 'Paid').reduce((s, b) => s + Number(b.total || 0), 0);

    const stats = $('pbStats');
    if (stats) stats.innerHTML = `
      <div class="stat-card"><div class="stat-icon green"><i class="fas fa-dollar-sign"></i></div>
        <div class="stat-content"><p>Total Billed</p><h3>${money(total)}</h3>
          <div class="stat-trend"><i class="fas fa-receipt"></i> All bills</div></div></div>
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-check-circle"></i></div>
        <div class="stat-content"><p>Paid</p><h3>${money(paid)}</h3>
          <div class="stat-trend"><i class="fas fa-check"></i> Collected</div></div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-clock"></i></div>
        <div class="stat-content"><p>Pending</p><h3>${money(pending)}</h3>
          <div class="stat-trend down"><i class="fas fa-exclamation"></i> Awaiting payment</div></div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-list"></i></div>
        <div class="stat-content"><p>Total Bills</p><h3>${all.length}</h3>
          <div class="stat-trend"><i class="fas fa-file-invoice"></i> Issued</div></div></div>
    `;

    const q = pbQuery.toLowerCase();
    const list = q
      ? all.filter(b => (b.patientName + ' ' + b.patientEmail + ' ' + b.billNo).toLowerCase().includes(q))
      : all;

    const tbody = $('pbTableBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8">
        <div class="mp-empty"><i class="fas fa-receipt"></i>
        <h3>No patient bills yet</h3>
        <p>Click <strong>Create Bill</strong> to send one to a patient.</p></div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(b => {
      const matched = !!findAccountByEmail(b.patientEmail);
      return `
      <tr>
        <td><strong>${esc(b.billNo)}</strong></td>
        <td>${esc(b.patientName)}</td>
        <td>
          ${esc(b.patientEmail)}
          ${matched
            ? '<span class="mp-badge ok" style="margin-left:6px;">linked</span>'
            : '<span class="mp-badge out" style="margin-left:6px;">no account</span>'}
        </td>
        <td>${(b.items || []).length}</td>
        <td><strong>${money(b.total)}</strong></td>
        <td>${new Date(b.date).toLocaleDateString()}</td>
        <td><span class="mp-badge ${b.status === 'Paid' ? 'paid' : 'pending'}">${esc(b.status)}</span></td>
        <td>
          ${b.status !== 'Paid'
            ? `<button class="btn btn-outline btn-sm" data-pb-paid="${esc(b.id)}" title="Mark paid"><i class="fas fa-check"></i></button>` : ''}
          <button class="btn btn-outline btn-sm" data-pb-edit="${esc(b.id)}" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm" data-pb-del="${esc(b.id)}" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  }

  /* =========================================================
     MODALS — ADD/EDIT MEDICINE
  ========================================================= */
  function openMedicineModal(editId) {
    const list = read(KEYS.MEDICINES, []);
    const m = editId ? list.find(x => x.id === editId) : null;

    showModal(`
      <div class="modal-header">
        <h2>${m ? 'Edit Medicine' : 'Add Medicine'}</h2>
        <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="extMedForm">
        <div class="form-group"><label>Name *</label>
          <input type="text" id="emName" required value="${m ? esc(m.name) : ''}"></div>
        <div class="mp-form-grid">
          <div class="form-group"><label>Generic Name</label>
            <input type="text" id="emGeneric" value="${m ? esc(m.genericName || '') : ''}"></div>
          <div class="form-group"><label>Category</label>
            <input type="text" id="emCat" value="${m ? esc(m.category || 'Tablet') : 'Tablet'}"></div>
          <div class="form-group"><label>Batch No</label>
            <input type="text" id="emBatch" value="${m ? esc(m.batchNo || '') : ''}"></div>
          <div class="form-group"><label>Expiry</label>
            <input type="date" id="emExp" value="${m && m.expiryDate ? String(m.expiryDate).slice(0,10) : ''}"></div>
          <div class="form-group"><label>Unit</label>
            <input type="text" id="emUnit" value="${m ? esc(m.unit || 'tablet') : 'tablet'}"></div>
          <div class="form-group"><label>Stock Qty</label>
            <input type="number" min="0" id="emQty" value="${m ? m.stockQty : 0}"></div>
          <div class="form-group"><label>Reorder Level</label>
            <input type="number" min="0" id="emReorder" value="${m ? m.reorderLevel : 20}"></div>
          <div class="form-group"><label>Purchase Price</label>
            <input type="number" min="0" step="0.01" id="emBuy" value="${m ? m.purchasePrice : 0}"></div>
          <div class="form-group"><label>Selling Price</label>
            <input type="number" min="0" step="0.01" id="emSell" value="${m ? m.sellingPrice : 0}"></div>
          <div class="form-group"><label>Supplier</label>
            <input type="text" id="emSup" value="${m ? esc(m.supplier || '') : ''}"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${m ? 'Update' : 'Save'}</button>
        </div>
      </form>
    `);

    $('extMedForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        name:          $('emName').value.trim(),
        genericName:   $('emGeneric').value.trim(),
        category:      $('emCat').value.trim(),
        batchNo:       $('emBatch').value.trim(),
        expiryDate:    $('emExp').value || null,
        unit:          $('emUnit').value.trim() || 'tablet',
        stockQty:      Number($('emQty').value) || 0,
        reorderLevel:  Number($('emReorder').value) || 20,
        purchasePrice: Number($('emBuy').value) || 0,
        sellingPrice:  Number($('emSell').value) || 0,
        supplier:      $('emSup').value.trim()
      };
      if (!payload.name) return;

      const meds = read(KEYS.MEDICINES, []);
      if (m) {
        const i = meds.findIndex(x => x.id === m.id);
        meds[i] = { ...meds[i], ...payload };
      } else {
        meds.push({ id: uid('MED'), ...payload });
      }
      write(KEYS.MEDICINES, meds);
      showToast(m ? 'Medicine updated' : 'Medicine added', 'success');
      closeModal();
      renderPharmacyStock();
      renderPurchaseRows();
    });
  }

  /* =========================================================
     MODALS — NEW PRESCRIPTION
  ========================================================= */
  function openRxModal() {
    const meds = read(KEYS.MEDICINES, []);
    const db = (typeof DB !== 'undefined' && DB.get) ? DB.get() : { doctors: [], departments: [] };
    const doctors = (db.doctors || []).map(d => d.name);
    const depts = (db.departments || []).map(d => d.name);

    let rxRows = [{ medicineId: '', name: '', qty: 1, dose: '1-0-1', duration: '5 days' }];

    function rowsHTML() {
      return rxRows.map((r, idx) => `
        <tr>
          <td>
            <select data-ri="${idx}" data-rk="medicineId"
                    style="width:100%; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;">
              <option value="">Select medicine…</option>
              ${meds.map(m => `<option value="${esc(m.id)}"${r.medicineId === m.id ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}
            </select>
          </td>
          <td><input type="number" min="1" data-ri="${idx}" data-rk="qty" value="${r.qty}"
                style="width:70px; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;"></td>
          <td><input type="text" data-ri="${idx}" data-rk="dose" value="${esc(r.dose)}"
                placeholder="1-0-1"
                style="width:80px; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;"></td>
          <td><input type="text" data-ri="${idx}" data-rk="duration" value="${esc(r.duration)}"
                placeholder="5 days"
                style="width:90px; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;"></td>
          <td>${rxRows.length > 1
            ? `<button type="button" class="btn btn-danger btn-sm" data-rx-rm="${idx}"><i class="fas fa-times"></i></button>` : ''}</td>
        </tr>`).join('');
    }

    function refresh() {
      $('rxItems').innerHTML = rowsHTML();
    }

    showModal(`
      <div class="modal-header">
        <h2>New Prescription</h2>
        <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="rxForm">
        <div class="form-group"><label>Patient Account *</label>
          <select id="rxPatientSelect">${patientOptionsHTML('')}</select>
        </div>
        <div class="form-group" id="rxCustomWrap" style="display:none;">
          <label>Custom Email *</label>
          <input type="email" id="rxCustomEmail" placeholder="patient@example.com">
        </div>
        <div class="mp-form-grid">
          <div class="form-group"><label>Patient Name *</label>
            <input type="text" id="rxPName" required></div>
          <div class="form-group"><label>Patient Phone</label>
            <input type="text" id="rxPPhone"></div>
          <div class="form-group"><label>Doctor</label>
            <select id="rxDoctor">
              <option value="">Select…</option>
              ${doctors.map(d => `<option>${esc(d)}</option>`).join('')}
              <option>Other</option>
            </select>
          </div>
          <div class="form-group"><label>Department</label>
            <select id="rxDept">
              <option value="">Select…</option>
              ${depts.map(d => `<option>${esc(d)}</option>`).join('')}
            </select>
          </div>
        </div>

        <label style="display:block; margin-top:14px; margin-bottom:8px; font-size:12px; font-weight:700; color:var(--gray); text-transform:uppercase;">Medicines</label>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Medicine</th><th>Qty</th><th>Dose</th><th>Duration</th><th></th></tr></thead>
            <tbody id="rxItems">${rowsHTML()}</tbody>
          </table>
        </div>
        <button type="button" class="btn btn-outline btn-sm" id="rxAddRow" style="margin-top:10px;">
          <i class="fas fa-plus"></i> Add Medicine
        </button>

        <div class="form-group" style="margin-top:14px;">
          <label>Notes</label>
          <textarea id="rxNotes" placeholder="Additional instructions…"></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Prescription</button>
        </div>
      </form>
    `);

    /* patient picker behaviour */
    $('rxPatientSelect').addEventListener('change', () => {
      const v = $('rxPatientSelect').value;
      const isOther = v === '__other__';
      $('rxCustomWrap').style.display = isOther ? 'block' : 'none';
      if (!isOther && v) {
        const acct = findAccountByEmail(v);
        if (acct) {
          $('rxPName').value = acct.name || '';
        }
      }
    });

    $('rxAddRow').addEventListener('click', () => {
      rxRows.push({ medicineId: '', name: '', qty: 1, dose: '', duration: '' });
      refresh();
    });

    $('rxItems').addEventListener('input', (e) => {
      const t = e.target;
      const i = Number(t.dataset.ri);
      if (Number.isNaN(i)) return;
      const k = t.dataset.rk;
      if (k === 'medicineId') {
        const med = meds.find(x => x.id === t.value);
        rxRows[i].medicineId = t.value;
        rxRows[i].name = med ? med.name : '';
      } else {
        rxRows[i][k] = t.value;
      }
    });

    $('rxItems').addEventListener('change', (e) => {
      if (e.target.tagName === 'SELECT') {
        $('rxItems').dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    $('rxItems').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-rx-rm]');
      if (!btn) return;
      rxRows.splice(Number(btn.dataset.rx-rm), 1);
      refresh();
    });

    $('rxForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const sel = $('rxPatientSelect').value;
      const isOther = sel === '__other__';
      const patientEmail = isOther
        ? $('rxCustomEmail').value.trim().toLowerCase()
        : String(sel || '').trim().toLowerCase();

      const patientName = $('rxPName').value.trim();
      if (!patientName) return showToast('Patient name is required', 'error');
      if (!patientEmail) return showToast('Please select or enter a patient email', 'error');

      const items = rxRows
        .filter(r => r.medicineId && Number(r.qty) > 0)
        .map(r => ({
          medicineId: r.medicineId,
          name: r.name,
          qty: Number(r.qty),
          dose: r.dose || '',
          duration: r.duration || ''
        }));

      if (!items.length) return showToast('Add at least one medicine', 'error');

      const list = read(KEYS.PRESCRIPTIONS, []);
      list.push({
        id: uid('RX'),
        patientName,
        patientEmail,
        patientPhone: $('rxPPhone').value.trim(),
        doctorName:   $('rxDoctor').value,
        department:   $('rxDept').value,
        medicines: items,
        notes: $('rxNotes').value.trim(),
        status: 'Pending',
        createdAt: new Date().toISOString(),
        fulfilledAt: null
      });
      write(KEYS.PRESCRIPTIONS, list);
      showToast('Prescription created', 'success');
      closeModal();
      renderPrescriptions();
    });
  }

  /* =========================================================
     MODALS — NEW PATIENT BILL
     Patient email is chosen from the signed-up accounts list
     so the bill always lands on the correct patient's account.
  ========================================================= */
  function openBillModal() {
    let items = [{ description: '', qty: 1, rate: 0 }];

    function rowsHTML() {
      return items.map((it, idx) => `
        <tr>
          <td><input type="text" data-bi="${idx}" data-bk="description" value="${esc(it.description)}"
                placeholder="Service / item"
                style="width:100%; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;"></td>
          <td><input type="number" min="1" data-bi="${idx}" data-bk="qty" value="${it.qty}"
                style="width:70px; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;"></td>
          <td><input type="number" min="0" step="0.01" data-bi="${idx}" data-bk="rate" value="${it.rate}"
                style="width:100px; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;"></td>
          <td>${money((Number(it.qty)||0) * (Number(it.rate)||0))}</td>
          <td>${items.length > 1
            ? `<button type="button" class="btn btn-danger btn-sm" data-bi-rm="${idx}"><i class="fas fa-times"></i></button>` : ''}</td>
        </tr>`).join('');
    }

    function refresh() {
      $('billItems').innerHTML = rowsHTML();
      const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
      $('billTotal').textContent = money(total);
    }

    showModal(`
      <div class="modal-header">
        <h2>Create Patient Bill</h2>
        <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="billForm">
        <div class="form-group"><label>Patient Account *</label>
          <select id="bPatientSelect">${patientOptionsHTML('')}</select>
          <div style="font-size:12px;color:var(--gray);margin-top:6px;">
            <i class="fas fa-info-circle"></i>
            Pick the patient account — the bill will appear automatically on their <strong>My Bills</strong> page.
          </div>
        </div>
        <div class="form-group" id="bCustomWrap" style="display:none;">
          <label>Custom Email *</label>
          <input type="email" id="bCustomEmail" placeholder="patient@example.com">
        </div>
        <div class="mp-form-grid">
          <div class="form-group"><label>Patient Name *</label>
            <input type="text" id="bPatientName" required></div>
          <div class="form-group"><label>Status</label>
            <select id="bStatus"><option value="Pending">Pending</option><option value="Paid">Paid</option></select>
          </div>
        </div>

        <label style="display:block; margin-top:14px; margin-bottom:8px; font-size:12px; font-weight:700; color:var(--gray); text-transform:uppercase;">Items</label>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
            <tbody id="billItems">${rowsHTML()}</tbody>
          </table>
        </div>
        <button type="button" class="btn btn-outline btn-sm" id="billAddRow" style="margin-top:10px;">
          <i class="fas fa-plus"></i> Add Item
        </button>

        <div class="stats-grid" style="margin-top:16px;">
          <div class="stat-card"><div class="stat-content">
            <p>Total</p><h3 id="billTotal" style="font-size:22px;color:var(--success);">$0.00</h3>
          </div></div>
        </div>

        <div class="form-group" style="margin-top:14px;">
          <label>Notes</label>
          <textarea id="bNotes" placeholder="Payment notes…"></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Send Bill</button>
        </div>
      </form>
    `);

    /* patient picker: auto-fill name, show custom email when "Other" */
    $('bPatientSelect').addEventListener('change', () => {
      const v = $('bPatientSelect').value;
      const isOther = v === '__other__';
      $('bCustomWrap').style.display = isOther ? 'block' : 'none';
      if (!isOther && v) {
        const acct = findAccountByEmail(v);
        if (acct) $('bPatientName').value = acct.name || '';
      }
    });

    $('billAddRow').addEventListener('click', () => {
      items.push({ description: '', qty: 1, rate: 0 });
      refresh();
    });

    $('billItems').addEventListener('input', (e) => {
      const t = e.target;
      const i = Number(t.dataset.bi);
      if (Number.isNaN(i)) return;
      items[i][t.dataset.bk] = t.value;
      refresh();
    });

    $('billItems').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-bi-rm]');
      if (!btn) return;
      items.splice(Number(btn.dataset.bi-rm), 1);
      refresh();
    });

    $('billForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const sel = $('bPatientSelect').value;
      const isOther = sel === '__other__';
      const patientEmail = isOther
        ? $('bCustomEmail').value.trim().toLowerCase()
        : String(sel || '').trim().toLowerCase();
      const patientName = $('bPatientName').value.trim();
      const status = $('bStatus').value;
      const notes = $('bNotes').value.trim();

      if (!patientEmail) return showToast('Please select or enter a patient email', 'error');
      if (!patientName)  return showToast('Patient name is required', 'error');

      const norm = items
        .filter(i => i.description || Number(i.rate) > 0)
        .map(i => ({
          description: i.description || 'Item',
          qty: Number(i.qty) || 1,
          rate: Number(i.rate) || 0,
          amount: +((Number(i.qty) || 1) * (Number(i.rate) || 0)).toFixed(2)
        }));
      if (!norm.length) return showToast('Add at least one item', 'error');

      const total = +norm.reduce((s, i) => s + i.amount, 0).toFixed(2);
      const list = read(KEYS.PATIENT_BILLS, []);
      const year = new Date().getFullYear();
      const n = list.filter(b => (b.billNo || '').startsWith('PB-' + year)).length;

      list.push({
        id: uid('PB'),
        billNo: `PB-${year}-${String(n + 1).padStart(4, '0')}`,
        patientName,
        patientEmail,
        items: norm,
        total,
        status,
        notes,
        date: new Date().toISOString()
      });
      write(KEYS.PATIENT_BILLS, list);
      showToast('Bill sent to ' + patientEmail, 'success');
      closeModal();
      renderPatientBills();
    });
  }

  /* =========================================================
     MODALS — EDIT PATIENT BILL
  ========================================================= */
  function openEditBillModal(id) {
    const list = read(KEYS.PATIENT_BILLS, []);
    const b = list.find(x => x.id === id);
    if (!b) return;

    let items = (b.items && b.items.length)
      ? b.items.map(i => ({ ...i }))
      : [{ description: '', qty: 1, rate: 0 }];

    function rowsHTML() {
      return items.map((it, idx) => `
        <tr>
          <td><input type="text" data-bi="${idx}" data-bk="description" value="${esc(it.description)}"
                style="width:100%; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;"></td>
          <td><input type="number" min="1" data-bi="${idx}" data-bk="qty" value="${it.qty}"
                style="width:70px; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;"></td>
          <td><input type="number" min="0" step="0.01" data-bi="${idx}" data-bk="rate" value="${it.rate}"
                style="width:100px; padding:8px 10px; border-radius:9px; border:1px solid var(--border); font-family:inherit;"></td>
          <td>${money((Number(it.qty)||0) * (Number(it.rate)||0))}</td>
          <td>${items.length > 1
            ? `<button type="button" class="btn btn-danger btn-sm" data-bi-rm="${idx}"><i class="fas fa-times"></i></button>` : ''}</td>
        </tr>`).join('');
    }

    function refresh() {
      $('ebItems').innerHTML = rowsHTML();
      const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
      $('ebTotal').textContent = money(total);
    }

    /* current email — detect whether it matches a real account */
    const curEmail = String(b.patientEmail || '').trim().toLowerCase();
    const curInList = !!findAccountByEmail(curEmail);

    showModal(`
      <div class="modal-header">
        <h2>Edit Bill ${esc(b.billNo)}</h2>
        <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="editBillForm">
        <div class="form-group"><label>Patient Account *</label>
          <select id="ebPatientSelect">${patientOptionsHTML(curEmail)}</select>
        </div>
        <div class="form-group" id="ebCustomWrap" style="display:${curInList ? 'none' : 'block'};">
          <label>Custom Email *</label>
          <input type="email" id="ebCustomEmail" value="${curInList ? '' : esc(curEmail)}"
                 placeholder="patient@example.com">
        </div>
        <div class="mp-form-grid">
          <div class="form-group"><label>Patient Name *</label>
            <input type="text" id="ebPatientName" required value="${esc(b.patientName)}"></div>
          <div class="form-group"><label>Status</label>
            <select id="ebStatus">
              <option value="Pending"${b.status === 'Pending' ? ' selected' : ''}>Pending</option>
              <option value="Paid"${b.status === 'Paid' ? ' selected' : ''}>Paid</option>
            </select>
          </div>
        </div>

        <label style="display:block; margin-top:14px; margin-bottom:8px; font-size:12px; font-weight:700; color:var(--gray); text-transform:uppercase;">Items</label>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
            <tbody id="ebItems">${rowsHTML()}</tbody>
          </table>
        </div>
        <button type="button" class="btn btn-outline btn-sm" id="ebAddRow" style="margin-top:10px;">
          <i class="fas fa-plus"></i> Add Item
        </button>

        <div class="stats-grid" style="margin-top:16px;">
          <div class="stat-card"><div class="stat-content">
            <p>Total</p><h3 id="ebTotal" style="font-size:22px;color:var(--success);">$0.00</h3>
          </div></div>
        </div>

        <div class="form-group" style="margin-top:14px;">
          <label>Notes</label>
          <textarea id="ebNotes">${esc(b.notes || '')}</textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Changes</button>
        </div>
      </form>
    `);

    /* picker behaviour */
    $('ebPatientSelect').addEventListener('change', () => {
      const v = $('ebPatientSelect').value;
      const isOther = v === '__other__';
      $('ebCustomWrap').style.display = isOther ? 'block' : 'none';
      if (!isOther && v) {
        const acct = findAccountByEmail(v);
        if (acct) $('ebPatientName').value = acct.name || $('ebPatientName').value;
      }
    });

    $('ebAddRow').addEventListener('click', () => {
      items.push({ description: '', qty: 1, rate: 0 });
      refresh();
    });

    $('ebItems').addEventListener('input', (e) => {
      const t = e.target;
      const i = Number(t.dataset.bi);
      if (Number.isNaN(i)) return;
      items[i][t.dataset.bk] = t.value;
      refresh();
    });

    $('ebItems').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-bi-rm]');
      if (!btn) return;
      items.splice(Number(btn.dataset.bi-rm), 1);
      refresh();
    });

    refresh();

    $('editBillForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const sel = $('ebPatientSelect').value;
      const isOther = sel === '__other__';
      const patientEmail = isOther
        ? $('ebCustomEmail').value.trim().toLowerCase()
        : String(sel || '').trim().toLowerCase();
      const patientName = $('ebPatientName').value.trim();
      const status      = $('ebStatus').value;
      const notes       = $('ebNotes').value.trim();

      if (!patientEmail) return showToast('Please select or enter a patient email', 'error');
      if (!patientName)  return showToast('Patient name is required', 'error');

      const norm = items
        .filter(i => i.description || Number(i.rate) > 0)
        .map(i => ({
          description: i.description || 'Item',
          qty: Number(i.qty) || 1,
          rate: Number(i.rate) || 0,
          amount: +((Number(i.qty) || 1) * (Number(i.rate) || 0)).toFixed(2)
        }));
      if (!norm.length) return showToast('Add at least one item', 'error');

      const total = +norm.reduce((s, i) => s + i.amount, 0).toFixed(2);

      const all = read(KEYS.PATIENT_BILLS, []);
      const idx = all.findIndex(x => x.id === id);
      if (idx === -1) return;

      all[idx] = { ...all[idx], patientName, patientEmail, items: norm, total, status, notes };
      write(KEYS.PATIENT_BILLS, all);
      showToast('Bill updated', 'success');
      closeModal();
      renderPatientBills();
    });
  }

  /* =========================================================
     CORE ACTIONS
  ========================================================= */
  function savePurchase(e) {
    e.preventDefault();
    const items = purRows
      .filter(r => r.medicineId && Number(r.qty) > 0)
      .map(r => ({
        medicineId: r.medicineId,
        name: r.name,
        qty: Number(r.qty),
        unitCost: Number(r.unitCost)
      }));
    if (!items.length) return showToast('Add at least one medicine', 'error');

    const sub = +items.reduce((s, i) => s + i.qty * i.unitCost, 0).toFixed(2);
    const taxPct = Number($('purTax').value) || 0;
    const taxAmt = +((sub * taxPct) / 100).toFixed(2);
    const total = +(sub + taxAmt).toFixed(2);

    const purchase = {
      id: uid('PO'),
      invoiceNo: $('purInv').value.trim() || ('PO-' + Date.now().toString(36).toUpperCase()),
      supplier:  $('purSup').value.trim(),
      items,
      subTotal: sub,
      taxPercent: taxPct,
      taxAmount: taxAmt,
      totalAmount: total,
      purchaseDate: new Date().toISOString(),
      paymentStatus: $('purPay').value
    };

    const meds = read(KEYS.MEDICINES, []);
    items.forEach(it => {
      const m = meds.find(x => x.id === it.medicineId);
      if (!m) return;
      m.stockQty = Number(m.stockQty || 0) + it.qty;
      m.purchasePrice = it.unitCost;
      if (purchase.supplier) m.supplier = purchase.supplier;
    });
    write(KEYS.MEDICINES, meds);

    const purchases = read(KEYS.PURCHASES, []);
    purchases.push(purchase);
    write(KEYS.PURCHASES, purchases);

    $('purchaseForm').reset();
    purRows = [{ medicineId: '', name: '', qty: 1, unitCost: 0 }];
    renderPurchaseRows();
    renderPurchaseHistory();
    renderPharmacyStock();
    showToast('Purchase saved — stock updated', 'success');
  }

  function fulfillPrescription(id) {
    const list = read(KEYS.PRESCRIPTIONS, []);
    const rx = list.find(r => r.id === id);
    if (!rx || rx.status !== 'Pending') return;

    const meds = read(KEYS.MEDICINES, []);

    for (const item of rx.medicines) {
      const m = meds.find(x => x.id === item.medicineId);
      if (!m) return showToast(`Medicine not found: ${item.name}`, 'error');
      if (Number(m.stockQty) < item.qty) {
        return showToast(`Only ${m.stockQty} ${m.unit}(s) of ${m.name} left`, 'error');
      }
    }

    rx.medicines.forEach(item => {
      const m = meds.find(x => x.id === item.medicineId);
      if (m) m.stockQty = Number(m.stockQty) - item.qty;
    });
    write(KEYS.MEDICINES, meds);

    rx.status = 'Fulfilled';
    rx.fulfilledAt = new Date().toISOString();
    write(KEYS.PRESCRIPTIONS, list);

    if (rx.patientEmail) {
      const billItems = rx.medicines.map(m => {
        const med = meds.find(x => x.id === m.medicineId);
        const rate = med ? Number(med.sellingPrice) || 0 : 0;
        return {
          description: `${m.name} × ${m.qty}${m.dose ? ' (' + m.dose + ')' : ''}`,
          qty: m.qty,
          rate,
          amount: +(m.qty * rate).toFixed(2)
        };
      });
      const total = +billItems.reduce((s, i) => s + i.amount, 0).toFixed(2);
      const bills = read(KEYS.PATIENT_BILLS, []);
      const year = new Date().getFullYear();
      const n = bills.filter(b => (b.billNo || '').startsWith('PB-' + year)).length;
      bills.push({
        id: uid('PB'),
        billNo: `PB-${year}-${String(n + 1).padStart(4, '0')}`,
        patientName: rx.patientName,
        patientEmail: rx.patientEmail.toLowerCase(),
        items: billItems,
        total,
        status: 'Pending',
        notes: `Pharmacy fulfillment of ${rx.id}`,
        date: new Date().toISOString()
      });
      write(KEYS.PATIENT_BILLS, bills);
      showToast('Prescription fulfilled — bill sent to patient', 'success');
    } else {
      showToast('Prescription fulfilled — stock updated', 'success');
    }

    renderPrescriptions();
    renderPharmacyStock();
    renderPatientBills();
  }

  /* =========================================================
     WATCH PAGE CHANGES
  ========================================================= */
  function watchPageChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName !== 'class') return;
        const el = m.target;
        if (!el.classList) return;
        if (!el.classList.contains('page') || !el.classList.contains('active')) return;

        const pageId = el.id.replace('page-', '');
        if (pageId === 'pharmacy') {
          const t = document.getElementById('pageTitle');
          const s = document.getElementById('pageSubtitle');
          if (t) t.textContent = 'Pharmacy';
          if (s) s.textContent = 'Stock, purchases, and doctor prescriptions';
          renderPharmacyStock();
          renderPurchaseRows();
          renderPurchaseHistory();
          renderPrescriptions();
        }
        if (pageId === 'patient-bills') {
          const t = document.getElementById('pageTitle');
          const s = document.getElementById('pageSubtitle');
          if (t) t.textContent = 'Patient Bills';
          if (s) s.textContent = 'Bills visible in each patient\u2019s "My Bills" page';
          renderPatientBills();
        }
      });
    });

    document.querySelectorAll('.page').forEach(p => {
      observer.observe(p, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* =========================================================
     EVENT BINDING
  ========================================================= */
  function bindEvents() {
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('#page-pharmacy .mp-tab');
      if (tab) {
        document.querySelectorAll('#page-pharmacy .mp-tab')
          .forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#page-pharmacy .mp-tabpane')
          .forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const pane = document.querySelector(`#page-pharmacy .mp-tabpane[data-pane="${tab.dataset.ptab}"]`);
        if (pane) pane.classList.add('active');
        if (tab.dataset.ptab === 'purchases') { renderPurchaseRows(); renderPurchaseHistory(); }
        if (tab.dataset.ptab === 'prescriptions') renderPrescriptions();
        return;
      }

      const chip = e.target.closest('#rxChips .chip');
      if (chip) {
        document.querySelectorAll('#rxChips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        rxFilter = chip.dataset.rxfilter;
        renderPrescriptions();
        return;
      }

      if (e.target.closest('#addMedicineBtn')) { openMedicineModal(); return; }

      const adjBtn = e.target.closest('[data-med-adj]');
      if (adjBtn) {
        const id = adjBtn.dataset.medAdj;
        const delta = Number(adjBtn.dataset.delta);
        const meds = read(KEYS.MEDICINES, []);
        const i = meds.findIndex(x => x.id === id);
        if (i > -1) {
          meds[i].stockQty = Math.max(0, Number(meds[i].stockQty || 0) + delta);
          write(KEYS.MEDICINES, meds);
          renderPharmacyStock();
        }
        return;
      }

      const editBtn = e.target.closest('[data-med-edit]');
      if (editBtn) { openMedicineModal(editBtn.dataset.medEdit); return; }

      const delBtn = e.target.closest('[data-med-del]');
      if (delBtn) {
        if (!confirm('Delete this medicine from the catalog?')) return;
        const meds = read(KEYS.MEDICINES, [])
          .filter(x => x.id !== delBtn.dataset.medDel);
        write(KEYS.MEDICINES, meds);
        showToast('Medicine removed', 'success');
        renderPharmacyStock();
        renderPurchaseRows();
        return;
      }

      const pRem = e.target.closest('[data-pur-remove]');
      if (pRem) {
        purRows.splice(Number(pRem.dataset.purRemove), 1);
        renderPurchaseRows();
        return;
      }

      if (e.target.closest('#purAddRow')) {
        purRows.push({ medicineId: '', name: '', qty: 1, unitCost: 0 });
        renderPurchaseRows();
        return;
      }

      if (e.target.closest('#addRxBtn')) { openRxModal(); return; }

      const rxAct = e.target.closest('[data-rx-act]');
      if (rxAct) {
        const id = rxAct.dataset.id;
        const act = rxAct.dataset.rxAct;
        if (act === 'fulfill') fulfillPrescription(id);
        if (act === 'cancel') {
          if (!confirm('Cancel this prescription?')) return;
          const list = read(KEYS.PRESCRIPTIONS, []);
          const rx = list.find(r => r.id === id);
          if (rx) { rx.status = 'Cancelled'; write(KEYS.PRESCRIPTIONS, list); }
          showToast('Prescription cancelled', 'error');
          renderPrescriptions();
        }
        return;
      }

      if (e.target.closest('#addBillBtn')) { openBillModal(); return; }

      const pbEdit = e.target.closest('[data-pb-edit]');
      if (pbEdit) { openEditBillModal(pbEdit.dataset.pbEdit); return; }

      const paidBtn = e.target.closest('[data-pb-paid]');
      if (paidBtn) {
        const list = read(KEYS.PATIENT_BILLS, []);
        const b = list.find(x => x.id === paidBtn.dataset.pbPaid);
        if (b) { b.status = 'Paid'; write(KEYS.PATIENT_BILLS, list); }
        showToast('Bill marked paid', 'success');
        renderPatientBills();
        return;
      }

      const pbDel = e.target.closest('[data-pb-del]');
      if (pbDel) {
        if (!confirm('Delete this bill?')) return;
        const list = read(KEYS.PATIENT_BILLS, [])
          .filter(x => x.id !== pbDel.dataset.pbDel);
        write(KEYS.PATIENT_BILLS, list);
        showToast('Bill deleted', 'success');
        renderPatientBills();
        return;
      }
    });

    document.addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'medSearch') { medQuery = t.value.trim(); renderPharmacyStock(); }
      if (t.id === 'medLowOnly') { medLowOnly = t.checked; renderPharmacyStock(); }
      if (t.id === 'pbSearch') { pbQuery = t.value.trim(); renderPatientBills(); }
      if (t.id === 'purTax') computePurchaseTotals();

      if (t.dataset && t.dataset.pi !== undefined) {
        const i = Number(t.dataset.pi);
        const k = t.dataset.pk;
        if (Number.isNaN(i)) return;
        if (k === 'medicineId') {
          const meds = read(KEYS.MEDICINES, []);
          const med = meds.find(x => x.id === t.value);
          purRows[i].medicineId = t.value;
          purRows[i].name = med ? med.name : '';
          purRows[i].unitCost = med ? Number(med.purchasePrice) || 0 : 0;
          renderPurchaseRows();
        } else {
          purRows[i][k] = t.value;
          const tr = t.closest('tr');
          if (tr && tr.children[3]) {
            tr.children[3].textContent =
              money((Number(purRows[i].qty) || 0) * (Number(purRows[i].unitCost) || 0));
          }
          computePurchaseTotals();
        }
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'medLowOnly') { medLowOnly = e.target.checked; renderPharmacyStock(); }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'purchaseForm') savePurchase(e);
    });
  }

  /* =========================================================
     INIT
  ========================================================= */
  function init() {
    if (!document.getElementById('appContainer')) return;
    seedOnce();
    injectNav();
    injectPages();
    watchPageChanges();
    bindEvents();

    renderPharmacyStock();
    renderPurchaseHistory();
    renderPrescriptions();
    renderPatientBills();

    const origInit = window.initApp;
    if (typeof origInit === 'function') {
      window.initApp = function () {
        origInit.apply(this, arguments);
        renderPharmacyStock();
        renderPurchaseHistory();
        renderPrescriptions();
        renderPatientBills();
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();