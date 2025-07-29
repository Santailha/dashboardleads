// Aguarda o carregamento completo da página
document.addEventListener('DOMContentLoaded', () => {
    const unidadeFilter = document.getElementById('unidade-filter');
    let allLeadsData = []; // Armazena todos os dados já processados
    let charts = {}; // Objeto para armazenar as instâncias dos gráficos

    // Procura o arquivo com o nome que você definiu
    const NOME_DO_ARQUIVO_CRM = 'leads_processados.csv';

    // Usa PapaParse para buscar e processar o arquivo CSV
    Papa.parse(NOME_DO_ARQUIVO_CRM, {
        download: true,
        header: true,
        skipEmptyLines: true,
        // Função executada ao concluir a leitura do arquivo
        complete: function(results) {
            // ETAPA DE PROCESSAMENTO: Transforma os dados do CRM no formato que os gráficos entendem
            const processedData = results.data.map(row => {
                // Pula linhas que não tiverem uma data de criação
                if (!row['Criado'] || row['Criado'].trim() === '') {
                    return null;
                }
                return {
                    // Mapeia as colunas do seu CRM para os nomes que usamos nos gráficos
                    data: row['Criado'],
                    fonte: row['Fonte'] || 'Não Informada',
                    unidade: row['Tipo de Negociação'] || 'Não Informada',
                    quantidade: 1 // Cada linha representa 1 lead
                };
            }).filter(row => row !== null); // Remove as linhas que foram puladas

            allLeadsData = processedData;
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
        // Limpa opções antigas
        unidadeFilter.innerHTML = '<option value="todas">Todas as Unidades</option>';
        const unidades = [...new Set(data.map(item => item.unidade))];
        unidades.sort().forEach(unidade => {
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
        
        const sortedData = Object.entries(leadsPorFonte).sort(([,a],[,b]) => b-a);

        charts.leadsPorFonte = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(item => item[0]),
                datasets: [{
                    label: 'Total de Leads',
                    data: sortedData.map(item => item[1]),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                indexAxis: 'y',
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
            type: 'pie',
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

    // Função para criar o gráfico de Leads por Semana (COM A CORREÇÃO)
    function createLeadsPorSemanaChart(data) {
        const ctx = document.getElementById('leadsPorSemanaChart').getContext('2d');

        // Função para converter data do formato "dd/mm/aaaa HH:MM:SS" para um objeto Date
        const parseDate = (dateString) => {
            // VERIFICAÇÃO DE SEGURANÇA: Retorna nulo se a data for inválida ou vazia
            if (!dateString || typeof dateString !== 'string') {
                return null;
            }

            const parts = dateString.split(' ');
            if (parts.length < 2) {
                return null;
            }

            const [datePart, timePart] = parts;
            const [day, month, year] = datePart.split('/');

            if (!day || !month || !year || year.length < 4) {
                return null;
            }

            // Retorna a data formatada corretamente
            return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`);
        };
        
        const getWeekNumber = (d) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        const leadsPorSemana = data.reduce((acc, curr) => {
            const date = parseDate(curr.data);
            // Pula para a próxima linha se a data for inválida
            if (!date || isNaN(date.getTime())) {
                return acc;
            }
            const year = date.getFullYear();
            const week = `Semana ${getWeekNumber(date)}/${year}`;
            acc[week] = (acc[week] || 0) + curr.quantidade;
            return acc;
        }, {});
        
        const sortedWeeks = Object.keys(leadsPorSemana).sort((a, b) => {
            const [weekA, yearA] = a.replace('Semana ', '').split('/');
            const [weekB, yearB] = b.replace('Semana ', '').split('/');
            if (yearA !== yearB) return yearA - yearB;
            return parseInt(weekA) - parseInt(weekB);
        });
        
        const sortedData = sortedWeeks.map(week => leadsPorSemana[week]);

        charts.leadsPorSemana = new Chart(ctx, {
            type: 'line',
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
