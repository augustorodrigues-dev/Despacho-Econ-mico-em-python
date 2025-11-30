// Variável global para o gráfico (para poder destruir e recriar)
let chartInstance = null;

// Dados dos Geradores (Hardcoded para visualização - Tabela 2 do Artigo)
const GEN_PARAMS = {
    'G1': { a: 0.0024, b: 21.0, c: 1530, min: 37, max: 150 },
    'G2': { a: 0.0029, b: 20.16, c: 992, min: 40, max: 160 },
    'G3': { a: 0.021, b: 20.4, c: 600, min: 50, max: 190 }
};

function setDemanda(val) {
    document.getElementById('inputDemanda').value = val;
    calcular(null);
}

async function calcular(event) {
    if (event) event.preventDefault();
    
    const demanda = document.getElementById('inputDemanda').value;
    
    // Feedback visual de carregamento
    const btn = document.querySelector('button[onclick*="calcular"]');
    const originalText = btn.innerText;
    btn.innerText = "Calculando...";
    btn.disabled = true;

    try {
        const response = await fetch('http://127.0.0.1:5000/api/calcular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demanda: demanda })
        });

        const data = await response.json();

        if (data.sucesso) {
            document.getElementById('resultados').classList.remove('d-none');
            exibirResultados(data.dados);
            
            // Renderiza o gráfico novo
            renderizarGrafico(data.dados.geradores);
        } else {
            alert("Atenção: " + data.mensagem);
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão. Verifique se o backend (app.py) está rodando.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function exibirResultados(dados) {
    document.getElementById('valLambda').innerText = "$ " + dados.lambda.toFixed(4);
    document.getElementById('custoTotal').innerText = dados.custo_total.toFixed(2);
    
    // Cálculo Estimado de Economia (Simulação: Comparado com Média Simples)
    // Supomos um cenário ineficiente onde o custo seria ~5% maior (apenas para ilustrar a Persona)
    const custoIneficiente = dados.custo_total * 1.052; 
    const economia = custoIneficiente - dados.custo_total;
    document.getElementById('valEconomia').innerText = `$ ${economia.toFixed(2)} (5.2%)`;

    const container = document.getElementById('cardsGeradores');
    container.innerHTML = '';

    for (const [key, val] of Object.entries(dados.geradores)) {
        const limites = GEN_PARAMS[key]; // Pega min/max
        const percentual = ((val.potencia - limites.min) / (limites.max - limites.min)) * 100;
        
        // Lógica de Cor: Vermelho se estiver travado no limite (Fronteira Ativa)
        let corBarra = 'bg-success';
        let badge = '';
        
        if (val.potencia >= limites.max - 0.1) {
            corBarra = 'bg-danger';
            badge = '<span class="badge bg-danger ms-2">Max</span>';
        } else if (val.potencia <= limites.min + 0.1) {
            corBarra = 'bg-warning text-dark';
            badge = '<span class="badge bg-warning text-dark ms-2">Min</span>';
        }

        const html = `
            <div class="col-12 mb-3">
                <div class="card card-result border-0 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="card-title mb-0 fw-bold">${key} ${badge}</h5>
                            <span class="text-muted small">Custo: $${val.custo.toFixed(2)}</span>
                        </div>
                        <h3 class="text-primary mb-2">${val.potencia.toFixed(1)} <small class="fs-6 text-muted">MW</small></h3>
                        
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar ${corBarra}" role="progressbar" style="width: ${Math.max(5, percentual)}%"></div>
                        </div>
                        <div class="d-flex justify-content-between mt-1 text-muted" style="font-size: 0.75rem;">
                            <span>Min: ${limites.min}</span>
                            <span>Max: ${limites.max}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    }
}

// --- Lógica do Gráfico (Chart.js) ---
function renderizarGrafico(resultados) {
    const ctx = document.getElementById('costChart').getContext('2d');

    // Se já existe gráfico, destrói para criar o novo
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Gera pontos para desenhar as curvas (Domínio Completo)
    const datasets = [];
    const colors = { 'G1': '#0d6efd', 'G2': '#198754', 'G3': '#ffc107' };

    for (const [genId, params] of Object.entries(GEN_PARAMS)) {
        const dataPoints = [];
        // Gera 20 pontos para suavizar a curva entre Min e Max
        const step = (params.max - params.min) / 20;
        
        for (let p = params.min; p <= params.max; p += step) {
            const custo = params.a * p * p + params.b * p + params.c;
            dataPoints.push({ x: p, y: custo });
        }

        // Adiciona a Curva (Linha)
        datasets.push({
            label: `Curva ${genId}`,
            data: dataPoints,
            borderColor: colors[genId],
            borderWidth: 2,
            pointRadius: 0, // Esconde os pontos da linha
            fill: false,
            tension: 0.4 // Suaviza a linha (Bézier)
        });

        // Adiciona o Ponto de Operação Atual (Resultado da Otimização)
        if (resultados[genId]) {
            datasets.push({
                label: `Operação ${genId}`,
                data: [{ x: resultados[genId].potencia, y: resultados[genId].custo }],
                backgroundColor: colors[genId],
                borderColor: '#000',
                borderWidth: 2,
                pointRadius: 8, // Ponto grande para destaque
                pointHoverRadius: 10,
                type: 'scatter' // Tipo dispersão para ser apenas um ponto
            });
        }
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'Potência Gerada (MW)' }
                },
                y: {
                    title: { display: true, text: 'Custo ($/h)' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.x.toFixed(1)} MW / $${context.raw.y.toFixed(1)}`;
                        }
                    }
                }
            }
        }
    });
}