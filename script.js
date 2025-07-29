// main.js

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQFdqk65-E3D_pKp4-G2xn9mxE_zULv9CyStMINEw40j9O71M5zke3-Bd5wphvDS3CqwdpnyV2B8-yE/pubhtml'; // Substitua pelo seu URL real!

// Função para converter CSV para array de objetos JavaScript
async function parseCsv(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.trim()); // Remove espaços em branco
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim();
        if (currentLine === '') continue; // Ignora linhas vazias

        const values = currentLine.split(',');
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] ? values[j].trim() : ''; // Trata valores vazios
        }
        data.push(row);
    }
    return data;
}

// Função para determinar a semana de análise
function getWeekNumber(dateString) {
    // A string de data vem no formato "DD/MM/AAAA HH:MM:SS"
    const [datePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque o mês em JS é 0-indexed

    // Definições das semanas para Julho de 2025
    const weeks = [
        { name: 'Semana 1', start: new Date(2025, 6, 1), end: new Date(2025, 6, 7) }, // Mês 6 = Julho
        { name: 'Semana 2', start: new Date(2025, 6, 8), end: new Date(2025, 6, 14) },
        { name: 'Semana 3', start: new Date(2025, 6, 15), end: new Date(2025, 6, 21) },
        { name: 'Semana 4', start: new Date(2025, 6, 22), end: new Date(2025, 6, 28) },
        { name: 'Semana 5', start: new Date(2025, 6, 29), end: new Date(2025, 7, 4) }, // Mês 7 = Agosto
        { name: 'Semana 1', start: new Date(2025, 7, 18), end: new Date(2025, 7, 24) }, 
        // Adicione mais semanas conforme o calendário avança
        // Ex: { name: 'Semana 6', start: new Date(2025, 7, 5), end: new Date(2025, 7, 11) },
    ];

    for (const week of weeks) {
        // Ajusta as horas para garantir que o dia inteiro seja incluído
        week.start.setHours(0, 0, 0, 0);
        week.end.setHours(23, 59, 59, 999);

        if (date >= week.start && date <= week.end) {
            return week.name;
        }
    }
    return 'Semana Não Definida'; // Para datas fora das semanas especificadas
}

// Função principal para carregar e processar dados
async function loadAndProcessData() {
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvText = await response.text();
        const rawData = await parseCsv(csvText);

        // Filtrar e processar apenas leads válidos ou relevantes
        const leads = rawData.filter(lead => lead['Criado'] && lead['Tipo de Negócio Detalhado']);

        // Mapear e adicionar a semana de análise para cada lead
        const processedLeads = leads.map(lead => ({
            ...lead,
            // Certifique-se de que 'Criado' é o nome exato da coluna da data no seu CSV
            week: getWeekNumber(lead['Criado'])
        }));

        // Exemplo de como agrupar dados para gráficos:
        const leadsByDetailedType = {};
        const leadsByWeek = {};
        const leadsBySource = {};

        processedLeads.forEach(lead => {
            // Agrupar por "Tipo de Negócio Detalhado"
            if (lead['Tipo de Negócio Detalhado']) {
                leadsByDetailedType[lead['Tipo de Negócio Detalhado']] = (leadsByDetailedType[lead['Tipo de Negócio Detalhado']] || 0) + 1;
            }

            // Agrupar por Semana
            if (lead.week && lead.week !== 'Semana Não Definida') {
                leadsByWeek[lead.week] = (leadsByWeek[lead.week] || 0) + 1;
            }

            // Agrupar por Fonte (certifique-se de que 'Fonte' é o nome exato da coluna)
            if (lead['Fonte']) {
                leadsBySource[lead['Fonte']] = (leadsBySource[lead['Fonte']] || 0) + 1;
            }
        });

        console.log('Leads por Tipo de Negócio Detalhado:', leadsByDetailedType);
        console.log('Leads por Semana:', leadsByWeek);
        console.log('Leads por Fonte:', leadsBySource);

        // Chamar funções para renderizar os gráficos (ex: renderChartJsCharts)
        renderChartJsCharts(leadsByDetailedType, leadsByWeek, leadsBySource);

    } catch (error) {
        console.error('Erro ao carregar ou processar dados:', error);
    }
}

// Função para renderizar gráficos com Chart.js (exemplo)
function renderChartJsCharts(dataByDetailedType, dataByWeek, dataBySource) {
    // Exemplo de gráfico de barras para Total por Unidade/Tipo de Negócio
    const totalLeadsCtx = document.getElementById('totalLeadsChart').getContext('2d');
    new Chart(totalLeadsCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(dataByDetailedType),
            datasets: [{
                label: 'Total de Leads',
                data: Object.values(dataByDetailedType),
                backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(153, 102, 255, 0.6)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)', 'rgba(153, 102, 255, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Exemplo de gráfico de linha para Leads por Semana
    const leadsByWeekCtx = document.getElementById('leadsByWeekChart').getContext('2d');
    // Certifique-se de ordenar as semanas corretamente para o gráfico de linha
    const sortedWeeks = Object.keys(dataByWeek).sort((a, b) => {
        // Lógica de ordenação customizada para "Semana X"
        const weekNumA = parseInt(a.replace('Semana ', ''));
        const weekNumB = parseInt(b.replace('Semana ', ''));
        return weekNumA - weekNumB;
    });

    new Chart(leadsByWeekCtx, {
        type: 'line',
        data: {
            labels: sortedWeeks,
            datasets: [{
                label: 'Leads por Semana',
                data: sortedWeeks.map(week => dataByWeek[week]),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Exemplo de gráfico de pizza para Leads por Fonte
    const leadsBySourceCtx = document.getElementById('leadsBySourceChart').getContext('2d');
    new Chart(leadsBySourceCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(dataBySource),
            datasets: [{
                label: 'Leads por Fonte',
                data: Object.values(dataBySource),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribuição de Leads por Fonte'
                }
            }
        }
    });
}

// Chamar a função principal quando a página for carregada
document.addEventListener('DOMContentLoaded', loadAndProcessData);
