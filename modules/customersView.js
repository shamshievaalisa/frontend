// modules/customersView.js

(function () {
  const API_BASE = "http://localhost:8081";
  const API_URL_CUSTOMERS = API_BASE + "/clients";

  let allCustomers = [];

  function getToken() {
    return localStorage.getItem("jwt");
  }

  async function loadCustomerCount() {
    const countElement = document.getElementById("customerCount");
    if (!countElement) return;

    const token = getToken();
    if (!token) {
      countElement.textContent = "0";
      return;
    }

    try {
      const response = await fetch(`${API_URL_CUSTOMERS}/count`, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (response.ok) {
        const count = await response.json();
        countElement.textContent = count;
      } else {
        countElement.textContent = "ошибка";
      }
    } catch (e) {
      console.error("Ошибка загрузки количества клиентов:", e);
      countElement.textContent = "ошибка";
    }
  }
  async function loadCustomers() {
    const tbody = document.getElementById("customersTableBody");
    if (!tbody) return;

    tbody.innerHTML =
      '<tr><td colspan="3" class="text-center">Загрузка...</td></tr>';

    const token = getToken();
    if (!token) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="text-center text-danger">Нет авторизации</td></tr>';
      return;
    }

    try {
      const response = await fetch(API_URL_CUSTOMERS, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      allCustomers = await response.json();
      displayCustomers(allCustomers);
    } catch (e) {
      console.error("Ошибка загрузки клиентов:", e);
      const tbody = document.getElementById("customersTableBody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="3" class="text-center text-danger">Ошибка загрузки</td></tr>';
      }
    }
  }
  function displayCustomers(customers) {
    const tbody = document.getElementById("customersTableBody");
    if (!tbody) return;

    if (!customers || customers.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="text-center">Клиенты не найдены</td></tr>';
      return;
    }

    tbody.innerHTML = customers
      .map(
        (customer) => `
        <tr>
            <td>${customer.fullName || customer.name || ""}</td>
            <td>${customer.phone || ""}</td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editCustomer(${
                  customer.id
                })">Редактировать</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${
                  customer.id
                })">Удалить</button>
            </td>
        </tr>
    `
      )
      .join("");
  }
  function filterCustomers() {
    const term =
      document.getElementById("searchCustomers")?.value?.toLowerCase() || "";
    const filtered = allCustomers.filter(
      (c) =>
        (c.fullName || c.name || "").toLowerCase().includes(term) ||
        (c.phone || "").toLowerCase().includes(term)
    );
    displayCustomers(filtered);
  }

  // === ГЛОБАЛЬНЫЕ ФУНКЦИИ ===

  // Open modal for creating a new customer: clear fields and set title
  window.newCustomer = function () {
    const idEl = document.getElementById("customerId");
    const nameEl = document.getElementById("customerName");
    const phoneEl = document.getElementById("customerPhone");
    const modalEl = document.getElementById("customerModal");
    if (idEl) idEl.value = "";
    if (nameEl) nameEl.value = "";
    if (phoneEl) phoneEl.value = "";
    if (modalEl) {
      const title = modalEl.querySelector(".modal-title");
      if (title) title.textContent = "Добавить клиента";
    }
  };

  window.saveCustomer = async function () {
    const idRaw = document.getElementById("customerId").value;
    const idNum = idRaw ? parseInt(idRaw, 10) : null;
    const isEdit = Number.isInteger(idNum) && idNum > 0;
    const fullName = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();

    if (!fullName || !phone) {
      alert("Заполните все обязательные поля");
      return;
    }

    const customerData = { fullName, phone };
    const token = getToken();
    const url = isEdit ? `${API_URL_CUSTOMERS}/${idNum}` : API_URL_CUSTOMERS;
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        bootstrap.Modal.getInstance(
          document.getElementById("customerModal")
        ).hide();
        await loadCustomers();
      } else {
        const error = await response.text().catch(() => "Ошибка сервера");
        alert("Ошибка: " + error);
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
  };

  window.editCustomer = function (customerId) {
    const customer = allCustomers.find((c) => c.id === customerId);
    if (!customer) return;

    document.getElementById("customerId").value = customer.id;
    document.getElementById("customerName").value =
      customer.fullName || customer.name || "";
    document.getElementById("customerPhone").value = customer.phone || "";

    const modalEl = document.getElementById("customerModal");
    if (modalEl) {
      const title = modalEl.querySelector(".modal-title");
      if (title) title.textContent = "Редактировать клиента";
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  };

  window.deleteCustomer = async function (id) {
    if (!confirm("Вы уверены, что хотите удалить этого клиента?")) return;

    const token = getToken();
    try {
      const response = await fetch(`${API_URL_CUSTOMERS}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (response.ok) {
        await loadCustomers();
      } else {
        alert("Не удалось удалить клиента");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка соединения");
    }
  };

  // === ИНИЦИАЛИЗАЦИЯ ===
  window.initCustomersView = function () {
    loadCustomers();
    loadCustomerCount();
    const searchInput = document.getElementById("searchCustomers");
    if (searchInput) {
      searchInput.addEventListener("input", filterCustomers);
    }
  };
})();
