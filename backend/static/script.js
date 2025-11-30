let chartInstance = null;
const GEN_PARAMS = {
    'G1': { 
        nome: 'Turbina a Vapor (Base)', 
        icone: '🏭', 
        a: 0.0024, b: 21.0, c: 1530, min: 37, max: 150 
    },
    'G2': { 
        nome: 'Unidade Térmica (Flex)', 
        icone: '🔥', 
        a: 0.0029, b: 20.16, c: 992, min: 40, max: 160 
    },
    'G3': { 
        nome: 'Gerador Rápido (Pico)', 
        icone: '⚡', 
        a: 0.021, b: 20.4, c: 600, min: 50, max: 190 
    }
};

function setDemanda(val) {
    document.getElementById('inputDemanda').value = val;
    calcular(null);
}

function baixarCSV() {
    window.location.href = "/api/exportar_csv";
}

async function calcular(event) {
    if (event) event.preventDefault();

    const btn = document.querySelector('button[onclick*="calcular"]');
    const originalText = btn.innerText;
    btn.innerText = "Calculando...";
    btn.disabled = true;

    const demanda = document.getElementById('inputDemanda').value;
    
    try {
        const response = await fetch('/api/calcular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demanda: demanda })
        });

        const data = await response.json();

        if (data.sucesso) {
            document.getElementById('resultados').classList.remove('d-none');
            exibirResultados(data.dados);
            renderizarGrafico(data.dados.geradores);
        } else {
            alert("Atenção: " + data.mensagem);
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão com o servidor.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

function exibirResultados(dados) {
    document.getElementById('valLambda').innerText = "$ " + dados.lambda.toFixed(4);
    document.getElementById('custoTotal').innerText = dados.custo_total.toFixed(2);
    const economia = dados.custo_total * 0.052; 
    document.getElementById('valEconomia').innerText = `$ ${economia.toFixed(2)}`;

    const container = document.getElementById('cardsGeradores');
    container.innerHTML = '';

    for (const [key, val] of Object.entries(dados.geradores)) {
        const info = GEN_PARAMS[key];
        const percentual = ((val.potencia - info.min) / (info.max - info.min)) * 100;
        
        let corBarra = 'bg-success';
        let statusBadge = '<span class="badge bg-success bg-opacity-10 text-success border border-success">Ideal</span>';
        
        if (val.potencia >= info.max - 0.1) { 
            corBarra = 'bg-danger'; 
            statusBadge = '<span class="badge bg-danger">Limite Máx</span>'; 
        } else if (val.potencia <= info.min + 0.1) { 
            corBarra = 'bg-warning text-dark'; 
            statusBadge = '<span class="badge bg-warning text-dark">Limite Min</span>'; 
        }

        container.innerHTML += `
            <div class="col-12 mb-3">
                <div class="card card-result border-0 shadow-sm p-3 h-100">
                    <div class="d-flex align-items-center mb-2">
                        <div class="fs-1 me-3 opacity-75">${info.icone}</div>
                        <div class="flex-grow-1">
                            <h6 class="fw-bold mb-0 text-dark">${info.nome}</h6>
                            <small class="text-muted" style="font-size: 0.75rem;">${key} • Eficiência: ${info.a}</small>
                        </div>
                        <div class="text-end">
                             <h3 class="text-primary mb-0 fw-bold">${val.potencia.toFixed(1)} <small class="fs-6 text-muted">MW</small></h3>
                             <small class="text-muted">$${val.custo.toFixed(2)}/h</small>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-end mb-1 mt-2">
                        <small class="text-muted fw-bold" style="font-size: 0.7rem;">${info.min} MW</small>
                        ${statusBadge}
                        <small class="text-muted fw-bold" style="font-size: 0.7rem;">${info.max} MW</small>
                    </div>

                    <div class="progress" style="height: 10px; border-radius: 5px; background-color: #e9ecef;">
                        <div class="progress-bar ${corBarra} progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${Math.max(5, percentual)}%"></div>
                    </div>
                </div>
            </div>`;
    }
}

function renderizarGrafico(resultados) {
    const ctx = document.getElementById('costChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const datasets = [];
  
    const colors = { 'G1': '#0d6efd', 'G2': '#198754', 'G3': '#ffc107' };

    for (const [genId, params] of Object.entries(GEN_PARAMS)) {
        const dataPoints = [];
        const step = (params.max - params.min) / 20;
      
        for (let p = params.min; p <= params.max; p += step) {
            dataPoints.push({ x: p, y: params.a * p * p + params.b * p + params.c });
        }

        datasets.push({
            label: params.nome, 
            data: dataPoints,
            borderColor: colors[genId],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4
        });

        if (resultados[genId]) {
            datasets.push({
                label: `Operação ${genId}`,
                data: [{ x: resultados[genId].potencia, y: resultados[genId].custo }],
                backgroundColor: colors[genId],
                borderColor: '#000',
                borderWidth: 2,
                pointRadius: 8,
                pointHoverRadius: 10,
                type: 'scatter'
            });
        }
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { type: 'linear', position: 'bottom', title: {display: true, text: 'Potência (MW)'} },
                y: { title: {display: true, text: 'Custo ($/h)'} }
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            
                            return `${context.dataset.label}: ${context.raw.x.toFixed(1)} MW / $${context.raw.y.toFixed(0)}`;
                        }
                    }
                }
            }
        }
    });
}