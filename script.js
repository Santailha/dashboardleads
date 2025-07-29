// Aguarda o carregamento completo da página
document.addEventListener('DOMContentLoaded', () => {
    // Mapeamento dos elementos do HTML
    const unidadeFilter = document.getElementById('unidade-filter');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const filterButton = document.getElementById('filter-button');
    const tablesContainer = document.getElementById('tables-container');

    let allLeadsData = []; // Armazena todos os dados já processados
    let charts = {}; // Objeto para armazenar as instâncias dos gráficos

    const NOME_DO_ARQUIVO_CRM = 'leads_processados.csv';

    const bairrosCampeche = [
        'Campeche', 'Morro das Pedras', 'Ribeirao da Ilha', 'Armação',
        'Açores', 'Barra da Lagoa', 'Carianos', 'Costeira do Pirajubaé',
        'Lagoa da Conceição', 'Novo Campeche', 'Praia Mole', 'Pântano do Sul',
        'Rio Tavares', 'Tapera', 'Saco dos Limões'
    ];

    const motivosParaDescarte = [
        'Atendimento Duplicado',
        'Cadastro Duplicado',
        'Contato Não Comercial'
    ];
    
    const tiposDeNegociacaoExcluidos = ['não comercial'];

    Chart.register(ChartDataLabels);
    Chart.defaults.set('plugins.datalabels', {
        color: '#444',
        font: {
            weight: 'bold'
        }
    });

    Papa.parse(NOME_DO_ARQUIVO_CRM, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const processedData = results.data.map(row => {
                const tipoNegociacao = row['Tipo de Negociação'];
                if (!row['Criado'] || row['Criado'].trim() === '') return null;
                if (motivosParaDescarte.includes(row['Motivo de Descarte'])) return null;
                if (!tipoNegociacao || tiposDeNegociacaoExcluidos.includes(tipoNegociacao.trim().toLowerCase())) return null;
                let unidade;
                if (tipoNegociacao === 'Compradores') {
                    const bairro = row['Bairro Principal'];
                    unidade = bairrosCampeche.includes(bairro) ? 'Vendas - Campeche' : 'Vendas - Centro';
                } else {
                    unidade = tipoNegociacao;
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
            updateDashboard(allLeadsData);
        }
    });
    
    filterButton.addEventListener('click', applyFilters);
    unidadeFilter.addEventListener('change', applyFilters);

    const parseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const parts = dateString.split(' ');
        if (parts.length < 2) return null;
        const [datePart, timePart] = parts;
        const [day, month, year] = datePart.split('/');
        if (!day || !month || !year || year.length < 4) return null;
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`);
    };
    
    function applyFilters() {
        const selectedUnidade = unidadeFilter.value;
        const startDate = startDateInput.value ? new Date(startDateInput.value + 'T00:00:00') : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value + 'T23:59:59') : null;
        let filteredData = allLeadsData;
        if (selectedUnidade !== 'todas') {
            filteredData = filteredData.filter(row => row.unidade === selectedUnidade);
        }
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
        createSummaryTables(data); // <-- Chamada para a nova função das tabelas
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
            options: {
                scales: { x: { ticks: { precision: 0 } } },
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => value > 0 ? value : '',
                    }
                }
            }
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
            },
            options: {
                plugins: {
                    datalabels: {
                        formatter: (value, ctx) => {
                            let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            let percentage = (value * 100 / sum).toFixed(1) + "%";
                            return percentage;
                        },
                        color: '#fff',
                    }
                }
            }
        });
    }

    // NOVA FUNÇÃO PARA CRIAR AS TABELAS DE RESUMO
    function createSummaryTables(data) {
        tablesContainer.innerHTML = ''; // Limpa as tabelas antigas
        const unidades = [...new Set(data.map(item => item.unidade))].sort();

        unidades.forEach(unidade => {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';

            const title = document.createElement('h3');
            title.textContent = unidade;

            const dataDaUnidade = data.filter(d => d.unidade === unidade);
            const totalGeral = dataDaUnidade.length;

            const leadsPorFonte = dataDaUnidade.reduce((acc, curr) => {
                acc[curr.fonte] = (acc[curr.fonte] || 0) + 1;
                return acc;
            }, {});
            
            const sortedLeads = Object.entries(leadsPorFonte).sort(([,a],[,b]) => b-a);

            let tableHTML = `
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>Fonte</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            sortedLeads.forEach(([fonte, total]) => {
                tableHTML += `<tr><td>${fonte}</td><td>${total}</td></tr>`;
            });

            tableHTML += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>Total geral</td>
                            <td>${totalGeral}</td>
                        </tr>
                    </tfoot>
                </table>
            `;

            wrapper.appendChild(title);
            wrapper.innerHTML += tableHTML;
            tablesContainer.appendChild(wrapper);
        });
    }
});
