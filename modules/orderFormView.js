/**
 * Order Form View Logic
 */

(function () {
    const API_BASE = 'http://localhost:8081';

    let orderPositions = [];

    function getToken() {
        return localStorage.getItem('jwt');
    }

    function parseJwtToken(t) {
        try {
            const payload = t.split('.')[1];
            const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decodeURIComponent(escape(json)));
        } catch (e) {
            return null;
        }
    }

    function getCurrentUser() {
        if (window.currentUser) return window.currentUser;
        const token = getToken();
        if (!token) return null;
        const payload = parseJwtToken(token);
        if (!payload) return null;
        return {
            username: payload.sub || payload.username || null,
            id: payload.id || payload.userId || null,
            role: payload.role || (payload.roles && payload.roles[0]) || null,
        };
    }

    function initOrderFormView() {
        loadCustomersForOrder();
        loadProductsForOrder();
        attachPreviewHandlers();
    }

    function attachPreviewHandlers() {
        const productSelect = document.getElementById('orderProduct');
        const quantityInput = document.getElementById('orderQuantity');
        if (productSelect) productSelect.addEventListener('change', updateSelectedPreview);
        if (quantityInput) quantityInput.addEventListener('input', updateSelectedPreview);
        // initial preview
        setTimeout(updateSelectedPreview, 50);
    }

    function updateSelectedPreview() {
        const productSelect = document.getElementById('orderProduct');
        const quantityInput = document.getElementById('orderQuantity');
        const priceEl = document.getElementById('selectedPrice');
        const lineEl = document.getElementById('selectedLineTotal');
        if (!productSelect || !quantityInput) return;
        const idx = productSelect.selectedIndex;
        const unit = parseFloat(productSelect.options[idx]?.dataset.price || 0) || 0;
        const qty = parseInt(quantityInput.value, 10) || 1;
        const line = unit * qty;
        if (priceEl) priceEl.textContent = formatPrice(unit);
        if (lineEl) lineEl.textContent = formatPrice(line);
    }

    async function loadCustomersForOrder() {
        const select = document.getElementById('orderCustomer');
        if (!select) return;
        // Clear existing options except placeholder
        select.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

        const token = getToken();
        if (!token) {
            // fallback: show message option
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Нет авторизации';
            select.appendChild(opt);
            return;
        }

        try {
            const res = await fetch(API_BASE + '/clients', {
                headers: { Authorization: 'Bearer ' + token }
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const customers = await res.json();
            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.fullName || customer.name || (customer.login || '');
                select.appendChild(option);
            });
        } catch (e) {
            console.error('Ошибка загрузки клиентов для формы заказа:', e);
        }
    }

    async function loadProductsForOrder() {
        const select = document.getElementById('orderProduct');
        if (!select) return;
        select.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

        const token = getToken();
        try {
            const res = await fetch(API_BASE + '/products', {
                headers: token ? { Authorization: 'Bearer ' + token } : {}
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const products = await res.json();
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                option.dataset.price = product.price || product.cost || 0;
                select.appendChild(option);
            });
        } catch (e) {
            console.warn('Не удалось загрузить товары с бэкенда, используем заглушку', e);
            // fallback static
            const products = [
                { id: 1, name: 'Товар 1', price: 100 },
                { id: 2, name: 'Товар 2', price: 200 }
            ];
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                option.dataset.price = product.price;
                select.appendChild(option);
            });
        }
    }

    function addOrderPosition() {
        const productSelect = document.getElementById('orderProduct');
        const quantityInput = document.getElementById('orderQuantity');

        const productId = productSelect.value;
        const idx = productSelect.selectedIndex;
        const productName = idx > -1 ? productSelect.options[idx].text : '';
        const price = parseFloat(productSelect.options[idx]?.dataset.price || 0);
        const quantity = parseInt(quantityInput.value, 10);

        if (!productId || !quantity || quantity <= 0) {
            alert('Выберите товар и корректное количество');
            return;
        }

        const position = {
            id: Date.now(),
            productId: parseInt(productId, 10),
            productName: productName,
            price: price,
            quantity: quantity,
            sum: price * quantity
        };

        orderPositions.push(position);
        displayOrderPositions();
        updateOrderTotal();
    }

    function displayOrderPositions() {
        const tbody = document.getElementById('orderPositionsBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        orderPositions.forEach((position) => {
            const row = document.createElement('tr');
            // Use input for quantity so user can edit and trigger recalculation
            row.innerHTML = `
                        <td>${position.productName}</td>
                <td><input type="number" min="1" value="${position.quantity}" class="form-control form-control-sm position-qty" data-id="${position.id}"></td>
                <td>${formatPrice(position.price)} ₽</td>
                <td class="position-sum" data-id="${position.id}">${position.quantity} × ${formatPrice(position.price)} ₽ = ${formatPrice(position.sum)} ₽</td>
                        <td>
                                <button class="btn btn-sm btn-danger remove-position" data-id="${position.id}">Удалить</button>
                        </td>
                `;
            tbody.appendChild(row);
        });

        // attach event listeners (delegation could be used, but attach directly for simplicity)
        tbody.querySelectorAll('.position-qty').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id, 10);
                const qty = parseInt(e.target.value, 10) || 1;
                updateOrderPositionQuantity(id, qty);
            });
        });

        tbody.querySelectorAll('.remove-position').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id, 10);
                removeOrderPosition(id);
            });
        });
    }

    function formatPrice(v) {
        return (Number(v) || 0).toFixed(2);
    }

    function updateOrderPositionQuantity(id, quantity) {
        const pos = orderPositions.find(p => p.id === id);
        if (!pos) return;
        pos.quantity = quantity > 0 ? quantity : 1;
        pos.sum = pos.price * pos.quantity;

        // update sum cell in DOM
        const sumEl = document.querySelector(`.position-sum[data-id="${id}"]`);
        if (sumEl) sumEl.textContent = `${pos.quantity} × ${formatPrice(pos.price)} ₽ = ${formatPrice(pos.sum)} ₽`;

        updateOrderTotal();
    }

    function removeOrderPosition(id) {
        const idx = orderPositions.findIndex(p => p.id === id);
        if (idx === -1) return;
        orderPositions.splice(idx, 1);
        displayOrderPositions();
        updateOrderTotal();
    }

    function updateOrderTotal() {
        const total = orderPositions.reduce((sum, pos) => sum + pos.sum, 0);
        const el = document.getElementById('orderTotal');
        if (el) el.textContent = formatPrice(total);
    }

    async function saveOrder() {
        const customerId = document.getElementById('orderCustomer').value;

        if (!customerId) {
            alert('Выберите клиента');
            return;
        }

        if (orderPositions.length === 0) {
            alert('Добавьте позиции в заказ');
            return;
        }

        const currentUser = getCurrentUser();

        const orderData = {
            customerId: parseInt(customerId, 10),
            positions: orderPositions.map(p => ({ productId: p.productId, quantity: p.quantity })),
            total: orderPositions.reduce((sum, pos) => sum + pos.sum, 0),
            createdBy: currentUser?.username || null,
            createdById: currentUser?.id || null
        };

        const token = getToken();
        try {
            const res = await fetch(API_BASE + '/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: 'Bearer ' + token } : {})
                },
                body: JSON.stringify(orderData)
            });

            if (!res.ok) {
                const text = await res.text().catch(() => 'Ошибка');
                throw new Error(text || res.statusText || 'Ошибка при сохранении заказа');
            }

            console.log('Order saved', await res.json());
            alert('Заказ сохранен');

            // Reset form
            orderPositions = [];
            displayOrderPositions();
            updateOrderTotal();
            showView('orders');
        } catch (e) {
            console.error('Ошибка сохранения заказа:', e);
            alert('Не удалось сохранить заказ: ' + (e.message || e));
        }
    }

    async function createNewCustomer() {
        const name = document.getElementById('newCustomerName').value;
        const phone = document.getElementById('newCustomerPhone').value;

        if (!name || !phone) {
            alert('Заполните все поля');
            return;
        }

        const token = getToken();
        try {
            const res = await fetch(API_BASE + '/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: 'Bearer ' + token } : {})
                },
                body: JSON.stringify({ fullName: name, phone })
            });

            if (!res.ok) throw new Error('HTTP ' + res.status);
            const created = await res.json();

            bootstrap.Modal.getInstance(document.getElementById('newCustomerModal')).hide();
            await loadCustomersForOrder();

            // Select created customer if id present
            if (created && created.id) {
                const select = document.getElementById('orderCustomer');
                if (select) select.value = created.id;
            }
        } catch (e) {
            console.error('Ошибка создания клиента:', e);
            alert('Не удалось создать клиента');
        }
    }

    // expose functions globally for inline buttons
    window.initOrderFormView = initOrderFormView;
    window.addOrderPosition = addOrderPosition;
    window.removeOrderPosition = removeOrderPosition;
    window.saveOrder = saveOrder;
    window.createNewCustomer = createNewCustomer;

})();
