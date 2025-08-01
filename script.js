// --- CÓDIGO DE DIAGNÓSTICO TEMPORÁRIO ---

document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('main');
    mainContainer.innerHTML = '<h2>Analisando colunas do arquivo leads.csv...</h2>';

    Papa.parse('leads.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                const headers = Object.keys(results.data[0]);
                mainContainer.innerHTML += '<p><b>O script encontrou as seguintes colunas no seu arquivo:</b></p>';
                mainContainer.innerHTML += '<ul id="header-list"></ul>';
                const list = document.getElementById('header-list');
                headers.forEach(header => {
                    const li = document.createElement('li');
                    li.textContent = header;
                    list.appendChild(li);
                });
                mainContainer.innerHTML += '<hr><p style="color: blue; font-weight: bold;">Por favor, me envie um print desta lista de colunas para o diagnóstico final.</p>';
            } else {
                mainContainer.innerHTML = '<p style="color: red;">Não foi possível ler nenhuma linha de dados do arquivo leads.csv. Verifique se o arquivo não está vazio.</p>';
            }
        },
        error: function(err) {
            mainContainer.innerHTML = `<p style="color: red;">Ocorreu um erro ao carregar o arquivo: ${err.message}</p>`;
        }
    });
});
