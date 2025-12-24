const API_URL = "http://localhost:8081"; 

function initLoginView() {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        let login = document.getElementById('username').value;
        let password = document.getElementById('password').value;

        if (!login || !password) {
            alert('Заполните все поля');
            return;
        }

        try {
            // Use redirect: 'manual' to detect server-side redirects (helps debug unexpected navigation)
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    login: login,
                    password: password
                }),
                redirect: 'manual'
            });

            console.debug('Login response status:', response.status, 'url:', response.url);
            try {
                // log Location header if present (may be empty due to CORS)
                console.debug('Login response headers:');
                for (const pair of response.headers.entries()) {
                    console.debug(pair[0] + ':', pair[1]);
                }
            } catch (e) {
                console.warn('Could not read response headers (CORS?),', e);
            }

            if (response.status >= 300 && response.status < 400) {
                // Server tried to redirect (e.g. to /dashboard.html). We block navigation and report.
                const loc = response.headers.get('Location');
                console.warn('Server responded with redirect to', loc);
                alert('Сервер вернул редирект на: ' + loc + '\nНавигация заблокирована в целях SPA. Проверьте backend.');
                return;
            }

            if (!response.ok) {
                alert("Неверный логин или пароль");
                return;
            }

            const token = await response.text();

            // сохраняем токен
            localStorage.setItem("jwt", token);

            // Попытка извлечь роль/имя пользователя из payload JWT
            function parseJwt (t) {
                try {
                    const payload = t.split('.')[1];
                    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
                    return JSON.parse(decodeURIComponent(escape(json)));
                } catch (e) {
                    return null;
                }
            }

            const payload = parseJwt(token);
            let role = null;
            if (payload && (payload.role || payload.roles || payload.authorities)) {
                role = payload.role || payload.roles || payload.authorities;
                if (Array.isArray(role)) role = role[0];
            }

            // Установим текущее состояние SPA: currentUser, navbar и покажем products
            // Никаких редиректов на /dashboard.html — остаёмся в SPA
            const normalizeRole = r => {
                if (!r) return null;
                if (Array.isArray(r)) r = r[0];
                // remove ROLE_ prefix if present
                if (typeof r === 'string' && r.startsWith('ROLE_')) return r.substring(5);
                return r;
            };

            const normalizedRole = normalizeRole(role);
            const finalRole = normalizedRole ? String(normalizedRole).toUpperCase() : (login === 'admin' ? 'ADMIN' : 'MANAGER');

            const newCurrentUser = {
                username: payload && (payload.sub || payload.username) ? (payload.sub || payload.username) : login,
                role: finalRole
            };

            // Assign both window.currentUser and the script-global `currentUser` (declared with let in index.html)
            try {
                window.currentUser = newCurrentUser;
            } catch (e) {
                // ignore
            }
            try {
                if (typeof currentUser !== 'undefined') {
                    currentUser = newCurrentUser;
                }
            } catch (e) {
                // ignore
            }

            const navbar = document.getElementById('navbar');
            const userInfo = document.getElementById('userInfo');
            const activeUser = (typeof currentUser !== 'undefined') ? currentUser : window.currentUser;
            if (navbar) navbar.style.display = 'block';
            if (userInfo) userInfo.textContent = `${activeUser.username} (${activeUser.role})`;
            if (activeUser.role === 'ADMIN') {
                const adminMenu = document.getElementById('adminMenu');
                if (adminMenu) adminMenu.style.display = 'block';
            }

            // Показать список товаров в SPA
            if (typeof showView === 'function') {
                showView('products');
            } else {
                console.warn('showView is not defined; staying on current view');
            }

        } catch (error) {
            console.error("Ошибка:", error);
            alert("Ошибка соединения с сервером");
        }
    });
}

// Экспортируем и делаем доступной инициализацию для динамически загружаемых view
window.initLoginView = initLoginView;
