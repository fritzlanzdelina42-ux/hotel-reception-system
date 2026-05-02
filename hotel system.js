const STORAGE_KEY = "hotelSystemDataV2";
const THEME_KEY = "hotelSystemTheme";

let users = [{ u: "admin", p: "123" }];
let guests = [];
let bookingHistory = [];
let currentUser = null;
let isEditing = false;
let editingRoom = null;
let selectedRoomType = "all";
let lastReceipt = null;
const rooms = [101, 102, 103, 104, 105, 106, 107, 108];

const authSection = document.getElementById("authSection");
const roomsSection = document.getElementById("roomsSection");
const dashboardSection = document.getElementById("dashboardSection");
const roomDetailsModal = document.getElementById("roomDetailsModal");
const bookingModal = document.getElementById("bookingModal");
const bulkModal = document.getElementById("bulkModal");
const receiptModal = document.getElementById("receiptModal");

const total = document.getElementById("total");
const occ = document.getElementById("occ");
const avail = document.getElementById("avail");
const revenue = document.getElementById("revenue");
const avgStay = document.getElementById("avgStay");
const occupancy = document.getElementById("occupancy");
const roomsContainer = document.getElementById("roomsContainer");
const roomDetails = document.getElementById("roomDetails");
const roomDetailsContent = document.getElementById("roomDetailsContent");
const roomDetailsContentModal = document.getElementById("roomDetailsContentModal");
const guestsList = document.getElementById("guestsList");
const recentActivity = document.getElementById("recentActivity");
const historyList = document.getElementById("historyList");
const receiptContent = document.getElementById("receiptContent");

const username = document.getElementById("username");
const password = document.getElementById("password");
const modalName = document.getElementById("modalName");
const modalCheckIn = document.getElementById("modalCheckIn");
const modalCheckOut = document.getElementById("modalCheckOut");

const roomSearch = document.getElementById("roomSearch");
const roomTypeFilter = document.getElementById("roomTypeFilter");
const roomStatusFilter = document.getElementById("roomStatusFilter");
const roomResultsCount = document.getElementById("roomResultsCount");
const welcomeUser = document.getElementById("welcomeUser");
const authTitle = document.getElementById("authTitle");
const authAction = document.getElementById("authAction");
const authToggle = document.getElementById("authToggle");

let isRegisterMode = false;

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.body.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    const icon = button.querySelector(".theme-toggle-icon");
    const text = button.querySelector(".theme-toggle-text");
    if (icon) icon.textContent = nextTheme === "light" ? "\u2600" : "\u263E";
    if (text) text.textContent = nextTheme === "light" ? "Light" : "Dark";
  });
}

function toggleTheme() {
  const currentTheme = document.body.dataset.theme === "light" ? "light" : "dark";
  applyTheme(currentTheme === "light" ? "dark" : "light");
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(savedTheme || (prefersLight ? "light" : "dark"));
}

function ensureDefaultAdmin() {
  const hasAdmin = users.some((item) => String(item.u).toLowerCase() === "admin");
  if (!hasAdmin) users.unshift({ u: "admin", p: "123" });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ users, guests, bookingHistory, currentUser }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { ensureDefaultAdmin(); return; }
  try {
    const parsed = JSON.parse(raw);
    users = Array.isArray(parsed.users) && parsed.users.length ? parsed.users : users;
    guests = Array.isArray(parsed.guests) ? parsed.guests : [];
    bookingHistory = Array.isArray(parsed.bookingHistory) ? parsed.bookingHistory : [];
    currentUser = parsed.currentUser || null;
  } catch (error) {
    console.error("Failed to load saved hotel data:", error);
  }
  ensureDefaultAdmin();
}

function updateAuthMode() {
  if (!authTitle || !authAction || !authToggle) return;
  authTitle.textContent = isRegisterMode ? "Create Account" : "Sign In";
  authAction.textContent = isRegisterMode ? "Create Account" : "Login";
  authToggle.textContent = isRegisterMode ? "Back to Sign In" : "Create account";
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  updateAuthMode();
}

function showLogin() {
  isRegisterMode = false;
  updateAuthMode();
}

function submitAuth() {
  if (!username || !password) { alert("Auth form is not ready"); return; }
  if (isRegisterMode) { register(); return; }
  login();
}

function register() {
  const user = username.value.trim();
  const pass = password.value.trim();
  if (!user || !pass) { alert("Please enter username and password"); return; }
  if (users.some((item) => item.u.toLowerCase() === user.toLowerCase())) {
    alert("Username already exists"); return;
  }
  users.push({ u: user, p: pass });
  // Auto-login after registration then go straight to landing page
  currentUser = user;
  saveState();
  alert("Account created successfully!");
  username.value = "";
  password.value = "";
  authSection.classList.add("hidden");
  showLanding();
}

function login() {
  const user = username.value.trim();
  const pass = password.value.trim();
  if (!user || !pass) { alert("Please enter username and password"); return; }
  const ok = users.find(
    (item) => String(item.u).toLowerCase() === user.toLowerCase() && String(item.p) === pass
  );
  if (!ok) { alert("Invalid credentials"); return; }
  currentUser = ok.u;
  saveState();
  authSection.classList.add("hidden");
  showLanding();
}

function logout() {
  currentUser = null;
  saveState();
  document.getElementById("landingSection").classList.add("hidden");
  roomsSection.classList.add("hidden");
  dashboardSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  showLogin();
  username.value = "";
  password.value = "";
}

function showLanding() {
  document.getElementById("landingSection").classList.remove("hidden");
  dashboardSection.classList.add("hidden");
  roomsSection.classList.add("hidden");
  // sync theme toggles inside landing
  applyTheme(document.body.dataset.theme || "dark");
}

function showDashboard() {
  document.getElementById("landingSection").classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  roomsSection.classList.add("hidden");
  syncWelcome();
  render();
  update();
}

function showRooms() {
  document.getElementById("landingSection").classList.add("hidden");
  roomsSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
  renderRooms();
  roomDetails.classList.remove("hidden");
  roomDetailsContent.innerHTML = '<div class="reservation-board"><h3>Choose a room type above or use the filters below.</h3><p class="helper-copy">You can search by room number, room class, guest name, or availability.</p></div>';
}

function showRoomCategory(type) {
  selectedRoomType = type;
  roomTypeFilter.value = type;
  document.getElementById("landingSection").classList.add("hidden");
  showRooms();

  const categoryName = type === "vip" ? "VIP Suites" : type === "high" ? "High Class Rooms" : "Standard Rooms";
  const categoryDescription = type === "vip"
    ? "Premium suites with ocean view, luxury service, and elegant design."
    : type === "high"
      ? "Modern rooms with comfortable beds and upscale amenities."
      : "Cozy rooms with great value, clean style, and essential comforts.";
  const categoryImage = type === "vip"
    ? "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&q=90"
    : type === "high"
      ? "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400&q=90"
      : "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=1400&q=90";

  const roomsInCategory = getFilteredRooms().filter((room) => getClass(room) === type);

  roomDetailsContent.innerHTML =
    '<div class="category-panel">' +
    '<img src="' + categoryImage + '" class="room-category-image" alt="' + categoryName + '">' +
    '<h3>' + categoryName + '</h3>' +
    '<p>' + categoryDescription + '</p>' +
    '</div>' +
    '<div class="room-category-grid">' +
    roomsInCategory.map(function(room) {
      const guest = getGuest(room);
      return '<div class="room-category-card">' +
        '<img src="' + getImg(room) + '" alt="Room ' + room + '">' +
        '<div class="room-category-card-body">' +
        '<h4>Room ' + room + ' - ' + getType(room) + '</h4>' +
        '<p>Price: ' + formatPeso(getPrice(room)) + ' / night</p>' +
        '<p>' + (guest ? "Occupied by " + guest.name : "Available now") + '</p>' +
        '<button onclick="handleRoomClick(' + room + ')">' + (guest ? "View Reservation" : "Reserve Now") + '</button>' +
        '</div></div>';
    }).join("") +
    '</div>';
}

function clearRoomFilters() {
  selectedRoomType = "all";
  roomSearch.value = "";
  roomTypeFilter.value = "all";
  roomStatusFilter.value = "all";
  renderRooms();
}

function getFilteredRooms() {
  const searchValue = roomSearch.value.trim().toLowerCase();
  const typeValue = roomTypeFilter.value;
  const statusValue = roomStatusFilter.value;
  return rooms.filter(function(room) {
    const guest = getGuest(room);
    const roomType = getClass(room);
    const roomStatus = guest ? "occupied" : "available";
    const searchTarget = [String(room), getType(room), roomType, guest ? guest.name : "", guest ? guest.phone : "", guest ? guest.email : ""].join(" ").toLowerCase();
    const matchesSearch = !searchValue || searchTarget.includes(searchValue);
    const matchesType = typeValue === "all" || roomType === typeValue;
    const matchesStatus = statusValue === "all" || roomStatus === statusValue;
    return matchesSearch && matchesType && matchesStatus;
  });
}

function renderRooms() {
  const filteredRooms = getFilteredRooms();
  roomResultsCount.textContent = filteredRooms.length + " room(s) shown";
  roomsContainer.innerHTML = "";
  if (!filteredRooms.length) {
    roomsContainer.innerHTML = '<div class="empty-state wide">No rooms matched your current filters.</div>';
    return;
  }
  filteredRooms.forEach(function(room) {
    const guest = getGuest(room);
    const roomType = getClass(room);
    const card = document.createElement("div");
    card.className = "room-card " + roomType;
    const statusText = guest
      ? guest.name + " \u2022 " + guest.checkIn + " " + guest.checkInTime + " to " + guest.checkOut + " " + guest.checkOutTime
      : "Available for booking";
    card.innerHTML =
      '<div class="room-badge ' + roomType + '">' + getBadgeText(room) + '</div>' +
      '<img src="' + getImg(room) + '" alt="' + getType(room) + '">' +
      '<div class="room-info">' +
      '<h4>Room ' + room + '</h4>' +
      '<p class="room-price">' + getType(room) + ' - ' + formatPeso(getPrice(room)) + '/night</p>' +
      '<p class="room-features-text">' + getFeatures(room) + '</p>' +
      '<div class="room-status ' + (guest ? "occupied" : "available") + '">' + statusText + '</div>' +
      '<button onclick="handleRoomClick(' + room + ')" class="room-btn ' + roomType + '">' +
      (guest ? "Manage Reservation" : "Create Reservation") + '</button>' +
      '</div>';
    roomsContainer.appendChild(card);
  });
}

function handleRoomClick(room) {
  const guest = getGuest(room);
  const roomType = getClass(room);
  const roomTypeText = getType(room);
  const roomImg = getImg(room);
  const modalCard = roomDetailsModal.querySelector(".modal-content");
  modalCard.className = "modal-content reservation-board room-details-" + roomType;

  if (isEditing && editingRoom === room && guest) {
    roomDetailsContentModal.innerHTML =
      '<button class="modal-back-btn" onclick="closeRoomDetailsModal()">&#8592;</button>' +
      '<img src="' + roomImg + '" alt="' + roomTypeText + '" class="room-details-image">' +
      '<div class="room-details-header">' +
      '<div class="room-details-badge ' + roomType + '">' + getBadgeText(room) + '</div>' +
      '<h3>Edit Reservation - Room ' + room + '</h3></div>' +
      '<div class="room-details-info">' +
      '<p><strong>Type:</strong> ' + roomTypeText + '</p>' +
      '<p><strong>Rate:</strong> ' + formatPeso(getPrice(room)) + ' / night</p></div>' +
      '<input id="editName" placeholder="Guest Name" value="' + guest.name + '">' +
      '<input id="editPhone" placeholder="Phone Number" value="' + (guest.phone || "") + '">' +
      '<input id="editEmail" type="email" placeholder="Email Address" value="' + (guest.email || "") + '">' +
      '<div class="date-row">' +
      '<div><label style="font-size:0.72rem;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:0.4px;display:block;margin-bottom:4px">Check-in</label>' +
      '<input id="editCheckIn" type="date" value="' + guest.checkIn + '" onchange="updateEditSummary(' + room + ')"></div>' +
      '<div><label style="font-size:0.72rem;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:0.4px;display:block;margin-bottom:4px">Check-out</label>' +
      '<input id="editCheckOut" type="date" value="' + guest.checkOut + '" onchange="updateEditSummary(' + room + ')"></div>' +
      '</div>' +
      '<div class="edit-price-summary" id="editPriceSummary"></div>' +
      '<div class="board-actions">' +
      '<button class="primary" onclick="updateReservation(' + room + ')">Save Changes</button>' +
      '<button class="secondary" onclick="cancelEdit()">Cancel Edit</button></div>';

    // Trigger initial summary render
    updateEditSummary(room);
  } else if (guest) {
    roomDetailsContentModal.innerHTML =
      '<button class="modal-back-btn" onclick="closeRoomDetailsModal()">&#8592;</button>' +
      '<img src="' + roomImg + '" alt="' + roomTypeText + '" class="room-details-image">' +
      '<div class="room-details-header">' +
      '<div class="room-details-badge ' + roomType + '">' + getBadgeText(room) + '</div>' +
      '<h3>Room ' + room + ' - Currently Occupied</h3></div>' +
      '<div class="room-details-info">' +
      '<p><strong>Guest:</strong> ' + guest.name + '</p>' +
      '<p><strong>Phone:</strong> ' + (guest.phone || "Not provided") + '</p>' +
      '<p><strong>Email:</strong> ' + (guest.email || "Not provided") + '</p>' +
      '<p><strong>Check-in:</strong> ' + guest.checkIn + ' ' + guest.checkInTime + '</p>' +
      '<p><strong>Check-out:</strong> ' + guest.checkOut + ' ' + guest.checkOutTime + '</p>' +
      '<p><strong>Type:</strong> ' + roomTypeText + '</p>' +
      '<p><strong>Price:</strong> ' + formatPeso(getPrice(room)) + ' / night</p>' +
      '<p><strong>Payment:</strong> ' + (guest.paymentMethod ? guest.paymentMethod.toUpperCase() : 'N/A') + '</p>' +
      (guest.halfPayment ? '<p><strong>Half Payment:</strong> <span style="color:var(--green)">' + formatPeso(guest.halfPayment) + ' ✓ Paid</span></p>' : '') +
      (guest.balanceDue ? '<p><strong>Balance Due:</strong> <span style="color:var(--gold)">' + formatPeso(guest.balanceDue) + '</span></p>' : '') +
      (guest.promoCode ? '<p><strong>Promo:</strong> ' + guest.promoCode + ' (-' + formatPeso(guest.discount || 0) + ')</p>' : '') +
      '</div>' +
      '<div class="board-actions">' +
      '<button class="primary" onclick="startEdit(' + room + ')">Edit Reservation</button>' +
      '<button class="warning" onclick="cancelReservation(' + room + ')">Cancel Reservation</button>' +
      '<button onclick="checkout(' + room + '); closeRoomDetailsModal()">Checkout</button></div>';
  } else {
    roomDetailsContentModal.innerHTML =
      '<button class="modal-back-btn" onclick="closeRoomDetailsModal()">&#8592;</button>' +
      '<div class="booking-card">' +
      '<div class="booking-card-header">' +
      '<div class="room-details-badge ' + roomType + '">' + getBadgeText(room) + '</div>' +
      '<h3>Reserve Room ' + room + '</h3>' +
      '<p class="booking-subtitle">' + roomTypeText + ' - ' + formatPeso(getPrice(room)) + ' / night</p></div>' +
      '<div class="booking-info">' +
      '<label for="detailName">Guest Name</label>' +
      '<input id="detailName" placeholder="Your Name">' +
      '<div class="info-grid">' +
      '<div><label for="detailPhone">Phone Number</label><input id="detailPhone" placeholder="09XXXXXXXXX"></div>' +
      '<div><label for="detailEmail">Email Address</label><input id="detailEmail" type="email" placeholder="name@example.com"></div>' +
      '</div>' +
      '<div class="date-row">' +
      '<div><label for="detailCheckIn">Check-in Date</label><input id="detailCheckIn" type="date" onchange="updateBookingDuration()"></div>' +
      '<div><label for="detailCheckInTime">Check-in Time</label><input id="detailCheckInTime" type="time" value="14:00" onchange="updateBookingDuration()"></div>' +
      '</div>' +
      '<div class="date-row">' +
      '<div><label for="detailCheckOut">Check-out Date</label><input id="detailCheckOut" type="date" onchange="updateBookingDuration()"></div>' +
      '<div><label for="detailCheckOutTime">Check-out Time</label><input id="detailCheckOutTime" type="time" value="12:00" onchange="updateBookingDuration()"></div>' +
      '</div>' +
      '<div class="duration-info" id="bookingDuration">Duration: set check-in and check-out first</div>' +
      '<label>Promo Code <span style="color:var(--text3);font-weight:400">(optional)</span></label>' +
      '<input id="detailPromoCode" placeholder="Enter promo code" style="margin-bottom:12px" oninput="previewPromo()">' +
      '<div id="promoPreview" style="display:none;padding:8px 12px;border-radius:var(--r-sm);background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:var(--green);font-size:0.84rem;margin-bottom:12px;"></div>' +
      '<label>Payment Method</label>' +
      '<div class="payment-options">' +
      '<label class="payment-option" onclick="selectPayment(this, \'gcash\')">' +
      '<input type="radio" name="paymentMethod" value="gcash">' +
      '<div class="payment-card">' +
      '<span class="payment-icon">💙</span>' +
      '<span class="payment-name">GCash</span>' +
      '</div></label>' +
      '<label class="payment-option" onclick="selectPayment(this, \'maya\')">' +
      '<input type="radio" name="paymentMethod" value="maya">' +
      '<div class="payment-card">' +
      '<span class="payment-icon">💚</span>' +
      '<span class="payment-name">Maya</span>' +
      '</div></label>' +
      '</div>' +
      '<div class="board-actions">' +
      '<button class="primary" onclick="reserveRoom(' + room + ')">Reserve</button>' +
      '<button class="secondary" onclick="closeRoomDetailsModal()">Cancel</button></div>' +
      '</div></div>';
    updateBookingDuration();
  }
  roomDetailsModal.classList.remove("hidden");
}

function previewPromo() {
  const input = document.getElementById("detailPromoCode");
  const preview = document.getElementById("promoPreview");
  const durationEl = document.getElementById("bookingDuration");
  if (!input || !preview) return;

  const code = input.value.trim();
  if (!code) { preview.style.display = "none"; return; }

  const promo = getActivePromo(code);
  if (!promo) {
    preview.style.display = "block";
    preview.style.background = "rgba(239,68,68,0.1)";
    preview.style.borderColor = "rgba(239,68,68,0.3)";
    preview.style.color = "var(--red)";
    preview.textContent = "Invalid or expired promo code.";
    return;
  }

  preview.style.display = "block";
  preview.style.background = "rgba(16,185,129,0.1)";
  preview.style.borderColor = "rgba(16,185,129,0.3)";
  preview.style.color = "var(--green)";
  preview.textContent = "✓ Promo applied: " + (promo.type === "percent" ? promo.value + "% OFF" : "₱" + promo.value.toLocaleString() + " OFF");

  // Re-trigger duration update to show discounted estimate
  updateBookingDuration();
}

function selectPayment(label, method) {
  document.querySelectorAll(".payment-option").forEach(function(el) {
    el.classList.remove("selected");
  });
  label.classList.add("selected");
  var radio = label.querySelector("input[type=radio]");
  if (radio) radio.checked = true;
}

// ============================================================
// PROMO / DISCOUNT SYSTEM
// ============================================================
let promos = [];

function savePromos() {
  localStorage.setItem("hotelPromos", JSON.stringify(promos));
}

function loadPromos() {
  try {
    const raw = localStorage.getItem("hotelPromos");
    if (raw) promos = JSON.parse(raw);
  } catch(e) { promos = []; }
}

function getActivePromo(code) {
  if (!code) return null;
  const now = new Date();
  return promos.find(function(p) {
    return p.code.toUpperCase() === code.toUpperCase() &&
           p.active &&
           new Date(p.expiry) >= now;
  }) || null;
}

function applyPromoDiscount(totalAmount, promoCode) {
  const promo = getActivePromo(promoCode);
  if (!promo) return { discount: 0, final: totalAmount, promo: null };
  const discount = promo.type === "percent"
    ? Math.round(totalAmount * promo.value / 100)
    : Math.min(promo.value, totalAmount);
  return { discount: discount, final: totalAmount - discount, promo: promo };
}

function showPromoModal() {
  const modal = document.getElementById("promoModal");
  renderPromoList();
  modal.classList.remove("hidden");
}

function closePromoModal() {
  document.getElementById("promoModal").classList.add("hidden");
}

function renderPromoList() {
  const list = document.getElementById("promoList");
  if (!promos.length) {
    list.innerHTML = '<div class="empty-state">No promos created yet.</div>';
    return;
  }
  list.innerHTML = promos.map(function(p, i) {
    const expired = new Date(p.expiry) < new Date();
    return '<div class="promo-item' + (expired ? ' promo-expired' : '') + '">' +
      '<div>' +
      '<span class="promo-code">' + p.code + '</span>' +
      '<span class="promo-badge">' + (p.type === "percent" ? p.value + "% OFF" : "₱" + p.value.toLocaleString() + " OFF") + '</span>' +
      (expired ? '<span class="promo-tag-expired">Expired</span>' : (p.active ? '<span class="promo-tag-active">Active</span>' : '<span class="promo-tag-inactive">Inactive</span>')) +
      '</div>' +
      '<div class="promo-meta">Expires: ' + p.expiry + '</div>' +
      '<div class="promo-actions">' +
      '<button onclick="togglePromo(' + i + ')" class="promo-toggle-btn">' + (p.active ? 'Deactivate' : 'Activate') + '</button>' +
      '<button onclick="deletePromo(' + i + ')" class="promo-del-btn">Delete</button>' +
      '</div>' +
      '</div>';
  }).join("");
}

function addPromo() {
  const code = document.getElementById("promoCode").value.trim().toUpperCase();
  const type = document.getElementById("promoType").value;
  const value = Number(document.getElementById("promoValue").value);
  const expiry = document.getElementById("promoExpiry").value;

  if (!code || !value || !expiry) { alert("Please fill in all promo fields."); return; }
  if (promos.some(function(p) { return p.code === code; })) { alert("Promo code already exists."); return; }
  if (type === "percent" && (value <= 0 || value > 100)) { alert("Percent discount must be 1–100."); return; }

  promos.push({ code: code, type: type, value: value, expiry: expiry, active: true });
  savePromos();
  renderPromoList();
  document.getElementById("promoCode").value = "";
  document.getElementById("promoValue").value = "";
  document.getElementById("promoExpiry").value = "";
  alert("Promo " + code + " created!");
}

function togglePromo(i) {
  promos[i].active = !promos[i].active;
  savePromos();
  renderPromoList();
}

function deletePromo(i) {
  if (!confirm("Delete promo " + promos[i].code + "?")) return;
  promos.splice(i, 1);
  savePromos();
  renderPromoList();
}

// ============================================================
// MONTHLY INCOME REPORT
// ============================================================
function showReportsModal() {
  const modal = document.getElementById("reportsModal");
  renderMonthlyReport();
  modal.classList.remove("hidden");
}

function closeReportsModal() {
  document.getElementById("reportsModal").classList.add("hidden");
}

function renderMonthlyReport() {
  const container = document.getElementById("monthlyReportContent");
  const checkedOut = bookingHistory.filter(function(e) { return e.type === "checked-out"; });

  if (!checkedOut.length) {
    container.innerHTML = '<div class="empty-state">No checkout history yet.</div>';
    return;
  }

  // Group by month
  const monthly = {};
  checkedOut.forEach(function(e) {
    const d = new Date(e.createdAt);
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const label = d.toLocaleString("en-PH", { month: "long", year: "numeric" });
    if (!monthly[key]) monthly[key] = { label: label, total: 0, count: 0, refunds: 0 };
    monthly[key].total += Number(e.chargedAmount || 0);
    monthly[key].count++;
  });

  // Add refunds from cancelled
  bookingHistory.filter(function(e) { return e.type === "cancelled" && e.refundAmount; }).forEach(function(e) {
    const d = new Date(e.createdAt);
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    if (monthly[key]) monthly[key].refunds += Number(e.refundAmount || 0);
  });

  const sorted = Object.keys(monthly).sort().reverse();
  const grandTotal = sorted.reduce(function(s, k) { return s + monthly[k].total; }, 0);
  const grandRefunds = sorted.reduce(function(s, k) { return s + monthly[k].refunds; }, 0);

  container.innerHTML =
    '<div class="report-summary">' +
    '<div class="report-sum-card"><span>Total Revenue</span><strong>' + formatPeso(grandTotal) + '</strong></div>' +
    '<div class="report-sum-card"><span>Total Refunds</span><strong class="report-red">' + formatPeso(grandRefunds) + '</strong></div>' +
    '<div class="report-sum-card"><span>Net Income</span><strong class="report-green">' + formatPeso(grandTotal - grandRefunds) + '</strong></div>' +
    '</div>' +
    '<table class="report-table">' +
    '<thead><tr><th>Month</th><th>Checkouts</th><th>Revenue</th><th>Refunds</th><th>Net</th></tr></thead>' +
    '<tbody>' +
    sorted.map(function(k) {
      const m = monthly[k];
      return '<tr>' +
        '<td>' + m.label + '</td>' +
        '<td>' + m.count + '</td>' +
        '<td>' + formatPeso(m.total) + '</td>' +
        '<td class="report-red">' + formatPeso(m.refunds) + '</td>' +
        '<td class="report-green">' + formatPeso(m.total - m.refunds) + '</td>' +
        '</tr>';
    }).join("") +
    '</tbody></table>';
}

// ============================================================
// REFUND MANAGEMENT (3-day rule)
// ============================================================
function computeRefund(guest) {
  const now = new Date();
  const checkInDate = new Date(guest.checkIn + "T" + (guest.checkInTime || "14:00"));
  const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
  const nights = Math.max(1, Math.ceil(
    (new Date(guest.checkOut + "T" + (guest.checkOutTime || "12:00")) - checkInDate) / (1000 * 60 * 60 * 24)
  ));
  const totalPrice = nights * getPrice(guest.room);
  const halfPaid = guest.halfPayment || Math.round(totalPrice / 2);

  // 3-day rule: cancel 3+ days before = full refund of half payment
  // cancel 1-2 days before = 50% of half payment refunded
  // cancel same day or after check-in = no refund
  let refundAmount = 0;
  let refundPolicy = "";

  if (daysUntilCheckIn >= 3) {
    refundAmount = halfPaid;
    refundPolicy = "Full refund (" + daysUntilCheckIn + " days before check-in)";
  } else if (daysUntilCheckIn >= 1) {
    refundAmount = Math.round(halfPaid / 2);
    refundPolicy = "50% refund (" + daysUntilCheckIn + " day(s) before check-in)";
  } else {
    refundAmount = 0;
    refundPolicy = "No refund (same day or past check-in)";
  }

  return { refundAmount: refundAmount, refundPolicy: refundPolicy, halfPaid: halfPaid, daysUntilCheckIn: daysUntilCheckIn };
}

function reserveRoom(room) {
  const nameField = document.getElementById("detailName");
  const phoneField = document.getElementById("detailPhone");
  const emailField = document.getElementById("detailEmail");
  const checkInField = document.getElementById("detailCheckIn");
  const checkInTimeField = document.getElementById("detailCheckInTime");
  const checkOutField = document.getElementById("detailCheckOut");
  const checkOutTimeField = document.getElementById("detailCheckOutTime");
  const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
  const promoInput = document.getElementById("detailPromoCode");
  const promoCode = promoInput ? promoInput.value.trim() : "";

  if (!nameField || !nameField.value.trim() || !phoneField || !phoneField.value.trim() ||
      !emailField || !emailField.value.trim() || !checkInField || !checkInField.value ||
      !checkInTimeField || !checkInTimeField.value || !checkOutField || !checkOutField.value ||
      !checkOutTimeField || !checkOutTimeField.value) {
    alert("Please fill in guest details, dates, and times");
    return;
  }

  if (!paymentRadio) {
    alert("Please select a payment method (GCash or Maya)");
    return;
  }

  const start = new Date(checkInField.value + "T" + checkInTimeField.value);
  const end = new Date(checkOutField.value + "T" + checkOutTimeField.value);
  if (end <= start) { alert("Check-out must be after check-in"); return; }
  if (getGuest(room)) { alert("This room already has an active reservation"); return; }

  // Calculate nights and total
  const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const baseTotal = nights * getPrice(room);

  // Apply promo if any
  let promoResult = { discount: 0, final: baseTotal, promo: null };
  if (promoCode) {
    promoResult = applyPromoDiscount(baseTotal, promoCode);
    if (!promoResult.promo) {
      alert("Invalid or expired promo code.");
      return;
    }
  }

  const discountedTotal = promoResult.final;
  const halfPayment = Math.round(discountedTotal / 2);

  const confirmMsg = "Reservation Summary:\n\n" +
    "Room " + room + " - " + getType(room) + "\n" +
    "Duration: " + nights + " night(s)\n" +
    "Base Total: " + formatPeso(baseTotal) + "\n" +
    (promoResult.discount > 0 ? "Promo Discount: -" + formatPeso(promoResult.discount) + "\n" : "") +
    "Total After Discount: " + formatPeso(discountedTotal) + "\n\n" +
    "HALF PAYMENT DUE NOW: " + formatPeso(halfPayment) + "\n" +
    "Remaining Balance: " + formatPeso(discountedTotal - halfPayment) + "\n\n" +
    "Payment via: " + paymentRadio.value.toUpperCase() + "\n\n" +
    "Confirm reservation?";

  if (!confirm(confirmMsg)) return;

  guests.push({
    id: Date.now(),
    name: nameField.value.trim(),
    phone: phoneField.value.trim(),
    email: emailField.value.trim(),
    room: room,
    checkIn: checkInField.value,
    checkInTime: checkInTimeField.value,
    checkOut: checkOutField.value,
    checkOutTime: checkOutTimeField.value,
    paymentMethod: paymentRadio.value,
    promoCode: promoCode || null,
    discount: promoResult.discount,
    totalAmount: discountedTotal,
    halfPayment: halfPayment,
    balanceDue: discountedTotal - halfPayment,
    nights: nights,
    createdAt: new Date().toISOString()
  });

  saveState();
  alert("Reservation confirmed!\n\nHalf payment of " + formatPeso(halfPayment) + " collected via " + paymentRadio.value.toUpperCase() + ".\nRemaining balance of " + formatPeso(discountedTotal - halfPayment) + " due at checkout.");
  closeRoomDetailsModal();
  render();
  update();
  renderRooms();
}

function updateEditSummary(room) {
  const checkInEl  = document.getElementById("editCheckIn");
  const checkOutEl = document.getElementById("editCheckOut");
  const summaryEl  = document.getElementById("editPriceSummary");
  if (!checkInEl || !checkOutEl || !summaryEl) return;

  const checkIn  = checkInEl.value;
  const checkOut = checkOutEl.value;

  if (!checkIn || !checkOut) {
    summaryEl.innerHTML = '';
    return;
  }

  const start = new Date(checkIn + "T14:00");
  const end   = new Date(checkOut + "T12:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    summaryEl.innerHTML = '<div class="edit-summary-error">⚠ Check-out must be after check-in</div>';
    return;
  }

  const nights        = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const pricePerNight = getPrice(room);
  const newTotal      = nights * pricePerNight;
  const newHalfPayment = Math.round(newTotal / 2);

  // Get original booking data
  const guest         = getGuest(room);
  const origTotal     = guest ? (guest.totalAmount || (guest.nights || 1) * pricePerNight) : newTotal;
  const oldHalfPaid   = guest ? (guest.halfPayment || Math.round(origTotal / 2)) : Math.round(origTotal / 2);
  const additionalHalf = Math.max(0, newHalfPayment - oldHalfPaid);
  const newBalance    = newTotal - newHalfPayment;
  const isExtension   = nights > (guest ? (guest.nights || 1) : 1);
  const isShorter     = nights < (guest ? (guest.nights || 1) : 1);

  summaryEl.innerHTML =
    '<div class="edit-summary">' +
    '<div class="edit-summary-row"><span>Duration</span><strong>' + nights + ' night(s)</strong></div>' +
    '<div class="edit-summary-row"><span>Rate</span><strong>' + formatPeso(pricePerNight) + ' / night</strong></div>' +
    '<div class="edit-summary-row"><span>New Total</span><strong>' + formatPeso(newTotal) + '</strong></div>' +
    '<div class="edit-summary-row"><span>New Half Payment (50%)</span><strong>' + formatPeso(newHalfPayment) + '</strong></div>' +
    '<div class="edit-summary-row"><span>Previously Paid</span><strong style="color:var(--green)">' + formatPeso(oldHalfPaid) + ' ✓</strong></div>' +
    (additionalHalf > 0 ? '<div class="edit-summary-row edit-summary-highlight"><span>Additional Half Due Now</span><strong style="color:var(--gold)">+' + formatPeso(additionalHalf) + '</strong></div>' : '') +
    (isShorter ? '<div class="edit-summary-row edit-summary-highlight"><span>Reduced Total</span><strong style="color:var(--teal)">-' + formatPeso(origTotal - newTotal) + '</strong></div>' : '') +
    '<div class="edit-summary-row edit-summary-total"><span>Balance Due at Checkout</span><strong>' + formatPeso(newBalance) + '</strong></div>' +
    '</div>';
}

function startEdit(room) {
  isEditing = true;
  editingRoom = room;
  handleRoomClick(room);
}

function cancelEdit() {
  const room = editingRoom;
  isEditing = false;
  editingRoom = null;
  if (room !== null) handleRoomClick(room);
}

function updateReservation(room) {
  const guest = guests.find(function(item) { return item.room === room; });
  if (!guest) return;

  const newName    = document.getElementById("editName").value.trim();
  const newPhone   = document.getElementById("editPhone").value.trim();
  const newEmail   = document.getElementById("editEmail").value.trim();
  const newCheckIn = document.getElementById("editCheckIn").value;
  const newCheckOut= document.getElementById("editCheckOut").value;

  if (!newName || !newPhone || !newEmail || !newCheckIn || !newCheckOut) {
    alert("Please fill in all fields"); return;
  }
  if (new Date(newCheckOut) <= new Date(newCheckIn)) {
    alert("Check-out must be after check-in"); return;
  }

  // Recalculate pricing based on new dates
  const start  = new Date(newCheckIn + "T14:00");
  const end    = new Date(newCheckOut + "T12:00");
  const newNights     = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const pricePerNight = getPrice(room);
  const newTotal      = newNights * pricePerNight;
  const newHalfPayment = Math.round(newTotal / 2);           // always 50% of new total
  const oldHalfPaid   = guest.halfPayment || Math.round((guest.totalAmount || newTotal) / 2);
  const additionalHalf = Math.max(0, newHalfPayment - oldHalfPaid); // extra half due now
  const newBalance    = newTotal - newHalfPayment;           // remaining 50% at checkout

  let confirmMsg = "Update reservation for " + newName + "?\n\n" +
    "New Duration: " + newNights + " night(s)\n" +
    "New Total: " + formatPeso(newTotal) + "\n\n" +
    "New Half Payment (50%): " + formatPeso(newHalfPayment) + "\n" +
    "Previously Paid: " + formatPeso(oldHalfPaid) + "\n";

  if (additionalHalf > 0) {
    confirmMsg += "Additional Half Payment Due Now: " + formatPeso(additionalHalf) + "\n";
  }

  confirmMsg += "Balance Due at Checkout: " + formatPeso(newBalance);

  if (!confirm(confirmMsg)) return;

  guest.name        = newName;
  guest.phone       = newPhone;
  guest.email       = newEmail;
  guest.checkIn     = newCheckIn;
  guest.checkOut    = newCheckOut;
  guest.nights      = newNights;
  guest.totalAmount = newTotal;
  guest.halfPayment = newHalfPayment;   // updated to 50% of new total
  guest.balanceDue  = newBalance;

  isEditing   = false;
  editingRoom = null;
  saveState();

  if (additionalHalf > 0) {
    alert("Reservation updated!\n\nAdditional half payment of " + formatPeso(additionalHalf) + " collected.\nBalance due at checkout: " + formatPeso(newBalance));
  } else {
    alert("Reservation updated!\nBalance due at checkout: " + formatPeso(newBalance));
  }

  render();
  update();
  renderRooms();
  closeRoomDetailsModal();
}

function cancelReservation(room) {
  const guest = getGuest(room);
  if (!guest) return;

  const refund = computeRefund(guest);
  const confirmMsg = "Cancel Reservation for " + guest.name + "?\n\n" +
    "Refund Policy:\n" + refund.refundPolicy + "\n\n" +
    "Half Payment Paid: " + formatPeso(refund.halfPaid) + "\n" +
    "Refund Amount: " + formatPeso(refund.refundAmount) + "\n\n" +
    "Proceed with cancellation?";

  if (!confirm(confirmMsg)) return;

  bookingHistory.unshift({
    id: "history-" + Date.now(),
    type: "cancelled",
    guestName: guest.name,
    room: guest.room,
    roomType: getType(guest.room),
    chargedAmount: 0,
    refundAmount: refund.refundAmount,
    refundPolicy: refund.refundPolicy,
    halfPaid: refund.halfPaid,
    checkIn: guest.checkIn,
    checkOut: guest.checkOut,
    createdAt: new Date().toISOString()
  });

  guests = guests.filter(function(item) { return item.room !== room; });
  saveState();

  if (refund.refundAmount > 0) {
    alert("Reservation cancelled.\n\nRefund of " + formatPeso(refund.refundAmount) + " will be processed to guest's " + (guest.paymentMethod || "payment method").toUpperCase() + ".\n\n" + refund.refundPolicy);
  } else {
    alert("Reservation cancelled.\n\nNo refund applicable.\n" + refund.refundPolicy);
  }

  render();
  update();
  renderRooms();
  closeRoomDetailsModal();
}

function updateBookingDuration() {
  const checkInEl = document.getElementById("detailCheckIn");
  const checkInTimeEl = document.getElementById("detailCheckInTime");
  const checkOutEl = document.getElementById("detailCheckOut");
  const checkOutTimeEl = document.getElementById("detailCheckOutTime");
  const durationEl = document.getElementById("bookingDuration");
  if (!durationEl) return;

  const checkIn = checkInEl ? checkInEl.value : "";
  const checkInTime = (checkInTimeEl && checkInTimeEl.value) ? checkInTimeEl.value : "14:00";
  const checkOut = checkOutEl ? checkOutEl.value : "";
  const checkOutTime = (checkOutTimeEl && checkOutTimeEl.value) ? checkOutTimeEl.value : "12:00";

  if (!checkIn || !checkOut) {
    durationEl.textContent = "Duration: set check-in and check-out first";
    return;
  }

  const start = new Date(checkIn + "T" + checkInTime);
  const end = new Date(checkOut + "T" + checkOutTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    durationEl.textContent = "Duration: check-out must be after check-in";
    return;
  }

  const diffHours = Math.ceil((end - start) / (1000 * 60 * 60));
  const nights = Math.floor(diffHours / 24);
  const hours = diffHours % 24;
  const h3 = document.querySelector(".booking-card-header h3");
  const roomNum = editingRoom || (h3 ? Number((h3.textContent.match(/\d+/) || [101])[0]) : 101);
  const estimated = Math.max(1, Math.ceil(diffHours / 24)) * getPrice(roomNum);
  durationEl.textContent = "Duration: " + nights + " night(s) " + hours + " hour(s) \u2022 Est. " + formatPeso(estimated);
}

function getClass(room) {
  if (room <= 102) return "vip";
  if (room <= 105) return "high";
  return "low";
}

function getType(room) {
  if (room <= 102) return "VIP Suite";
  if (room <= 105) return "High Class";
  return "Standard";
}

function getImg(room) {
  if (room === 101) return "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80";
  if (room === 102) return "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80";
  if (room === 103) return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80";
  if (room === 104) return "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80";
  if (room === 105) return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80";
  if (room === 106) return "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80";
  if (room === 107) return "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80";
  if (room === 108) return "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80";
  return "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80";
}

function getBadgeText(room) {
  if (room <= 102) return "VIP";
  if (room <= 105) return "HIGH CLASS";
  return "STANDARD";
}

function getFeatures(room) {
  if (room <= 102) return "Ocean View \u2022 King Bed \u2022 Pool Access \u2022 Room Service";
  if (room <= 105) return "City View \u2022 Queen Bed \u2022 Smart TV \u2022 Coffee Maker";
  return "Standard Bed \u2022 TV \u2022 WiFi \u2022 Clean Bathroom";
}

function getPrice(room) {
  if (room <= 102) return 8500;
  if (room <= 105) return 5500;
  return 3200;
}

function getGuest(room) {
  return guests.find((item) => Number(item.room) === Number(room));
}

function closeModal() {
  bookingModal.classList.add("hidden");
}

function closeRoomDetailsModal() {
  isEditing = false;
  editingRoom = null;
  roomDetailsModal.classList.add("hidden");
}

function showBulkCancelModal() {
  bulkModal.classList.remove("hidden");
}

function closeBulkModal() {
  bulkModal.classList.add("hidden");
}

function showReceiptModal() {
  if (!lastReceipt) { alert("No recent receipt available"); return; }
  const r = lastReceipt;
  receiptContent.innerHTML =
    '<div class="receipt-grid">' +
    '<p><strong>Guest:</strong> ' + r.guestName + '</p>' +
    '<p><strong>Room:</strong> ' + r.room + ' (' + r.roomType + ')</p>' +
    '<p><strong>Check-in:</strong> ' + r.checkIn + '</p>' +
    '<p><strong>Check-out:</strong> ' + r.checkOut + '</p>' +
    '<p><strong>Stay:</strong> ' + r.nights + ' night(s)</p>' +
    '<p><strong>Rate:</strong> ' + formatPeso(r.pricePerNight) + ' / night</p>' +
    (r.discount > 0 ? '<p><strong>Promo (' + (r.promoCode || '') + '):</strong> <span style="color:var(--green)">-' + formatPeso(r.discount) + '</span></p>' : '') +
    '<p><strong>Total:</strong> ' + formatPeso(r.chargedAmount) + '</p>' +
    '<p><strong>Half Payment:</strong> <span style="color:var(--green)">' + formatPeso(r.halfPayment) + ' ✓ Paid</span></p>' +
    '<p><strong>Balance Collected:</strong> ' + formatPeso(r.balanceDue) + '</p>' +
    '<p><strong>Payment via:</strong> ' + (r.paymentMethod ? r.paymentMethod.toUpperCase() : 'N/A') + '</p>' +
    '</div>';
  receiptModal.classList.remove("hidden");
}

function closeReceiptModal() {
  receiptModal.classList.add("hidden");
}

function buildReceipt(guest) {
  const start = new Date(guest.checkIn + "T" + (guest.checkInTime || "14:00"));
  const end = new Date();
  const nights = guest.nights || Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const pricePerNight = getPrice(guest.room);
  const baseTotal = nights * pricePerNight;
  const discount = guest.discount || 0;
  const totalAmount = guest.totalAmount || (baseTotal - discount);
  const halfPayment = guest.halfPayment || Math.round(totalAmount / 2);
  const balanceDue = totalAmount - halfPayment;

  return {
    guestName: guest.name,
    room: guest.room,
    roomType: getType(guest.room),
    nights: nights,
    pricePerNight: pricePerNight,
    baseTotal: baseTotal,
    discount: discount,
    promoCode: guest.promoCode || null,
    chargedAmount: totalAmount,
    halfPayment: halfPayment,
    balanceDue: balanceDue,
    paymentMethod: guest.paymentMethod || null,
    checkIn: guest.checkIn + " " + (guest.checkInTime || "14:00"),
    checkOut: end.toLocaleString()
  };
}

function checkout(room) {
  const guest = getGuest(room);
  if (!guest) return;
  lastReceipt = buildReceipt(guest);
  bookingHistory.unshift({
    id: "history-" + Date.now(),
    type: "checked-out",
    guestName: guest.name,
    room: guest.room,
    roomType: lastReceipt.roomType,
    chargedAmount: lastReceipt.chargedAmount,
    checkIn: guest.checkIn,
    checkOut: lastReceipt.checkOut,
    createdAt: new Date().toISOString()
  });
  guests = guests.filter((item) => item.room !== room);
  saveState();
  render();
  update();
  renderRooms();
  showReceiptModal();
}

function checkoutAllGuests() {
  if (!guests.length) { alert("No guests to checkout"); return; }
  if (!confirm("Checkout all " + guests.length + " guests?")) return;

  let totalAmount = 0;
  const allGuests = guests.slice();
  allGuests.forEach(function(guest) {
    const receipt = buildReceipt(guest);
    totalAmount += receipt.chargedAmount;
    bookingHistory.unshift({
      id: "history-" + Date.now() + "-" + guest.room,
      type: "checked-out",
      guestName: guest.name,
      room: guest.room,
      roomType: receipt.roomType,
      chargedAmount: receipt.chargedAmount,
      checkIn: guest.checkIn,
      checkOut: receipt.checkOut,
      createdAt: new Date().toISOString()
    });
    lastReceipt = receipt;
  });

  guests = [];
  saveState();
  closeBulkModal();
  render();
  update();
  renderRooms();
  alert("All guests checked out. Total collected: " + formatPeso(totalAmount));
}

function cancelAllReservations() {
  if (!guests.length) { alert("No reservations to cancel"); return; }
  if (!confirm("Cancel all " + guests.length + " reservations?")) return;

  guests.forEach(function(guest) {
    bookingHistory.unshift({
      id: "history-" + Date.now() + "-" + guest.room,
      type: "cancelled",
      guestName: guest.name,
      room: guest.room,
      roomType: getType(guest.room),
      chargedAmount: 0,
      checkIn: guest.checkIn,
      checkOut: guest.checkOut,
      createdAt: new Date().toISOString()
    });
  });

  guests = [];
  saveState();
  closeBulkModal();
  render();
  update();
  renderRooms();
  alert("All reservations cancelled.");
}

function clearAllData() {
  if (!confirm("This will clear all reservations and history. Continue?")) return;
  guests = [];
  bookingHistory = [];
  lastReceipt = null;
  saveState();
  closeBulkModal();
  render();
  update();
  renderRooms();
  alert("All data cleared. Reservations and history have been removed.");
}

function bookModal() {
  if (!modalName.value || !modalCheckIn.value || !modalCheckOut.value) {
    alert("Please fill all fields"); return;
  }
  if (new Date(modalCheckOut.value) <= new Date(modalCheckIn.value)) {
    alert("Check-out must be after check-in"); return;
  }
  guests.push({
    id: Date.now(),
    name: modalName.value.trim(),
    phone: "",
    email: "",
    room: Number(document.getElementById("modalRoom").textContent),
    checkIn: modalCheckIn.value,
    checkInTime: "14:00",
    checkOut: modalCheckOut.value,
    checkOutTime: "12:00",
    createdAt: new Date().toISOString()
  });
  modalName.value = "";
  modalCheckIn.value = "";
  modalCheckOut.value = "";
  saveState();
  closeModal();
  render();
  update();
  renderRooms();
}

function renderHistory() {
  if (!bookingHistory.length) {
    historyList.innerHTML = '<div class="empty-state">No completed or cancelled bookings yet</div>';
    return;
  }
  historyList.innerHTML = bookingHistory.slice(0, 8).map(function(entry) {
    return '<div class="history-item">' +
      '<div><h4>' + entry.guestName + ' - Room ' + entry.room + '</h4>' +
      '<p>' + (entry.type === "checked-out" ? "Checked out" : "Cancelled") + ' \u2022 ' + entry.roomType + '</p></div>' +
      '<div class="history-meta"><span>' + formatPeso(entry.chargedAmount) + '</span>' +
      '<small>' + formatDateTime(entry.createdAt) + '</small></div>' +
      '</div>';
  }).join("");
}

function render() {
  if (!guests.length) {
    guestsList.innerHTML = '<div class="empty-state">No guests currently checked in</div>';
    recentActivity.innerHTML = '<div class="empty-state">No recent activity</div>';
  } else {
    guestsList.innerHTML = guests.map(function(guest) {
      return '<div class="guest-item">' +
        '<div class="guest-info">' +
        '<h4>' + guest.name + '</h4>' +
        '<p>Room ' + guest.room + ' - ' + guest.checkIn + ' to ' + guest.checkOut + '</p>' +
        '<p>' + (guest.phone || "No phone") + ' \u2022 ' + (guest.email || "No email") + '</p>' +
        '</div>' +
        '<div class="guest-actions">' +
        '<button onclick="handleRoomClick(' + guest.room + ')" style="background:#3b82f6;">View</button>' +
        '<button onclick="checkout(' + guest.room + ')" style="background:#ef4444;">Checkout</button>' +
        '</div></div>';
    }).join("");

    recentActivity.innerHTML = guests.slice().reverse().map(function(guest) {
      return '<div class="activity-item">' +
        '<div class="activity-icon">IN</div>' +
        '<div class="activity-content"><p><strong>' + guest.name + '</strong> is staying in Room ' + guest.room + '</p></div>' +
        '<div class="activity-time">' + guest.checkIn + '</div>' +
        '</div>';
    }).join("");
  }
  renderHistory();
}

function update() {
  total.textContent = rooms.length;
  occ.textContent = guests.length;
  avail.textContent = rooms.length - guests.length;

  const totalRealRevenue = bookingHistory
    .filter((entry) => entry.type === "checked-out")
    .reduce((sum, entry) => sum + Number(entry.chargedAmount || 0), 0);
  revenue.textContent = totalRealRevenue.toLocaleString();

  const totalStayDays = bookingHistory
    .filter((entry) => entry.type === "checked-out")
    .reduce((sum, entry) => sum + estimateNightsFromHistory(entry), 0);
  const completedStays = bookingHistory.filter((entry) => entry.type === "checked-out").length;
  avgStay.textContent = completedStays ? Math.round(totalStayDays / completedStays) : 0;

  const occupancyPercent = Math.round((guests.length / rooms.length) * 100);
  occupancy.textContent = occupancyPercent + "%";
}

function estimateNightsFromHistory(entry) {
  const money = Number(entry.chargedAmount || 0);
  const rate = getPrice(entry.room);
  return rate ? Math.max(1, Math.round(money / rate)) : 0;
}

function syncWelcome() {
  if (welcomeUser) {
    welcomeUser.textContent = currentUser ? "Signed in as " + currentUser : "Hotel front desk";
  }
}

function formatPeso(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function attachFilterEvents() {
  roomSearch.addEventListener("input", renderRooms);
  roomTypeFilter.addEventListener("change", function() {
    selectedRoomType = roomTypeFilter.value;
    renderRooms();
  });
  roomStatusFilter.addEventListener("change", renderRooms);
}

function init() {
  initTheme();
  loadState();
  loadPromos();
  attachFilterEvents();
  updateAuthMode();
  syncWelcome();
  render();
  update();
  renderRooms();
  if (currentUser) {
    authSection.classList.add("hidden");
    showLanding();
  }
}

init();
