/* ============================================================
   RENTFLOW — APP LOGIC
   All data is saved to localStorage. No backend required.
   ============================================================ */

'use strict';

// ────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────
const STORE_KEY = 'rentflow_v3';

const PROP_TYPES   = ['APARTMENT', 'HOUSE', 'COMMERCIAL', 'PLOT'];
const PROP_STATUSES = ['OCCUPIED', 'VACANT', 'LISTED'];
const LEASE_STATUSES = ['ACTIVE', 'EXPIRED', 'TERMINATED'];
const PAY_STATUSES  = ['PAID', 'PENDING', 'OVERDUE', 'PARTIAL'];
const PAY_MODES     = ['UPI', 'Bank Transfer', 'Cash', 'Cheque', 'Online'];
const TXN_TYPES     = ['INCOME', 'EXPENSE'];
const TXN_CATS      = ['Rent', 'Maintenance', 'Tax', 'Society Dues', 'Insurance', 'Repairs', 'Other'];
const TK_STATUSES   = ['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const TK_RAISED     = ['TENANT', 'LANDLORD'];
const SOC_QUARTERS  = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];
const DOC_TYPES     = ['Rental Agreement', 'Registration Proof', 'Police Verification', 'Tenant ID Proof', 'NOC', 'Other'];
const ID_TYPES      = ['Aadhaar', 'PAN', 'Passport', 'Voter ID'];

// ────────────────────────────────────────────────────────────
// DATA STORE
// ────────────────────────────────────────────────────────────
let DB = {
  properties: [], tenants: [], leases: [],
  payments: [], transactions: [], tickets: [],
  society: [], taxes: [], documents: []
};

function saveDB() {
  localStorage.setItem(STORE_KEY, JSON.stringify(DB));
  updateBadges();
}

function loadDB() {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    try { DB = JSON.parse(raw); return; } catch (e) { /* corrupt, re-seed */ }
  }
  seedData();
}

function genId() {
  return '_' + Math.random().toString(36).slice(2, 11);
}

// ────────────────────────────────────────────────────────────
// FORMATTERS
// ────────────────────────────────────────────────────────────
function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function monthLabel(ym) {
  // ym = "2025-06"
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}
function today() {
  return new Date().toISOString().split('T')[0];
}
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
function daysUntil(d) {
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
}
function propName(pid) {
  const p = DB.properties.find(x => x.id === pid);
  return p ? p.name : 'Unknown';
}
function tenantName(tid) {
  const t = DB.tenants.find(x => x.id === tid);
  return t ? t.name : 'Unknown';
}
function esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

// ────────────────────────────────────────────────────────────
// SEED DATA
// ────────────────────────────────────────────────────────────
function seedData() {
  DB.properties = [
    { id: 'p1', name: 'Flat 3B, Green Residency', type: 'APARTMENT', address: 'Plot 12, Sector 4', city: 'Noida', state: 'UP', rent: 22000, dueDay: 5, status: 'OCCUPIED', notes: '' },
    { id: 'p2', name: 'Shop A, Main Market', type: 'COMMERCIAL', address: 'MG Road, Block B', city: 'Gurugram', state: 'Haryana', rent: 35000, dueDay: 1, status: 'OCCUPIED', notes: 'Ground floor commercial' },
    { id: 'p3', name: '2BHK Flat, Sunshine Apt', type: 'APARTMENT', address: 'HSR Layout, 3rd Block', city: 'Bengaluru', state: 'Karnataka', rent: 28000, dueDay: 7, status: 'VACANT', notes: 'Freshly painted, ready to let' },
  ];
  DB.tenants = [
    { id: 't1', name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@email.com', idType: 'Aadhaar', emergency: 'Sunita Sharma +91 98700 11111', notes: '' },
    { id: 't2', name: 'Meera Jain', phone: '+91 87654 32109', email: 'meera@biz.com', idType: 'PAN', emergency: '', notes: 'Business owner' },
  ];
  DB.leases = [
    { id: 'l1', propertyId: 'p1', tenantId: 't1', start: '2024-01-01', end: '2025-12-31', rent: 22000, deposit: 44000, depositDate: '2024-01-01', depositRefunded: false, status: 'ACTIVE', notes: '' },
    { id: 'l2', propertyId: 'p2', tenantId: 't2', start: '2023-06-01', end: '2025-05-31', rent: 35000, deposit: 70000, depositDate: '2023-06-01', depositRefunded: false, status: 'ACTIVE', notes: '2-year agreement' },
  ];
  DB.payments = [
    { id: 'py1', propertyId: 'p1', tenant: 'Rahul Sharma', month: '2025-05', amount: 22000, due: '2025-05-05', paid: '2025-05-04', mode: 'UPI', status: 'PAID', notes: 'Ref: UPI/883421' },
    { id: 'py2', propertyId: 'p2', tenant: 'Meera Jain',   month: '2025-05', amount: 35000, due: '2025-05-01', paid: '2025-05-01', mode: 'Bank Transfer', status: 'PAID', notes: '' },
    { id: 'py3', propertyId: 'p1', tenant: 'Rahul Sharma', month: '2025-06', amount: 22000, due: '2025-06-05', paid: null, mode: 'UPI', status: 'OVERDUE', notes: '' },
    { id: 'py4', propertyId: 'p2', tenant: 'Meera Jain',   month: '2025-06', amount: 35000, due: '2025-06-01', paid: null, mode: 'Bank Transfer', status: 'PENDING', notes: '' },
  ];
  DB.transactions = [
    { id: 'tx1', date: '2025-05-04', desc: 'Rent collected — Flat 3B',   propertyId: 'p1', category: 'Rent',         type: 'INCOME',  amount: 22000 },
    { id: 'tx2', date: '2025-05-01', desc: 'Rent collected — Shop A',    propertyId: 'p2', category: 'Rent',         type: 'INCOME',  amount: 35000 },
    { id: 'tx3', date: '2025-05-10', desc: 'Plumber repair — Flat 3B',   propertyId: 'p1', category: 'Repairs',      type: 'EXPENSE', amount: 2500  },
    { id: 'tx4', date: '2025-04-15', desc: 'Society maintenance Q2',     propertyId: 'p1', category: 'Society Dues', type: 'EXPENSE', amount: 4800  },
    { id: 'tx5', date: '2025-04-01', desc: 'Property tax Q1 — Shop A',   propertyId: 'p2', category: 'Tax',          type: 'EXPENSE', amount: 8200  },
  ];
  DB.tickets = [
    { id: 'tk1', propertyId: 'p1', raisedBy: 'TENANT',   title: 'Leaking pipe in bathroom', desc: 'Pipe under sink drips constantly', status: 'IN_PROGRESS', cost: 2500, responsibility: 'LANDLORD' },
    { id: 'tk2', propertyId: 'p2', raisedBy: 'LANDLORD', title: 'AC servicing required',    desc: 'Annual AC service due',            status: 'REQUESTED',   cost: 0,    responsibility: '' },
    { id: 'tk3', propertyId: 'p1', raisedBy: 'TENANT',   title: 'Window latch broken',      desc: 'Bedroom window latch snapped',     status: 'COMPLETED',   cost: 500,  responsibility: 'LANDLORD' },
  ];
  DB.society = [
    { id: 's1', propertyId: 'p1', quarter: 'Q1 (Jan–Mar)', year: 2025, amount: 4800, date: '2025-01-15', status: 'PAID' },
    { id: 's2', propertyId: 'p1', quarter: 'Q2 (Apr–Jun)', year: 2025, amount: 4800, date: '2025-04-15', status: 'PAID' },
    { id: 's3', propertyId: 'p1', quarter: 'Q3 (Jul–Sep)', year: 2025, amount: 4800, date: null,          status: 'PENDING' },
  ];
  DB.taxes = [
    { id: 'ta1', propertyId: 'p1', period: 'FY 2024–25 H1', due: '2024-09-30', amount: 6500, status: 'PAID', paidDate: '2024-09-25' },
    { id: 'ta2', propertyId: 'p2', period: 'FY 2024–25 Q1', due: '2025-06-30', amount: 8200, status: 'PAID', paidDate: '2025-04-01' },
    { id: 'ta3', propertyId: 'p3', period: 'FY 2025–26 Q1', due: '2025-07-31', amount: 5500, status: 'PENDING', paidDate: null },
  ];
  DB.documents = [
    { id: 'd1', propertyId: 'p1', type: 'Rental Agreement',    name: 'Rental Agreement Jan 2024',     date: '2024-01-01', status: 'COMPLETED', notes: '' },
    { id: 'd2', propertyId: 'p1', type: 'Police Verification', name: 'Police Verification — Rahul',   date: '2024-01-05', status: 'COMPLETED', notes: '' },
    { id: 'd3', propertyId: 'p1', type: 'Tenant ID Proof',     name: 'Aadhaar Card — Rahul Sharma',   date: '2024-01-01', status: 'COMPLETED', notes: '' },
    { id: 'd4', propertyId: 'p1', type: 'Registration Proof',  name: 'Property Registration',         date: null,         status: 'PENDING',   notes: 'Needs upload' },
    { id: 'd5', propertyId: 'p2', type: 'Rental Agreement',    name: 'Lease Agreement — Meera Jain',  date: '2023-06-01', status: 'COMPLETED', notes: '2 year lease' },
    { id: 'd6', propertyId: 'p2', type: 'Police Verification', name: 'Police Verification — Meera',   date: null,         status: 'PENDING',   notes: '' },
  ];
  saveDB();
}

// ────────────────────────────────────────────────────────────
// NAVIGATION
// ────────────────────────────────────────────────────────────
let currentPage = 'dashboard';

function nav(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  const ni = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (ni) ni.classList.add('active');
  renderPage(page);
  document.getElementById('sidebar').classList.remove('open');
  // scroll main to top
  document.querySelector('.main').scrollTop = 0;
}

function renderPage(p) {
  const map = {
    dashboard:   renderDashboard,
    properties:  renderProperties,
    tenants:     renderTenants,
    leases:      renderLeases,
    payments:    renderPayments,
    accounting:  renderAccounting,
    maintenance: renderMaintenance,
    society:     renderSociety,
    taxes:       renderTaxes,
    documents:   renderDocuments,
  };
  if (map[p]) map[p]();
}

// ────────────────────────────────────────────────────────────
// MODAL HELPERS
// ────────────────────────────────────────────────────────────
function openModal(id, editId) {
  populateAllSelects();
  // Set sensible defaults
  if (id === 'modal-payment') {
    setVal('pay-month', currentMonth());
    setVal('pay-due', today());
  }
  if (id === 'modal-transaction') setVal('txn-date', today());
  if (id === 'modal-document')    setVal('doc-date', today());
  if (id === 'modal-tax')         setVal('tax-due', today());
  if (id === 'modal-society') {
    setVal('soc-date', today());
    setVal('soc-year', new Date().getFullYear());
  }
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// Close on overlay background click
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.add('hidden'); });
});

function populateAllSelects() {
  const propOpts = DB.properties.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  const tenOpts  = DB.tenants.map(t =>   `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  const blank    = `<option value="">Select…</option>`;

  [ 'l-property', 'pay-property', 'txn-property',
    'tk-property', 'soc-property', 'tax-property', 'doc-property' ]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = blank + propOpts;
    });

  const lTenant = document.getElementById('l-tenant');
  if (lTenant) lTenant.innerHTML = blank + tenOpts;
}

// ────────────────────────────────────────────────────────────
// FORM HELPERS
// ────────────────────────────────────────────────────────────
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function clearFields(ids) {
  ids.forEach(id => setVal(id, ''));
}

// ────────────────────────────────────────────────────────────
// SAVE — PROPERTY
// ────────────────────────────────────────────────────────────
function saveProperty() {
  const name = getVal('p-name');
  if (!name) { toast('Property name is required', '⚠️', 'amber'); return; }
  DB.properties.push({
    id: genId(),
    name,
    type:    getVal('p-type'),
    address: getVal('p-address'),
    city:    getVal('p-city'),
    state:   getVal('p-state'),
    rent:    +getVal('p-rent') || 0,
    dueDay:  +getVal('p-dueday') || 1,
    status:  getVal('p-status'),
    notes:   getVal('p-notes'),
  });
  saveDB();
  closeModal('modal-property');
  clearFields(['p-name','p-address','p-city','p-state','p-rent','p-notes']);
  renderProperties();
  renderDashboard();
  toast('Property added!', '🏠', 'green');
}

// ────────────────────────────────────────────────────────────
// SAVE — TENANT
// ────────────────────────────────────────────────────────────
function saveTenant() {
  const name = getVal('t-name'), phone = getVal('t-phone');
  if (!name || !phone) { toast('Name and phone are required', '⚠️', 'amber'); return; }
  DB.tenants.push({
    id: genId(), name, phone,
    email:     getVal('t-email'),
    idType:    getVal('t-idtype'),
    emergency: getVal('t-emergency'),
    notes:     getVal('t-notes'),
  });
  saveDB();
  closeModal('modal-tenant');
  clearFields(['t-name','t-phone','t-email','t-emergency','t-notes']);
  renderTenants();
  toast('Tenant added!', '👤', 'green');
}

// ────────────────────────────────────────────────────────────
// SAVE — LEASE
// ────────────────────────────────────────────────────────────
function saveLease() {
  const pid = getVal('l-property'), tid = getVal('l-tenant');
  const start = getVal('l-start'), end = getVal('l-end');
  if (!pid || !tid || !start || !end) { toast('Fill all required fields', '⚠️', 'amber'); return; }
  const status = getVal('l-status');
  DB.leases.push({
    id: genId(), propertyId: pid, tenantId: tid,
    start, end,
    rent:            +getVal('l-rent') || 0,
    deposit:         +getVal('l-deposit') || 0,
    depositDate:     getVal('l-deposit-date') || null,
    depositRefunded: false,
    status, notes: getVal('l-notes'),
  });
  // Update property status if lease is active
  if (status === 'ACTIVE') {
    const prop = DB.properties.find(p => p.id === pid);
    if (prop) prop.status = 'OCCUPIED';
  }
  saveDB();
  closeModal('modal-lease');
  renderLeases();
  renderDashboard();
  toast('Lease created!', '📄', 'green');
}

// ────────────────────────────────────────────────────────────
// SAVE — PAYMENT
// ────────────────────────────────────────────────────────────
function savePayment() {
  const pid = getVal('pay-property'), amount = +getVal('pay-amount');
  if (!pid || !amount) { toast('Property and amount required', '⚠️', 'amber'); return; }
  const status = getVal('pay-status');
  const paidDate = getVal('pay-paid') || null;
  DB.payments.push({
    id: genId(), propertyId: pid,
    tenant:  getVal('pay-tenant'),
    month:   getVal('pay-month'),
    amount, due: getVal('pay-due'),
    paid:    paidDate,
    mode:    getVal('pay-mode'),
    status,  notes: getVal('pay-notes'),
  });
  // Auto-create income transaction if paid
  if (status === 'PAID' && paidDate) {
    DB.transactions.push({
      id: genId(), date: paidDate,
      desc: `Rent — ${propName(pid)}`,
      propertyId: pid, category: 'Rent',
      type: 'INCOME', amount,
    });
  }
  saveDB();
  closeModal('modal-payment');
  renderPayments();
  renderDashboard();
  toast('Payment recorded!', '💰', 'green');
}

// ────────────────────────────────────────────────────────────
// SAVE — TRANSACTION
// ────────────────────────────────────────────────────────────
function saveTransaction() {
  const desc = getVal('txn-desc'), amount = +getVal('txn-amount');
  if (!desc || !amount) { toast('Description and amount required', '⚠️', 'amber'); return; }
  DB.transactions.push({
    id: genId(),
    date:       getVal('txn-date') || today(),
    desc,
    propertyId: getVal('txn-property'),
    category:   getVal('txn-cat'),
    type:       getVal('txn-type'),
    amount,
  });
  saveDB();
  closeModal('modal-transaction');
  renderAccounting();
  toast('Transaction saved!', '📈', 'green');
}

// ────────────────────────────────────────────────────────────
// SAVE — TICKET
// ────────────────────────────────────────────────────────────
function saveTicket() {
  const pid = getVal('tk-property'), title = getVal('tk-title');
  if (!pid || !title) { toast('Property and title required', '⚠️', 'amber'); return; }
  DB.tickets.push({
    id: genId(), propertyId: pid,
    raisedBy:       getVal('tk-raisedby'),
    title,
    desc:           getVal('tk-desc'),
    status:         getVal('tk-status'),
    cost:           +getVal('tk-cost') || 0,
    responsibility: getVal('tk-resp'),
  });
  saveDB();
  closeModal('modal-ticket');
  renderMaintenance();
  toast('Ticket created!', '🔧', 'green');
}

// ────────────────────────────────────────────────────────────
// SAVE — SOCIETY PAYMENT
// ────────────────────────────────────────────────────────────
function saveSociety() {
  const pid = getVal('soc-property'), amount = +getVal('soc-amount');
  if (!pid || !amount) { toast('Fill required fields', '⚠️', 'amber'); return; }
  DB.society.push({
    id: genId(), propertyId: pid,
    quarter: getVal('soc-quarter'),
    year:    +getVal('soc-year') || new Date().getFullYear(),
    amount,
    date:    getVal('soc-date') || null,
    status:  getVal('soc-status'),
  });
  saveDB();
  closeModal('modal-society');
  renderSociety();
  toast('Society payment saved!', '🏗', 'green');
}

// ────────────────────────────────────────────────────────────
// SAVE — TAX
// ────────────────────────────────────────────────────────────
function saveTax() {
  const pid = getVal('tax-property'), amount = +getVal('tax-amount');
  if (!pid || !amount) { toast('Fill required fields', '⚠️', 'amber'); return; }
  DB.taxes.push({
    id: genId(), propertyId: pid,
    period:   getVal('tax-period'),
    due:      getVal('tax-due'),
    amount,
    status:   getVal('tax-status'),
    paidDate: getVal('tax-paid') || null,
  });
  saveDB();
  closeModal('modal-tax');
  renderTaxes();
  toast('Tax record saved!', '🧾', 'green');
}

// ────────────────────────────────────────────────────────────
// SAVE — DOCUMENT
// ────────────────────────────────────────────────────────────
function saveDocument() {
  const pid = getVal('doc-property'), name = getVal('doc-name');
  if (!pid || !name) { toast('Property and name required', '⚠️', 'amber'); return; }
  DB.documents.push({
    id: genId(), propertyId: pid,
    type:   getVal('doc-type'),
    name,
    date:   getVal('doc-date') || null,
    status: getVal('doc-status'),
    notes:  getVal('doc-notes'),
  });
  saveDB();
  closeModal('modal-document');
  renderDocuments();
  toast('Document saved!', '📋', 'green');
}

// ────────────────────────────────────────────────────────────
// STATUS UPDATERS
// ────────────────────────────────────────────────────────────
function markPaymentPaid(id) {
  const py = DB.payments.find(p => p.id === id);
  if (!py) return;
  py.status = 'PAID';
  py.paid = today();
  // Auto income transaction
  if (!DB.transactions.find(t => t.desc === `Rent — ${propName(py.propertyId)}` && t.date === today())) {
    DB.transactions.push({
      id: genId(), date: today(),
      desc: `Rent — ${propName(py.propertyId)}`,
      propertyId: py.propertyId, category: 'Rent',
      type: 'INCOME', amount: py.amount,
    });
  }
  saveDB();
  renderPayments();
  renderDashboard();
  toast('Payment marked as paid!', '✅', 'green');
}

function markTaxPaid(id) {
  const tx = DB.taxes.find(t => t.id === id);
  if (!tx) return;
  tx.status = 'PAID';
  tx.paidDate = today();
  saveDB();
  renderTaxes();
  toast('Tax marked as paid!', '✅', 'green');
}

function updateTicketStatus(id, status) {
  const tk = DB.tickets.find(t => t.id === id);
  if (!tk) return;
  tk.status = status;
  saveDB();
  renderMaintenance();
  updateBadges();
  toast('Status updated', '✅', 'green');
}

function refundDeposit(id) {
  const l = DB.leases.find(x => x.id === id);
  if (!l) return;
  l.depositRefunded = true;
  saveDB();
  renderLeases();
  toast('Deposit marked as refunded', '💸', 'green');
}

// ────────────────────────────────────────────────────────────
// DELETE
// ────────────────────────────────────────────────────────────
let _pendingDelete = null;

function openDeleteConfirm(collection, id, afterFn) {
  _pendingDelete = { collection, id, afterFn };
  const item = DB[collection].find(x => x.id === id);
  const nameEl = document.getElementById('delete-item-name');
  if (nameEl) nameEl.textContent = item ? (item.name || item.title || item.desc || 'this item') : 'this item';
  openModal('modal-delete');
}

function confirmDelete() {
  if (!_pendingDelete) return;
  const { collection, id, afterFn } = _pendingDelete;
  DB[collection] = DB[collection].filter(x => x.id !== id);
  _pendingDelete = null;
  saveDB();
  closeModal('modal-delete');
  if (afterFn) afterFn();
  toast('Deleted', '🗑', 'red');
}

// ────────────────────────────────────────────────────────────
// NAV BADGES
// ────────────────────────────────────────────────────────────
function updateBadges() {
  const overdue = DB.payments.filter(p => p.status === 'OVERDUE').length;
  const badgePay = document.getElementById('badge-payments');
  if (badgePay) {
    badgePay.textContent = overdue;
    badgePay.style.display = overdue ? '' : 'none';
  }
  const openTk = DB.tickets.filter(t => t.status === 'REQUESTED' || t.status === 'IN_PROGRESS').length;
  const badgeMt = document.getElementById('badge-maint');
  if (badgeMt) {
    badgeMt.textContent = openTk;
    badgeMt.style.display = openTk ? '' : 'none';
  }
}

// ────────────────────────────────────────────────────────────
// RENDER — DASHBOARD
// ────────────────────────────────────────────────────────────
function renderDashboard() {
  const totalRent  = DB.properties.reduce((s, p) => s + p.rent, 0);
  const occupied   = DB.properties.filter(p => p.status === 'OCCUPIED').length;
  const vacant     = DB.properties.filter(p => p.status === 'VACANT').length;
  const overdues   = DB.payments.filter(p => p.status === 'OVERDUE');
  const expLeases  = DB.leases.filter(l => l.status === 'ACTIVE' && daysUntil(l.end) <= 60 && daysUntil(l.end) >= 0);
  const thisMonth  = currentMonth();
  const income     = DB.transactions.filter(t => t.type === 'INCOME'  && (t.date || '').startsWith(thisMonth)).reduce((s, t) => s + t.amount, 0);
  const expenses   = DB.transactions.filter(t => t.type === 'EXPENSE' && (t.date || '').startsWith(thisMonth)).reduce((s, t) => s + t.amount, 0);

  setHTML('dash-stats', `
    <div class="stat-card sc-blue"><div class="sc-icon">🏠</div><div class="sc-val">${DB.properties.length}</div><div class="sc-label">Total Properties</div></div>
    <div class="stat-card sc-green"><div class="sc-icon">✅</div><div class="sc-val">${occupied}</div><div class="sc-label">Occupied</div></div>
    <div class="stat-card sc-amber"><div class="sc-icon">🏚</div><div class="sc-val">${vacant}</div><div class="sc-label">Vacant</div></div>
    <div class="stat-card sc-teal"><div class="sc-icon">💰</div><div class="sc-val">${fmt(totalRent)}</div><div class="sc-label">Rent Roll/mo</div></div>
    <div class="stat-card sc-red"><div class="sc-icon">⏰</div><div class="sc-val">${overdues.length}</div><div class="sc-label">Overdue Payments</div></div>
    <div class="stat-card sc-purple"><div class="sc-icon">📄</div><div class="sc-val">${expLeases.length}</div><div class="sc-label">Leases Expiring</div></div>
  `);

  // Build alerts
  const alerts = [];
  overdues.forEach(p => alerts.push({ type: 'red', icon: '🔴',
    title: `Rent overdue — ${esc(propName(p.propertyId))}`,
    sub:   `${esc(p.tenant)} · ${fmt(p.amount)} · due ${fmtDate(p.due)}`,
    action: `<button class="btn btn-sm btn-primary" onclick="markPaymentPaid('${p.id}')">Mark Paid</button>` }));
  expLeases.forEach(l => alerts.push({ type: 'amber', icon: '⚠️',
    title: `Lease expiring in ${daysUntil(l.end)} days`,
    sub:   `${esc(tenantName(l.tenantId))} · ${esc(propName(l.propertyId))} · ${fmtDate(l.end)}`,
    action: `<button class="btn btn-sm btn-secondary" onclick="nav('leases')">View</button>` }));
  DB.taxes.filter(t => t.status === 'PENDING' && daysUntil(t.due) <= 30 && daysUntil(t.due) >= 0)
    .forEach(t => alerts.push({ type: 'amber', icon: '🧾',
      title: `Tax due: ${esc(t.period)}`,
      sub:   `${esc(propName(t.propertyId))} · ${fmt(t.amount)} · due ${fmtDate(t.due)}`,
      action: `<button class="btn btn-sm btn-primary" onclick="markTaxPaid('${t.id}')">Mark Paid</button>` }));
  DB.properties.filter(p => p.status === 'VACANT').forEach(p => alerts.push({ type: 'blue', icon: '🏚',
    title: `${esc(p.name)} is vacant`,
    sub:   `${fmt(p.rent)}/month · ready to let`,
    action: `<button class="btn btn-sm btn-secondary" onclick="nav('properties')">Manage</button>` }));

  const alertsEl = document.getElementById('dash-alerts');
  if (alertsEl) {
    if (alerts.length === 0) {
      alertsEl.innerHTML = `<div class="empty-state" style="padding:30px"><span class="es-icon">🎉</span><h3>All clear!</h3><p>No alerts right now</p></div>`;
    } else {
      alertsEl.innerHTML = alerts.map(a =>
        `<div class="alert-item alert-${a.type}">
          <span class="ai-icon">${a.icon}</span>
          <div class="ai-body"><div class="ai-title">${a.title}</div><div class="ai-sub">${a.sub}</div></div>
          <div class="ai-action">${a.action || ''}</div>
        </div>`
      ).join('');
    }
  }

  // Financials
  const pct = income > 0 ? Math.min(100, Math.round(expenses / income * 100)) : 0;
  setHTML('dash-financials', `
    <div style="display:flex;flex-direction:column;gap:14px;padding:4px 0">
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;color:var(--ink3)">Income this month</span>
          <span style="font-weight:700;color:var(--green)">${fmt(income)}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:100%;background:var(--green)"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;color:var(--ink3)">Expenses this month</span>
          <span style="font-weight:700;color:var(--red)">${fmt(expenses)}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:var(--red)"></div></div>
      </div>
      <div style="border-top:1px solid var(--surface3);padding-top:14px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:14px;font-weight:700">Net Profit</span>
        <span style="font-size:22px;font-weight:700;color:${income - expenses >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(income - expenses)}</span>
      </div>
    </div>
  `);

  // Mini property cards
  setHTML('dash-properties', DB.properties.slice(0, 6).map(p => buildPropCard(p, true)).join(''));
}

// ────────────────────────────────────────────────────────────
// RENDER — PROPERTIES
// ────────────────────────────────────────────────────────────
function buildPropCard(p, mini = false) {
  const colors = { OCCUPIED: 'var(--green)', VACANT: 'var(--amber)', LISTED: 'var(--accent)' };
  const bColors = { OCCUPIED: 'badge-green', VACANT: 'badge-amber', LISTED: 'badge-blue' };
  const icons   = { COMMERCIAL: '🏪', HOUSE: '🏡', APARTMENT: '🏢', PLOT: '🏞' };
  const stripe  = colors[p.status] || 'var(--ink4)';
  const lease   = DB.leases.find(l => l.propertyId === p.id && l.status === 'ACTIVE');
  const tenant  = lease ? esc(tenantName(lease.tenantId)) : 'No tenant';
  const actions = mini ? '' : `
    <div class="pc-actions" style="margin-top:12px;border-top:1px solid var(--surface3);padding-top:12px">
      <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openDeleteConfirm('properties','${p.id}',()=>{renderProperties();renderDashboard();})">🗑 Remove</button>
    </div>`;
  return `
    <div class="prop-card" onclick="nav('payments')">
      <div class="pc-stripe" style="background:${stripe}"></div>
      <div class="pc-body">
        <div class="pc-header">
          <div class="pc-icon">${icons[p.type] || '🏠'}</div>
          <span class="badge ${bColors[p.status] || 'badge-gray'}">${p.status}</span>
        </div>
        <h3>${esc(p.name)}</h3>
        <div class="pc-addr">${esc(p.address)}, ${esc(p.city)}, ${esc(p.state)}</div>
        ${!mini ? `<span class="badge badge-gray" style="margin-bottom:8px">${p.type}</span>` : ''}
        <div class="pc-stats">
          <div><div class="pc-stat-val">${fmt(p.rent)}</div><div class="pc-stat-label">per month</div></div>
          <div><div class="pc-stat-val" style="font-size:12px">${tenant}</div><div class="pc-stat-label">tenant</div></div>
        </div>
        ${p.notes && !mini ? `<div style="margin-top:8px;font-size:12px;color:var(--ink3);font-style:italic">${esc(p.notes)}</div>` : ''}
        ${actions}
      </div>
    </div>`;
}

function renderProperties() {
  const el = document.getElementById('prop-grid');
  if (!el) return;
  if (!DB.properties.length) {
    el.innerHTML = `<div class="empty-state"><span class="es-icon">🏠</span><h3>No properties yet</h3><p>Add your first property to get started.</p><button class="btn btn-primary" onclick="openModal('modal-property')">+ Add Property</button></div>`;
    return;
  }
  el.innerHTML = DB.properties.map(p => buildPropCard(p, false)).join('');
}

// ────────────────────────────────────────────────────────────
// RENDER — TENANTS
// ────────────────────────────────────────────────────────────
function renderTenants(q = '') {
  const list = DB.tenants.filter(t => {
    if (!q) return true;
    const lq = q.toLowerCase();
    return t.name.toLowerCase().includes(lq) || t.phone.includes(lq) || (t.email || '').toLowerCase().includes(lq);
  });
  const el = document.getElementById('tenant-tbody');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--ink3)">No tenants found</td></tr>`;
    return;
  }
  el.innerHTML = list.map(t => {
    const lease = DB.leases.find(l => l.tenantId === t.id && l.status === 'ACTIVE');
    return `<tr>
      <td><div style="font-weight:600">${esc(t.name)}</div><div style="font-size:12px;color:var(--ink3)">${esc(t.email || '')}</div></td>
      <td>${esc(t.phone)}</td>
      <td>${lease ? esc(propName(lease.propertyId)) : '—'}</td>
      <td style="font-size:12px">${lease ? `${fmtDate(lease.start)} → ${fmtDate(lease.end)}` : 'No active lease'}</td>
      <td>${lease ? fmt(lease.deposit) : '—'}</td>
      <td><span class="badge ${lease ? 'badge-green' : 'badge-gray'}">${lease ? 'ACTIVE' : 'INACTIVE'}</span></td>
      <td><div class="tbl-actions">
        <button class="btn-icon" title="Delete" onclick="openDeleteConfirm('tenants','${t.id}',renderTenants)">🗑</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ────────────────────────────────────────────────────────────
// RENDER — LEASES
// ────────────────────────────────────────────────────────────
function renderLeases(q = '', statusFilter = '') {
  let list = DB.leases.filter(l => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (!q) return true;
    const lq = q.toLowerCase();
    return esc(tenantName(l.tenantId)).toLowerCase().includes(lq) ||
           esc(propName(l.propertyId)).toLowerCase().includes(lq);
  });
  const el = document.getElementById('lease-tbody');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:40px;color:var(--ink3)">No leases found</td></tr>`;
    return;
  }
  el.innerHTML = list.map(l => {
    const days = daysUntil(l.end);
    const expBadge = (l.status === 'ACTIVE' && days <= 60 && days >= 0)
      ? `<span class="badge badge-amber" style="margin-left:5px;font-size:10px">⚠ ${days}d</span>` : '';
    return `<tr>
      <td style="font-weight:600">${esc(propName(l.propertyId))}</td>
      <td>${esc(tenantName(l.tenantId))}</td>
      <td>${fmtDate(l.start)}</td>
      <td>${fmtDate(l.end)}${expBadge}</td>
      <td style="font-weight:700">${fmt(l.rent)}</td>
      <td>${fmt(l.deposit)}<div style="font-size:11px;color:var(--ink3)">${l.depositRefunded ? '✅ Refunded' : 'Not refunded'}</div></td>
      <td><span class="badge ${l.status === 'ACTIVE' ? 'badge-green' : l.status === 'EXPIRED' ? 'badge-amber' : 'badge-red'}">${l.status}</span></td>
      <td><div class="tbl-actions">
        ${!l.depositRefunded && l.status !== 'ACTIVE' ? `<button class="btn btn-ghost btn-sm" title="Mark deposit refunded" onclick="refundDeposit('${l.id}')">💸</button>` : ''}
        <button class="btn-icon" onclick="openDeleteConfirm('leases','${l.id}',renderLeases)">🗑</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ────────────────────────────────────────────────────────────
// RENDER — PAYMENTS
// ────────────────────────────────────────────────────────────
function renderPayments(q = '', statusFilter = '') {
  let list = DB.payments.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (!q) return true;
    const lq = q.toLowerCase();
    return p.tenant.toLowerCase().includes(lq) || propName(p.propertyId).toLowerCase().includes(lq);
  });
  list.sort((a, b) => {
    const o = { OVERDUE: 0, PENDING: 1, PARTIAL: 2, PAID: 3 };
    return (o[a.status] || 4) - (o[b.status] || 4);
  });

  const allPaid    = DB.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const allOverdue = DB.payments.filter(p => p.status === 'OVERDUE').reduce((s, p) => s + p.amount, 0);
  const allPending = DB.payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

  setHTML('payment-stats', `
    <div class="stat-card sc-green"><div class="sc-icon">✅</div><div class="sc-val">${fmt(allPaid)}</div><div class="sc-label">Collected</div></div>
    <div class="stat-card sc-red"><div class="sc-icon">🔴</div><div class="sc-val">${fmt(allOverdue)}</div><div class="sc-label">Overdue</div></div>
    <div class="stat-card sc-amber"><div class="sc-icon">⏳</div><div class="sc-val">${fmt(allPending)}</div><div class="sc-label">Pending</div></div>
    <div class="stat-card sc-blue"><div class="sc-icon">💳</div><div class="sc-val">${fmt(allPaid + allOverdue + allPending)}</div><div class="sc-label">Total Billed</div></div>
  `);

  const el = document.getElementById('payment-tbody');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<tr><td colspan="9" class="text-center" style="padding:40px;color:var(--ink3)">No payments found</td></tr>`;
    return;
  }
  el.innerHTML = list.map(p => `<tr>
    <td style="font-weight:600">${esc(propName(p.propertyId))}</td>
    <td>${esc(p.tenant)}</td>
    <td style="color:var(--ink3)">${monthLabel(p.month)}</td>
    <td style="font-weight:700">${fmt(p.amount)}</td>
    <td>${fmtDate(p.due)}</td>
    <td>${p.paid ? fmtDate(p.paid) : '—'}</td>
    <td><span class="badge badge-gray">${esc(p.mode)}</span></td>
    <td><span class="badge ${p.status === 'PAID' ? 'badge-green' : p.status === 'OVERDUE' ? 'badge-red' : p.status === 'PARTIAL' ? 'badge-amber' : 'badge-blue'}">${p.status}</span></td>
    <td><div class="tbl-actions" style="opacity:1">
      ${p.status !== 'PAID' ? `<button class="btn btn-sm btn-primary" onclick="markPaymentPaid('${p.id}')">✓ Paid</button>` : ''}
      <button class="btn-icon" onclick="openDeleteConfirm('payments','${p.id}',renderPayments)">🗑</button>
    </div></td>
  </tr>`).join('');
}

// ────────────────────────────────────────────────────────────
// RENDER — ACCOUNTING
// ────────────────────────────────────────────────────────────
function renderAccounting() {
  const income   = DB.transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expenses = DB.transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  setHTML('accounting-stats', `
    <div class="stat-card sc-green"><div class="sc-icon">📥</div><div class="sc-val">${fmt(income)}</div><div class="sc-label">Total Income</div></div>
    <div class="stat-card sc-red"><div class="sc-icon">📤</div><div class="sc-val">${fmt(expenses)}</div><div class="sc-label">Total Expenses</div></div>
    <div class="stat-card sc-blue"><div class="sc-icon">📊</div><div class="sc-val">${fmt(income - expenses)}</div><div class="sc-label">Net Profit</div></div>
    <div class="stat-card sc-teal"><div class="sc-icon">🏠</div><div class="sc-val">${DB.properties.length}</div><div class="sc-label">Properties</div></div>
  `);

  // Income by property
  const byProp = {};
  DB.transactions.filter(t => t.type === 'INCOME').forEach(t => {
    byProp[t.propertyId] = (byProp[t.propertyId] || 0) + t.amount;
  });
  setHTML('income-breakdown', Object.entries(byProp).length
    ? Object.entries(byProp).map(([pid, amt]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--surface3)">
          <span style="font-size:13px">${esc(propName(pid))}</span>
          <span style="font-weight:700;color:var(--green)">${fmt(amt)}</span>
        </div>`).join('')
    : '<div style="padding:20px;color:var(--ink3);text-align:center">No income recorded</div>');

  // Expenses by category
  const byCat = {};
  DB.transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  });
  setHTML('expense-breakdown', Object.entries(byCat).length
    ? Object.entries(byCat).map(([cat, amt]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--surface3)">
          <span style="font-size:13px">${esc(cat)}</span>
          <span style="font-weight:700;color:var(--red)">${fmt(amt)}</span>
        </div>`).join('')
    : '<div style="padding:20px;color:var(--ink3);text-align:center">No expenses recorded</div>');

  // Transactions table
  const sorted = [...DB.transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const el = document.getElementById('txn-tbody');
  if (el) {
    el.innerHTML = sorted.map(t => `<tr>
      <td>${fmtDate(t.date)}</td>
      <td style="font-weight:500">${esc(t.desc)}</td>
      <td style="font-size:12px;color:var(--ink3)">${t.propertyId ? esc(propName(t.propertyId)) : '—'}</td>
      <td><span class="badge badge-gray">${esc(t.category)}</span></td>
      <td><span class="badge ${t.type === 'INCOME' ? 'badge-green' : 'badge-red'}">${t.type}</span></td>
      <td style="font-weight:700;color:${t.type === 'INCOME' ? 'var(--green)' : 'var(--red)'}">
        ${t.type === 'INCOME' ? '+' : '−'}${fmt(t.amount)}
      </td>
    </tr>`).join('');
  }
}

// ────────────────────────────────────────────────────────────
// RENDER — MAINTENANCE
// ────────────────────────────────────────────────────────────
let _ticketFilter = 'all';

function filterTickets(f, btn) {
  _ticketFilter = f;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMaintenance();
}

function renderMaintenance() {
  const list = DB.tickets.filter(t => _ticketFilter === 'all' || t.status === _ticketFilter);
  const el = document.getElementById('ticket-grid');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><span class="es-icon">🔧</span><h3>No tickets found</h3><p>No maintenance requests match this filter.</p></div>`;
    return;
  }
  const statusColor = { REQUESTED: 'badge-amber', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-green', CANCELLED: 'badge-gray' };
  const steps = ['REQUESTED', 'IN_PROGRESS', 'COMPLETED'];
  el.innerHTML = list.map(t => {
    const si = steps.indexOf(t.status);
    return `<div class="card">
      <div class="card-hdr">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
            <span style="font-size:15px">🔧</span>
            <div style="font-size:15px;font-weight:700">${esc(t.title)}</div>
          </div>
          <div style="font-size:12px;color:var(--ink3)">${esc(propName(t.propertyId))} · Raised by ${t.raisedBy}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge ${statusColor[t.status] || 'badge-gray'}">${t.status.replace('_', ' ')}</span>
          <button class="btn-icon" onclick="openDeleteConfirm('tickets','${t.id}',renderMaintenance)">🗑</button>
        </div>
      </div>
      <div class="status-flow">
        ${steps.map((s, i) => `<div class="sf-step ${i < si ? 'done' : i === si ? 'active' : ''}">${s.replace('_', ' ')}</div>`).join('')}
      </div>
      ${t.desc ? `<p style="font-size:13px;color:var(--ink3);margin-bottom:12px">${esc(t.desc)}</p>` : ''}
      ${t.cost ? `<div style="font-size:13px;margin-bottom:12px"><strong>Cost:</strong> ${fmt(t.cost)}${t.responsibility ? ` <span class="badge badge-gray">${t.responsibility}</span>` : ''}</div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${t.status === 'REQUESTED'   ? `<button class="btn btn-sm btn-secondary" onclick="updateTicketStatus('${t.id}','IN_PROGRESS')">▶ Start Work</button>` : ''}
        ${t.status === 'IN_PROGRESS' ? `<button class="btn btn-sm btn-primary"   onclick="updateTicketStatus('${t.id}','COMPLETED')">✓ Mark Complete</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ────────────────────────────────────────────────────────────
// RENDER — SOCIETY
// ────────────────────────────────────────────────────────────
function renderSociety() {
  const el = document.getElementById('society-tbody');
  if (!el) return;
  if (!DB.society.length) {
    el.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--ink3)">No society records yet</td></tr>`;
    return;
  }
  el.innerHTML = DB.society.map(s => `<tr>
    <td style="font-weight:600">${esc(propName(s.propertyId))}</td>
    <td>${esc(s.quarter)} ${s.year}</td>
    <td style="font-weight:700">${fmt(s.amount)}</td>
    <td>${fmtDate(s.date)}</td>
    <td><span class="badge ${s.status === 'PAID' ? 'badge-green' : s.status === 'OVERDUE' ? 'badge-red' : 'badge-amber'}">${s.status}</span></td>
    <td>${s.status === 'PAID' ? '<span style="color:var(--green)">✓ Paid</span>' : '—'}</td>
    <td><div class="tbl-actions"><button class="btn-icon" onclick="openDeleteConfirm('society','${s.id}',renderSociety)">🗑</button></div></td>
  </tr>`).join('');
}

// ────────────────────────────────────────────────────────────
// RENDER — TAXES
// ────────────────────────────────────────────────────────────
function renderTaxes() {
  const el = document.getElementById('tax-tbody');
  if (!el) return;
  if (!DB.taxes.length) {
    el.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--ink3)">No tax records yet</td></tr>`;
    return;
  }
  el.innerHTML = DB.taxes.map(t => `<tr>
    <td style="font-weight:600">${esc(propName(t.propertyId))}</td>
    <td>${esc(t.period)}</td>
    <td>${fmtDate(t.due)}</td>
    <td style="font-weight:700">${fmt(t.amount)}</td>
    <td><span class="badge ${t.status === 'PAID' ? 'badge-green' : t.status === 'OVERDUE' ? 'badge-red' : 'badge-amber'}">${t.status}</span></td>
    <td>${fmtDate(t.paidDate)}</td>
    <td><div class="tbl-actions" style="opacity:1">
      ${t.status !== 'PAID' ? `<button class="btn btn-sm btn-primary" onclick="markTaxPaid('${t.id}')">Pay Now</button>` : ''}
      <button class="btn-icon" onclick="openDeleteConfirm('taxes','${t.id}',renderTaxes)">🗑</button>
    </div></td>
  </tr>`).join('');
}

// ────────────────────────────────────────────────────────────
// RENDER — DOCUMENTS
// ────────────────────────────────────────────────────────────
function renderDocuments() {
  const el = document.getElementById('doc-compliance');
  if (!el) return;
  if (!DB.documents.length) {
    el.innerHTML = `<div class="empty-state"><span class="es-icon">📋</span><h3>No documents yet</h3><p>Upload documents to track compliance.</p></div>`;
    return;
  }
  // Group by property
  const byProp = {};
  DB.documents.forEach(d => {
    if (!byProp[d.propertyId]) byProp[d.propertyId] = [];
    byProp[d.propertyId].push(d);
  });
  el.innerHTML = Object.entries(byProp).map(([pid, docs]) => {
    const done = docs.filter(d => d.status === 'COMPLETED').length;
    const pct  = Math.round(done / Math.max(docs.length, 1) * 100);
    const pctColor = pct === 100 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
    const badgeCl  = pct === 100 ? 'badge-green' : pct >= 50 ? 'badge-amber' : 'badge-red';
    return `<div class="card">
      <div class="card-hdr">
        <div><h3>🏠 ${esc(propName(pid))}</h3><div style="font-size:12px;color:var(--ink3)">${done}/${docs.length} documents completed</div></div>
        <span class="badge ${badgeCl}">${pct}% compliant</span>
      </div>
      <div class="progress-bar" style="margin-bottom:16px"><div class="progress-fill" style="width:${pct}%;background:${pctColor}"></div></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${docs.map(d => `
          <div class="doc-row">
            <span style="font-size:18px">${d.status === 'COMPLETED' ? '✅' : '🔴'}</span>
            <div style="flex:1">
              <div style="font-size:13.5px;font-weight:600">${esc(d.type)}</div>
              <div style="font-size:12px;color:var(--ink3)">${esc(d.name)}${d.date ? ' · ' + fmtDate(d.date) : ''}</div>
            </div>
            <span class="badge ${d.status === 'COMPLETED' ? 'badge-green' : 'badge-red'}">${d.status}</span>
            <button class="btn-icon" onclick="openDeleteConfirm('documents','${d.id}',renderDocuments)">🗑</button>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

// ────────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────────
let _toastTimer = null;
function toast(msg, icon = '✅', type = 'green') {
  const c = document.getElementById('toasts');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add('removing');
    setTimeout(() => t.remove(), 200);
  }, 2800);
}

// ────────────────────────────────────────────────────────────
// UTILITY
// ────────────────────────────────────────────────────────────
function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ────────────────────────────────────────────────────────────
// GLOBAL ADD BUTTON
// ────────────────────────────────────────────────────────────
document.getElementById('globalAddBtn').addEventListener('click', () => {
  const map = {
    properties: 'modal-property', tenants: 'modal-tenant',
    leases: 'modal-lease', payments: 'modal-payment',
    maintenance: 'modal-ticket', society: 'modal-society',
    taxes: 'modal-tax', documents: 'modal-document',
    accounting: 'modal-transaction',
  };
  openModal(map[currentPage] || 'modal-property');
});

// ────────────────────────────────────────────────────────────
// SIDEBAR NAV WIRE-UP
// ────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => nav(btn.dataset.page));
});

// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ────────────────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────────────────
loadDB();
updateBadges();
renderDashboard();
