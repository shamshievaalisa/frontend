// modules/usersView.js

(function () {
  const API_BASE = "http://localhost:8081";
  const API_URL_USERS = API_BASE + "/users";

  let allUsers = [];

  function getToken() {
    return localStorage.getItem("jwt");
  }

  async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center">Загрузка...</td></tr>';

  const token = getToken();
  if (!token) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">Нет авторизации</td></tr>';
    return;
  }

  try {
    const response = await fetch(API_URL_USERS, {
      headers: {
        Authorization: "Bearer " + token
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    allUsers = await response.json();
    displayUsers(allUsers);
  } catch (e) {
    console.error("Ошибка загрузки пользователей:", e);
    const tbody = document.getElementById("usersTableBody");
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-danger">Ошибка загрузки</td></tr>';
    }
  }
}

  function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center">Пользователи не найдены</td></tr>';
    return;
  }

  tbody.innerHTML = users
    .map(
      (user) => `
        <tr>
            <td>${user.id}</td>
            <td>${user.login || ""}</td>
            <td>${user.fullName || ""}</td>
            <td>${user.role || ""}</td>
            <td>${user.status || "ACTIVE"}</td>
            <td>${user.position || "-"}</td>
              
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editUser(${
                  user.id
                })">Редактировать</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${
                  user.id
                })">Удалить</button>
            </td>
        </tr>
    `
    )
    .join("");
}

  function filterUsers() {
    const term =
      document.getElementById("searchUsers")?.value?.toLowerCase() || "";
    const filtered = allUsers.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(term) ||
        (u.login || "").toLowerCase().includes(term)
    );
    displayUsers(filtered);
  }

// ... (остальные функции: saveUser, editUser, deleteUser — сюда же)

// Экспорт функций в глобальную область (или используй обработчики через addEventListener)
// Глобальные функции для onclick
  window.editUser = function (userId) {
  const user = allUsers.find((u) => u.id === userId);
  if (!user) {
    console.warn("Пользователь не найден:", userId);
    return;
  }

  // Заполняем форму данными
  document.getElementById("userId").value = user.id;
  document.getElementById("userLogin").value = user.login || "";
  document.getElementById("userFullName").value = user.fullName || "";
  document.getElementById("userPassword").value = ""; // пароль не показываем
  document.getElementById("userRole").value = user.role || "MANAGER";
  document.getElementById("userStatus").value = user.status || "ACTIVE";
  // Меняем заголовок модалки
  document.getElementById("userModalTitle").textContent =
    "Редактировать пользователя";

  // Показываем модалку
  const modal = new bootstrap.Modal(document.getElementById("userModal"));
  modal.show();
};

  window.deleteUser = async function (id) {
  if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return;

  const token = localStorage.getItem("jwt");
  try {
    const response = await fetch(`http://localhost:8081/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (response.ok) {
      // Обновляем список
      await loadUsers();
    } else {
      alert("Не удалось удалить пользователя");
    }
  } catch (err) {
    console.error(err);
    alert("Ошибка соединения");
  }
};
  window.saveUser = async function () {
  const id = document.getElementById("userId").value || null;
  const login = document.getElementById("userLogin").value.trim();
  const fullName = document.getElementById("userFullName").value.trim();
  const password = document.getElementById("userPassword").value.trim();
  const role = document.getElementById("userRole").value;
  const position =
    document.getElementById("userPosition").value.trim() || "Менеджер";
  const status = document.getElementById("userStatus").value || "ACTIVE";

  // Валидация
  if (!login || !fullName || (!id && !password) || !role) {
    alert("Заполните все обязательные поля");
    return;
  }

  // Формируем тело запроса ТОЧНО как ожидает сервер
  const userData = {
    login,
    fullName,
    role,
    position,
  };

  // Пароль — только если создаём или явно указан
  if (!id || password) {
    userData.password = password;
  }

  // Если сервер принимает status — добавь его
  // userData.status = status;

  const token = localStorage.getItem("jwt");
  const url = id
    ? `http://localhost:8081/users/${id}`
    : `http://localhost:8081/auth/register`;

  const method = id ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      bootstrap.Modal.getInstance(document.getElementById("userModal")).hide();
      await loadUsers();
    } else {
      const errorText = await response.text().catch(() => "Неизвестная ошибка");
      alert("Ошибка сохранения: " + errorText);
    }
  } catch (err) {
    console.error(err);
    alert("Ошибка сети");
  }
};


  window.initUsersView = function() {
    const MAX_ATTEMPTS = 20;
    let attempts = 0;

    const tryInit = () => {
      const tbody = document.getElementById("usersTableBody");
      if (tbody) {
        // DOM готов — грузим данные
        loadUsers();
        const searchInput = document.getElementById("searchUsers");
        if (searchInput) {
          searchInput.addEventListener("input", filterUsers);
        }
      } else if (attempts < MAX_ATTEMPTS) {
        // Повторить через 50 мс
        attempts++;
        setTimeout(tryInit, 50);
      } else {
        console.error("Не удалось найти #usersTableBody после 20 попыток");
      }
    };

    tryInit();
  };

})();

