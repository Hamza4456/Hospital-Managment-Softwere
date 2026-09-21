/* =========================================================
   PUBLIC DOCTORS — merges hardcoded list with admin-added ones
   Include BEFORE the page's inline <script>.
   Use: const doctors = MediCareDoctors.merge(baseDoctors);
========================================================= */
(function () {
  const KEY     = 'medicare_public_doctors_v1';
  const DEL_KEY = 'medicare_public_doctors_deleted_v1';

  function getSaved() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function getDeleted() {
    try { return JSON.parse(localStorage.getItem(DEL_KEY)) || []; }
    catch { return []; }
  }

  window.MediCareDoctors = {
    KEY, DEL_KEY, getSaved, getDeleted,

    /* Merge: saved doctor overrides hardcoded one with the same id.
       Extra saved doctors get appended. Deleted ids are hidden. */
    merge(baseDoctors) {
      baseDoctors = Array.isArray(baseDoctors) ? baseDoctors : [];
      const saved   = getSaved();
      const deleted = getDeleted();
      const savedById = new Map(saved.map(d => [d.id, d]));

      const merged = baseDoctors
        .filter(d => !deleted.includes(d.id))
        .map(d => savedById.get(d.id) || d);

      const baseIds = new Set(baseDoctors.map(d => d.id));
      const extra = saved.filter(d => !baseIds.has(d.id));
      return merged.concat(extra);
    }
  };
})();