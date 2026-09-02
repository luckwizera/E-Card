/* E-Card usability enhancements: print-ready reports and remembered portal selection. */
(function () {
  const STORAGE_KEY = 'ecard-portal-preferences-v1';

  function rememberPortal() {
    const activeRole = document.querySelector('.role-btn.active')?.dataset.role;
    const activeView = document.querySelector('.nav-item.active')?.dataset.view;
    if (activeRole || activeView) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: activeRole, view: activeView }));
    }
  }

  function restorePortal() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.role) {
        const roleButton = document.querySelector(`.role-btn[data-role="${saved.role}"]`);
        if (roleButton && !roleButton.classList.contains('active')) roleButton.click();
      }
      setTimeout(() => {
        if (saved.view) {
          const viewButton = document.querySelector(`.nav-item[data-view="${saved.view}"]`);
          if (viewButton && !viewButton.classList.contains('active')) viewButton.click();
        }
      }, 50);
    } catch (_) {}
  }

  function printableReport(type) {
    const title = `${type} Conduct Report`;
    const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const section = document.querySelector('#appContent');
    if (!section) return;
    const body = section.innerHTML;
    const win = window.open('', '_blank', 'noopener,noreferrer,width=1000,height=800');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${title}</title><style>
      body{font-family:Arial,sans-serif;color:#172033;margin:40px}h1{margin-bottom:4px}p{color:#667085}.card{border:1px solid #ddd;border-radius:10px;padding:16px;margin:14px 0}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stat strong{font-size:25px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px;border-bottom:1px solid #ddd}.badge{padding:4px 7px;border-radius:12px;background:#eef2ff}.btn,.modal,.toast{display:none!important}@media print{body{margin:18mm}}
    </style></head><body><h1>${title}</h1><p>Generated ${date} · E-Card school conduct system</p>${body}<script>window.onload=()=>window.print();<\/script></body></html>`);
    win.document.close();
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('.role-btn, .nav-item');
    if (target) setTimeout(rememberPortal, 30);

    const reportButton = event.target.closest('[data-report]');
    if (reportButton) setTimeout(() => printableReport(reportButton.dataset.report), 80);
  });

  window.addEventListener('load', () => setTimeout(restorePortal, 120));
})();
