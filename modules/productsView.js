// modules/productsView.js

(function () {
  const API_BASE = "http://localhost:8081";
  const API_URL_PRODUCTS = API_BASE + "/products";
  const API_URL_CATEGORIES = API_BASE + "/categories"; // для выпадающего списка

  let allProducts = [];
  let allCategories = [];

  function getToken() {
    return localStorage.getItem("jwt");
  }

  // Загрузка категорий (для select в модальном окне)
  async function loadCategoriesForSelect() {
    const select = document.getElementById("productCategoryId");
    if (!select) return;

    const token = getToken();
    try {
      const response = await fetch(API_URL_CATEGORIES, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!response.ok) throw new Error("Не удалось загрузить категории");
      allCategories = await response.json();
      renderCategorySelect(allCategories, select);
    } catch (e) {
      console.error("Ошибка загрузки категорий:", e);
      select.innerHTML = '<option value="">Ошибка загрузки</option>';
    }
  }

  function renderCategorySelect(categories, selectEl) {
    selectEl.innerHTML = '<option value="">Выберите категорию</option>';
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      selectEl.appendChild(option);
    });
  }

  // Загрузка товаров
  async function loadProducts() {
    const tbody = document.getElementById("productsTableBody");
    if (!tbody) return;

    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center">Загрузка...</td></tr>';

    const token = getToken();
    if (!token) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger">Нет авторизации</td></tr>';
      return;
    }

    try {
      const response = await fetch(API_URL_PRODUCTS, {
        headers: { Authorization: "Bearer " + token },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      allProducts = await response.json();
      displayProducts(allProducts);
    } catch (e) {
      console.error("Ошибка загрузки товаров:", e);
      const tbody = document.getElementById("productsTableBody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="text-center text-danger">Ошибка загрузки</td></tr>';
      }
    }
  }

  function getCategoryNameById(id) {
    const cat = allCategories.find((c) => c.id === id);
    return cat ? cat.name : "—";
  }

  function displayProducts(products) {
    const tbody = document.getElementById("productsTableBody");
    if (!tbody) return;

    if (!products || products.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center">Товары не найдены</td></tr>';
      return;
    }

    tbody.innerHTML = products
      .map(
        (p) => `
            <tr>
                <td>${p.id || ""}</td>
                <td>${p.name || ""}</td>
                <td>${p.price ? p.price + " ₽" : "—"}</td>
                <td>${getCategoryNameById(p.categoryId) || "—"}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="editProduct(${
                      p.id
                    })">Редактировать</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${
                      p.id
                    })">Удалить</button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  function filterProducts() {
    const term =
      document.getElementById("searchProducts")?.value?.toLowerCase() || "";
    const filtered = allProducts.filter(
      (p) =>
        String(p.id).includes(term) ||
        (p.name || "").toLowerCase().includes(term) ||
        (p.price?.toString() || "").includes(term) ||
        getCategoryNameById(p.categoryId).toLowerCase().includes(term)
    );
    displayProducts(filtered);
  }

  // === ГЛОБАЛЬНЫЕ ФУНКЦИИ ===

  window.newProduct = async function () {
    await loadCategoriesForSelect(); // обновляем список категорий при открытии
    document.getElementById("productId").value = "";
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productCategoryId").value = "";

    const modalTitle = document.getElementById("productModalTitle");
    if (modalTitle) modalTitle.textContent = "Добавить товар";
  };

  window.saveProduct = async function () {
    const idRaw = document.getElementById("productId").value;
    const idNum = idRaw ? parseInt(idRaw, 10) : null;
    const isEdit = Number.isInteger(idNum) && idNum > 0;

    const name = document.getElementById("productName").value.trim();
    const priceRaw = document.getElementById("productPrice").value.trim();
    const categoryIdRaw = document.getElementById("productCategoryId").value;

    // Валидация
    if (!name) {
      alert("Укажите название товара");
      return;
    }
    if (!priceRaw || isNaN(priceRaw) || parseFloat(priceRaw) <= 0) {
      alert("Укажите корректную цену (положительное число)");
      return;
    }
    if (!categoryIdRaw) {
      alert("Выберите категорию");
      return;
    }

    const productData = {
      name: name,
      price: parseFloat(priceRaw), // отправляем как число
      categoryId: parseInt(categoryIdRaw, 10),
    };

    const token = getToken();
    const url = isEdit ? `${API_URL_PRODUCTS}/${idNum}` : API_URL_PRODUCTS;
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        bootstrap.Modal.getInstance(
          document.getElementById("productModal")
        ).hide();
        await loadProducts();
      } else {
        const error = await response.text().catch(() => "Ошибка сервера");
        alert("Ошибка: " + error);
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    }
  };

  window.editProduct = async function (productId) {
    await loadCategoriesForSelect(); // синхронизируем категории
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name || "";
    document.getElementById("productPrice").value = product.price || "";
    document.getElementById("productCategoryId").value =
      product.categoryId || "";

    const modalTitle = document.getElementById("productModalTitle");
    if (modalTitle) modalTitle.textContent = "Редактировать товар";

    const modal = new bootstrap.Modal(document.getElementById("productModal"));
    modal.show();
  };

  window.deleteProduct = async function (id) {
    if (!confirm("Вы уверены, что хотите удалить этот товар?")) return;

    const token = getToken();
    try {
      const response = await fetch(`${API_URL_PRODUCTS}/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });

      if (response.ok) {
        await loadProducts();
      } else {
        alert("Не удалось удалить товар");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка соединения");
    }
  };

  // === ИНИЦИАЛИЗАЦИЯ ===
  window.initProductsView = async function () {
    // Сначала загружаем категории, чтобы отображать их в таблице
    const token = getToken();
    try {
      const categoriesRes = await fetch(API_URL_CATEGORIES, {
        headers: { Authorization: "Bearer " + token },
      });
      if (categoriesRes.ok) {
        allCategories = await categoriesRes.json();
      } else {
        console.warn("Не удалось загрузить категории для отображения");
      }
    } catch (e) {
      console.error("Ошибка загрузки категорий при старте:", e);
    }

    // Теперь загружаем товары — они смогут использовать allCategories
    await loadProducts();

    const searchInput = document.getElementById("searchProducts");
    if (searchInput) {
      searchInput.addEventListener("input", filterProducts);
    }
  };
})();
