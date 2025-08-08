const firebaseConfig = {
  apiKey: "AIzaSyA158V3DAubBnVWVHdGJR-R0zd5HX2BfNE",
  authDomain: "dashboard-leads-b75dc.firebaseapp.com",
  projectId: "dashboard-leads-b75dc",
  storageBucket: "dashboard-leads-b75dc.firebasestorage.app",
  messagingSenderId: "76951765640",
  appId: "1:76951765640:web:be9723b9bf2d8f1858953d"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// --- Lógica para a página de LOGIN (login.html) ---
if (document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login bem-sucedido, redireciona para o dashboard
                window.location.href = 'index.html';
            })
            .catch((error) => {
                // Mostra mensagem de erro
                errorMessage.textContent = 'E-mail ou senha inválidos.';
                console.error("Erro de login:", error);
            });
    });
}

// --- Lógica para a página PRINCIPAL (index.html) ---
// (Esta parte do código protege a página do dashboard)
if (document.getElementById('dashboard-main-content')) {
    const logoutButton = document.getElementById('logout-button');

    auth.onAuthStateChanged((user) => {
        if (!user) {
            // Se não houver usuário logado, redireciona para a tela de login
            window.location.href = 'login.html';
        }
    });

    if(logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'login.html';
            });
        });
    }
}
