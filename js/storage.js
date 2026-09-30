const STORAGE_KEYS = {
  products: 'miniMart_products',
  customers: 'miniMart_customers',
  sales: 'miniMart_sales',
  purchases: 'miniMart_purchases',
  cart: 'miniMart_cart',
  theme: 'miniMart_theme'
};

function getStoredData(key, fallback = []) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse localStorage item', key, error);
    return fallback;
  }
}

function saveStoredData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadProducts() {
  return getStoredData(STORAGE_KEYS.products, []);
}

function saveProducts(products) {
  saveStoredData(STORAGE_KEYS.products, products);
}

function loadCustomers() {
  return getStoredData(STORAGE_KEYS.customers, []);
}

function saveCustomers(customers) {
  saveStoredData(STORAGE_KEYS.customers, customers);
}

function loadSales() {
  return getStoredData(STORAGE_KEYS.sales, []);
}

function saveSales(sales) {
  saveStoredData(STORAGE_KEYS.sales, sales);
}

function loadPurchases() {
  return getStoredData(STORAGE_KEYS.purchases, []);
}

function savePurchases(purchases) {
  saveStoredData(STORAGE_KEYS.purchases, purchases);
}

function loadCart() {
  return getStoredData(STORAGE_KEYS.cart, []);
}

function saveCart(cart) {
  saveStoredData(STORAGE_KEYS.cart, cart);
}

function saveTheme(theme) {
  saveStoredData(STORAGE_KEYS.theme, theme);
}

function loadTheme() {
  return getStoredData(STORAGE_KEYS.theme, 'light');
}

function seedDefaultData() {
  const products = loadProducts();
  if (!products.length) {
    saveProducts([
      { id: generateId('product'), name: 'Fresh Milk', category: 'Dairy', price: 3.49, stock: 12, description: 'Fresh dairy milk', image: '' },
      { id: generateId('product'), name: 'Whole Bread', category: 'Bakery', price: 2.2, stock: 8, description: 'Soft whole grain bread', image: '' },
      { id: generateId('product'), name: 'Orange Juice', category: 'Beverages', price: 4.5, stock: 5, description: 'Cold pressed orange juice', image: '' },
      { id: generateId('product'), name: 'Soap Bar', category: 'Household', price: 1.75, stock: 15, description: 'Gentle cleansing soap', image: '' }
    ]);
  }

  const customers = loadCustomers();
  if (!customers.length) {
    saveCustomers([
      { id: generateId('customer'), name: 'John Doe', phone: '0123456789', memberId: 'MEM-1001', address: 'Downtown Street' },
      { id: generateId('customer'), name: 'Mina Kim', phone: '0987654321', memberId: 'MEM-1002', address: 'North Avenue' }
    ]);
  }

  if (!loadSales().length) {
    saveSales([]);
  }

  if (!loadCart().length) {
    saveCart([]);
  }

  if (!loadTheme()) {
    saveTheme('light');
  }
}
