/* =========================================================
   GLOBAL SUPPORT — countries, currency, admin Region & Currency
   card, topbar currency pill, + signup phone picker.
   Load right AFTER shared.js on every page:
     <script src="shared.js"></script>
     <script src="global-support.js?v=9"></script>
========================================================= */
(function () {
  'use strict';
  console.log('[global-support] loading…');

  /* =====================================================
     COUNTRY DATABASE (74 countries)
  ===================================================== */
  const COUNTRIES = [
    { code:'PK', name:'Pakistan',        dial:'+92',  currency:'PKR', symbol:'₨',    len:10 },
    { code:'IN', name:'India',           dial:'+91',  currency:'INR', symbol:'₹',    len:10 },
    { code:'BD', name:'Bangladesh',      dial:'+880', currency:'BDT', symbol:'৳',    len:10 },
    { code:'LK', name:'Sri Lanka',       dial:'+94',  currency:'LKR', symbol:'Rs',   len:9  },
    { code:'NP', name:'Nepal',           dial:'+977', currency:'NPR', symbol:'रू',    len:10 },
    { code:'AF', name:'Afghanistan',     dial:'+93',  currency:'AFN', symbol:'؋',    len:9  },
    { code:'CN', name:'China',           dial:'+86',  currency:'CNY', symbol:'¥',    len:11 },
    { code:'JP', name:'Japan',           dial:'+81',  currency:'JPY', symbol:'¥',    len:10 },
    { code:'KR', name:'South Korea',     dial:'+82',  currency:'KRW', symbol:'₩',    len:10 },
    { code:'HK', name:'Hong Kong',       dial:'+852', currency:'HKD', symbol:'HK$',  len:8  },
    { code:'TW', name:'Taiwan',          dial:'+886', currency:'TWD', symbol:'NT$',  len:9  },
    { code:'ID', name:'Indonesia',       dial:'+62',  currency:'IDR', symbol:'Rp',   len:11 },
    { code:'MY', name:'Malaysia',        dial:'+60',  currency:'MYR', symbol:'RM',   len:10 },
    { code:'SG', name:'Singapore',       dial:'+65',  currency:'SGD', symbol:'S$',   len:8  },
    { code:'TH', name:'Thailand',        dial:'+66',  currency:'THB', symbol:'฿',    len:9  },
    { code:'VN', name:'Vietnam',         dial:'+84',  currency:'VND', symbol:'₫',    len:10 },
    { code:'PH', name:'Philippines',     dial:'+63',  currency:'PHP', symbol:'₱',    len:10 },
    { code:'AE', name:'UAE',             dial:'+971', currency:'AED', symbol:'د.إ', len:9  },
    { code:'SA', name:'Saudi Arabia',    dial:'+966', currency:'SAR', symbol:'﷼',    len:9  },
    { code:'QA', name:'Qatar',           dial:'+974', currency:'QAR', symbol:'ر.ق',  len:8  },
    { code:'KW', name:'Kuwait',          dial:'+965', currency:'KWD', symbol:'د.ك',  len:8  },
    { code:'BH', name:'Bahrain',         dial:'+973', currency:'BHD', symbol:'BD',   len:8  },
    { code:'OM', name:'Oman',            dial:'+968', currency:'OMR', symbol:'ر.ع.', len:8  },
    { code:'JO', name:'Jordan',          dial:'+962', currency:'JOD', symbol:'JD',   len:9  },
    { code:'LB', name:'Lebanon',         dial:'+961', currency:'LBP', symbol:'ل.ل',  len:8  },
    { code:'IL', name:'Israel',          dial:'+972', currency:'ILS', symbol:'₪',    len:9  },
    { code:'TR', name:'Turkey',          dial:'+90',  currency:'TRY', symbol:'₺',    len:10 },
    { code:'IR', name:'Iran',            dial:'+98',  currency:'IRR', symbol:'﷼',    len:10 },
    { code:'IQ', name:'Iraq',            dial:'+964', currency:'IQD', symbol:'ع.د',  len:10 },
    { code:'EG', name:'Egypt',           dial:'+20',  currency:'EGP', symbol:'E£',   len:10 },
    { code:'ZA', name:'South Africa',    dial:'+27',  currency:'ZAR', symbol:'R',    len:9  },
    { code:'NG', name:'Nigeria',         dial:'+234', currency:'NGN', symbol:'₦',    len:10 },
    { code:'KE', name:'Kenya',           dial:'+254', currency:'KES', symbol:'KSh',  len:9  },
    { code:'GH', name:'Ghana',           dial:'+233', currency:'GHS', symbol:'₵',    len:9  },
    { code:'MA', name:'Morocco',         dial:'+212', currency:'MAD', symbol:'DH',   len:9  },
    { code:'TN', name:'Tunisia',         dial:'+216', currency:'TND', symbol:'د.ت',  len:8  },
    { code:'DZ', name:'Algeria',         dial:'+213', currency:'DZD', symbol:'د.ج',  len:9  },
    { code:'ET', name:'Ethiopia',        dial:'+251', currency:'ETB', symbol:'Br',   len:9  },
    { code:'TZ', name:'Tanzania',        dial:'+255', currency:'TZS', symbol:'TSh',  len:9  },
    { code:'UG', name:'Uganda',          dial:'+256', currency:'UGX', symbol:'USh',  len:9  },
    { code:'GB', name:'United Kingdom',  dial:'+44',  currency:'GBP', symbol:'£',    len:10 },
    { code:'DE', name:'Germany',         dial:'+49',  currency:'EUR', symbol:'€',    len:11 },
    { code:'FR', name:'France',          dial:'+33',  currency:'EUR', symbol:'€',    len:9  },
    { code:'IT', name:'Italy',           dial:'+39',  currency:'EUR', symbol:'€',    len:10 },
    { code:'ES', name:'Spain',           dial:'+34',  currency:'EUR', symbol:'€',    len:9  },
    { code:'NL', name:'Netherlands',     dial:'+31',  currency:'EUR', symbol:'€',    len:9  },
    { code:'BE', name:'Belgium',         dial:'+32',  currency:'EUR', symbol:'€',    len:9  },
    { code:'CH', name:'Switzerland',     dial:'+41',  currency:'CHF', symbol:'CHF',  len:9  },
    { code:'AT', name:'Austria',         dial:'+43',  currency:'EUR', symbol:'€',    len:11 },
    { code:'SE', name:'Sweden',          dial:'+46',  currency:'SEK', symbol:'kr',   len:9  },
    { code:'NO', name:'Norway',          dial:'+47',  currency:'NOK', symbol:'kr',   len:8  },
    { code:'DK', name:'Denmark',         dial:'+45',  currency:'DKK', symbol:'kr',   len:8  },
    { code:'FI', name:'Finland',         dial:'+358', currency:'EUR', symbol:'€',    len:10 },
    { code:'IE', name:'Ireland',         dial:'+353', currency:'EUR', symbol:'€',    len:9  },
    { code:'PT', name:'Portugal',        dial:'+351', currency:'EUR', symbol:'€',    len:9  },
    { code:'GR', name:'Greece',          dial:'+30',  currency:'EUR', symbol:'€',    len:10 },
    { code:'PL', name:'Poland',          dial:'+48',  currency:'PLN', symbol:'zł',   len:9  },
    { code:'CZ', name:'Czech Republic',  dial:'+420', currency:'CZK', symbol:'Kč',   len:9  },
    { code:'HU', name:'Hungary',         dial:'+36',  currency:'HUF', symbol:'Ft',   len:9  },
    { code:'RO', name:'Romania',         dial:'+40',  currency:'RON', symbol:'lei',  len:9  },
    { code:'RU', name:'Russia',          dial:'+7',   currency:'RUB', symbol:'₽',    len:10 },
    { code:'UA', name:'Ukraine',         dial:'+380', currency:'UAH', symbol:'₴',    len:9  },
    { code:'IS', name:'Iceland',         dial:'+354', currency:'ISK', symbol:'kr',   len:7  },
    { code:'US', name:'United States',   dial:'+1',   currency:'USD', symbol:'$',    len:10 },
    { code:'CA', name:'Canada',          dial:'+1',   currency:'CAD', symbol:'C$',   len:10 },
    { code:'MX', name:'Mexico',          dial:'+52',  currency:'MXN', symbol:'MX$',  len:10 },
    { code:'BR', name:'Brazil',          dial:'+55',  currency:'BRL', symbol:'R$',   len:11 },
    { code:'AR', name:'Argentina',       dial:'+54',  currency:'ARS', symbol:'$',    len:10 },
    { code:'CL', name:'Chile',           dial:'+56',  currency:'CLP', symbol:'$',    len:9  },
    { code:'CO', name:'Colombia',        dial:'+57',  currency:'COP', symbol:'$',    len:10 },
    { code:'PE', name:'Peru',            dial:'+51',  currency:'PEN', symbol:'S/',   len:9  },
    { code:'AU', name:'Australia',       dial:'+61',  currency:'AUD', symbol:'A$',   len:9  },
    { code:'NZ', name:'New Zealand',     dial:'+64',  currency:'NZD', symbol:'NZ$',  len:9  }
  ];

  const CURRENCIES = [...new Set(COUNTRIES.map(c => c.currency))].sort();

  const REGION = {
    'South Asia':      ['PK','IN','BD','LK','NP','AF'],
    'East Asia':       ['CN','JP','KR','HK','TW'],
    'Southeast Asia':  ['ID','MY','SG','TH','VN','PH'],
    'Middle East':     ['AE','SA','QA','KW','BH','OM','JO','LB','IL','TR','IR','IQ'],
    'Africa':          ['EG','ZA','NG','KE','GH','MA','TN','DZ','ET','TZ','UG'],
    'Europe':          ['GB','DE','FR','IT','ES','NL','BE','CH','AT','SE','NO','DK','FI','IE','PT','GR','PL','CZ','HU','RO','RU','UA','IS'],
    'North America':   ['US','CA','MX'],
    'South America':   ['BR','AR','CL','CO','PE'],
    'Oceania':         ['AU','NZ']
  };

  /* =====================================================
     STORAGE
  ===================================================== */
  const SETTINGS_KEY = 'medicare_global_settings';
  const USERS_KEY    = 'medicare_users';

  const read = (k, fb) => {
    try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; }
    catch { return fb; }
  };

  function getSettings() {
    const s = read(SETTINGS_KEY, {}) || {};
    if (!s.country) s.country = 'PK';
    if (!s.currency) {
      const c = COUNTRIES.find(x => x.code === s.country);
      s.currency = c ? c.currency : 'USD';
    }
    return s;
  }
  function setSettings(patch) {
    const merged = Object.assign(getSettings(), patch || {});
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    try {
      window.dispatchEvent(new CustomEvent('medicare:settings-changed', { detail: merged }));
    } catch (e) {}
    return merged;
  }

  /* =====================================================
     HELPERS
  ===================================================== */
  function getCountry(code) { return COUNTRIES.find(c => c.code === code) || null; }

  function currencySymbol(code) {
    const c = COUNTRIES.find(x => x.currency === code);
    return c ? c.symbol : code;
  }

  function currentCurrency() { return getSettings().currency; }

  function money(n) {
    const code = currentCurrency();
    const num  = Number(n) || 0;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency', currency: code, maximumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return currencySymbol(code) + num.toFixed(2);
    }
  }

  /* =====================================================
     DUPLICATE EMAIL CHECK
  ===================================================== */
  function emailTaken(email, exceptId) {
    const e = String(email || '').trim().toLowerCase();
    if (!e) return false;
    return (read(USERS_KEY, []) || []).some(u =>
      u && u.id !== exceptId && String(u.email || '').toLowerCase() === e);
  }

  function patchUserAuth() {
    if (!window.UserAuth || UserAuth._gsPatched) return;

    const origSignup = UserAuth.signup.bind(UserAuth);
    UserAuth.signup = async function (data) {
      data = data || {};
      if (emailTaken(data.email)) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      if (pendingPhoneE164) {
        data.phoneE164 = pendingPhoneE164;
        data.phone     = pendingPhoneE164;
      }
      return origSignup(data);
    };

    UserAuth._gsPatched = true;
  }

  /* =====================================================
     SIGNUP POPUP — country picker + digit-only phone
  ===================================================== */
  let pendingPhoneE164 = '';

  function popupError(msg) {
    const box = document.getElementById('popupSignupErr');
    if (box) {
      const span = box.querySelector('span');
      if (span) span.textContent = msg;
      box.classList.add('show');
    } else {
      alert(msg);
    }
  }

  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (!form || form.id !== 'popupSignupForm') return;

    const cc  = document.getElementById('popupSuCountry');
    const raw = document.getElementById('popupSuPhone');
    if (!cc || !raw) return;

    const c = getCountry(cc.value);
    const digits = String(raw.value).replace(/\D/g, '');

    if (!cc.value) {
      e.preventDefault(); e.stopImmediatePropagation();
      return popupError('Please select your country code.');
    }
    if (!c) {
      e.preventDefault(); e.stopImmediatePropagation();
      return popupError('Please select a valid country.');
    }
    if (digits.length !== c.len) {
      e.preventDefault(); e.stopImmediatePropagation();
      return popupError(
        'Please enter a valid ' + c.name + ' number — exactly ' + c.len + ' digits after ' + c.dial + '.'
      );
    }
    pendingPhoneE164 = c.dial + digits;
  }, true);

  /* Inject styles once */
  function injectPhoneStylesOnce() {
    if (document.getElementById('gs-phone-styles')) return;
    const st = document.createElement('style');
    st.id = 'gs-phone-styles';
    st.textContent = `
      .gs-phone-row {
        display: flex;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        align-items: stretch;
      }
      .gs-phone-row .gs-cc {
        flex: 0 0 100px;
        width: 100px;
        min-width: 0;
        box-sizing: border-box;
        padding: 11px 24px 11px 10px;
        border: 1.5px solid #e6f0f5;
        border-radius: 11px;
        background: #f9fcfd;
        font-family: inherit;
        font-size: 13.5px;
        font-weight: 600;
        color: #0b3b4b;
        cursor: pointer;
        outline: none;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235e7e8c' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 6px center;
        background-size: 10px;
        transition: border-color .15s, box-shadow .15s, background .15s;
      }
      .gs-phone-row .gs-cc:focus {
        border-color: #0d6e9e;
        background: #fff;
        box-shadow: 0 0 0 4px rgba(13,110,158,.08);
      }
      .gs-phone-row .gs-phone {
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        padding: 11px 13px;
        border: 1.5px solid #e6f0f5;
        border-radius: 11px;
        background: #f9fcfd;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        color: #0b3b4b;
        outline: none;
        letter-spacing: 0.5px;
        transition: border-color .15s, box-shadow .15s, background .15s;
      }
      .gs-phone-row .gs-phone::placeholder {
        color: #9bb1bc;
        font-weight: 400;
        letter-spacing: 0;
      }
      .gs-phone-row .gs-phone:focus {
        border-color: #0d6e9e;
        background: #fff;
        box-shadow: 0 0 0 4px rgba(13,110,158,.08);
      }
      .gs-phone-hint {
        margin-top: 6px;
        font-size: 11.5px;
        color: #7a8b96;
        line-height: 1.35;
      }
      .gs-phone-hint b { color: #0b3b4b; font-weight: 700; }

      .form-group.error .gs-phone-row .gs-cc,
      .form-group.error .gs-phone-row .gs-phone {
        border-color: #e84a5f;
        background: #fff7f8;
        box-shadow: 0 0 0 4px rgba(232,74,95,.10);
      }

      @media (max-width: 440px) {
        .gs-phone-row { flex-wrap: wrap; gap: 8px; }
        .gs-phone-row .gs-cc,
        .gs-phone-row .gs-phone { flex: 1 1 100%; width: 100%; }
      }
    `;
    document.head.appendChild(st);
  }

  function injectCountryPicker() {
    const form = document.getElementById('popupSignupForm');
    if (!form) return;

    const phoneInput = document.getElementById('popupSuPhone');
    if (!phoneInput) return;
    const group = phoneInput.closest('.form-group');
    if (!group) return;

    /* Already injected correctly? */
    const existingRow = group.querySelector('.gs-phone-row');
    const existingSelect = document.getElementById('popupSuCountry');
    if (existingRow && existingSelect && existingSelect.parentElement === existingRow) return;

    /* Clean up any previous/broken injection */
    group.querySelectorAll('.gs-phone-row, .gs-phone-hint').forEach(n => n.remove());
    const stale = document.getElementById('popupSuCountry');
    if (stale) {
      const w = stale.parentElement;
      if (w && !w.classList.contains('gs-phone-row')) w.remove();
      else stale.remove();
    }

    /* If the phone input was orphaned by a previous bug, move it back into the group */
    if (phoneInput.parentElement && phoneInput.parentElement !== group) {
      group.appendChild(phoneInput);
    }

    phoneInput.removeAttribute('style');
    injectPhoneStylesOnce();

    /* Capture the phone input's current position BEFORE moving it into the row */
    const nextSibling = phoneInput.nextSibling;

    /* Build the row */
    const row = document.createElement('div');
    row.className = 'gs-phone-row';

    const select = document.createElement('select');
    select.id = 'popupSuCountry';
    select.className = 'gs-cc';
    select.innerHTML =
      '<option value="">Code</option>' +
      COUNTRIES.map(c =>
        '<option value="' + c.code + '"' + (c.code === getSettings().country ? ' selected' : '') + '>' +
        c.code + ' ' + c.dial + '</option>'
      ).join('');

    phoneInput.classList.add('gs-phone');
    phoneInput.type = 'tel';
    phoneInput.inputMode = 'numeric';
    phoneInput.autocomplete = 'tel';

    /* Digit-only enforcement */
    phoneInput.addEventListener('input', () => {
      const cleaned = phoneInput.value.replace(/\D/g, '');
      if (cleaned !== phoneInput.value) phoneInput.value = cleaned;
    });
    phoneInput.addEventListener('keypress', (e) => {
      if (e.key && !/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
    });
    phoneInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text') || '';
      const digits = text.replace(/\D/g, '');
      const start = phoneInput.selectionStart;
      const end = phoneInput.selectionEnd;
      phoneInput.value = phoneInput.value.slice(0, start) + digits + phoneInput.value.slice(end);
      phoneInput.dispatchEvent(new Event('input'));
    });

    /* Move phone into row */
    row.appendChild(select);
    row.appendChild(phoneInput);

    /* Hint below the row */
    const hint = document.createElement('div');
    hint.className = 'gs-phone-hint';

    function updateHint() {
      const c = getCountry(select.value);
      if (c) {
        hint.innerHTML = '<b>' + c.name + '</b> — ' + c.len + ' digits after ' + c.dial;
        phoneInput.placeholder = '0'.repeat(c.len);
        phoneInput.setAttribute('maxlength', String(c.len));
        if (phoneInput.value.length > c.len) phoneInput.value = phoneInput.value.slice(0, c.len);
      } else {
        hint.textContent = 'Select your country code first.';
        phoneInput.placeholder = '';
        phoneInput.removeAttribute('maxlength');
      }
    }

    /* Insert the row at the captured position — CRITICAL FIX */
    group.insertBefore(row, nextSibling);
    /* Insert the hint right after the row */
    if (row.parentNode) row.parentNode.insertBefore(hint, row.nextSibling);

    select.addEventListener('change', updateHint);
    updateHint();

    console.log('[global-support] phone picker injected');
  }

  function watchPopup() {
    injectCountryPicker();
    setTimeout(injectCountryPicker, 100);
    setTimeout(injectCountryPicker, 400);
    setTimeout(injectCountryPicker, 1000);
    setTimeout(injectCountryPicker, 2000);

    const obs = new MutationObserver(() => {
      const form = document.getElementById('popupSignupForm');
      const cc   = document.getElementById('popupSuCountry');
      if (form && !cc) injectCountryPicker();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* =====================================================
     ADMIN — Region & Currency card + topbar pill
  ===================================================== */
  function injectAdminCard() {
    if (!document.getElementById('appContainer')) return false;
    const settings = document.getElementById('page-settings');
    if (!settings) return false;
    if (document.getElementById('globalRegionCard')) return true;

    const grid = settings.querySelector('.grid-2');
    if (!grid) return false;

    const s = getSettings();

    const currencyOptions = Object.keys(REGION).map(region => {
      const items = REGION[region]
        .map(code => getCountry(code))
        .filter(Boolean)
        .map(c => {
          const selected = (c.currency === s.currency) ? ' selected' : '';
          return '<option value="' + c.currency + '" data-country="' + c.code + '"' + selected + '>' +
                 c.currency + ' ' + c.symbol + ' — ' + c.name + '</option>';
        }).join('');
      return '<optgroup label="' + region + '">' + items + '</optgroup>';
    }).join('');

    const countryOptions = COUNTRIES.map(c =>
      '<option value="' + c.code + '"' + (c.code === s.country ? ' selected' : '') + '>' +
      c.name + ' (' + c.dial + ')</option>').join('');

    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'globalRegionCard';
    card.innerHTML =
      '<div class="card-header"><h2><i class="fas fa-globe"></i> Region &amp; Currency</h2></div>' +
      '<div class="form-group"><label>Default Country</label>' +
        '<select id="setCountry">' + countryOptions + '</select></div>' +
      '<div class="form-group"><label>Currency (pick any country\'s currency)</label>' +
        '<select id="setCurrency">' + currencyOptions + '</select></div>' +
      '<div id="currencyPreview" style="background:#f5fafd;border-radius:12px;padding:14px 16px;' +
      'margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">' +
        '<div><div style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#7a8b96;">Preview</div>' +
          '<div id="currencyPreviewAmount" style="font-size:22px;font-weight:800;color:#0b3b4b;margin-top:2px;"></div></div>' +
        '<div style="text-align:right;"><div style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#7a8b96;">Code</div>' +
          '<div id="currencyPreviewCode" style="font-size:14px;font-weight:700;color:#0d6e9e;margin-top:2px;"></div></div>' +
      '</div>' +
      '<button class="btn btn-primary" id="saveRegionBtn" style="width:100%;"><i class="fas fa-save"></i> Save Region &amp; Currency</button>';

    grid.appendChild(card);
    console.log('[global-support] admin card injected');

    const countrySel  = document.getElementById('setCountry');
    const currencySel = document.getElementById('setCurrency');

    function updatePreview() {
      const code = currencySel.value;
      const sym  = currencySymbol(code);
      let f;
      try {
        f = new Intl.NumberFormat(undefined, { style:'currency', currency:code, maximumFractionDigits:2 }).format(1234.5);
      } catch (e) { f = sym + '1234.50'; }
      document.getElementById('currencyPreviewAmount').textContent = f;
      document.getElementById('currencyPreviewCode').textContent   = code + ' ' + sym;
    }

    countrySel.addEventListener('change', () => {
      const c = getCountry(countrySel.value);
      if (c) { currencySel.value = c.currency; updatePreview(); }
    });
    currencySel.addEventListener('change', () => {
      const opt = currencySel.options[currencySel.selectedIndex];
      const cc  = opt && opt.dataset && opt.dataset.country;
      if (cc) countrySel.value = cc;
      updatePreview();
    });
    updatePreview();

    document.getElementById('saveRegionBtn').addEventListener('click', () => {
      setSettings({ country: countrySel.value, currency: currencySel.value });
      if (typeof window.showToast === 'function') {
        window.showToast('Saved: ' + currencySel.value + ' ' + currencySymbol(currencySel.value), 'success');
      }
      try { if (typeof window.renderBilling === 'function') window.renderBilling(); } catch (e) {}
      window.dispatchEvent(new CustomEvent('medicare:changed', { detail:{ key: SETTINGS_KEY } }));
      setTimeout(() => location.reload(), 650);
    });

    return true;
  }

  function injectAdminPill() {
    if (!document.getElementById('appContainer')) return false;
    const topbarRight = document.querySelector('.topbar-right');
    if (!topbarRight) return false;
    if (document.getElementById('currencyPill')) return true;

    const s = getSettings();
    const pill = document.createElement('div');
    pill.id = 'currencyPill';
    pill.title = 'Click to change currency';
    pill.style.cssText =
      'display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #e6f0f5;' +
      'border-radius:40px;padding:10px 16px;font-size:13px;font-weight:700;color:#0b3b4b;' +
      'box-shadow:0 6px 18px rgba(0,30,45,.04);cursor:pointer;flex-shrink:0;';
    pill.innerHTML =
      '<i class="fas fa-coins" style="color:#0d6e9e;"></i> ' +
      '<span>' + s.currency + '</span> ' +
      '<span style="color:#5e7e8c;font-weight:600;">' + currencySymbol(s.currency) + '</span>';

    pill.addEventListener('click', () => {
      if (typeof window.goToPage === 'function') window.goToPage('settings');
      setTimeout(() => {
        const c = document.getElementById('globalRegionCard');
        if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    });

    const notif = document.getElementById('notifBtn');
    if (notif && notif.parentNode === topbarRight) topbarRight.insertBefore(pill, notif);
    else topbarRight.appendChild(pill);

    console.log('[global-support] admin pill injected');
    return true;
  }

  let adminAttempts = 0;
  function tryInjectAdmin() {
    if (!document.getElementById('appContainer')) return;
    adminAttempts++;
    const okCard = injectAdminCard();
    const okPill = injectAdminPill();
    if (okCard && okPill) {
      console.log('[global-support] admin injected at attempt', adminAttempts);
      return;
    }
    if (adminAttempts < 15) setTimeout(tryInjectAdmin, 500);
    else console.warn('[global-support] admin inject gave up');
  }

  /* =====================================================
     PUBLIC API
  ===================================================== */
  window.GlobalSupport = {
    COUNTRIES, CURRENCIES, REGION,
    getCountry, getSettings, setSettings,
    currentCurrency, currencySymbol, money,
    emailTaken
  };

  /* =====================================================
     INIT
  ===================================================== */
  function init() {
    patchUserAuth();
    watchPopup();

    if (document.getElementById('appContainer')) {
      tryInjectAdmin();
    }

    console.log('[global-support] ready —',
                COUNTRIES.length, 'countries,',
                CURRENCIES.length, 'currencies');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();