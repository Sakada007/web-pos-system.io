let customerEditingId = null;

function initializeCustomers() {
  const form = document.getElementById('customerForm');
  const search = document.getElementById('customerSearch');
  const cancelBtn = document.getElementById('cancelCustomerBtn');
  const newCustomerBtn = document.getElementById('newCustomerBtn');

  if (form) form.addEventListener('submit', handleCustomerSubmit);
  if (search) search.addEventListener('input', searchCustomer);
  if (cancelBtn) cancelBtn.addEventListener('click', resetCustomerForm);
  if (newCustomerBtn) newCustomerBtn.addEventListener('click', () => {
    resetCustomerForm();
    document.getElementById('customerName').focus();
  });

  displayCustomers();
}

function displayCustomers(customers = loadCustomers()) {
  const body = document.getElementById('customersTableBody');
  if (!body) return;

  if (!customers.length) {
    body.innerHTML = `<tr><td colspan="8">${createEmptyState('No customers yet', 'Add your first customer profile and they will appear here.')}</td></tr>`;
    return;
  }

  body.innerHTML = customers.map((customer) => `
    <tr>
      <td>${customer.name}</td>
      <td>${customer.phone}</td>
      <td>${customer.memberId}</td>
      <td>${customer.address || '-'}</td>
      <td>${customer.purchaseCount || 0}</td>
      <td>${customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : '—'}</td>
      <td><span class="badge member"><i class="fa-solid fa-id-badge"></i> Member</span></td>
      <td>
        <button class="ghost-btn" onclick="editCustomer('${customer.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="ghost-btn" onclick="deleteCustomer('${customer.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function handleCustomerSubmit(event) {
  try {
    event.preventDefault();
    const idEl = document.getElementById('customerId');
    const nameEl = document.getElementById('customerName');
    const phoneEl = document.getElementById('customerPhone');
    const memberEl = document.getElementById('customerMemberId');
    const addrEl = document.getElementById('customerAddress');
    if (!nameEl || !phoneEl || !memberEl) {
      showNotification('Form inputs missing. Reload the page.', 'error');
      return;
    }

    const payload = {
      id: (idEl && idEl.value) || generateId('customer'),
      name: nameEl.value.trim(),
      phone: phoneEl.value.trim(),
      memberId: memberEl.value.trim(),
      address: (addrEl && addrEl.value.trim()) || ''
    };

    if (!payload.name || !payload.phone || !payload.memberId) {
      showNotification('Please fill in all required customer fields.', 'error');
      return;
    }

    const customers = loadCustomers();
    if (customerEditingId) {
      const index = customers.findIndex((item) => item.id === customerEditingId);
      if (index >= 0) {
        customers[index] = { ...customers[index], ...payload, id: customerEditingId };
      }
    } else {
      customers.push(payload);
    }

    saveCustomers(customers);
    resetCustomerForm();
    displayCustomers(customers);
    showNotification(customerEditingId ? 'Customer updated.' : 'Customer added.');
    customerEditingId = null;
    updateDashboard();
  } catch (err) {
    console.error('Customer submit error', err);
    showNotification('Error saving customer: ' + (err && err.message), 'error');
  }
}

function editCustomer(id) {
  const customer = loadCustomers().find((item) => item.id === id);
  if (!customer) return;
  customerEditingId = customer.id;
  document.getElementById('customerId').value = customer.id;
  document.getElementById('customerName').value = customer.name;
  document.getElementById('customerPhone').value = customer.phone;
  document.getElementById('customerMemberId').value = customer.memberId;
  document.getElementById('customerAddress').value = customer.address || '';
  document.getElementById('customerName').focus();
}

function deleteCustomer(id) {
  confirmAction('Delete this customer permanently?', () => {
    const customers = loadCustomers().filter((item) => item.id !== id);
    saveCustomers(customers);
    displayCustomers(customers);
    showNotification('Customer deleted.');
    updateDashboard();
  });
}

function searchCustomer() {
  const query = document.getElementById('customerSearch').value.toLowerCase();
  const customers = loadCustomers().filter((customer) => `${customer.name} ${customer.phone} ${customer.memberId}`.toLowerCase().includes(query));
  displayCustomers(customers);
}

function resetCustomerForm() {
  document.getElementById('customerForm').reset();
  document.getElementById('customerId').value = '';
  customerEditingId = null;
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initializeCustomers);
} else {
  initializeCustomers();
}
