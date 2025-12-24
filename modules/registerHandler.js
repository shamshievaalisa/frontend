var registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        let name = document.getElementById('name').value.trim();
        let email = document.getElementById('emailReg').value.trim();
        let password = document.getElementById('passwordReg').value.trim();
        let passwordConfirm = document.getElementById('passwordConfirm').value.trim();
        let agreeTerms = document.getElementById('agreeTerms').checked;

        if (!name || !email || !password || !passwordConfirm) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        if (password !== passwordConfirm) {
            alert('Пароли не совпадают');
            return;
        }

        if (!agreeTerms) {
            alert('Вы должны согласиться с условиями использования');
            return;
        }

        // Тело под RegisterRequestDto
        const body = {
            fullName: name,
            login: email,
            password: password,
            position: "Продавец",   // можно любое дефолтное значение
            role: "MANAGER"          // можно любое дефолтное значение
        };

        try {
            let response = await fetch("http://localhost:8081/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                let errText = await response.text();
                alert("Ошибка регистрации: " + errText);
                return;
            }

            // backend возвращает строку "registered"
            let text = await response.text();
            console.log("Ответ сервера:", text);

            alert("Пользователь успешно зарегистрирован!");

            registerForm.reset();
            if (typeof showLogin === 'function') {
                showLogin(); // переключаемся на форму логина, если функция есть
            }

        } catch (error) {
            console.error("Ошибка:", error);
            alert("Не удалось подключиться к серверу");
        }
    });
}
