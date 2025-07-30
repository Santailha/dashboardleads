// ▼▼▼ COLE AQUI A CONFIGURAÇÃO DO SEU PROJETO FIREBASE ▼▼▼
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};
// ▲▲▲ COLE AQUI A CONFIGURAÇÃO DO SEU PROJETO FIREBASE ▲▲▲

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
                window.location.href = 'index.html';
            })
            .catch((error) => {
                errorMessage.textContent = 'E-mail ou senha inválidos.';
                console.error("Erro de login:", error);
            });
    });
}

// --- Lógica para a página PRINCIPAL (index.html) ---
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
