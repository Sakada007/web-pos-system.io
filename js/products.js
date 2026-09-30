let productEditingId = null;
let productImageBase64 = '';

function normalizeProductName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function initializeProducts() {
  const form = document.getElementById('productForm');
  const nameInput = document.getElementById('productName');
  const search = document.getElementById('productSearch');
  const fileInput = document.getElementById('productImage');
  const cancelBtn = document.getElementById('cancelProductBtn');
  const newProductBtn = document.getElementById('newProductBtn');

  if (form) {
    form.addEventListener('submit', handleProductSubmit);
  }
  if (nameInput) {
    nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
  }
  if (search) {
    search.addEventListener('input', searchProduct);
  }
  if (fileInput) {
    fileInput.addEventListener('change', uploadImage);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetProductForm);
  }
  if (newProductBtn) {
    newProductBtn.addEventListener('click', () => {
      resetProductForm();
      document.getElementById('productName').focus();
    });
  }

  displayProducts();
}

function displayProducts(products = loadProducts()) {
  const body = document.getElementById('productsTableBody');
  if (!body) return;

  if (!products.length) {
    body.innerHTML = `<tr><td colspan="7">${createEmptyState('No products yet', 'Add your first product to build the catalog.')}</td></tr>`;
    return;
  }

  body.innerHTML = products.map((product) => `
    <tr>
      <td>${product.image ? `<img class="product-thumb" src="${product.image}" alt="${product.name}" />` : '<i class="fa-solid fa-image"></i>'}</td>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>${product.stock}</td>
      <td>${checkLowStock(product.stock)}</td>
      <td>
        <button class="ghost-btn" onclick="editProduct('${product.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="ghost-btn" onclick="deleteProduct('${product.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function handleProductSubmit(event) {
  try {
    event.preventDefault();
    const idEl = document.getElementById('productId');
    const nameEl = document.getElementById('productName');
    const categoryEl = document.getElementById('productCategory');
    const priceEl = document.getElementById('productPrice');
    const stockEl = document.getElementById('productStock');
    const descEl = document.getElementById('productDescription');
    const previewEl = document.getElementById('productImagePreview');
    if (!nameEl || !categoryEl || !priceEl || !stockEl || !descEl) {
      showNotification('Form inputs missing. Reload the page.', 'error');
      return;
    }

    nameEl.setCustomValidity('');

    const payload = {
      id: (idEl && idEl.value) || generateId('product'),
      name: nameEl.value.trim(),
      category: categoryEl.value.trim(),
      price: Number(priceEl.value),
      stock: Number(stockEl.value),
      description: descEl.value.trim(),
      image: productImageBase64 || (previewEl && previewEl.src) || ''
    };

    if (!payload.name || !payload.category || Number.isNaN(payload.price) || Number.isNaN(payload.stock)) {
      showNotification('Please complete all required fields with valid values.', 'error');
      return;
    }

    const products = loadProducts();
    const normalizedName = normalizeProductName(payload.name);
    const duplicateProduct = products.find((product) => (
      product.id !== productEditingId
      && normalizeProductName(product.name) === normalizedName
    ));

    if (duplicateProduct) {
      const message = `Product "${duplicateProduct.name}" already exists.`;
      nameEl.setCustomValidity(message);
      nameEl.reportValidity();
      nameEl.focus();
      showNotification(message, 'error');
      return;
    }

    const isEditing = Boolean(productEditingId);

    if (productEditingId) {
      const index = products.findIndex((item) => item.id === productEditingId);
      if (index >= 0) {
        products[index] = { ...products[index], ...payload, id: productEditingId };
      }
    } else {
      products.push(payload);
    }

    saveProducts(products);
    resetProductForm();
    displayProducts(products);
    showNotification(isEditing ? 'Product updated.' : 'Product added.');
    productEditingId = null;
    productImageBase64 = '';
    updateDashboard();
  } catch (err) {
    console.error('Product submit error', err);
    showNotification('Error saving product: ' + (err && err.message), 'error');
  }
}

function editProduct(id) {
  const products = loadProducts();
  const product = products.find((item) => item.id === id);
  if (!product) return;
  productEditingId = product.id;
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productStock').value = product.stock;
  document.getElementById('productDescription').value = product.description || '';
  const preview = document.getElementById('productImagePreview');
  const placeholder = document.getElementById('productImagePlaceholder');
  if (preview) {
    preview.src = product.image || '';
    preview.style.display = product.image ? 'block' : 'none';
  }
  if (placeholder) {
    placeholder.style.display = product.image ? 'none' : 'flex';
  }
  productImageBase64 = product.image || '';
  document.getElementById('productName').focus();
}

function deleteProduct(id) {
  confirmAction('This action is restricted. Type ADMIN to delete this product.', () => {
    const products = loadProducts().filter((item) => item.id !== id);
    saveProducts(products);
    displayProducts(products);
    showNotification('Product deleted.');
    updateDashboard();
  }, {
    requireInput: true,
    placeholder: 'Type ADMIN',
    label: 'Admin confirmation',
    validator: (value) => value.toLowerCase() === 'admin'
  });
}

function searchProduct() {
  const query = document.getElementById('productSearch').value.toLowerCase();
  const products = loadProducts().filter((product) => {
    const searchable = `${product.name} ${product.category}`.toLowerCase();
    return searchable.includes(query);
  });
  displayProducts(products);
}

function uploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    productImageBase64 = reader.result;
    const preview = document.getElementById('productImagePreview');
    const placeholder = document.getElementById('productImagePlaceholder');
    if (preview) {
      preview.src = productImageBase64;
      preview.style.display = 'block';
    }
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  };
  reader.readAsDataURL(file);
}

function previewImage() {
  const input = document.getElementById('productImage');
  if (input && input.files[0]) {
    uploadImage({ target: input });
  }
}

function checkLowStock(stock) {
  const numericStock = Number(stock);
  if (numericStock === 0) {
    return '<span class="badge out-stock"><i class="fa-solid fa-ban"></i> Out of Stock</span>';
  }
  if (numericStock <= 5) {
    return '<span class="badge low-stock"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock</span>';
  }
  return '<span class="badge"><i class="fa-solid fa-check"></i> In Stock</span>';
}

function resetProductForm() {
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  const preview = document.getElementById('productImagePreview');
  const placeholder = document.getElementById('productImagePlaceholder');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if (placeholder) {
    placeholder.style.display = 'flex';
  }
  productEditingId = null;
  productImageBase64 = '';
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initializeProducts);
} else {
  initializeProducts();
}
