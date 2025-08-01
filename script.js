document.addEventListener('DOMContentLoaded', () => {
    // === ELEMENTOS DO HTML ===
    const unidadeFilter = document.getElementById('unidade-filter');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const filterButton = document.getElementById('filter-button');
    const tablesContainer = document.getElementById('tables-container');
    const kpiTotalLeads = document.getElementById('kpi-total-leads');
    const kpiTotalMqls = document.getElementById('kpi-total-mqls');
    const kpiConversao = document.getElementById('kpi-conversao');
    const leadsKpiCard = document.getElementById('leads-kpi-card');
    const mqlKpiCard = document.getElementById('mql-kpi-card');
    const modal = document.getElementById('drill-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDetailsTable = document.getElementById('modal-details-table');
    const closeModalButton = document.querySelector('.close-button');
    const motivosDescarteContainer = document.getElementById('motivos-descarte-filters');
    const tiposNegociacaoContainer = document.getElementById('tipos-negociacao-filters');

    // === VARIÁVEIS GLOBAIS ===
    let allLeads = [];
    let allMqls = [];
    let charts = {};
    let currentFilteredLeads = [];
    let currentFilteredMqls = [];

    // === REGRAS DE NEGÓCIO ===
    const bairrosCampeche = ['Campeche', 'Morro das Pedras', 'Ribeirao da Ilha', 'Armação', 'Açores', 'Barra da Lagoa', 'Carianos', 'Costeira do Pirajubaé', 'Lagoa da Conceição', 'Novo Campeche', 'Praia Mole', 'Pântano do Sul', 'Rio Tavares', 'Tapera', 'Saco dos Limões'];
    const mqlDateColumnVendas = 'Fase Atendimento do Lead - Vendas';
    // Nova regra para MQL de Locação
    const mqlEtapaLocacao = 'Ganho';

    // === INICIALIZAÇÃO ===
    Chart.register(ChartDataLabels);
    Chart.defaults.set('plugins.datalabels', { color: '#444', font: { weight: 'bold' } });
    
    const loadFile = (url) => new Promise((resolve, reject) => { Papa.parse(url, { download: true, header: true, skipEmptyLines: true, complete: results => resolve(results.data), error: err => reject(err) }); });
    
    // Agora carrega apenas 2 arquivos
    Promise.all([
        loadFile('leads.csv'),
        loadFile('deals_vendas.csv')
    ]).then(([leadData, dealsVendasData]) => {
        processAllData(leadData, dealsVendasData);
        populateDynamicFilters(allLeads);
        applyFilters();
    }).catch(err => {
        console.error("Erro ao carregar os arquivos CSV:", err);
        tablesContainer.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar arquivos. Verifique se os arquivos 'leads.csv' e 'deals_vendas.csv' estão no repositório.</p>`;
    });
    
    function processAllData(leadData, dealsVendasData) {
        allLeads = leadData.map(row => {
            const tipoNegociacao = row['Tipo de Negociação'] || row['Tipo de NegociaÃ§Ã£o'];
            if (!row['Criado'] || !tipoNegociacao) return null;
            let unidade = (tipoNegociacao === 'Compradores') ? (bairrosCampeche.includes(row['Bairro Principal']) ? 'Vendas - Campeche' : 'Vendas - Centro') : tipoNegociacao;
            return {
                id: row['ID'], nome: row['Nome do Lead'], leadDate: parseDate(row['Criado']),
                fonte: row['Fonte'] || 'Não Informada', unidade: unidade, quantidade: 1,
                motivoDescarte: row['Motivo de Descarte'], tipoNegociacao: tipoNegociacao
            };
        }).filter(Boolean);

        // MQLs de Vendas (lógica inalterada, usa deals_vendas.csv)
        const mqlsVendas = dealsVendasData.map(row => {
            if (!row[mqlDateColumnVendas] || !row['Data e hora da criação do Lead']) return null;
            let unidade = bairrosCampeche.includes(row['Bairros (LS)']) ? 'MQL Vendas - Campeche' : 'MQL Vendas - Centro';
            return { id: row['ID'], nome: row['Nome do negócio'], mqlDate: parseDate(row[mqlDateColumnVendas]), leadDate: parseDate(row['Data e hora da criação do Lead']), fonte: row['Fonte'] || 'Não Informada', unidade: unidade };
        }).filter(Boolean);

        // MQLs de Locação (NOVA LÓGICA, usa leads.csv)
        const mqlsLocacao = leadData.map(row => {
            const tipoNegociacao = row['Tipo de Negociação'] || row['Tipo de NegociaÃ§Ã£o'];
            if (tipoNegociacao === 'Locatários' && row['Etapa'] === mqlEtapaLocacao) {
                return {
                    id: row['ID'],
                    nome: row['Nome do Lead'],
                    mqlDate: parseDate(row['Criado']), // A data do MQL é a data de criação, como definido
                    leadDate: parseDate(row['Criado']),
                    fonte: row['Fonte'] || 'Não Informada',
                    unidade: 'MQL Locação'
                };
            }
            return null;
        }).filter(Boolean);
        
        allMqls = [...mqlsVendas, ...mqlsLocacao];
        populateFilter(allLeads);
    }
    
    // O restante do script continua exatamente o mesmo
    function populateDynamicFilters(leads) { /* ... */ }
    filterButton.addEventListener('click', applyFilters);
    unidadeFilter.addEventListener('change', applyFilters);
    function applyFilters() { /* ... */ }
    function populateFilter(data) { /* ... */ }
    function updateDashboard(leads, mqls) { /* ... */ }
    function updateKPIs(leads, mqls) { /* ... */ }
    function showDrillModal(title, items, type = 'lead') { /* ... */ }
    closeModalButton.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = 'none'; } };
    leadsKpiCard.addEventListener('click', () => { showDrillModal('Detalhes de Leads (Filtro Atual)', currentFilteredLeads, 'lead'); });
    mqlKpiCard.addEventListener('click', () => { showDrillModal('Detalhes de MQLs (Filtro Atual)', currentFilteredMqls, 'mql'); });
    tablesContainer.addEventListener('click', (event) => { /* ... */ });
    function createSummaryTables(leads, mqls) { /* ... */ }
    function parseDate(dateString) { if (!dateString || typeof dateString !== 'string') return null; const parts = dateString.split(' '); if (parts.length < 2) return null; const [datePart] = parts; const [day, month, year] = datePart.split('/'); if (!day || !month || !year || year.length < 4) return null; return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`); }
    function createLeadsPorFonteChart(data) { /* ... */ }
    function createLeadsPorUnidadeChart(data) { /* ... */ }

    // Colando o restante das funções para garantir a integridade
    populateDynamicFilters = (leads) => {
        const motivosDescartePadrao = ['Atendimento Duplicado', 'Cadastro Duplicado', 'Contato Não Comercial'];
        const motivos = [...new Set(leads.map(lead => lead.motivoDescarte).filter(Boolean))].sort();
        const tipos = [...new Set(leads.map(lead => lead.tipoNegociacao).filter(Boolean))].sort();
        motivosDescarteContainer.innerHTML = motivos.map(motivo => `<label><input type="checkbox" class="motivo-descarte-check" value="${motivo}" ${motivosDescartePadrao.includes(motivo) ? 'checked' : ''}> ${motivo}</label>`).join('');
        tiposNegociacaoContainer.innerHTML = tipos.map(tipo => `<label><input type="checkbox" class="tipo-negociacao-check" value="${tipo}"> ${tipo}</label>`).join('');
    };
    applyFilters = () => {
        const selectedUnidade = unidadeFilter.value;
        const startDate = startDateInput.value ? new Date(startDateInput.value + 'T00:00:00') : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value + 'T23:59:59') : null;
        const motivosExcluir = [...document.querySelectorAll('.motivo-descarte-check:checked')].map(cb => cb.value);
        const tiposExcluir = [...document.querySelectorAll('.tipo-negociacao-check:checked')].map(cb => cb.value);
        currentFilteredLeads = allLeads.filter(lead => {
            if (motivosExcluir.includes(lead.motivoDescarte)) return false;
            if (tiposExcluir.includes(lead.tipoNegociacao)) return false;
            if (!lead.leadDate) return false;
            if (startDate && lead.leadDate < startDate) return false;
            if (endDate && lead.leadDate > endDate) return false;
            if (selectedUnidade !== 'todos' && lead.unidade !== selectedUnidade) return false;
            return true;
        });
        currentFilteredMqls = allMqls.filter(mql => {
            if (!mql.leadDate) return false;
            if (startDate && mql.leadDate < startDate) return false;
            if (endDate && mql.leadDate > endDate) return false;
            const leadCorrespondente = allLeads.find(l => l.id === mql.id);
            if(leadCorrespondente){
                 if (motivosExcluir.includes(leadCorrespondente.motivoDescarte)) return false;
                 if (tiposExcluir.includes(leadCorrespondente.tipoNegociacao)) return false;
            }
            const mqlUnidadeCorresponde = `MQL ${selectedUnidade}`;
            if (selectedUnidade !== 'todos' && mql.unidade !== mqlUnidadeCorresponde && !(selectedUnidade === 'Locatários' && mql.unidade === 'MQL Locação')) return false;
            return true;
        });
        updateDashboard(currentFilteredLeads, currentFilteredMqls);
    };
    populateFilter = (data) => { unidadeFilter.innerHTML = '<option value="todas">Todas as Unidades</option>'; const unidades = [...new Set(data.map(item => item.unidade))]; unidades.sort().forEach(unidade => { const option = document.createElement('option'); option.value = unidade; option.textContent = unidade; unidadeFilter.appendChild(option); }); };
    updateDashboard = (leads, mqls) => { Object.values(charts).forEach(chart => chart.destroy()); updateKPIs(leads, mqls); createLeadsPorFonteChart(leads); createLeadsPorUnidadeChart(leads); createSummaryTables(leads, mqls); };
    updateKPIs = (leads, mqls) => { const totalLeads = leads.length; const totalMqls = mqls.length; const conversao = totalLeads > 0 ? ((totalMqls / totalLeads) * 100).toFixed(1) + '%' : '0%'; kpiTotalLeads.textContent = totalLeads; kpiTotalMqls.textContent = totalMqls; kpiConversao.textContent = conversao; };
    showDrillModal = (title, items, type = 'lead') => { modalTitle.textContent = title; const nameHeader = type === 'lead' ? 'Nome do Lead' : 'Nome do Negócio'; let tableHTML = `<table><thead><tr><th>ID</th><th>${nameHeader}</th></tr></thead><tbody>`; if (items.length > 0) { items.forEach(item => { tableHTML += `<tr><td>${item.id || ''}</td><td>${item.nome || ''}</td></tr>`; }); } else { tableHTML += '<tr><td colspan="2">Nenhum dado encontrado.</td></tr>'; } tableHTML += '</tbody></table>'; modalDetailsTable.innerHTML = tableHTML; modal.style.display = 'block'; };
    tablesContainer.addEventListener('click', (event) => { if (event.target.classList.contains('mql-cell')) { const fonte = event.target.dataset.fonte; const unidade = event.target.dataset.unidade; let mqlsFiltrados; if (fonte === 'all') { const mqlUnidadeCorresponde = (unidade === 'Locatários') ? 'MQL Locação' : `MQL ${unidade}`; mqlsFiltrados = currentFilteredMqls.filter(mql => mql.unidade === mqlUnidadeCorresponde); showDrillModal(`MQLs de ${unidade} (Todos)`, mqlsFiltrados, 'mql'); } else { const mqlUnidadeCorresponde = (unidade === 'Locatários') ? 'MQL Locação' : `MQL ${unidade}`; mqlsFiltrados = currentFilteredMqls.filter(mql => mql.unidade === mqlUnidadeCorresponde && mql.fonte === fonte); showDrillModal(`MQLs de ${unidade} | Fonte: ${fonte}`, mqlsFiltrados, 'mql'); } } });
    createSummaryTables = (leads, mqls) => { tablesContainer.innerHTML = ''; const unidades = [...new Set(leads.map(item => item.unidade))].sort(); unidades.forEach(unidade => { const wrapper = document.createElement('div'); wrapper.className = 'table-wrapper'; const title = document.createElement('h3'); title.textContent = unidade; const leadsDaUnidade = leads.filter(l => l.unidade === unidade); const mqlUnidadeCorresponde = (unidade === 'Locatários') ? 'MQL Locação' : `MQL ${unidade}`; const mqlsDaUnidade = mqls.filter(m => m.unidade === mqlUnidadeCorresponde); const leadsPorFonte = leadsDaUnidade.reduce((acc, curr) => { acc[curr.fonte] = (acc[curr.fonte] || 0) + 1; return acc; }, {}); const mqlsPorFonte = mqlsDaUnidade.reduce((acc, curr) => { acc[curr.fonte] = (acc[curr.fonte] || 0) + 1; return acc; }, {}); const fontes = [...new Set([...Object.keys(leadsPorFonte), ...Object.keys(mqlsPorFonte)])].sort((a,b) => (leadsPorFonte[b]||0) - (leadsPorFonte[a]||0)); let tableHTML = `<table class="summary-table"><thead><tr><th>Fonte</th><th>Leads</th><th>MQLs</th><th>Conv.</th></tr></thead><tbody>`; fontes.forEach(fonte => { const nLeads = leadsPorFonte[fonte] || 0; const nMqls = mqlsPorFonte[fonte] || 0; const conv = nLeads > 0 ? ((nMqls / nLeads) * 100).toFixed(0) + '%' : '0%'; tableHTML += `<tr><td>${fonte}</td><td>${nLeads}</td><td class="mql-cell" data-fonte="${fonte}" data-unidade="${unidade}">${nMqls}</td><td>${conv}</td></tr>`; }); const totalLeadsUnidade = leadsDaUnidade.length; const totalMqlsUnidade = mqlsDaUnidade.length; const convTotal = totalLeadsUnidade > 0 ? ((totalMqlsUnidade / totalLeadsUnidade) * 100).toFixed(0) + '%' : '0%'; tableHTML += `</tbody><tfoot><tr><td>Total geral</td><td>${totalLeadsUnidade}</td><td class="mql-cell" data-fonte="all" data-unidade="${unidade}">${totalMqlsUnidade}</td><td>${convTotal}</td></tr></tfoot></table>`; wrapper.appendChild(title); wrapper.innerHTML += tableHTML; tablesContainer.appendChild(wrapper); }); };
    createLeadsPorFonteChart = (data) => { const ctx = document.getElementById('leadsPorFonteChart'); const leadsPorFonte = data.reduce((acc, curr) => { acc[curr.fonte] = (acc[curr.fonte] || 0) + curr.quantidade; return acc; }, {}); const sortedData = Object.entries(leadsPorFonte).sort(([,a],[,b]) => b-a); charts.leadsPorFonte = new Chart(ctx, { type: 'bar', data: { labels: sortedData.map(item => item[0]), datasets: [{ label: 'Total de Leads', data: sortedData.map(item => item[1]), backgroundColor: '#3d357e99', }] }, options: { scales: { x: { ticks: { precision: 0 } } }, indexAxis: 'y', plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'end', formatter: (value) => value > 0 ? value : '', } }, onClick: (event, elements) => { if (elements.length === 0) return; const index = elements[0].index; const fonteClicada = sortedData[index][0]; const leadsFiltrados = currentFilteredLeads.filter(lead => lead.fonte === fonteClicada); showDrillModal(`Leads da Fonte: ${fonteClicada}`, leadsFiltrados, 'lead'); } } }); };
    createLeadsPorUnidadeChart = (data) => { const ctx = document.getElementById('leadsPorUnidadeChart'); const leadsPorUnidade = data.reduce((acc, curr) => { acc[curr.unidade] = (acc[curr.unidade] || 0) + curr.quantidade; return acc; }, {}); const labels = Object.keys(leadsPorUnidade); const dataValues = Object.values(leadsPorUnidade); charts.leadsPorUnidade = new Chart(ctx, { type: 'pie', data: { labels: labels, datasets: [{ label: 'Total de Leads', data: dataValues, backgroundColor: ['#3d357e', '#edae0f', '#7c75b8', '#f2c75a', '#cccccc'], }] }, options: { plugins: { datalabels: { formatter: (value, ctx) => { let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); let percentage = (value * 100 / sum).toFixed(1) + "%"; return percentage; }, color: '#fff', font: { weight: 'bold', size: 14 } } }, onClick: (event, elements) => { if (elements.length === 0) return; const index = elements[0].index; const unidadeClicada = labels[index]; const leadsFiltrados = currentFilteredLeads.filter(lead => lead.unidade === unidadeClicada); showDrillModal(`Leads da Unidade: ${unidadeClicada}`, leadsFiltrados, 'lead'); } } }); };
});
