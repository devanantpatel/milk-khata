// Storage Schema
const STORAGE_KEY = 'doodh_khata_drawer_v3';

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  customers: [
    { id: 'c1', name: 'Ramesh Sharma', phone: '9876543210', rate: 60, logs: {} }
  ],
  activeCustomerId: 'c1'
};

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function getCurrentCustomer() {
  return appData.customers.find(c => c.id === appData.activeCustomerId) || appData.customers[0];
}

// App State
let currentDate = new Date();
let selectedDateStr = null;
let activeFilter = 'all';
let litreCount = 1;
let paawCount = 0;

// Elements
const openDrawerBtn = document.getElementById('openDrawerBtn');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const appDrawer = document.getElementById('appDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const customerListContainer = document.getElementById('customerListContainer');
const drawerAddBtn = document.getElementById('drawerAddBtn');
const openAddCustomerModal = document.getElementById('openAddCustomerModal');
const activeCustomerTitle = document.getElementById('activeCustomerTitle');
const activeCustomerRate = document.getElementById('activeCustomerRate');

// Calendar & Bill Elements
const monthYearTitle = document.getElementById('monthYearTitle');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const calendarGrid = document.getElementById('calendarGrid');

const billCustHeading = document.getElementById('billCustHeading');
const billMonthHeading = document.getElementById('billMonthHeading');
const billTotalMilk = document.getElementById('billTotalMilk');
const billDeliveryDays = document.getElementById('billDeliveryDays');
const billAbsentDays = document.getElementById('billAbsentDays');
const billTotalAmount = document.getElementById('billTotalAmount');
const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');

// Bottom Sheet Elements
const entrySheet = document.getElementById('entrySheet');
const closeSheetBtn = document.getElementById('closeSheetBtn');
const sheetDateLabel = document.getElementById('sheetDateLabel');
const displayLitre = document.getElementById('displayLitre');
const displayPaaw = document.getElementById('displayPaaw');
const previewTotal = document.getElementById('previewTotal');
const saveDayEntryBtn = document.getElementById('saveDayEntryBtn');

// Modal Elements
const customerModal = document.getElementById('customerModal');
const modalTitle = document.getElementById('modalTitle');
const editCustId = document.getElementById('editCustId');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const saveCustomerBtn = document.getElementById('saveCustomerBtn');
const newCustName = document.getElementById('newCustName');
const newCustPhone = document.getElementById('newCustPhone');
const newCustRate = document.getElementById('newCustRate');

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Drawer Functions
function toggleDrawer(open) {
  if (open) {
    appDrawer.classList.add('open');
    drawerBackdrop.classList.remove('hidden');
    renderDrawerList();
  } else {
    appDrawer.classList.remove('open');
    drawerBackdrop.classList.add('hidden');
  }
}

openDrawerBtn.onclick = () => toggleDrawer(true);
closeDrawerBtn.onclick = () => toggleDrawer(false);
drawerBackdrop.onclick = () => toggleDrawer(false);

// Customer Drawer Rendering with Edit Support
function renderDrawerList() {
  customerListContainer.innerHTML = '';
  appData.customers.forEach(cust => {
    const item = document.createElement('div');
    item.className = `customer-item ${cust.id === appData.activeCustomerId ? 'active' : ''}`;
    
    item.innerHTML = `
      <div class="cust-info">
        <strong>${cust.name}</strong>
        <small>${cust.phone || 'No Phone'} | ₹${cust.rate}/L</small>
      </div>
      <div class="cust-actions">
        <button class="btn-icon-sm btn-edit-cust" title="Edit Karein">✏️</button>
        <button class="btn-icon-sm btn-del-cust" title="Hataye">🗑️</button>
      </div>
    `;

    // Click to select
    item.querySelector('.cust-info').onclick = () => {
      appData.activeCustomerId = cust.id;
      saveData();
      toggleDrawer(false);
      renderCalendarAndBill();
    };

    // Edit customer
    item.querySelector('.btn-edit-cust').onclick = (e) => {
      e.stopPropagation();
      openCustomerModal(cust);
    };

    // Delete customer
    item.querySelector('.btn-del-cust').onclick = (e) => {
      e.stopPropagation();
      if (appData.customers.length <= 1) {
        alert('Kam se kam ek grahak hona zaroori hai.');
        return;
      }
      if (confirm(`Kya aap "${cust.name}" ko hatana chahte hain?`)) {
        appData.customers = appData.customers.filter(c => c.id !== cust.id);
        if (appData.activeCustomerId === cust.id) {
          appData.activeCustomerId = appData.customers[0].id;
        }
        saveData();
        renderDrawerList();
        renderCalendarAndBill();
      }
    };

    customerListContainer.appendChild(item);
  });
}

// Stepper Logic
function calculateTotal() {
  return litreCount + (paawCount * 0.25);
}

function updateSheetDisplay() {
  displayLitre.textContent = litreCount;
  displayPaaw.textContent = paawCount;
  previewTotal.textContent = `${calculateTotal().toFixed(2)} L`;
}

document.getElementById('incLitre').onclick = () => { litreCount++; updateSheetDisplay(); };
document.getElementById('decLitre').onclick = () => { if (litreCount > 0) litreCount--; updateSheetDisplay(); };
document.getElementById('incPaaw').onclick = () => {
  if (paawCount < 3) paawCount++;
  else { paawCount = 0; litreCount++; }
  updateSheetDisplay();
};
document.getElementById('decPaaw').onclick = () => {
  if (paawCount > 0) paawCount--;
  else if (litreCount > 0) { litreCount--; paawCount = 3; }
  updateSheetDisplay();
};

document.querySelectorAll('.btn-chip').forEach(btn => {
  btn.onclick = () => {
    const val = parseFloat(btn.dataset.val);
    litreCount = Math.floor(val);
    paawCount = Math.round((val - litreCount) / 0.25);
    updateSheetDisplay();
  };
});

// Filters
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderCalendarAndBill();
  };
});

// Render Main Calendar & Bill
function renderCalendarAndBill() {
  const currentCust = getCurrentCustomer();
  if (!currentCust) return;

  activeCustomerTitle.textContent = currentCust.name;
  activeCustomerRate.textContent = `Rate: ₹${currentCust.rate}/L`;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthYearTitle.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  calendarGrid.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    calendarGrid.appendChild(empty);
  }

  let totalMilk = 0;
  let deliveryDays = 0;
  let absentDays = 0;
  const monthLogRecords = [];

  for (let day = 1; day <= totalDays; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const qty = currentCust.logs[dateKey];

    if (qty !== undefined) {
      totalMilk += qty;
      if (qty > 0) deliveryDays++;
      else absentDays++;
      monthLogRecords.push({ date: dateKey, dayNum: day, qty: qty });
    }

    const dayEl = document.createElement('div');
    dayEl.className = 'cal-day';
    if (dateKey === todayStr) dayEl.classList.add('is-today');

    // Filter highlight
    let match = true;
    if (activeFilter === 'delivered') match = (qty > 0);
    else if (activeFilter === 'absent') match = (qty === 0);
    else if (activeFilter === 'exact1') match = (qty === 1);

    if (!match && activeFilter !== 'all') {
      dayEl.classList.add('dimmed');
    }

    // Calendar Label
    let badge = '<span class="day-qty qty-none">-</span>';
    if (qty !== undefined) {
      if (qty === 0) badge = '<span class="day-qty qty-zero">Chhuti</span>';
      else badge = `<span class="day-qty qty-given">${qty.toFixed(2)}L</span>`;
    }

    dayEl.innerHTML = `<span class="day-number">${day}</span>${badge}`;
    dayEl.onclick = () => openDaySheet(dateKey);
    calendarGrid.appendChild(dayEl);
  }

  // Update Bill Card
  const totalAmount = Math.round(totalMilk * currentCust.rate);
  billCustHeading.textContent = `${currentCust.name} Ka Hisaab`;
  billMonthHeading.textContent = `${monthNames[month]} ${year} | ₹${currentCust.rate}/L`;
  billTotalMilk.textContent = `${totalMilk.toFixed(2)} Liter`;
  billDeliveryDays.textContent = `${deliveryDays} Din`;
  billAbsentDays.textContent = `${absentDays} Din`;
  billTotalAmount.textContent = `₹${totalAmount}`;

  // WhatsApp Share Setup (Clean Text, No ERR_UNKNOWN_URL_SCHEME)
  shareWhatsAppBtn.onclick = () => {
    let msg = `*DOODH HISAAB PARCHA*\n`;
    msg += `----------------------------\n`;
    msg += `Grahak: *${currentCust.name}*\n`;
    msg += `Mahina: *${monthNames[month]} ${year}*\n`;
    msg += `Rate: *Rs.${currentCust.rate}/Liter*\n`;
    msg += `----------------------------\n`;
    msg += `*TAREEKH-WAR ROZANA HISAAB:*\n`;

    if (monthLogRecords.length === 0) {
      msg += `Is mahine koi entry darj nahi hai.\n`;
    } else {
      monthLogRecords.forEach(r => {
        const dayFormatted = String(r.dayNum).padStart(2, '0');
        if (r.qty === 0) {
          msg += `Tareekh ${dayFormatted}: Nahi Liya (Chhuti)\n`;
        } else {
          const cost = Math.round(r.qty * currentCust.rate);
          msg += `Tareekh ${dayFormatted}: ${r.qty.toFixed(2)} Liter (Rs.${cost})\n`;
        }
      });
    }

    msg += `----------------------------\n`;
    msg += `Kul Doodh: *${totalMilk.toFixed(2)} Liter*\n`;
    msg += `Delivery Din: *${deliveryDays} Din*\n`;
    msg += `Chhuti Wale Din: *${absentDays} Din*\n`;
    msg += `*KUL BILL: Rs.${totalAmount}*\n`;
    msg += `----------------------------\n`;
    msg += `Doodh Khata Dairy App`;

    let cleanPhone = (currentCust.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const encodedMsg = encodeURIComponent(msg);

    // Standard Universal Web Link (100% Mobile & WebView Compatible)
    let waUrl = cleanPhone.length >= 10
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(waUrl, '_blank');
  };
}

// Day Entry Bottom Sheet
function openDaySheet(dateKey) {
  selectedDateStr = dateKey;
  const currentCust = getCurrentCustomer();
  sheetDateLabel.textContent = `Tareekh: ${dateKey}`;

  const existingQty = currentCust.logs[dateKey];
  if (existingQty !== undefined) {
    litreCount = Math.floor(existingQty);
    paawCount = Math.round((existingQty - litreCount) / 0.25);
  } else {
    litreCount = 1;
    paawCount = 0;
  }

  updateSheetDisplay();
  entrySheet.classList.remove('hidden');
}

closeSheetBtn.onclick = () => entrySheet.classList.add('hidden');

saveDayEntryBtn.onclick = () => {
  if (!selectedDateStr) return;
  const currentCust = getCurrentCustomer();
  currentCust.logs[selectedDateStr] = calculateTotal();
  saveData();
  entrySheet.classList.add('hidden');
  renderCalendarAndBill();
};

// Month Navigation
prevMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendarAndBill(); };
nextMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendarAndBill(); };

// Add / Edit Customer Modal
function openCustomerModal(cust = null) {
  toggleDrawer(false);
  if (cust) {
    modalTitle.textContent = 'Grahak Edit Karein';
    editCustId.value = cust.id;
    newCustName.value = cust.name;
    newCustPhone.value = cust.phone || '';
    newCustRate.value = cust.rate;
  } else {
    modalTitle.textContent = 'Naya Grahak Jode';
    editCustId.value = '';
    newCustName.value = '';
    newCustPhone.value = '';
    newCustRate.value = '60';
  }
  customerModal.classList.remove('hidden');
}

openAddCustomerModal.onclick = () => openCustomerModal();
drawerAddBtn.onclick = () => openCustomerModal();
cancelModalBtn.onclick = () => customerModal.classList.add('hidden');

saveCustomerBtn.onclick = () => {
  const name = newCustName.value.trim();
  const phone = newCustPhone.value.trim();
  const rate = parseFloat(newCustRate.value);
  const targetId = editCustId.value;

  if (!name || isNaN(rate)) {
    alert('Kripya grahak ka naam aur rate sahi bharein.');
    return;
  }

  if (targetId) {
    // Edit existing customer
    const existing = appData.customers.find(c => c.id === targetId);
    if (existing) {
      existing.name = name;
      existing.phone = phone;
      existing.rate = rate;
    }
  } else {
    // Add new customer
    const newCust = {
      id: 'c_' + Date.now(),
      name: name,
      phone: phone,
      rate: rate,
      logs: {}
    };
    appData.customers.push(newCust);
    appData.activeCustomerId = newCust.id;
  }

  saveData();
  customerModal.classList.add('hidden');
  renderCalendarAndBill();
};

// Initial Load
renderCalendarAndBill();
