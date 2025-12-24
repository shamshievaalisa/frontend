// modules/categoriesView.js

(function () {
    const API_BASE = "http://localhost:8081";
    const API_URL_CATEGORIES = API_BASE + "/categories";

    let allCategories = [];

    function getToken() {
        return localStorage.getItem("jwt");
    }

    async function loadCategories() {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Загрузка...</td></tr>';

        const token = getToken();
        if (!token) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Нет авторизации</td></tr>';
            return;
        }

        try {
            const response = await fetch(API_URL_CATEGORIES, {
                headers: {
                    "Authorization": "Bearer " + token,
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            allCategories = await response.json();
            displayCategories(allCategories);
        } catch (e) {
            console.error("Ошибка загрузки категорий:", e);
            const tbody = document.getElementById('categoriesTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Ошибка загрузки</td></tr>';
            }
        }
    }

    function displayCategories(categories) {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;

        if (!categories || categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Категории не найдены</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(category => `
            <tr>
                <td>${category.id || ""}</td>
                <td>${category.name || ""}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="editCategory(${category.id})">Редактировать</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">Удалить</button>
                </td>
            </tr>
        `).join('');
    }

    function filterCategories() {
        const term = document.getElementById("searchCategories")?.value?.toLowerCase() || "";
        const filtered = allCategories.filter(c =>
            String(c.id).includes(term) ||
            (c.name || "").toLowerCase().includes(term)
        );
        displayCategories(filtered);
    }

    // === ГЛОБАЛЬНЫЕ ФУНКЦИИ ===

    window.newCategory = function () {
        const idEl = document.getElementById("categoryId");
        const nameEl = document.getElementById("categoryName");
        const modalEl = document.getElementById("categoryModal");
        if (idEl) idEl.value = "";
        if (nameEl) nameEl.value = "";
        if (modalEl) {
            const title = modalEl.querySelector('.modal-title');
            if (title) title.textContent = 'Добавить категорию';
        }
    };

    window.saveCategory = async function () {
        const idRaw = document.getElementById("categoryId").value;
        const idNum = idRaw ? parseInt(idRaw, 10) : null;
        const isEdit = Number.isInteger(idNum) && idNum > 0;
        const name = document.getElementById("categoryName").value.trim();

        if (!name) {
            alert("Заполните название категории");
            return;
        }

        const categoryData = { name };
        const token = getToken();
        const url = isEdit ? `${API_URL_CATEGORIES}/${idNum}` : API_URL_CATEGORIES;
        const method = isEdit ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(categoryData)
            });

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide();
                await loadCategories();
            } else {
                const error = await response.text().catch(() => "Ошибка сервера");
                alert("Ошибка: " + error);
            }
        } catch (err) {
            console.error(err);
            alert("Ошибка сети");
        }
    };

    window.editCategory = function (categoryId) {
        const category = allCategories.find(c => c.id === categoryId);
        if (!category) return;

        document.getElementById("categoryId").value = category.id;
        document.getElementById("categoryName").value = category.name || "";

        const modalEl = document.getElementById("categoryModal");
        if (modalEl) {
            const title = modalEl.querySelector('.modal-title');
            if (title) title.textContent = 'Редактировать категорию';
        }

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    };

    window.deleteCategory = async function (id) {
        if (!confirm("Вы уверены, что хотите удалить эту категорию?")) return;

        const token = getToken();
        try {
            const response = await fetch(`${API_URL_CATEGORIES}/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            if (response.ok) {
                await loadCategories();
            } else {
                alert("Не удалось удалить категорию");
            }
        } catch (err) {
            console.error(err);
            alert("Ошибка соединения");
        }
    };

    // === ИНИЦИАЛИЗАЦИЯ ===
    window.initCategoriesView = function () {
        loadCategories();
        const searchInput = document.getElementById('searchCategories');
        if (searchInput) {
            searchInput.addEventListener('input', filterCategories);
        }
    };

})();