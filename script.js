// Aguarda o carregamento completo da página
document.addEventListener('DOMContentLoaded', () => {
    // Mapeamento dos elementos do HTML
    const unidadeFilter = document.getElementById('unidade-filter');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const filterButton = document.getElementById('filter-button');

    let allLeadsData = []; // Armazena todos os dados já processados
    let charts = {}; // Objeto para armazenar as instâncias dos gráficos

    const NOME_DO_ARQUIVO_CRM = 'leads_processados.csv';

    // LISTA DE BAIRROS ATUALIZADA
    const bairrosCampeche = [
        'Campeche', 'Morro das Pedras', 'Ribeirao da Ilha', 'Armação',
        'Açores', 'Barra da Lagoa', 'Carianos', 'Costeira do Pirajubaé',
        'Lagoa da Conceição', 'Novo Campeche', 'Praia Mole', 'Pântano do Sul',
        'Rio Tavares', 'Tapera', 'Saco dos Limões'
    ];

    // Usa PapaParse para buscar e processar o arquivo CSV
    Papa.parse(NOME_DO_ARQUIVO_CRM, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            // ETAPA DE PROCESSAMENTO: Transforma os dados do CRM
            const processedData = results.data.map(row => {
                if (!row['Criado'] || row['Criado'].trim() === '') {
                    return null;
                }

                let unidade;
                // LÓGICA DE SUBDIVISÃO DE UNIDADE
                if (row['Tipo de Negociação'] === 'Compradores') {
                    const bairro = row['Bairro Principal'];
                    if (bairrosCampeche.includes(bairro)) {
                        unidade = 'Vendas - Campeche';
                    } else {
                        unidade = 'Vendas - Centro';
                    }
                } else {
                    unidade = row['Tipo de Negociação'] || 'Não Informada';
                }

                return {
                    data: row['Criado'],
                    fonte: row['Fonte'] || 'Não Informada',
                    unidade: unidade,
                    bairro: row['Bairro Principal'] || 'Não Informado',
                    quantidade: 1
                };
            }).filter(row => row !== null);

            allLeadsData = processedData;
            populateFilter(allLeadsData);
            updateDashboard(allLeadsData); // Carga inicial com todos os dados
        }
    });
    
    // Adiciona o evento de clique ao botão de filtro
    filterButton.addEventListener('click', applyFilters);
    // Também permite filtrar ao mudar a unidade no dropdown
    unidadeFilter.addEventListener('change', applyFilters);

    // Função central que aplica TODOS os filtros
    function applyFilters() {
        const selectedUnidade = unidadeFilter.value;
        const startDate = startDateInput.value ? new Date(startDateInput.value + 'T00:00:00') : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value + 'T23:59:59') : null;

        let filteredData = allLeadsData;

        // 1. Aplica filtro de Unidade
        if (selectedUnidade !== 'todas') {
            filteredData = filteredData.filter(row => row.unidade === selectedUnidade);
        }

        // 2. Aplica filtro de Data
        if (startDate && endDate) {
            filteredData = filteredData.filter(row => {
                const rowDate = parseDate(row.data);
                return rowDate && rowDate >= startDate && rowDate <= endDate;
            });
        }
        
        updateDashboard(filteredData);
    }

    function populateFilter(data) {
        unidadeFilter.innerHTML = '<option value="todas">Todas as Unidades</option>';
        const unidades = [...new Set(data.map(item => item.unidade))];
        unidades.sort().forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade;
            option.textContent = unidade;
            unidadeFilter.appendChild(option);
        });
    }

    function updateDashboard(data) {
        Object.values(charts).forEach(chart => chart.destroy());
        createLeadsPorFonteChart(data);
        createLeadsPorUnidadeChart(data);
        createLeadsPorSemanaChart(data);
    }

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
                }]
            },
            options: { scales: { y: { beginAtZero: true } }, indexAxis: 'y' }
        });
    }

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
                        'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                }]
            }
        });
    }

    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split(' ');
        if (parts.length < 2) return null;
        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split('/');
        if (!day || !month || !year || year.length < 4) return null;
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`);
    };

    function createLeadsPorSemanaChart(data) {
        const ctx = document.getElementById('leadsPorSemanaChart').getContext('2d');
        const getWeekNumber = (d) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }
        const leadsPorSemana = data.reduce((acc, curr) => {
            const date = parseDate(curr.data);
            if (!date || isNaN(date.getTime())) return acc;
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
                }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }
});
