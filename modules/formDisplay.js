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
