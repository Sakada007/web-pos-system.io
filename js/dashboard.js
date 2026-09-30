function updateDashboard() {
  const products = loadProducts();
  const customers = loadCustomers();
  const sales = loadSales();

  const today = new Date().toDateString();
  const todaysSales = sales.filter((sale) => new Date(sale.date).toDateString() === today);
  const revenue = todaysSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const lowStock = products.filter((product) => Number(product.stock) <= 5).length;

  const statProducts = document.getElementById('statProducts');
  const statCustomers = document.getElementById('statCustomers');
  const statRevenue = document.getElementById('statRevenue');
  const statSales = document.getElementById('statSales');
  const statLowStock = document.getElementById('statLowStock');

  if (statProducts) statProducts.textContent = products.length;
  if (statCustomers) statCustomers.textContent = customers.length;
  if (statRevenue) statRevenue.textContent = formatCurrency(revenue);
  if (statSales) statSales.textContent = todaysSales.length;
  if (statLowStock) statLowStock.textContent = lowStock;

  renderRecentSales();
}

function renderRecentSales() {
  const sales = loadSales().slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const body = document.getElementById('recentSalesBody');
  if (!body) return;

  if (!sales.length) {
    body.innerHTML = `<tr><td colspan="5">${createEmptyState('No sales yet', 'Checkout a sale to see activity here.')}</td></tr>`;
    return;
  }

  body.innerHTML = sales.map((sale) => `
    <tr>
      <td>${sale.invoice}</td>
      <td>${sale.customer || 'Walk-in'}</td>
      <td>${sale.items.length}</td>
      <td>${formatCurrency(sale.total)}</td>
      <td>${new Date(sale.date).toLocaleTimeString()}</td>
    </tr>
  `).join('');
}

window.addEventListener('DOMContentLoaded', updateDashboard);
