const DB_KEY = 'biznest_full_app_v4';

const defaultState = {
  users: [],
  currentUserId: null,
  viewingStoreId: 'demo',
  demoBusiness: {
    id: 'demo',
    name: 'Sharma Chai & Snacks',
    category: 'Café & Quick Bites',
    tagline: 'Fresh kulhad chai, bun maska, and crispy samosas served hot all day.',
    phone: '919876543210',
    location: 'Phase 7, Mohali, Punjab',
    hours: 'Mon–Sun, 7:00 AM – 10:30 PM',
    upi: 'sharmachai@okaxis',
    theme: '#047857',
    items: [
      { id: '1', name: 'Special Kulhad Masala Chai', price: '₹20' },
      { id: '2', name: 'Butter Bun Maska', price: '₹40' },
      { id: '3', name: 'Paneer Bread Pakora', price: '₹35' }
    ],
    stats: { views: 14, qrScans: 5, enquiries: 1 },
    enquiries: [
      {
        id: 'e1',
        name: 'Rohan',
        contact: '+91 98111 22334',
        message: 'Do you take evening party orders for 30 people?',
        date: 'Today, 5:30 PM'
      }
    ]
  }
};

function loadState() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    return saved ? JSON.parse(saved) : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

let state = loadState();

function getCurrentUser() {
  return state.users.find((u) => u.id === state.currentUserId) || null;
}

function getStoreById(storeId) {
  if (storeId === 'demo') return state.demoBusiness;
  const owner = state.users.find((u) => u.id === storeId);
  return owner ? owner.business : state.demoBusiness;
}

function isDarkHex(hex = '') {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}

function applyTheme(color) {
  const chosen = color || '#047857';
  document.documentElement.style.setProperty('--accent', chosen);

  const catBadge = document.getElementById('sCategory');
  if (catBadge) {
    catBadge.style.background = isDarkHex(chosen)
      ? 'rgba(255, 255, 255, 0.18)'
      : 'rgba(255, 255, 255, 0.22)';
  }
}

function escapeHtml(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showAlert(elId, msg, type = 'success') {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className = `alert ${type}`;
  setTimeout(() => {
    el.className = 'alert';
  }, 3500);
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'biznest-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Navigation & View Router
function renderNav() {
  const user = getCurrentUser();
  const nav = document.getElementById('navLinks');
  if (user) {
    nav.innerHTML = `
      <button class="ghost" onclick="showView('home')">Home</button>
      <button class="ghost" onclick="showView('directory')">Explore</button>
      <button class="ghost" onclick="showView('about')">About</button>
      <button onclick="showView('dashboard')">Dashboard (${escapeHtml(user.owner.split(' ')[0])})</button>
    `;
  } else {
    nav.innerHTML = `
      <button class="ghost" onclick="showView('home')">Home</button>
      <button class="ghost" onclick="showView('directory')">Explore</button>
      <button class="ghost" onclick="showView('about')">About</button>
      <button class="ghost" onclick="showView('login')">Log In</button>
      <button onclick="showView('register')">Register</button>
    `;
  }
}

function showView(viewName) {
  const user = getCurrentUser();
  if (viewName === 'dashboard' && !user) {
    viewName = 'login';
  }

  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');

  if (viewName === 'dashboard') {
    applyTheme(user.business.theme);
    renderDashboard();
  } else if (viewName === 'storefront') {
    renderStorefront();
  } else if (viewName === 'directory') {
    applyTheme('#047857');
    renderDirectory();
  } else {
    applyTheme(user ? user.business.theme : '#047857');
  }

  renderNav();
  window.scrollTo(0, 0);
}

// Directory Rendering
function renderDirectory() {
  const query = (document.getElementById('dirSearch').value || '').toLowerCase().trim();
  const allStores = [
    { storeId: 'demo', ...state.demoBusiness },
    ...state.users.map((u) => ({ storeId: u.id, ...u.business }))
  ];

  const filtered = allStores.filter(
    (b) =>
      b.name.toLowerCase().includes(query) ||
      (b.category || '').toLowerCase().includes(query) ||
      (b.location || '').toLowerCase().includes(query)
  );

  const grid = document.getElementById('directoryGrid');
  if (!filtered.length) {
    grid.innerHTML = '<p class="muted">No matching businesses found.</p>';
    return;
  }

  grid.innerHTML = filtered
    .map(
      (b) => `
      <div class="card">
        <span class="badge-pill" style="background: color-mix(in srgb, ${b.theme || '#047857'} 14%, transparent); color: ${b.theme || '#047857'};">
          ${escapeHtml(b.category || 'Local Business')}
        </span>
        <h3>${escapeHtml(b.name)}</h3>
        <p class="muted" style="margin-bottom: 8px;">${escapeHtml(b.tagline || '')}</p>
        <p class="muted" style="font-size: 0.85rem; margin-bottom: 14px;">📍 ${escapeHtml(b.location || 'India')}</p>
        <button style="background: ${b.theme || '#047857'};" onclick="openStorefrontById('${b.storeId}')">Visit Storefront →</button>
      </div>
    `
    )
    .join('');
}

// Register Handler
document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const owner = document.getElementById('regOwner').value.trim();
  const bizName = document.getElementById('regBizName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;

  if (state.users.some((u) => u.email === email)) {
    showAlert('registerAlert', 'An account with this email already exists.', 'error');
    return;
  }

  const newUser = {
    id: 'u_' + Date.now(),
    owner,
    email,
    password,
    business: {
      name: bizName,
      category: 'Local Business',
      tagline: 'Welcome to our official BizNest storefront.',
      phone: '',
      location: 'India',
      hours: '',
      upi: '',
      theme: '#047857',
      items: [],
      stats: { views: 1, qrScans: 0, enquiries: 0 },
      enquiries: []
    }
  };

  state.users.push(newUser);
  state.currentUserId = newUser.id;
  saveState();
  e.target.reset();
  showView('dashboard');
});

// Login Handler
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  const user = state.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    showAlert('loginAlert', 'Invalid email or password.', 'error');
    return;
  }

  state.currentUserId = user.id;
  saveState();
  e.target.reset();
  showView('dashboard');
});

function logout() {
  state.currentUserId = null;
  saveState();
  applyTheme('#047857');
  showView('home');
}

// Dashboard Rendering & Actions
function renderDashboard() {
  const user = getCurrentUser();
  if (!user) return;
  const biz = user.business;

  document.getElementById('dashWelcome').textContent = `Welcome, ${user.owner}`;
  document.getElementById('pName').value = biz.name || '';
  document.getElementById('pCategory').value = biz.category || '';
  document.getElementById('pTagline').value = biz.tagline || '';
  document.getElementById('pPhone').value = biz.phone || '';
  document.getElementById('pLocation').value = biz.location || '';
  document.getElementById('pHours').value = biz.hours || '';
  document.getElementById('pUpi').value = biz.upi || '';
  document.getElementById('pTheme').value = biz.theme || '#047857';

  document.getElementById('statViews').textContent = biz.stats.views;
  document.getElementById('statQr').textContent = biz.stats.qrScans;
  document.getElementById('statEnquiries').textContent = biz.stats.enquiries;

  const itemsEl = document.getElementById('dashItemsList');
  itemsEl.innerHTML = biz.items.length
    ? biz.items
        .map(
          (it) => `
        <div class="item-row">
          <span><strong>${escapeHtml(it.name)}</strong> ${it.price ? `— ${escapeHtml(it.price)}` : ''}</span>
          <button type="button" class="danger" onclick="deleteCatalogItem('${it.id}')">Remove</button>
        </div>
      `
        )
        .join('')
    : '<p class="muted">No products or services added yet.</p>';

  const enqEl = document.getElementById('dashEnquiriesList');
  enqEl.innerHTML = biz.enquiries.length
    ? biz.enquiries
        .map(
          (q) => `
        <div class="enquiry-card">
          <strong>${escapeHtml(q.name)}</strong> <span class="muted">(${escapeHtml(q.contact)})</span>
          <p style="margin-top: 4px;">${escapeHtml(q.message)}</p>
          <span class="muted" style="font-size: 0.78rem;">${escapeHtml(q.date)}</span>
        </div>
      `
        )
        .join('')
    : '<p class="muted">No customer enquiries received yet.</p>';
}

document.getElementById('profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  user.business.name = document.getElementById('pName').value.trim();
  user.business.category = document.getElementById('pCategory').value.trim();
  user.business.tagline = document.getElementById('pTagline').value.trim();
  user.business.phone = document.getElementById('pPhone').value.trim();
  user.business.location = document.getElementById('pLocation').value.trim();
  user.business.hours = document.getElementById('pHours').value.trim();
  user.business.upi = document.getElementById('pUpi').value.trim();
  user.business.theme = document.getElementById('pTheme').value;

  applyTheme(user.business.theme);
  saveState();
  showAlert('profileAlert', 'Business profile updated!');
});

document.getElementById('itemForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const name = document.getElementById('itemName').value.trim();
  const price = document.getElementById('itemPrice').value.trim();
  if (!name) return;

  user.business.items.push({ id: 'i_' + Date.now(), name, price });
  saveState();
  e.target.reset();
  renderDashboard();
});

function deleteCatalogItem(id) {
  const user = getCurrentUser();
  if (!user) return;
  user.business.items = user.business.items.filter((i) => i.id !== id);
  saveState();
  renderDashboard();
}

function simulateQrScan() {
  const user = getCurrentUser();
  if (!user) return;
  user.business.stats.qrScans += 1;
  saveState();
  renderDashboard();
}

// Public Storefront View
function openMyStorefront() {
  const user = getCurrentUser();
  if (!user) return;
  openStorefrontById(user.id);
}

function openStorefrontById(storeId) {
  state.viewingStoreId = storeId;
  const biz = getStoreById(storeId);
  biz.stats.views += 1;
  saveState();
  showView('storefront');
}

function renderStorefront() {
  const user = getCurrentUser();
  const biz = getStoreById(state.viewingStoreId);
  applyTheme(biz.theme);

  document.getElementById('backToDashBtn').style.display = user ? 'inline-flex' : 'none';
  document.getElementById('sCategory').textContent = biz.category || 'Local Business';
  document.getElementById('sName').textContent = biz.name;
  document.getElementById('sTagline').textContent = biz.tagline;
  document.getElementById('sLocation').textContent = biz.location ? `📍 ${biz.location}` : '';
  document.getElementById('sHours').textContent = biz.hours ? `🕒 ${biz.hours}` : '';
  document.getElementById('sUpi').textContent = biz.upi ? `💳 UPI: ${biz.upi}` : '';

  const cleanPhone = (biz.phone || '').replace(/\D/g, '');
  const waWrap = document.getElementById('sWhatsappWrap');
  if (cleanPhone) {
    const text = encodeURIComponent(`Hi ${biz.name}, I saw your BizNest profile and want to enquire.`);
    waWrap.innerHTML = `<a class="btn" style="background: #ffffff; color: #0f172a;" href="https://wa.me/${cleanPhone}?text=${text}" target="_blank" rel="noopener">💬 Chat on WhatsApp</a>`;
  } else {
    waWrap.innerHTML = '';
  }

  const listEl = document.getElementById('sItemsList');
  listEl.innerHTML = biz.items.length
    ? biz.items
        .map(
          (it) => `
        <div class="item-row">
          <strong>${escapeHtml(it.name)}</strong>
          <span>${escapeHtml(it.price || 'Enquire for price')}</span>
        </div>
      `
        )
        .join('')
    : '<p class="muted">Contact us directly for our latest offerings and rates.</p>';
}

document.getElementById('customerEnquiryForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const biz = getStoreById(state.viewingStoreId);
  biz.enquiries.unshift({
    id: 'e_' + Date.now(),
    name: document.getElementById('cName').value.trim(),
    contact: document.getElementById('cContact').value.trim(),
    message: document.getElementById('cMsg').value.trim(),
    date: new Date().toLocaleString()
  });
  biz.stats.enquiries += 1;
  saveState();
  e.target.reset();
  showAlert('cAlert', 'Your enquiry has been sent to ' + biz.name + '!');
});

// Initialize
renderNav();