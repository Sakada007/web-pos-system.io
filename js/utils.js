// -----------------------------------------------------------------------------
// Currency and safe text formatting
// -----------------------------------------------------------------------------

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function roundKHR(value) {
  return Math.round((Number(value) || 0) / 100) * 100;
}

function formatKHR(value) {
  const amount = roundKHR(value);
  return `${amount < 0 ? '-' : ''}៛${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(Math.abs(amount))}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function dualCurrencyMarkup(usdAmount, exchangeRate) {
  const usd = Number(usdAmount) || 0;
  return `<span class="receipt-money"><strong>${formatCurrency(usd)}</strong><small>${formatKHR(usd * exchangeRate)}</small></span>`;
}

// -----------------------------------------------------------------------------
// Shared professional receipt
// -----------------------------------------------------------------------------

function buildProfessionalReceipt(sale) {
  const exchangeRate = Number(sale.exchangeRate) > 0 ? Number(sale.exchangeRate) : 4100;
  const paymentCurrency = sale.paymentCurrency || 'usd';
  const paidUsd = paymentCurrency === 'khr' ? Number(sale.cash || 0) / exchangeRate : Number(sale.cash || 0);
  const changeUsd = paymentCurrency === 'khr' ? Number(sale.change || 0) / exchangeRate : Number(sale.change || 0);
  const paymentLabel = sale.paymentMethod === 'khqr' ? 'KH QR' : 'Cash';
  const itemCount = (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const itemLines = (sale.items || []).map((item) => {
    const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
    return `
      <div class="receipt-item">
        <div><strong>${escapeHtml(item.name)}</strong><small>${Number(item.quantity || 0)} × ${formatCurrency(item.price)} / ${formatKHR(Number(item.price || 0) * exchangeRate)}</small></div>
        ${dualCurrencyMarkup(lineTotal, exchangeRate)}
      </div>`;
  }).join('');

  return `
    <article class="receipt-paper">
      <header class="receipt-brand">
        <div class="receipt-logo">MM</div>
        <div>
          <h3>MINI MART</h3>
          <p>Official Sales Receipt</p>
        </div>
      </header>

      <div class="receipt-meta">
        <div><span>Invoice</span><strong>${escapeHtml(sale.invoice)}</strong></div>
        <div><span>Date</span><strong>${formatDateTime(sale.date)}</strong></div>
        <div><span>Customer</span><strong>${escapeHtml(sale.customer || 'Walk-in')}</strong></div>
        <div><span>Items</span><strong>${itemCount}</strong></div>
      </div>

      <section class="receipt-section">
        <h5>Purchased Items</h5>
        ${itemLines}
      </section>

      <section class="receipt-section receipt-totals">
        <div class="receipt-line"><span>Subtotal</span>${dualCurrencyMarkup(sale.subtotal, exchangeRate)}</div>
        <div class="receipt-line"><span>Discount${Number.isFinite(Number(sale.discountPercent)) ? ` (${Number(sale.discountPercent).toFixed(2).replace(/\.00$/, '')}%)` : ''}</span>${dualCurrencyMarkup(-Number(sale.discount || 0), exchangeRate)}</div>
        <div class="receipt-line"><span>Tax</span>${dualCurrencyMarkup(sale.tax || 0, exchangeRate)}</div>
        <div class="receipt-line receipt-grand"><span>Grand Total</span>${dualCurrencyMarkup(sale.total, exchangeRate)}</div>
      </section>

      <section class="receipt-section receipt-payment">
        <h5>Payment Details</h5>
        <div class="receipt-line"><span>Method</span><strong>${paymentLabel}</strong></div>
        <div class="receipt-line"><span>Paid Currency</span><strong>${paymentCurrency.toUpperCase()}</strong></div>
        <div class="receipt-line"><span>Exchange Rate</span><strong>$1.00 = ${formatKHR(exchangeRate)}</strong></div>
        <div class="receipt-line"><span>Amount Paid</span>${dualCurrencyMarkup(paidUsd, exchangeRate)}</div>
        <div class="receipt-line"><span>Change</span>${dualCurrencyMarkup(changeUsd, exchangeRate)}</div>
      </section>

      <footer class="receipt-footer">
        <strong>Thank you for shopping with us!</strong>
        <p>Please keep this receipt for your records.</p>
      </footer>
    </article>`;
}

function getReceiptPrintStyles() {
  return `
    *{box-sizing:border-box}body{margin:0;padding:24px;background:#fff;color:#172033;font-family:Arial,sans-serif}
    .receipt-paper{width:100%;max-width:420px;margin:0 auto}.receipt-brand{display:flex;align-items:center;gap:14px;padding-bottom:18px;border-bottom:2px solid #123c4a}
    .receipt-logo{display:grid;place-items:center;width:48px;height:48px;border-radius:12px;background:#123c4a;color:#fff;font-size:18px;font-weight:800}.receipt-brand h3{margin:0;font-size:21px;letter-spacing:1.5px}.receipt-brand p,.receipt-footer p{margin:3px 0 0;color:#64748b;font-size:12px}
    .receipt-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px 0}.receipt-meta div{display:grid;gap:3px}.receipt-meta span,.receipt-section h5{color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.8px}.receipt-meta strong{font-size:12px}
    .receipt-section{padding:14px 0;border-top:1px dashed #cbd5e1}.receipt-section h5{margin:0 0 10px}.receipt-item,.receipt-line{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:5px 0;font-size:12px}.receipt-item>div:first-child{display:grid;gap:3px}.receipt-item small{color:#64748b}.receipt-money{display:grid;text-align:right;white-space:nowrap}.receipt-money small{margin-top:2px;color:#64748b;font-size:10px}.receipt-grand{margin-top:8px;padding:11px 0 0;border-top:2px solid #123c4a;font-size:15px}.receipt-grand .receipt-money small{font-size:12px}.receipt-payment{background:#f1f5f9;margin:4px 0;padding:14px;border:0;border-radius:12px}.receipt-footer{text-align:center;padding-top:18px;border-top:1px dashed #cbd5e1;font-size:12px}
    @media print{body{padding:0}.receipt-paper{max-width:none}}
  `;
}

// -----------------------------------------------------------------------------
// Date, IDs, and interface helpers
// -----------------------------------------------------------------------------

function formatDateTime(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(value);
}

function getLocalDateKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function showNotification(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.className = `toast show ${type}`;
  toast.textContent = message;
  clearTimeout(showNotification.timeout);
  showNotification.timeout = setTimeout(() => {
    toast.className = 'toast';
  }, 2600);
}

function createEmptyState(title, message) {
  return `
    <div class="empty-state">
      <i class="fa-solid fa-box-open"></i>
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Export and confirmation helpers
// -----------------------------------------------------------------------------

/**
 * Export an array of objects to CSV and trigger a download.
 * rows: Array of objects (all objects should share the same keys)
 */
function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  for (const row of rows) {
    const values = keys.map(k => {
      const v = row[k] == null ? '' : String(row[k]);
      // escape quotes
      return '"' + v.replace(/"/g, '""') + '"';
    });
    lines.push(values.join(','));
  }
  const csv = lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function confirmAction(message, onConfirm, options = {}) {
  const modal = document.getElementById('confirmModal');
  const messageNode = document.getElementById('confirmMessage');
  const button = document.getElementById('confirmActionBtn');
  const inputWrap = document.getElementById('confirmInputWrap');
  const input = document.getElementById('confirmInput');
  if (!modal || !messageNode || !button) return;

  messageNode.textContent = message;
  if (inputWrap && input) {
    const requireInput = Boolean(options.requireInput);
    inputWrap.style.display = requireInput ? 'block' : 'none';
    input.value = '';
    input.placeholder = options.placeholder || 'Type confirmation';
    input.setAttribute('aria-label', options.label || 'Confirmation');
  }

  openModal('confirmModal');
  button.onclick = () => {
    if (inputWrap && input && options.requireInput) {
      const value = input.value.trim();
      if (!options.validator || !options.validator(value)) {
        showNotification('Confirmation failed.', 'error');
        return;
      }
    }

    closeModal('confirmModal');
    onConfirm();
  };
}
