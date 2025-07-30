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
    const modal = document.getElementById('drill-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDetailsTable = document.getElementById('modal-details-table');
    const closeModalButton = document.querySelector('.close-button');

    // === VARIÁVEIS GLOBAIS ===
    let allLeads = [];
    let allMqls = [];
    let charts = {};
    let currentFilteredLeads = [];

    // === REGRAS DE NEGÓCIO ===
    const bairrosCampeche = [
        'Campeche', 'Morro das Pedras', 'Ribeirao da Ilha', 'Armação', 'Açores', 
        'Barra da Lagoa', 'Carianos', 'Costeira do Pirajubaé', 'Lagoa da Conceição', 
        'Novo Campeche', 'Praia Mole', 'Pântano do Sul', 'Rio Tavares', 'Tapera', 'Saco dos Limões'
    ];
    const motivosDescarteLead = ['Atendimento Duplicado', 'Cadastro Duplicado', 'Contato Não Comercial'];
    const tiposNegociacaoExcluidos = ['não comercial'];
    const mqlDateColumnVendas = 'Fase Atendimento do Lead - Vendas';
    const mqlDateColumnLocacao = 'Data e Hora de entrada na fase Confirmação de visita loc.';

    // === INICIALIZAÇÃO ===
    Chart.register(ChartDataLabels);
    Chart.defaults.set('plugins.datalabels', { color: '#444', font: { weight: 'bold' } });
    
    const loadFile = (url) => new Promise((resolve, reject) => { Papa.parse(url, { download: true, header: true, skipEmptyLines: true, complete: results => resolve(results.data), error: err => reject(err) }); });
    
    Promise.all([
        loadFile('leads.csv'),
        loadFile('deals_vendas.csv'),
        loadFile('deals_locacao.csv')
    ]).then(([leadData, dealsVendasData, dealsLocacaoData]) => {
        processAllData(leadData, dealsVendasData, dealsLocacaoData);
        applyFilters();
    }).catch(err => { console.error("Erro ao carregar os arquivos CSV:", err); tablesContainer.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar arquivos. Verifique se os arquivos 'leads.csv', 'deals_vendas.csv' e 'deals_locacao.csv' estão no repositório.</p>`; });
    
    // === PROCESSAMENTO DE DADOS ===
    function processAllData(leadData, dealsVendasData, dealsLocacaoData) {
        allLeads = leadData.map(row => {
            const tipoNegociacao = row['Tipo de Negociação'];
            
            // Verificação de segurança para evitar o erro 'trim'
            if (!row['Criado'] || !tipoNegociacao) return null;

            if (motivosDescarteLead.includes(row['Motivo de Descarte'])) return null;
            if (tiposNegociacaoExcluidos.includes(tipoNegociacao.trim().toLowerCase())) return null;
            
            let unidade = (tipoNegociacao === 'Compradores') ? (bairrosCampeche.includes(row['Bairro Principal']) ? 'Vendas - Campeche' : 'Vendas - Centro') : tipoNegociacao;
            
            return {
                id: row['ID'],
                nome: row['Nome do Lead'],
                leadDate: parseDate(row['Criado']),
