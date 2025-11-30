let chartInstance = null;
const GEN_PARAMS = {
    'G1': { a: 0.0024, b: 21.0, c: 1530, min: 37, max: 150 },
    'G2': { a: 0.0029, b: 20.16, c: 992, min: 40, max: 160 },
    'G3': { a: 0.021, b: 20.4, c: 600, min: 50, max: 190 }
};

function setDemanda(val) {
    document.getElementById('inputDemanda').value = val;
    calcular(null);
}

function baixarCSV() {
    window.location.href = "/api/exportar_csv"; // Caminho relativo
}

async function calcular(event) {
    if (event) event.preventDefault();
    const demanda = document.getElementById('inputDemanda').value;
    
    try {
        const response = await fetch('/api/calcular', { // Caminho relativo
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
            alert("Erro: " + data.mensagem);
        }
    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    }
}

function exibirResultados(dados) {
    document.getElementById('valLambda').innerText = "$ " + dados.lambda.toFixed(4);
    document.getElementById('custoTotal').innerText = dados.custo_total.toFixed(2);
    
    const economia = dados.custo_total * 0.052; // Simulação 5.2%
    document.getElementById('valEconomia').innerText = `$ ${economia.toFixed(2)}`;

    const container = document.getElementById('cardsGeradores');
    container.innerHTML = '';

    for (const [key, val] of Object.entries(dados.geradores)) {
        const limites = GEN_PARAMS[key];
        const percentual = ((val.potencia - limites.min) / (limites.max - limites.min)) * 100;
        
        let corBarra = 'bg-success';
        let badge = '';
        if (val.potencia >= limites.max - 0.1) { corBarra = 'bg-danger'; badge = ' (Max)'; }
        else if (val.potencia <= limites.min + 0.1) { corBarra = 'bg-warning'; badge = ' (Min)'; }

        container.innerHTML += `
            <div class="col-12 mb-3">
                <div class="card card-result border-0 shadow-sm p-3">
                    <div class="d-flex justify-content-between">
                        <h5 class="fw-bold">${key}${badge}</h5>
                        <small>$${val.custo.toFixed(2)}</small>
                    </div>
                    <h3 class="text-primary">${val.potencia.toFixed(1)} MW</h3>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar ${corBarra}" style="width: ${Math.max(5, percentual)}%"></div>
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
            label: `Curva ${genId}`,
            data: dataPoints,
            borderColor: colors[genId],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4
        });
        if (resultados[genId]) {
            datasets.push({
                label: `Op. ${genId}`,
                data: [{ x: resultados[genId].potencia, y: resultados[genId].custo }],
                backgroundColor: colors[genId],
                borderColor: '#000',
                pointRadius: 6,
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
            scales: { x: { type: 'linear', position: 'bottom', title: {display: true, text: 'MW'} } }
        }
    });
}