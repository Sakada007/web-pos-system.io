// -----------------------------------------------------------------------------
// Invoice history setup, rendering, and search
// -----------------------------------------------------------------------------

function initializeHistory() {
  const search = document.getElementById('historySearch');
  const dateField = document.getElementById('historyDate');
  if (search) search.addEventListener('input', filterHistory);
  if (dateField) dateField.addEventListener('input', filterHistory);
  const exportBtn = document.getElementById('exportCsvBtn');
  const genBtn = document.getElementById('generateReportBtn');
  const reportType = document.getElementById('reportType');
  const newPurchaseBtn = document.getElementById('newPurchaseBtn');
  const savePurchaseBtn = document.getElementById('savePurchaseBtn');
  if (exportBtn) exportBtn.addEventListener('click', () => exportCurrentReportCSV());
  if (genBtn) genBtn.addEventListener('click', () => generateSelectedReport());
  if (newPurchaseBtn) newPurchaseBtn.addEventListener('click', () => openModal('purchaseModal'));
  if (savePurchaseBtn) savePurchaseBtn.addEventListener('click', handleSavePurchase);
  renderHistory();
}

function renderHistory(sales = loadSales()) {
  const body = document.getElementById('historyTableBody');
  if (!body) return;

  if (!sales.length) {
    body.innerHTML = `<tr><td colspan="6">${createEmptyState('No history', 'Past transactions will show here after you complete sales.')}</td></tr>`;
    return;
  }

  body.innerHTML = sales.map((sale) => {
    const items = Array.isArray(sale.items) ? sale.items : [];
    return `
      <tr>
        <td>${escapeHtml(sale.invoice || '-')}</td>
        <td>${formatDateTime(sale.date)}</td>
        <td>${escapeHtml(sale.customer || 'Walk-in')}</td>
        <td>${items.length}</td>
        <td>${formatCurrency(sale.total)}</td>
        <td>
          <button class="ghost-btn" onclick="showHistoryReceipt('${sale.id}')"><i class="fa-solid fa-eye"></i></button>
          <button class="ghost-btn" onclick="deleteHistory('${sale.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
  }).join('');
}

function filterHistory() {
  const searchField = document.getElementById('historySearch');
  const dateField = document.getElementById('historyDate');
  const query = (searchField?.value || '').trim().toLowerCase();
  const date = dateField?.value || '';
  const sales = loadSales().filter((sale) => {
    const localDateKey = getLocalDateKey(sale.date);
    const [year, month, day] = localDateKey.split('-');
    const searchableDate = localDateKey
      ? `${day}/${month}/${year} ${day}-${month}-${year} ${day} ${month} ${year} ${localDateKey}`
      : '';
    const items = Array.isArray(sale.items) ? sale.items : [];
    const itemNames = items.map((item) => item.name || '').join(' ');
    const searchText = `${sale.invoice || ''} ${sale.customer || 'Walk-in'} ${searchableDate} ${itemNames} ${sale.total || 0}`.toLowerCase();
    const matchesQuery = !query || searchText.includes(query);
    const matchesDate = !date || localDateKey === date;
    return matchesQuery && matchesDate;
  });
  renderHistory(sales);
}

// -----------------------------------------------------------------------------
// Receipt actions
// -----------------------------------------------------------------------------

function showHistoryReceipt(id) {
  const sale = loadSales().find((item) => item.id === id);
  if (!sale) return;
  const content = document.getElementById('receiptContent');
  if (!content) return;
  content.innerHTML = buildProfessionalReceipt(sale);
  openModal('receiptModal');
}

function deleteHistory(id) {
  confirmAction('Delete this sale from history?', () => {
    const sales = loadSales().filter((item) => item.id !== id);
    saveSales(sales);
    renderHistory(sales);
    showNotification('Sale deleted from history.');
    updateDashboard();
  });
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

// -----------------------------------------------------------------------------
// Purchase records
// -----------------------------------------------------------------------------

function renderPurchases(purchases = loadPurchases()) {
  const body = document.getElementById('historyTableBody');
  if (!body) return;

  if (!purchases.length) {
    // keep the same empty state but indicate purchases
    body.innerHTML = `<tr><td colspan="6">${createEmptyState('No purchase records', 'Record incoming supplier purchases here.')}</td></tr>`;
    return;
  }

  // reuse the history table to show purchases when selected
  body.innerHTML = purchases.map((p) => `
    <tr>
      <td>PUR-${p.id}</td>
      <td>${new Date(p.date).toLocaleString()}</td>
      <td>${p.supplier || '-'}</td>
      <td>${p.items ? p.items.length : 0}</td>
      <td>${formatCurrency(p.total || 0)}</td>
      <td><button class="ghost-btn" onclick="deletePurchase('${p.id}')"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('');
}

function handleSavePurchase() {
  const supplier = document.getElementById('purchaseSupplier').value.trim();
  const items = document.getElementById('purchaseItems').value.trim();
  const total = Number(document.getElementById('purchaseTotal').value || 0);
  const date = document.getElementById('purchaseDate').value || new Date().toISOString().split('T')[0];
  if (!supplier || !items || !total) {
    showNotification('Please complete purchase fields.', 'error');
    return;
  }
  const purchases = loadPurchases();
  const newPurchase = {
    id: generateId('purchase'),
    supplier,
    items: items.split(',').map(s => s.trim()).filter(Boolean),
    total,
    date: new Date(date).toISOString()
  };
  purchases.push(newPurchase);
  savePurchases(purchases);
  closeModal('purchaseModal');
  showNotification('Purchase recorded.');
  renderPurchases(purchases);
}

function deletePurchase(id) {
  confirmAction('Delete this purchase record?', () => {
    const purchases = loadPurchases().filter(p => p.id !== id);
    savePurchases(purchases);
    renderPurchases(purchases);
    showNotification('Purchase deleted.');
  });
}

// -----------------------------------------------------------------------------
// Reports and CSV export
// -----------------------------------------------------------------------------

function generateSelectedReport() {
  const type = document.getElementById('reportType')?.value;
  if (type === 'sales') {
    renderHistory(loadSales());
  } else if (type === 'inventory') {
    generateInventoryReport();
  } else if (type === 'profit') {
    generateProfitLossReport();
  } else if (type === 'purchases') {
    renderPurchases(loadPurchases());
  }
}

function exportCurrentReportCSV() {
  const type = document.getElementById('reportType')?.value;
  if (type === 'sales') {
    const rows = loadSales().map(s => ({ invoice: s.invoice, customer: s.customer, items: s.items.length, total: s.total, date: s.date }));
    exportToCSV('sales_report.csv', rows);
  } else if (type === 'purchases') {
    const rows = loadPurchases().map(p => ({ id: p.id, supplier: p.supplier, items: (p.items || []).join('; '), total: p.total, date: p.date }));
    exportToCSV('purchases_report.csv', rows);
  } else if (type === 'inventory') {
    const products = loadProducts();
    const rows = products.map(p => ({ id: p.id, name: p.name, category: p.category, stock: p.stock, price: p.price }));
    exportToCSV('inventory_report.csv', rows);
  } else if (type === 'profit') {
    // simple profit export from sales minus purchases
    const salesTotal = loadSales().reduce((s, x) => s + Number(x.total || 0), 0);
    const purchaseTotal = loadPurchases().reduce((s, x) => s + Number(x.total || 0), 0);
    exportToCSV('profit_loss.csv', [{ metric: 'sales_total', value: salesTotal }, { metric: 'purchase_total', value: purchaseTotal }, { metric: 'profit', value: salesTotal - purchaseTotal }]);
  }
}

function generateInventoryReport() {
  const products = loadProducts();
  const sales = loadSales();
  // calculate outgoing per product
  const outgoing = {};
  sales.forEach(s => s.items.forEach(i => { outgoing[i.productId] = (outgoing[i.productId] || 0) + Number(i.quantity || 0); }));
  const rows = products.map(p => ({ id: p.id, name: p.name, stock: p.stock, sold: outgoing[p.id] || 0 }));
  // render into table
  const body = document.getElementById('historyTableBody');
  if (!body) return;
  body.innerHTML = rows.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>-</td>
      <td>${r.name}</td>
      <td>${r.sold}</td>
      <td>${r.stock}</td>
      <td></td>
    </tr>
  `).join('');
}

function generateProfitLossReport() {
  const salesTotal = loadSales().reduce((s, x) => s + Number(x.total || 0), 0);
  const purchaseTotal = loadPurchases().reduce((s, x) => s + Number(x.total || 0), 0);
  const rows = [
    { label: 'Total Sales', value: formatCurrency(salesTotal) },
    { label: 'Total Purchases (costs)', value: formatCurrency(purchaseTotal) },
    { label: 'Profit (Sales - Purchases)', value: formatCurrency(salesTotal - purchaseTotal) }
  ];
  const body = document.getElementById('historyTableBody');
  if (!body) return;
  body.innerHTML = rows.map(r => `
    <tr>
      <td colspan="6"><strong>${r.label}:</strong> ${r.value}</td>
    </tr>
  `).join('');
}

window.addEventListener('DOMContentLoaded', initializeHistory);
