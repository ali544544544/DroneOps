// Toast notification helper — can be used standalone once fully migrated
export const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toastContainer');
  },
  show(message, type = 'info') {
    if (!this.container) this.init();
    const toast = document.createElement('div');
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    this.container?.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
};

// Skeleton screen helper
export const Skeleton = {
  show(container, type = 'dashboard') {
    if (!container) return;
    if (type === 'dashboard') {
      container.innerHTML = `
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width:60%"></div>
        <div class="skeleton skeleton-card" style="margin-top:12px"></div>
      `;
    } else if (type === 'hourly') {
      container.innerHTML = `
        <div class="skeleton skeleton-title" style="width:40%;margin-bottom:16px"></div>
        <div class="hourly-scroll">
          ${Array(6).fill('<div class="skeleton" style="min-width:120px;height:160px;flex-shrink:0"></div>').join('')}
        </div>
      `;
    } else if (type === 'list') {
      container.innerHTML = Array(3).fill(`
        <div class="skeleton" style="height:80px;margin-bottom:12px;border-radius:16px"></div>
      `).join('');
    }
  }
};

// Router for page navigation
export const Router = {
  showPage(page, storeFn) {
    document.querySelectorAll('.page').forEach(node => node.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => 
      btn.classList.toggle('active', btn.dataset.tab === page)
    );
    if (storeFn) storeFn(page);
  }
};
