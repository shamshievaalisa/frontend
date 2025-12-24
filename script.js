function showRegister() {
    var loginDiv = document.getElementById('loginDiv');
    var registerDiv = document.getElementById('registerDiv');
    
    loginDiv.style.display = 'none';
    registerDiv.style.display = 'block';
}

function showLogin() {
    var loginDiv = document.getElementById('loginDiv');
    var registerDiv = document.getElementById('registerDiv');
    
    loginDiv.style.display = 'block';
    registerDiv.style.display = 'none';
}


var loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;
        
        // Basic validation
        if (email !== '' && password !== '') {
            // Example output
            console.log('Login attempt with email: ' + email);
            alert('Вы вошли как: ' + email);
            loginForm.reset();
        } else {
            alert('Пожалуйста, заполните все поля');
        }
    });
}

// Registration form handler
var registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        var name = document.getElementById('name').value;
        var email = document.getElementById('emailReg').value;
        var password = document.getElementById('passwordReg').value;
        var passwordConfirm = document.getElementById('passwordConfirm').value;
        var agreeTerms = document.getElementById('agreeTerms').checked;
        
        // Validation checks
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
        
        // Success message
        console.log('Registration successful for: ' + name);
        alert('Пользователь ' + name + ' успешно зарегистрирован!');
        registerForm.reset();
        showLogin();
    });
}

// Document ready check
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM fully loaded and parsed');
    });
} else {
    console.log('DOM already ready');
}
