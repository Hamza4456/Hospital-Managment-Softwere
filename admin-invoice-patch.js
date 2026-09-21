/* =========================================================
   INVOICE MODAL PATCH
   - Patient account picker (auto-fills email + phone)
   - Mobile number with country code dropdown
   - Auto-selects country from Region & Currency settings
   - Saves to Billing store AND Patient Bills store
   Include AFTER admin-extras.js:
     <script src="admin-invoice-patch.js"></script>
========================================================= */
(function () {
  'use strict';
  if (!document.getElementById('appContainer')) return;
  console.log('[invoice-patch] loaded');

  var $ = function (id) { return document.getElementById(id); };

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  };

  var uid = function (p) {
    return p + '-' + Date.now().toString(36).toUpperCase() +
           Math.random().toString(36).slice(2, 5).toUpperCase();
  };

  var USERS_KEY    = 'medicare_users';
  var BILLS_KEY    = 'medicare_patient_bills_v1';
  var SETTINGS_KEY = 'medicare_global_settings';

  /* ---------- storage helpers ---------- */
  function read(k, fb) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; }
    catch (e) { return fb; }
  }
  function write(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
    try {
      window.dispatchEvent(new CustomEvent('medicare:changed', { detail: { key: k } }));
    } catch (e) {}
  }

  /* =====================================================
     COUNTRY LIST — with dial codes, used for the phone prefix
     (mirrors the one in global-support.js)
  ===================================================== */
  var COUNTRIES = [
    { code:'PK', name:'Pakistan',        dial:'+92'  },
    { code:'IN', name:'India',           dial:'+91'  },
    { code:'BD', name:'Bangladesh',      dial:'+880' },
    { code:'LK', name:'Sri Lanka',       dial:'+94'  },
    { code:'NP', name:'Nepal',           dial:'+977' },
    { code:'AF', name:'Afghanistan',     dial:'+93'  },
    { code:'CN', name:'China',           dial:'+86'  },
    { code:'JP', name:'Japan',           dial:'+81'  },
    { code:'KR', name:'South Korea',     dial:'+82'  },
    { code:'HK', name:'Hong Kong',       dial:'+852' },
    { code:'TW', name:'Taiwan',          dial:'+886' },
    { code:'ID', name:'Indonesia',       dial:'+62'  },
    { code:'MY', name:'Malaysia',        dial:'+60'  },
    { code:'SG', name:'Singapore',       dial:'+65'  },
    { code:'TH', name:'Thailand',        dial:'+66'  },
    { code:'VN', name:'Vietnam',         dial:'+84'  },
    { code:'PH', name:'Philippines',     dial:'+63'  },
    { code:'AE', name:'UAE',             dial:'+971' },
    { code:'SA', name:'Saudi Arabia',    dial:'+966' },
    { code:'QA', name:'Qatar',           dial:'+974' },
    { code:'KW', name:'Kuwait',          dial:'+965' },
    { code:'BH', name:'Bahrain',         dial:'+973' },
    { code:'OM', name:'Oman',            dial:'+968' },
    { code:'JO', name:'Jordan',          dial:'+962' },
    { code:'LB', name:'Lebanon',         dial:'+961' },
    { code:'IL', name:'Israel',          dial:'+972' },
    { code:'TR', name:'Turkey',          dial:'+90'  },
    { code:'IR', name:'Iran',            dial:'+98'  },
    { code:'IQ', name:'Iraq',            dial:'+964' },
    { code:'EG', name:'Egypt',           dial:'+20'  },
    { code:'ZA', name:'South Africa',    dial:'+27'  },
    { code:'NG', name:'Nigeria',         dial:'+234' },
    { code:'KE', name:'Kenya',           dial:'+254' },
    { code:'GH', name:'Ghana',           dial:'+233' },
    { code:'MA', name:'Morocco',         dial:'+212' },
    { code:'TN', name:'Tunisia',         dial:'+216' },
    { code:'DZ', name:'Algeria',         dial:'+213' },
    { code:'ET', name:'Ethiopia',        dial:'+251' },
    { code:'TZ', name:'Tanzania',        dial:'+255' },
    { code:'UG', name:'Uganda',          dial:'+256' },
    { code:'GB', name:'United Kingdom',  dial:'+44'  },
    { code:'DE', name:'Germany',         dial:'+49'  },
    { code:'FR', name:'France',          dial:'+33'  },
    { code:'IT', name:'Italy',           dial:'+39'  },
    { code:'ES', name:'Spain',           dial:'+34'  },
    { code:'NL', name:'Netherlands',     dial:'+31'  },
    { code:'BE', name:'Belgium',         dial:'+32'  },
    { code:'CH', name:'Switzerland',     dial:'+41'  },
    { code:'AT', name:'Austria',         dial:'+43'  },
    { code:'SE', name:'Sweden',          dial:'+46'  },
    { code:'NO', name:'Norway',          dial:'+47'  },
    { code:'DK', name:'Denmark',         dial:'+45'  },
    { code:'FI', name:'Finland',         dial:'+358' },
    { code:'IE', name:'Ireland',         dial:'+353' },
    { code:'PT', name:'Portugal',        dial:'+351' },
    { code:'GR', name:'Greece',          dial:'+30'  },
    { code:'PL', name:'Poland',          dial:'+48'  },
    { code:'CZ', name:'Czech Republic',  dial:'+420' },
    { code:'HU', name:'Hungary',         dial:'+36'  },
    { code:'RO', name:'Romania',         dial:'+40'  },
    { code:'RU', name:'Russia',          dial:'+7'   },
    { code:'UA', name:'Ukraine',         dial:'+380' },
    { code:'IS', name:'Iceland',         dial:'+354' },
    { code:'US', name:'United States',   dial:'+1'   },
    { code:'CA', name:'Canada',          dial:'+1'   },
    { code:'MX', name:'Mexico',          dial:'+52'  },
    { code:'BR', name:'Brazil',          dial:'+55'  },
    { code:'AR', name:'Argentina',       dial:'+54'  },
    { code:'CL', name:'Chile',           dial:'+56'  },
    { code:'CO', name:'Colombia',        dial:'+57'  },
    { code:'PE', name:'Peru',            dial:'+51'  },
    { code:'AU', name:'Australia',       dial:'+61'  },
    { code:'NZ', name:'New Zealand',     dial:'+64'  }
  ];

  /* =====================================================
     CURRENCY HELPERS
  ===================================================== */
  var SYMBOLS = {
    PKR:'₨', INR:'₹', BDT:'৳', LKR:'Rs', NPR:'रू', AFN:'؋', CNY:'¥', JPY:'¥',
    KRW:'₩', HKD:'HK$', TWD:'NT$', IDR:'Rp', MYR:'RM', SGD:'S$', THB:'฿',
    VND:'₫', PHP:'₱', AED:'د.إ', SAR:'﷼', QAR:'ر.ق', KWD:'د.ك', BHD:'BD',
    OMR:'ر.ع.', JOD:'JD', LBP:'ل.ل', ILS:'₪', TRY:'₺', IRR:'﷼', IQD:'ع.د',
    EGP:'E£', ZAR:'R', NGN:'₦', KES:'KSh', GHS:'₵', MAD:'DH', TND:'د.ت',
    DZD:'د.ج', ETB:'Br', TZS:'TSh', UGX:'USh', GBP:'£', EUR:'€', CHF:'CHF',
    SEK:'kr', NOK:'kr', DKK:'kr', PLN:'zł', CZK:'Kč', HUF:'Ft', RON:'lei',
    RUB:'₽', UAH:'₴', ISK:'kr', USD:'$', CAD:'C$', MXN:'MX$', BRL:'R$',
    ARS:'$', CLP:'$', COP:'$', PEN:'S/', AUD:'A$', NZD:'NZ$'
  };

  function currentSettings() {
    var s = read(SETTINGS_KEY, {}) || {};
    if (!s.country)  s.country  = 'PK';
    if (!s.currency) s.currency = 'PKR';
    return s;
  }
  function currentCurrency() {
    if (window.GlobalSupport && window.GlobalSupport.currentCurrency) {
      try { return window.GlobalSupport.currentCurrency(); } catch (e) {}
    }
    return currentSettings().currency;
  }
  function currencySymbol(code) {
    if (window.GlobalSupport && window.GlobalSupport.currencySymbol) {
      try { return window.GlobalSupport.currencySymbol(code); } catch (e) {}
    }
    return SYMBOLS[code] || code;
  }
  function currencyLabel() {
    var code = currentCurrency();
    var sym  = currencySymbol(code);
    return (sym && sym !== code) ? code + ' ' + sym : code;
  }
  function money(n) {
    if (window.GlobalSupport && window.GlobalSupport.money) {
      try { return window.GlobalSupport.money(n); } catch (e) {}
    }
    var code = currentCurrency();
    var num  = Number(n) || 0;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency', currency: code, maximumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return currencySymbol(code) + num.toFixed(2);
    }
  }

  /* =====================================================
     PATIENT ACCOUNTS
  ===================================================== */
  function getPatients() {
    return (read(USERS_KEY, []) || [])
      .filter(function (u) { return u && u.email; })
      .map(function (u) {
        return {
          name:  String(u.name  || '').trim(),
          email: String(u.email || '').trim().toLowerCase(),
          phone: String(u.phoneE164 || u.phone || '').trim()
        };
      })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function patientOpts() {
    var ps = getPatients();
    return '<option value="">— Select patient account —</option>' +
      ps.map(function (p) {
        return '<option value="' + esc(p.email) + '">' +
               esc(p.name || '(no name)') + ' — ' + esc(p.email) +
               '</option>';
      }).join('') +
      '<option value="__other__">— Other / type manually —</option>';
  }

  /* Build country code <option> list, with default = current settings.country */
  function countryOpts(selectedCode) {
    var sel = selectedCode || currentSettings().country || 'PK';
    return COUNTRIES.map(function (c) {
      return '<option value="' + c.code + '"' +
             (c.code === sel ? ' selected' : '') + '>' +
             c.dial + ' — ' + esc(c.name) + '</option>';
    }).join('');
  }

  /* Split an E.164 phone into { country, local } */
  function splitPhone(full) {
    var raw = String(full || '').trim();
    if (!raw) return { country: currentSettings().country, local: '' };

    /* If it already has + sign, try to match longest dial code */
    if (raw.charAt(0) === '+') {
      var sorted = COUNTRIES.slice().sort(function (a, b) {
        return b.dial.length - a.dial.length;
      });
      for (var i = 0; i < sorted.length; i++) {
        if (raw.indexOf(sorted[i].dial) === 0) {
          return {
            country: sorted[i].code,
            local: raw.slice(sorted[i].dial.length).replace(/\D/g, '')
          };
        }
      }
      return { country: currentSettings().country, local: raw.replace(/\D/g, '') };
    }

    return { country: currentSettings().country, local: raw.replace(/\D/g, '') };
  }

  /* =====================================================
     OVERRIDE openInvoiceModal
  ===================================================== */
  window.openInvoiceModal = function () {
    var db = (typeof DB !== 'undefined' && DB.get) ? DB.get() : { patients: [] };
    var settings = currentSettings();

    var fallbackOpts = (db.patients || []).map(function (p) {
      return '<option value="__name__' + esc(p.name) + '">' +
             esc(p.name) + ' (no account)</option>';
    }).join('');

    var currLabel = currencyLabel();

    showModal(
      '<div class="modal-header">' +
        '<h2>Create Invoice</h2>' +
        '<button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<form id="patchedInvoiceForm">' +

        /* ---- Patient picker ---- */
        '<div class="form-group">' +
          '<label>Patient Account *</label>' +
          '<select id="pInvPatient">' + patientOpts() +
            (fallbackOpts ? '<optgroup label="Patients (no account)">' + fallbackOpts + '</optgroup>' : '') +
          '</select>' +
        '</div>' +

        '<div class="form-group" id="pInvCustomWrap" style="display:none;">' +
          '<label>Custom Email *</label>' +
          '<input type="email" id="pInvCustomEmail" placeholder="patient@example.com">' +
        '</div>' +

        /* ---- Patient Name ---- */
        '<div class="form-group">' +
          '<label>Patient Name *</label>' +
          '<input type="text" id="pInvName" required>' +
        '</div>' +

        /* ---- Mobile number WITH country code ---- */
        '<div class="form-group">' +
          '<label>Mobile Number</label>' +
          '<div class="pInv-phone-row">' +
            '<select id="pInvPhoneCC" class="pInv-cc">' +
              countryOpts(settings.country) +
            '</select>' +
            '<input type="tel" id="pInvPhone" class="pInv-phone" ' +
                   'placeholder="3001234567" inputmode="tel" autocomplete="tel">' +
          '</div>' +
          '<div style="font-size:11.5px;color:#7a8b96;margin-top:4px;">' +
            '<i class="fas fa-info-circle"></i> ' +
            'Country code is auto-selected from <strong>Settings → Region &amp; Currency</strong>. You can change it above.' +
          '</div>' +
        '</div>' +

        /* ---- Amount ---- */
        '<div class="form-group">' +
          '<label>Amount in ' + esc(currLabel) + ' *</label>' +
          '<input type="number" id="pInvAmount" min="0" step="0.01" required ' +
                 'placeholder="0.00" inputmode="decimal">' +
          '<div style="font-size:12.5px;color:#5e7e8c;margin-top:6px;">' +
            '<i class="fas fa-coins" style="color:#0d6e9e;"></i> ' +
            'Will be saved as <strong id="pInvPreview">' + money(0) + '</strong>' +
          '</div>' +
        '</div>' +

        /* ---- Status ---- */
        '<div class="form-group">' +
          '<label>Status</label>' +
          '<select id="pInvStatus">' +
            '<option value="Pending">Pending</option>' +
            '<option value="Paid">Paid</option>' +
            '<option value="Overdue">Overdue</option>' +
          '</select>' +
        '</div>' +

        '<div style="background:#f5fafd;border-radius:10px;padding:10px 14px;' +
        'font-size:12.5px;color:#5e7e8c;margin-top:8px;">' +
          '<i class="fas fa-info-circle" style="color:#0d6e9e;"></i> ' +
          'Saves to the <strong>Billing</strong> table and appears on the patient\'s ' +
          '<strong>My Bills</strong> page when an account email is provided.' +
        '</div>' +

        '<div class="modal-footer">' +
          '<button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>' +
          '<button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Create</button>' +
        '</div>' +
      '</form>'
    );

    /* ---- live amount preview ---- */
    var amtInp = $('pInvAmount');
    var prevEl = $('pInvPreview');
    amtInp.addEventListener('input', function () {
      prevEl.textContent = money(Number(amtInp.value) || 0);
    });

    /* ---- Helper: set phone from a full string, splitting country code ---- */
    function setPhone(full) {
      var parts = splitPhone(full);
      $('pInvPhoneCC').value = parts.country;
      $('pInvPhone').value   = parts.local;
    }

    /* ---- Patient picker: auto-fill name + phone ---- */
    $('pInvPatient').addEventListener('change', function () {
      var v          = $('pInvPatient').value;
      var isOther    = v === '__other__';
      var isFallback = v.indexOf('__name__') === 0;

      $('pInvCustomWrap').style.display =
        (isOther || isFallback) ? 'block' : 'none';

      if (isFallback) {
        $('pInvName').value  = v.replace('__name__', '');
        $('pInvCustomEmail').value = '';
        $('pInvPhone').value = '';
        $('pInvPhoneCC').value = settings.country;
      } else if (!isOther && v) {
        var found = getPatients().filter(function (p) { return p.email === v; })[0];
        if (found) {
          $('pInvName').value = found.name || '';
          if (found.phone) setPhone(found.phone);
          else {
            $('pInvPhone').value   = '';
            $('pInvPhoneCC').value = settings.country;
          }
        }
      } else {
        /* user picked the empty "— Select patient —" option */
        $('pInvName').value    = '';
        $('pInvPhone').value   = '';
        $('pInvPhoneCC').value = settings.country;
      }
    });

    /* ---- Update placeholder whenever country code changes ---- */
    $('pInvPhoneCC').addEventListener('change', function () {
      var cc = $('pInvPhoneCC').value;
      var c  = COUNTRIES.filter(function (x) { return x.code === cc; })[0];
      $('pInvPhone').placeholder = c ? c.dial + ' …' : '+…';
      $('pInvPhone').focus();
    });

    /* ---- Submit ---- */
    $('patchedInvoiceForm').addEventListener('submit', function (e) {
      e.preventDefault();

      var sel        = $('pInvPatient').value;
      var isOther    = sel === '__other__';
      var isFallback = sel.indexOf('__name__') === 0;

      var patientEmail = (isOther || isFallback)
        ? $('pInvCustomEmail').value.trim().toLowerCase()
        : String(sel || '').trim().toLowerCase();

      var patientName = $('pInvName').value.trim();
      var amount      = Number($('pInvAmount').value) || 0;
      var status      = $('pInvStatus').value;

      /* Build full phone from CC + local digits */
      var ccCode  = $('pInvPhoneCC').value || settings.country;
      var ccObj   = COUNTRIES.filter(function (x) { return x.code === ccCode; })[0];
      var ccDial  = ccObj ? ccObj.dial : '';
      var local   = $('pInvPhone').value.replace(/\D/g, '');
      var fullPhone = local ? (ccDial + local) : '';

      if (!patientName) return showToast('Patient name is required', 'error');
      if (isOther && !patientEmail) return showToast('Please enter the patient email', 'error');
      if (!amount)      return showToast('Enter an amount', 'error');

      var dateStr = new Date().toISOString().split('T')[0];
      var code    = currentCurrency();

      /* 1. Billing store */
      if (typeof DB !== 'undefined' && DB.update) {
        DB.update(function (d) {
          d.invoices = d.invoices || [];
          d.invoices.push({
            id: 'INV-' + (2000 + d.invoices.length + 1),
            patient: patientName,
            phone: fullPhone,
            phoneCountry: ccCode,
            date: dateStr,
            amount: amount,
            status: status,
            currency: code
          });
        });
      }

      /* 2. Patient Bills store */
      if (patientEmail) {
        var list = read(BILLS_KEY, []);
        var year = new Date().getFullYear();
        var n = list.filter(function (b) {
          return (b.billNo || '').indexOf('PB-' + year) === 0;
        }).length;
        list.push({
          id: uid('PB'),
          billNo: 'PB-' + year + '-' + String(n + 1).padStart(4, '0'),
          patientName:  patientName,
          patientEmail: patientEmail,
          patientPhone: fullPhone,
          patientPhoneCountry: ccCode,
          items: [{ description: 'Hospital services', qty: 1, rate: amount, amount: amount }],
          total: amount,
          status: status === 'Paid' ? 'Paid' : 'Pending',
          notes: '',
          date: new Date().toISOString()
        });
        write(BILLS_KEY, list);
      }

      showToast(
        'Invoice created — ' + money(amount) +
        (patientEmail ? ' — visible on patient\'s My Bills page' : ''),
        'success'
      );
      closeModal();

      if (typeof window.renderBilling === 'function') window.renderBilling();

      var pbPage = document.getElementById('page-patient-bills');
      if (pbPage && pbPage.classList.contains('active')) {
        window.dispatchEvent(new CustomEvent('medicare:changed', {
          detail: { key: BILLS_KEY }
        }));
      }
    });
  };

  console.log('[invoice-patch] openInvoiceModal installed');
})();