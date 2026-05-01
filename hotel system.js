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
      '<p><strong>Price:</strong> ' + formatPeso(getPrice(room)) + ' / night</p></div>' +
      '<input id="editName" placeholder="Guest Name" value="' + guest.name + '">' +
      '<input id="editPhone" placeholder="Phone Number" value="' + (guest.phone || "") + '">' +
      '<input id="editEmail" type="email" placeholder="Email Address" value="' + (guest.email || "") + '">' +
      '<input id="editCheckIn" type="date" value="' + guest.checkIn + '">' +
      '<input id="editCheckOut" type="date" value="' + guest.checkOut + '">' +
      '<div class="board-actions">' +
      '<button class="primary" onclick="updateReservation(' + room + ')">Save Changes</button>' +
      '<button class="secondary" onclick="cancelEdit()">Cancel Edit</button></div>';
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
      '<p><strong>Payment:</strong> ' + (guest.paymentMethod ? guest.paymentMethod.toUpperCase() : 'N/A') + '</p></div>' +
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

function selectPayment(label, method) {
  document.querySelectorAll(".payment-option").forEach(function(el) {
    el.classList.remove("selected");
  });
  label.classList.add("selected");
  var radio = label.querySelector("input[type=radio]");
  if (radio) radio.checked = true;
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
    createdAt: new Date().toISOString()
  });

  saveState();
  alert("Reservation successful!");
  closeRoomDetailsModal();
  render();
  update();
  renderRooms();
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
  const guest = guests.find((item) => item.room === room);
  if (!guest) return;

  const newName = document.getElementById("editName").value.trim();
  const newPhone = document.getElementById("editPhone").value.trim();
  const newEmail = document.getElementById("editEmail").value.trim();
  const newCheckIn = document.getElementById("editCheckIn").value;
  const newCheckOut = document.getElementById("editCheckOut").value;

  if (!newName || !newPhone || !newEmail || !newCheckIn || !newCheckOut) {
    alert("Please fill in all fields"); return;
  }
  if (new Date(newCheckOut) <= new Date(newCheckIn)) {
    alert("Check-out must be after check-in"); return;
  }

  guest.name = newName;
  guest.phone = newPhone;
  guest.email = newEmail;
  guest.checkIn = newCheckIn;
  guest.checkOut = newCheckOut;

  isEditing = false;
  editingRoom = null;
  saveState();
  alert("Reservation updated successfully!");
  render();
  update();
  renderRooms();
  closeRoomDetailsModal();
}

function cancelReservation(room) {
  const guest = getGuest(room);
  if (!guest) return;
  if (!confirm("Are you sure you want to cancel this reservation?")) return;

  bookingHistory.unshift({
    id: "history-" + Date.now(),
    type: "cancelled",
    guestName: guest.name,
    room: guest.room,
    roomType: getType(guest.room),
    chargedAmount: 0,
    checkIn: guest.checkIn,
    checkOut: guest.checkOut,
    createdAt: new Date().toISOString()
  });

  guests = guests.filter((item) => item.room !== room);
  saveState();
  alert("Reservation cancelled!");
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
  receiptContent.innerHTML =
    '<div class="receipt-grid">' +
    '<p><strong>Guest:</strong> ' + lastReceipt.guestName + '</p>' +
    '<p><strong>Room:</strong> ' + lastReceipt.room + '</p>' +
    '<p><strong>Room Type:</strong> ' + lastReceipt.roomType + '</p>' +
    '<p><strong>Stay:</strong> ' + lastReceipt.nights + ' night(s)</p>' +
    '<p><strong>Rate:</strong> ' + formatPeso(lastReceipt.pricePerNight) + ' / night</p>' +
    '<p><strong>Total:</strong> ' + formatPeso(lastReceipt.chargedAmount) + '</p>' +
    '<p><strong>Payment:</strong> ' + (lastReceipt.paymentMethod ? lastReceipt.paymentMethod.toUpperCase() : 'N/A') + '</p>' +
    '<p><strong>Check-in:</strong> ' + lastReceipt.checkIn + '</p>' +
    '<p><strong>Check-out:</strong> ' + lastReceipt.checkOut + '</p>' +
    '</div>';
  receiptModal.classList.remove("hidden");
}

function closeReceiptModal() {
  receiptModal.classList.add("hidden");
}

function buildReceipt(guest) {
  const start = new Date(guest.checkIn + "T" + (guest.checkInTime || "14:00"));
  const end = new Date();
  const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const pricePerNight = getPrice(guest.room);
  return {
    guestName: guest.name,
    room: guest.room,
    roomType: getType(guest.room),
    nights: nights,
    pricePerNight: pricePerNight,
    chargedAmount: nights * pricePerNight,
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
