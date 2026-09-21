/* =========================================================
   PUBLIC EXTRAS — injects "Hospitals" nav link + "My Bills"
   into the user dropdown without touching shared.js
========================================================= */
(function () {
  'use strict';

  /* --- 1. add Hospitals to the main nav --- */
  function injectHospitalsNav() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks || navLinks.querySelector('a[href="hospitals.html"]')) return;

    const li = document.createElement('li');
    li.innerHTML = '<a href="hospitals.html">Hospitals</a>';
    const contactLi = navLinks.querySelector('a[href="contact.html"]')?.closest('li');
    if (contactLi) contactLi.before(li);
    else navLinks.appendChild(li);
  }

  /* --- 2. add "My Bills" to the user dropdown --- */
  function injectMyBillsLink() {
    const menu = document.getElementById('navUserMenu');
    if (!menu || menu.querySelector('a[href="my-bills.html"]')) return;

    const link = document.createElement('a');
    link.href = 'my-bills.html';
    link.innerHTML = '<i class="fas fa-receipt"></i> My Bills';

    const logoutLink = menu.querySelector('#navUserLogout');
    if (logoutLink) {
      const hr = logoutLink.previousElementSibling;
      if (hr && hr.tagName === 'HR') hr.before(link);
      else logoutLink.before(link);
    } else {
      menu.appendChild(link);
    }
  }

  function init() {
    injectHospitalsNav();

    /* shared.js re-renders the auth slot; watch for that */
    const slot = document.getElementById('navAuthSlot');
    if (slot) {
      new MutationObserver(injectMyBillsLink)
        .observe(slot, { childList: true, subtree: true });
      injectMyBillsLink();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }
})();