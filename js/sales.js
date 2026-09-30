// -----------------------------------------------------------------------------
// State and configuration
// -----------------------------------------------------------------------------

let cart = [];
let currentReceipt = null;
const DEFAULT_KH_QR_IMAGE = 'images/qr.jpg';

// -----------------------------------------------------------------------------
// Page setup and events
// -----------------------------------------------------------------------------

function initializeSales() {
  cart = loadCart();
  renderProductsForSale();
  renderCart();
  attachSalesListeners();
  updatePaymentUI();
}

function attachSalesListeners() {
  const search = document.getElementById('salesSearch');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const discountInput = document.getElementById('discount');
  const taxInput = document.getElementById('tax');
  const cashInput = document.getElementById('cashTendered');
  const paymentMethodSelect = document.getElementById('paymentMethod');
  const paymentCurrencySelect = document.getElementById('paymentCurrency');
  const exchangeRateInput = document.getElementById('exchangeRate');

  if (search) search.addEventListener('input', renderProductsForSale);
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
  if (discountInput) discountInput.addEventListener('input', renderCart);
  if (taxInput) taxInput.addEventListener('input', renderCart);
  if (cashInput) cashInput.addEventListener('input', renderCart);
  if (paymentMethodSelect) paymentMethodSelect.addEventListener('change', () => {
    updatePaymentUI();
    renderCart();
  });
  if (paymentCurrencySelect) paymentCurrencySelect.addEventListener('change', renderCart);
  if (exchangeRateInput) exchangeRateInput.addEventListener('input', () => {
    renderCart();
    renderProductsForSale();
  });
}

// -----------------------------------------------------------------------------
// Totals and currency conversion
// -----------------------------------------------------------------------------

function getCurrentTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountPercent = Math.min(100, Math.max(0, Number(document.getElementById('discount')?.value || 0)));
  const discount = subtotal * (discountPercent / 100);
  const tax = Number(document.getElementById('tax')?.value || 0);
  const taxAmount = subtotal * (tax / 100);
  const discounted = subtotal - discount;
  const total = discounted + taxAmount;
  return { subtotal, discount, discountPercent, taxAmount, total };
}

function getPaymentCurrency() {
  return document.getElementById('paymentCurrency')?.value || 'usd';
}

function getExchangeRate() {
  const rate = Number(document.getElementById('exchangeRate')?.value || 4100);
  return rate > 0 ? rate : 4100;
}

function getPaymentAmount(usdAmount) {
  return getPaymentCurrency() === 'khr' ? roundKHR(usdAmount * getExchangeRate()) : usdAmount;
}

function checkoutDualMarkup(usdAmount) {
  const usd = Number(usdAmount) || 0;
  return `<span>${formatCurrency(usd)}</span><small>${formatKHR(usd * getExchangeRate())}</small>`;
}

// -----------------------------------------------------------------------------
// Payment and QR display
// -----------------------------------------------------------------------------

function updatePaymentUI() {
  const paymentMethod = document.getElementById('paymentMethod')?.value || 'cash';
  const paymentCurrency = getPaymentCurrency();
  const wrap = document.getElementById('khQrUploadWrap');
  const cashInput = document.getElementById('cashTendered');
  const customerQrAmount = document.getElementById('customerQrAmount');

  if (wrap) wrap.style.display = paymentMethod === 'khqr' ? 'grid' : 'none';

  if (cashInput) {
    cashInput.disabled = paymentMethod === 'khqr';
    cashInput.placeholder = paymentCurrency === 'khr' ? 'Cash Received (KHR)' : 'Cash Received (USD)';
  }

  if (customerQrAmount) {
    const totals = getCurrentTotals();
    customerQrAmount.innerHTML = checkoutDualMarkup(totals.total);
  }

  const preview = document.getElementById('khQrPreview');
  const previewFrame = document.getElementById('khQrPreviewFrame');
  const placeholder = document.getElementById('khQrPlaceholder');

  if (!preview || !previewFrame || !placeholder) return;

  if (paymentMethod === 'khqr') {
    preview.src = DEFAULT_KH_QR_IMAGE;
    previewFrame.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    preview.src = '';
    previewFrame.style.display = 'none';
    placeholder.style.display = 'flex';
  }
}

// -----------------------------------------------------------------------------
// Products and cart
// -----------------------------------------------------------------------------

function getRemainingStock(productId) {
  const products = loadProducts();
  const product = products.find((item) => item.id === productId);
  if (!product) return 0;

  const existingItem = cart.find((item) => item.productId === productId);
  const currentInCart = existingItem ? Number(existingItem.quantity) : 0;
  return Math.max(0, Number(product.stock) - currentInCart);
}

function renderProductsForSale() {
  const products = loadProducts();
  const query = document.getElementById('salesSearch')?.value.toLowerCase() || '';
  const list = document.getElementById('productList');
  if (!list) return;

  const filtered = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query));

  if (!filtered.length) {
    list.innerHTML = createEmptyState('No products', 'Products will appear here when you add them.');
    return;
  }

  list.innerHTML = filtered.map((product) => {
    const remaining = getRemainingStock(product.id);
    const disabled = remaining <= 0;
    return `
      <div class="product-card ${disabled ? 'disabled' : ''}" onclick="${disabled ? '' : `addToCart('${product.id}')`}">
        ${product.image ? `<img src="${product.image}" alt="${product.name}" />` : '<div class="product-placeholder"></div>'}
        <h4>${product.name}</h4>
        <p>${product.category}</p>
        <div class="product-meta">
          <strong class="checkout-dual-money">${checkoutDualMarkup(product.price)}</strong>
          <span>${disabled ? 'Out of Stock' : `Stock: ${remaining}`}</span>
        </div>
      </div>
    `;
  }).join('');
}

function addToCart(productId) {
  const products = loadProducts();
  const product = products.find((item) => item.id === productId);
  if (!product) {
    showNotification('Product not found.', 'error');
    return;
  }

  const remaining = getRemainingStock(productId);
  if (remaining <= 0) {
    showNotification('Product is out of stock.', 'error');
    return;
  }

  const existingItem = cart.find((item) => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ productId, name: product.name, price: Number(product.price), quantity: 1 });
  }

  saveCart(cart);
  renderCart();
  renderProductsForSale();
  showNotification(`${product.name} added to cart.`);
}

function removeCartItem(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  saveCart(cart);
  renderCart();
}

function updateCart(productId, quantity) {
  cart = cart.map((item) => (item.productId === productId ? { ...item, quantity: Number(quantity) } : item));
  saveCart(cart);
  renderCart();
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const subtotalValue = document.getElementById('subtotalValue');
  const discountValue = document.getElementById('discountValue');
  const discountLabel = document.getElementById('discountLabel');
  const taxValue = document.getElementById('taxValue');
  const grandTotalValue = document.getElementById('grandTotalValue');
  const customerPayValue = document.getElementById('customerPayValue');
  const changeValue = document.getElementById('changeValue');
  if (!body) return;
  const enteredDiscountPercent = Math.min(100, Math.max(0, Number(document.getElementById('discount')?.value || 0)));
  if (discountLabel) discountLabel.textContent = `Discount (${enteredDiscountPercent.toFixed(2).replace(/\.00$/, '')}%)`;

  if (!cart.length) {
    body.innerHTML = '<tr><td colspan="5">Cart is empty.</td></tr>';
    if (subtotalValue) subtotalValue.innerHTML = checkoutDualMarkup(0);
    if (discountValue) discountValue.innerHTML = checkoutDualMarkup(0);
    if (taxValue) taxValue.innerHTML = checkoutDualMarkup(0);
    if (grandTotalValue) grandTotalValue.innerHTML = checkoutDualMarkup(0);
    if (customerPayValue) customerPayValue.innerHTML = checkoutDualMarkup(0);
    if (changeValue) changeValue.innerHTML = checkoutDualMarkup(0);
    updatePaymentUI();
    return;
  }

  body.innerHTML = cart.map((item) => {
    const remaining = getRemainingStock(item.productId);
    const maxReached = remaining <= 0;
    return `
      <tr>
        <td>${item.name}</td>
        <td>
          <div class="qty-control">
            <button onclick="updateCart('${item.productId}', ${Math.max(1, item.quantity - 1)})">-</button>
            <span>${item.quantity}</span>
            <button ${maxReached ? 'disabled' : ''} onclick="${maxReached ? '' : `updateCart('${item.productId}', ${item.quantity + 1})`}">+</button>
          </div>
        </td>
        <td><span class="checkout-dual-money">${checkoutDualMarkup(item.price)}</span></td>
        <td><span class="checkout-dual-money">${checkoutDualMarkup(item.price * item.quantity)}</span></td>
        <td><button class="ghost-btn" onclick="removeCartItem('${item.productId}')"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `;
  }).join('');

  const paymentMethod = document.getElementById('paymentMethod')?.value || 'cash';
  const paymentCurrency = getPaymentCurrency();
  const totals = getCurrentTotals();
  const subtotal = totals.subtotal;
  const discount = totals.discount;
  const paymentTotal = getPaymentAmount(totals.total);
  const cashTendered = paymentMethod === 'khqr' ? paymentTotal : Number(document.getElementById('cashTendered')?.value || 0);
  const taxAmount = totals.taxAmount;
  const total = totals.total;
  const change = paymentMethod === 'khqr' ? 0 : Math.max(0, cashTendered - paymentTotal);

  const changeUsd = paymentCurrency === 'khr' ? change / getExchangeRate() : change;
  if (subtotalValue) subtotalValue.innerHTML = checkoutDualMarkup(subtotal);
  if (discountValue) discountValue.innerHTML = checkoutDualMarkup(discount);
  if (taxValue) taxValue.innerHTML = checkoutDualMarkup(taxAmount);
  if (grandTotalValue) grandTotalValue.innerHTML = checkoutDualMarkup(total);
  if (customerPayValue) customerPayValue.innerHTML = checkoutDualMarkup(total);
  if (changeValue) changeValue.innerHTML = checkoutDualMarkup(changeUsd);
  updatePaymentUI();
}

function calculateTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// -----------------------------------------------------------------------------
// Checkout and receipts
// -----------------------------------------------------------------------------

function updateCustomerPurchaseRecord(customerName, amount) {
  const customers = loadCustomers();
  const trimmedName = (customerName || '').trim();
  const normalizedName = trimmedName.toLowerCase();
  if (!trimmedName || normalizedName === 'walk-in') return null;

  let customer = customers.find((entry) => {
    const nameMatch = (entry.name || '').toLowerCase() === normalizedName;
    const memberMatch = (entry.memberId || '').toLowerCase() === normalizedName;
    return nameMatch || memberMatch;
  });

  if (!customer) {
    customer = {
      id: generateId('customer'),
      name: trimmedName,
      phone: '',
      memberId: `MEM-${Date.now().toString().slice(-4)}`,
      address: '',
      purchaseCount: 0,
      lastPurchase: '',
      lastPurchaseAmount: 0
    };
    customers.push(customer);
  }

  customer.purchaseCount = Number(customer.purchaseCount || 0) + 1;
  customer.lastPurchase = new Date().toISOString();
  customer.lastPurchaseAmount = Number(amount || 0);
  saveCustomers(customers);
  return customer;
}

function checkout() {
  if (!cart.length) {
    showNotification('Cart is empty.', 'error');
    return;
  }

  const products = loadProducts();
  const discountPercent = Math.min(100, Math.max(0, Number(document.getElementById('discount')?.value || 0)));
  const taxPercent = Number(document.getElementById('tax')?.value || 0);
  const paymentMethod = document.getElementById('paymentMethod')?.value || 'cash';
  const paymentCurrency = getPaymentCurrency();
  const exchangeRate = getExchangeRate();
  const subtotal = calculateTotal();
  const discount = subtotal * (discountPercent / 100);
  const taxAmount = subtotal * (taxPercent / 100);
  const discountedTotal = subtotal - discount;
  const grandTotal = discountedTotal + taxAmount;
  const paymentTotal = paymentCurrency === 'khr' ? roundKHR(grandTotal * exchangeRate) : grandTotal;
  const cashTendered = paymentMethod === 'khqr' ? paymentTotal : Number(document.getElementById('cashTendered')?.value || 0);
  const change = paymentMethod === 'khqr' ? 0 : Math.max(0, cashTendered - paymentTotal);
  const customerName = document.getElementById('customerName')?.value.trim() || 'Walk-in';
  const customer = updateCustomerPurchaseRecord(customerName, grandTotal);

  const sale = {
    id: generateId('sale'),
    invoice: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    customer: customerName,
    customerId: customer ? customer.id : null,
    items: cart.map((item) => ({ ...item })),
    subtotal,
    discount,
    discountPercent,
    tax: taxAmount,
    total: grandTotal,
    cash: cashTendered,
    change,
    paymentMethod,
    paymentCurrency,
    exchangeRate,
    totalKhr: roundKHR(grandTotal * exchangeRate),
    date: new Date().toISOString()
  };

  const sales = loadSales();
  sales.push(sale);
  saveSales(sales);

  cart.forEach((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (product) {
      product.stock = Number(product.stock) - Number(item.quantity);
    }
  });
  saveProducts(products);

  currentReceipt = sale;
  saveCart([]);
  cart = [];
  renderCart();
  renderProductsForSale();
  updateDashboard();
  showNotification(paymentMethod === 'khqr' ? 'KH QR checkout complete.' : 'Checkout complete.');
  resetPaymentFields();
  generateReceipt(sale);
}

function resetPaymentFields() {
  const paymentMethod = document.getElementById('paymentMethod');
  const paymentCurrency = document.getElementById('paymentCurrency');

  if (paymentMethod) paymentMethod.value = 'cash';
  if (paymentCurrency) paymentCurrency.value = 'usd';
  updatePaymentUI();
}

function generateReceipt(sale = currentReceipt) {
  if (!sale) return;
  const content = document.getElementById('receiptContent');
  if (!content) return;
  content.innerHTML = buildProfessionalReceipt(sale);
  openModal('receiptModal');
}

function printReceipt() {
  const receipt = document.getElementById('receiptContent');
  if (!receipt) return;
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Mini Mart Receipt</title><style>${getReceiptPrintStyles()}</style></head><body>${receipt.innerHTML}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

window.addEventListener('DOMContentLoaded', initializeSales);
