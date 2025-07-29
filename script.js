// Aguarda o carregamento completo da página
document.addEventListener('DOMContentLoaded', () => {
    const unidadeFilter = document.getElementById('unidade-filter');
    let allLeadsData = []; // Armazena todos os dados do CSV
    let charts = {}; // Objeto para armazenar as instâncias dos gráficos

    // Usa PapaParse para buscar e processar o arquivo CSV
    Papa.parse('leads_processados.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            allLeadsData = results.data;
            populateFilter(allLeadsData);
            updateDashboard(allLeadsData);
        }
    });

    // Adiciona um "ouvinte" para o filtro de unidade
    unidadeFilter.addEventListener('change', () => {
        const selectedUnidade = unidadeFilter.value;
        let filteredData = allLeadsData;
        if (selectedUnidade !== 'todas') {
            filteredData = allLeadsData.filter(row => row.unidade === selectedUnidade);
        }
        updateDashboard(filteredData);
    });

    // Função para preencher o seletor de filtro com as unidades disponíveis
    function populateFilter(data) {
        const unidades = [...new Set(data.map(item => item.unidade))];
        unidades.forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade;
            option.textContent = unidade;
            unidadeFilter.appendChild(option);
        });
    }

    // Função principal que atualiza todos os gráficos
    function updateDashboard(data) {
        // Destrói gráficos antigos antes de desenhar novos para evitar sobreposição
        Object.values(charts).forEach(chart => chart.destroy());

        createLeadsPorFonteChart(data);
        createLeadsPorUnidadeChart(data);
        createLeadsPorSemanaChart(data);
    }

    // Função para criar o gráfico de Leads por Fonte
    function createLeadsPorFonteChart(data) {
        const ctx = document.getElementById('leadsPorFonteChart').getContext('2d');
        const leadsPorFonte = data.reduce((acc, curr) => {
            acc[curr.fonte] = (acc[curr.fonte] || 0) + curr.quantidade;
            return acc;
        }, {});

        charts.leadsPorFonte = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(leadsPorFonte),
                datasets: [{
                    label: 'Total de Leads',
                    data: Object.values(leadsPorFonte),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                indexAxis: 'y', // Deixa as barras na horizontal para melhor leitura
            }
        });
    }

    // Função para criar o gráfico de Leads por Unidade
    function createLeadsPorUnidadeChart(data) {
        const ctx = document.getElementById('leadsPorUnidadeChart').getContext('2d');
        const leadsPorUnidade = data.reduce((acc, curr) => {
            acc[curr.unidade] = (acc[curr.unidade] || 0) + curr.quantidade;
            return acc;
        }, {});

        charts.leadsPorUnidade = new Chart(ctx, {
            type: 'pie', // Gráfico de pizza
            data: {
                labels: Object.keys(leadsPorUnidade),
                datasets: [{
                    label: 'Total de Leads',
                    data: Object.values(leadsPorUnidade),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                }]
            }
        });
    }

    // Função para criar o gráfico de Leads por Semana
    function createLeadsPorSemanaChart(data) {
        const ctx = document.getElementById('leadsPorSemanaChart').getContext('2d');

        // Função para obter o número da semana do ano a partir de uma data
        const getWeekNumber = (d) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        const leadsPorSemana = data.reduce((acc, curr) => {
            const date = new Date(curr.data);
            const week = `Semana ${getWeekNumber(date)}`;
            acc[week] = (acc[week] || 0) + curr.quantidade;
            return acc;
        }, {});

        const sortedWeeks = Object.keys(leadsPorSemana).sort((a, b) => {
            return parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]);
        });

        const sortedData = sortedWeeks.map(week => leadsPorSemana[week]);

        charts.leadsPorSemana = new Chart(ctx, {
            type: 'line', // Gráfico de linha
            data: {
                labels: sortedWeeks,
                datasets: [{
                    label: 'Total de Leads',
                    data: sortedData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } }
            }
        });
    }
});
