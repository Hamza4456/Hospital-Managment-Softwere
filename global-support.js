/* =========================================================
   GLOBAL SUPPORT — countries, phone, currency, signup picker,
   admin Region & Currency card, topbar currency pill.
   Load right AFTER shared.js on every page:
     <script src="shared.js"></script>
     <script src="global-support.js"></script>
========================================================= */
(function () {
  'use strict';
  console.log('[global-support] loading…');

  /* =====================================================
     COUNTRY DATABASE
  ===================================================== */
  const COUNTRIES = [
    { code:'PK', name:'Pakistan',        dial:'+92',  currency:'PKR', symbol:'₨',    minDigits:10, maxDigits:10 },
    { code:'IN', name:'India',           dial:'+91',  currency:'INR', symbol:'₹',    minDigits:10, maxDigits:10 },
    { code:'BD', name:'Bangladesh',      dial:'+880', currency:'BDT', symbol:'৳',    minDigits:10, maxDigits:10 },
    { code:'LK', name:'Sri Lanka',       dial:'+94',  currency:'LKR', symbol:'Rs',   minDigits:9,  maxDigits:9  },
    { code:'NP', name:'Nepal',           dial:'+977', currency:'NPR', symbol:'रू',    minDigits:10, maxDigits:10 },
    { code:'AF', name:'Afghanistan',     dial:'+93',  currency:'AFN', symbol:'؋',    minDigits:9,  maxDigits:9  },
    { code:'CN', name:'China',           dial:'+86',  currency:'CNY', symbol:'¥',    minDigits:11, maxDigits:11 },
    { code:'JP', name:'Japan',           dial:'+81',  currency:'JPY', symbol:'¥',    minDigits:10, maxDigits:10 },
    { code:'KR', name:'South Korea',     dial:'+82',  currency:'KRW', symbol:'₩',    minDigits:9,  maxDigits:10 },
    { code:'HK', name:'Hong Kong',       dial:'+852', currency:'HKD', symbol:'HK$',  minDigits:8,  maxDigits:8  },
    { code:'TW', name:'Taiwan',          dial:'+886', currency:'TWD', symbol:'NT$',  minDigits:9,  maxDigits:9  },
    { code:'ID', name:'Indonesia',       dial:'+62',  currency:'IDR', symbol:'Rp',   minDigits:9,  maxDigits:12 },
    { code:'MY', name:'Malaysia',        dial:'+60',  currency:'MYR', symbol:'RM',   minDigits:9,  maxDigits:10 },
    { code:'SG', name:'Singapore',       dial:'+65',  currency:'SGD', symbol:'S$',   minDigits:8,  maxDigits:8  },
    { code:'TH', name:'Thailand',        dial:'+66',  currency:'THB', symbol:'฿',    minDigits:9,  maxDigits:9  },
    { code:'VN', name:'Vietnam',         dial:'+84',  currency:'VND', symbol:'₫',    minDigits:9,  maxDigits:10 },
    { code:'PH', name:'Philippines',     dial:'+63',  currency:'PHP', symbol:'₱',    minDigits:10, maxDigits:10 },
    { code:'AE', name:'United Arab Emirates', dial:'+971', currency:'AED', symbol:'د.إ', minDigits:8, maxDigits:9 },
    { code:'SA', name:'Saudi Arabia',    dial:'+966', currency:'SAR', symbol:'﷼',    minDigits:9,  maxDigits:9  },
    { code:'QA', name:'Qatar',           dial:'+974', currency:'QAR', symbol:'ر.ق',  minDigits:8,  maxDigits:8  },
    { code:'KW', name:'Kuwait',          dial:'+965', currency:'KWD', symbol:'د.ك',  minDigits:8,  maxDigits:8  },
    { code:'BH', name:'Bahrain',         dial:'+973', currency:'BHD', symbol:'BD',   minDigits:8,  maxDigits:8  },
    { code:'OM', name:'Oman',            dial:'+968', currency:'OMR', symbol:'ر.ع.', minDigits:8,  maxDigits:8  },
    { code:'JO', name:'Jordan',          dial:'+962', currency:'JOD', symbol:'JD',   minDigits:9,  maxDigits:9  },
    { code:'LB', name:'Lebanon',         dial:'+961', currency:'LBP', symbol:'ل.ل',  minDigits:7,  maxDigits:8  },
    { code:'IL', name:'Israel',          dial:'+972', currency:'ILS', symbol:'₪',    minDigits:9,  maxDigits:9  },
    { code:'TR', name:'Turkey',          dial:'+90',  currency:'TRY', symbol:'₺',    minDigits:10, maxDigits:10 },
    { code:'IR', name:'Iran',            dial:'+98',  currency:'IRR', symbol:'﷼',    minDigits:10, maxDigits:10 },
    { code:'IQ', name:'Iraq',            dial:'+964', currency:'IQD', symbol:'ع.د',  minDigits:10, maxDigits:10 },
    { code:'EG', name:'Egypt',           dial:'+20',  currency:'EGP', symbol:'E£',   minDigits:10, maxDigits:10 },
    { code:'ZA', name:'South Africa',    dial:'+27',  currency:'ZAR', symbol:'R',    minDigits:9,  maxDigits:9  },
    { code:'NG', name:'Nigeria',         dial:'+234', currency:'NGN', symbol:'₦',    minDigits:10, maxDigits:10 },
    { code:'KE', name:'Kenya',           dial:'+254', currency:'KES', symbol:'KSh',  minDigits:9,  maxDigits:9  },
    { code:'GH', name:'Ghana',           dial:'+233', currency:'GHS', symbol:'₵',    minDigits:9,  maxDigits:9  },
    { code:'MA', name:'Morocco',         dial:'+212', currency:'MAD', symbol:'DH',   minDigits:9,  maxDigits:9  },
    { code:'TN', name:'Tunisia',         dial:'+216', currency:'TND', symbol:'د.ت',  minDigits:8,  maxDigits:8  },
    { code:'DZ', name:'Algeria',         dial:'+213', currency:'DZD', symbol:'د.ج',  minDigits:9,  maxDigits:9  },
    { code:'ET', name:'Ethiopia',        dial:'+251', currency:'ETB', symbol:'Br',   minDigits:9,  maxDigits:9  },
    { code:'TZ', name:'Tanzania',        dial:'+255', currency:'TZS', symbol:'TSh',  minDigits:9,  maxDigits:9  },
    { code:'UG', name:'Uganda',          dial:'+256', currency:'UGX', symbol:'USh',  minDigits:9,  maxDigits:9  },
    { code:'GB', name:'United Kingdom',  dial:'+44',  currency:'GBP', symbol:'£',    minDigits:10, maxDigits:10 },
    { code:'DE', name:'Germany',         dial:'+49',  currency:'EUR', symbol:'€',    minDigits:10, maxDigits:11 },
    { code:'FR', name:'France',          dial:'+33',  currency:'EUR', symbol:'€',    minDigits:9,  maxDigits:9  },
    { code:'IT', name:'Italy',           dial:'+39',  currency:'EUR', symbol:'€',    minDigits:9,  maxDigits:10 },
    { code:'ES', name:'Spain',           dial:'+34',  currency:'EUR', symbol:'€',    minDigits:9,  maxDigits:9  },
    { code:'NL', name:'Netherlands',     dial:'+31',  currency:'EUR', symbol:'€',    minDigits:9,  maxDigits:9  },
    { code:'BE', name:'Belgium',         dial:'+32',  currency:'EUR', symbol:'€',    minDigits:9,  maxDigits:9  },
    { code:'CH', name:'Switzerland',     dial:'+41',  currency:'CHF', symbol:'CHF',  minDigits:9,  maxDigits:9  },
    { code:'AT', name:'Austria',         dial:'+43',  currency:'EUR', symbol:'€',    minDigits:9,  maxDigits:11 },
    { code:'SE', name:'Sweden',          dial:'+46',  currency:'SEK', symbol:'kr',   minDigits:7,  maxDigits:9  },
    { code:'NO', name:'Norway',          dial:'+47',  currency:'NOK', symbol:'kr',   minDigits:8,  maxDigits:8  },
    { code:'DK', name:'Denmark',         dial:'+45',  currency:'DKK', symbol:'kr',   minDigits:8,  maxDigits:8  },
    { code:'FI', name:'Finland',         dial:'+358', currency:'EUR', symbol:'€',    minDigits:9,  maxDigits:10 },
    { code:'IE', name:'Ireland',         dial:'+353', currency:'EUR', symbol:'€',    minDigits:9,  maxDigits:9  },
    { code:'PT', name:'Portugal',        dial:'+351', currency:'EUR', symbol:'€',    minDigits:9,  maxDigits:9  },
    { code:'GR', name:'Greece',          dial:'+30',  currency:'EUR', symbol:'€',    minDigits:10, maxDigits:10 },
    { code:'PL', name:'Poland',          dial:'+48',  currency:'PLN', symbol:'zł',   minDigits:9,  maxDigits:9  },
    { code:'CZ', name:'Czech Republic',  dial:'+420', currency:'CZK', symbol:'Kč',   minDigits:9,  maxDigits:9  },
    { code:'HU', name:'Hungary',         dial:'+36',  currency:'HUF', symbol:'Ft',   minDigits:9,  maxDigits:9  },
    { code:'RO', name:'Romania',         dial:'+40',  currency:'RON', symbol:'lei',  minDigits:9,  maxDigits:9  },
    { code:'RU', name:'Russia',          dial:'+7',   currency:'RUB', symbol:'₽',    minDigits:10, maxDigits:10 },
    { code:'UA', name:'Ukraine',         dial:'+380', currency:'UAH', symbol:'₴',    minDigits:9,  maxDigits:9  },
    { code:'IS', name:'Iceland',         dial:'+354', currency:'ISK', symbol:'kr',   minDigits:7,  maxDigits:7  },
    { code:'US', name:'United States',   dial:'+1',   currency:'USD', symbol:'$',    minDigits:10, maxDigits:10 },
    { code:'CA', name:'Canada',          dial:'+1',   currency:'CAD', symbol:'C$',   minDigits:10, maxDigits:10 },
    { code:'MX', name:'Mexico',          dial:'+52',  currency:'MXN', symbol:'MX$',  minDigits:10, maxDigits:10 },
    { code:'BR', name:'Brazil',          dial:'+55',  currency:'BRL', symbol:'R$',   minDigits:10, maxDigits:11 },
    { code:'AR', name:'Argentina',       dial:'+54',  currency:'ARS', symbol:'$',    minDigits:10, maxDigits:10 },
    { code:'CL', name:'Chile',           dial:'+56',  currency:'CLP', symbol:'$',    minDigits:9,  maxDigits:9  },
    { code:'CO', name:'Colombia',        dial:'+57',  currency:'COP', symbol:'$',    minDigits:10, maxDigits:10 },
    { code:'PE', name:'Peru',            dial:'+51',  currency:'PEN', symbol:'S/',   minDigits:9,  maxDigits:9  },
    { code:'AU', name:'Australia',       dial:'+61',  currency:'AUD', symbol:'A$',   minDigits:9,  maxDigits:9  },
    { code:'NZ', name:'New Zealand',     dial:'+64',  currency:'NZD', symbol:'NZ$',  minDigits:8,  maxDigits:10 }
  ];

  const CURRENCIES = [...new Set(COUNTRIES.map(c => c.currency))].sort();

  /* Region grouping — used by the admin currency picker */
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
     COUNTRY + CURRENCY HELPERS
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
        style: 'currency',
        currency: code,
        maximumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return currencySymbol(code) + num.toFixed(2);
    }
  }

  /* =====================================================
     PHONE HELPERS
  ===================================================== */
  function normalizePhone(rawDigits, countryCode) {
    const c = getCountry(countryCode);
    if (!c) return null;
    const d = String(rawDigits || '').replace(/\D/g, '');
    if (d.length < c.minDigits || d.length > c.maxDigits) return null;
    return c.dial + d;
  }

  function formatPhone(e164) {
    if (!e164) return '';
    const s = String(e164);
    const c = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length)
      .find(x => s.startsWith(x.dial));
    if (!c) return s;
    const local  = s.slice(c.dial.length);
    const groups = local.replace(/(\d{3})(?=\d)/g, '$1 ');
    return c.dial + ' ' + groups.trim();
  }

  /* =====================================================
     DUPLICATE RULES
  ===================================================== */
  function emailTaken(email, exceptId) {
    const e = String(email || '').trim().toLowerCase();
    if (!e) return false;
    return (read(USERS_KEY, []) || []).some(u =>
      u && u.id !== exceptId && String(u.email || '').toLowerCase() === e);
  }
  function phoneTaken(e164, exceptId) {
    const p = String(e164 || '').replace(/\D/g, '');
    if (!p) return false;
    return (read(USERS_KEY, []) || []).some(u => {
      if (!u || u.id === exceptId) return false;
      if (u.phoneE164 && String(u.phoneE164).replace(/\D/g,'') === p) return true;
      if (u.phone     && String(u.phone).replace(/\D/g,'')     === p) return true;
      return false;
    });
  }

  /* =====================================================
     SIGNUP POPUP — country picker + duplicate checks
  ===================================================== */
  let lastPhoneE164 = '';

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

    const countryCode = cc.value;
    const digits      = raw.value.replace(/\D/g,'');
    const c           = getCountry(countryCode);

    if (!countryCode) {
      e.preventDefault(); e.stopImmediatePropagation();
      return popupError('Please select your country.');
    }
    if (!c) {
      e.preventDefault(); e.stopImmediatePropagation();
      return popupError('Please select a valid country.');
    }
    if (digits.length < c.minDigits || digits.length > c.maxDigits) {
      e.preventDefault(); e.stopImmediatePropagation();
      return popupError(`Please enter a valid ${c.name} number (${c.minDigits} digits after ${c.dial}).`);
    }
    const e164 = c.dial + digits;
    if (phoneTaken(e164)) {
      e.preventDefault(); e.stopImmediatePropagation();
      return popupError('This phone number is already registered. Please sign in instead.');
    }
    lastPhoneE164 = e164;
  }, true);

  function patchUserAuth() {
    if (!window.UserAuth || UserAuth._gsPatched) return;

    const origSignup = UserAuth.signup.bind(UserAuth);
    UserAuth.signup = async function (data) {
      data = data || {};
      if (emailTaken(data.email)) {
        return { ok: false, error: 'An account with this email already exists.' };
      }
      if (lastPhoneE164) {
        if (phoneTaken(lastPhoneE164)) {
          return { ok: false, error: 'This phone number is already registered.' };
        }
        data.phoneE164 = lastPhoneE164;
        data.phone     = lastPhoneE164;
      } else if (data.phone) {
        const digits = String(data.phone).replace(/\D/g,'');
        if (phoneTaken(digits)) {
          return { ok: false, error: 'This phone number is already registered.' };
        }
      }
      return origSignup(data);
    };

    if (UserAuth.updateProfile) {
      const orig = UserAuth.updateProfile.bind(UserAuth);
      UserAuth.updateProfile = function ({ name, phone }) {
        const me = UserAuth.current();
        if (!me) return { ok: false, error: 'Not signed in.' };
        if (phone) {
          const digits = String(phone).replace(/\D/g,'');
          if (phoneTaken(digits, me.id)) {
            return { ok: false, error: 'This phone number is already in use.' };
          }
        }
        return orig({ name, phone });
      };
    }

    UserAuth._gsPatched = true;
  }

  function injectCountryPicker() {
    const form = document.getElementById('popupSignupForm');
    if (!form) return;
    if (document.getElementById('popupSuCountry')) return;

    const phoneInput = document.getElementById('popupSuPhone');
    if (!phoneInput) return;
    const group = phoneInput.closest('.form-group');
    if (!group) return;

    const row = document.createElement('div');
    row.style.cssText =
      'display:grid;grid-template-columns:130px 1fr;gap:8px;' +
      'width:100%;max-width:100%;box-sizing:border-box;';

    const select = document.createElement('select');
    select.id = 'popupSuCountry';
    select.style.cssText =
      'width:100%;max-width:100%;box-sizing:border-box;' +
      'padding:11px 8px;padding-right:24px;' +
      'border:1.5px solid #e6f0f5;border-radius:11px;' +
      'font-family:inherit;font-size:13px;color:#0b3b4b;background:#f9fcfd;' +
      'outline:none;cursor:pointer;text-overflow:ellipsis;min-width:0;';

    select.innerHTML =
      '<option value="">Country…</option>' +
      COUNTRIES.map(c =>
        `<option value="${c.code}"${c.code === getSettings().country ? ' selected' : ''}>` +
        `${c.name} (${c.dial})</option>`).join('');

    phoneInput.style.cssText =
      'width:100%;max-width:100%;box-sizing:border-box;min-width:0;';

    group.insertBefore(row, phoneInput);
    row.appendChild(select);
    row.appendChild(phoneInput);

    function applyLayout() {
      row.style.gridTemplateColumns = (window.innerWidth <= 520) ? '1fr' : '130px 1fr';
    }
    applyLayout();
    window.addEventListener('resize', applyLayout);

    select.addEventListener('change', () => {
      const c = getCountry(select.value);
      if (c) phoneInput.placeholder = '0'.repeat(Math.min(c.minDigits, 10));
    });
    const c0 = getCountry(select.value);
    if (c0) phoneInput.placeholder = '0'.repeat(Math.min(c0.minDigits, 10));
  }

  function watchPopup() {
    injectCountryPicker();
    const obs = new MutationObserver(() => {
      injectCountryPicker();
      if (document.getElementById('popupSuCountry')) obs.disconnect();
    });
    obs.observe(document.body, { childList: true, subtree: false });
  }

  /* =====================================================
     ADMIN — Region & Currency card + topbar pill
     Only runs on the dashboard (appContainer exists).
  ===================================================== */
  function injectAdminCard() {
    if (!document.getElementById('appContainer')) return false;

    const settings = document.getElementById('page-settings');
    if (!settings) return false;

    if (document.getElementById('globalRegionCard')) return true;

    const grid = settings.querySelector('.grid-2');
    if (!grid) return false;

    const s = getSettings();

    /* Currency options grouped by region */
    const currencyOptions = Object.keys(REGION).map(region => {
      const items = REGION[region]
        .map(code => getCountry(code))
        .filter(Boolean)
        .map(c => {
          const selected = (c.currency === s.currency) ? ' selected' : '';
          return `<option value="${c.currency}" data-country="${c.code}"${selected}>` +
                 `${c.currency} ${c.symbol} — ${c.name}</option>`;
        }).join('');
      return `<optgroup label="${region}">${items}</optgroup>`;
    }).join('');

    const countryOptions = COUNTRIES.map(c =>
      `<option value="${c.code}"${c.code === s.country ? ' selected' : ''}>` +
      `${c.name} (${c.dial})</option>`).join('');

    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'globalRegionCard';
    card.innerHTML =
      '<div class="card-header">' +
        '<h2><i class="fas fa-globe"></i> Region &amp; Currency</h2>' +
      '</div>' +

      '<div class="form-group">' +
        '<label>Default Country</label>' +
        '<select id="setCountry">' + countryOptions + '</select>' +
      '</div>' +

      '<div class="form-group">' +
        '<label>Currency (pick any country\'s currency)</label>' +
        '<select id="setCurrency">' + currencyOptions + '</select>' +
      '</div>' +

      '<div id="currencyPreview" style="background:#f5fafd;border-radius:12px;padding:14px 16px;' +
      'margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;' +
      'flex-wrap:wrap;">' +
        '<div>' +
          '<div style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;' +
          'color:#7a8b96;">Preview</div>' +
          '<div id="currencyPreviewAmount" style="font-size:22px;font-weight:800;color:#0b3b4b;' +
          'margin-top:2px;"></div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;' +
          'color:#7a8b96;">Code</div>' +
          '<div id="currencyPreviewCode" style="font-size:14px;font-weight:700;color:#0d6e9e;' +
          'margin-top:2px;"></div>' +
        '</div>' +
      '</div>' +

      '<button class="btn btn-primary" id="saveRegionBtn" style="width:100%;">' +
        '<i class="fas fa-save"></i> Save Region &amp; Currency' +
      '</button>';

    grid.appendChild(card);
    console.log('[global-support] admin card injected');

    const countrySel  = document.getElementById('setCountry');
    const currencySel = document.getElementById('setCurrency');

    function updatePreview() {
      const code = currencySel.value;
      const sym  = currencySymbol(code);
      let formatted;
      try {
        formatted = new Intl.NumberFormat(undefined, {
          style: 'currency', currency: code, maximumFractionDigits: 2
        }).format(1234.5);
      } catch (e) {
        formatted = sym + '1234.50';
      }
      document.getElementById('currencyPreviewAmount').textContent = formatted;
      document.getElementById('currencyPreviewCode').textContent   = code + ' ' + sym;
    }

    countrySel.addEventListener('change', () => {
      const c = getCountry(countrySel.value);
      if (c) {
        currencySel.value = c.currency;
        updatePreview();
      }
    });

    currencySel.addEventListener('change', () => {
      const opt = currencySel.options[currencySel.selectedIndex];
      const cc  = opt && opt.dataset && opt.dataset.country;
      if (cc) countrySel.value = cc;
      updatePreview();
    });

    updatePreview();

    document.getElementById('saveRegionBtn').addEventListener('click', () => {
      const country  = countrySel.value;
      const currency = currencySel.value;
      setSettings({ country, currency });

      if (typeof window.showToast === 'function') {
        window.showToast('Saved: ' + currency + ' ' + currencySymbol(currency), 'success');
      }

      try { if (typeof window.renderBilling === 'function') window.renderBilling(); } catch (e) {}
      window.dispatchEvent(new CustomEvent('medicare:changed', {
        detail: { key: SETTINGS_KEY }
      }));

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
      'display:inline-flex;align-items:center;gap:8px;background:#fff;' +
      'border:1px solid #e6f0f5;border-radius:40px;padding:10px 16px;' +
      'font-size:13px;font-weight:700;color:#0b3b4b;' +
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

  /* Retry admin injection until card + pill succeed */
  let adminAttempts = 0;
  function tryInjectAdmin() {
    if (!document.getElementById('appContainer')) return;   /* not a dashboard page */
    adminAttempts++;
    const okCard = injectAdminCard();
    const okPill = injectAdminPill();

    if (okCard && okPill) {
      console.log('[global-support] admin injected at attempt', adminAttempts);
      return;
    }
    if (adminAttempts < 15) setTimeout(tryInjectAdmin, 500);
    else console.warn('[global-support] admin inject gave up — card:', okCard, 'pill:', okPill);
  }

  /* =====================================================
     PUBLIC API
  ===================================================== */
  window.GlobalSupport = {
    COUNTRIES, CURRENCIES, REGION,
    getCountry, getSettings, setSettings,
    currentCurrency, currencySymbol, money,
    normalizePhone, formatPhone,
    emailTaken, phoneTaken
  };

  /* =====================================================
     INIT
  ===================================================== */
  function init() {
    patchUserAuth();
    watchPopup();

    /* Admin-only: card + pill */
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