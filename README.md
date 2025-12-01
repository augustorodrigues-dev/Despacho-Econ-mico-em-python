# ⚡ Smart Dispatch: Otimização Econômica para Microgrids

> **Projeto Full Stack de Despacho Econômico via Cálculo Diferencial (Lagrange)**
> *Disciplina: Resolução Diferencial de Problemas*

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)
![SymPy](https://img.shields.io/badge/Math-SymPy-orange.svg)
![Status](https://img.shields.io/badge/Status-Concluído-success.svg)

## 📖 Sobre o Projeto

O **Smart Dispatch** é um sistema de suporte à decisão projetado para operadores de microrredes (Microgrids). Ele resolve o problema clássico de **Despacho Econômico** (*Economic Dispatch*), determinando a potência ideal que cada gerador deve produzir para atender à demanda elétrica com o **menor custo possível**.

Diferente de abordagens tradicionais que usam métodos aproximados (metaheurísticas), este projeto utiliza **Cálculo Diferencial Exato** (Método dos Multiplicadores de Lagrange) para garantir matematicamente o encontro do Mínimo Global da função custo.

### 🎯 O Problema (Persona)
**Roberto**, gerente de operações de um parque industrial, precisa decidir hora a hora quanto acionar de cada gerador térmico. Decisões baseadas em "feeling" geram desperdício de combustível e aumento do OPEX. O Smart Dispatch automatiza essa decisão.

---

## 👥 Autores

Este projeto foi desenvolvido para a disciplina de Resolução Diferencial de Problemas.

Augusto Rodrigues
Cauê Barroso
César Ribeiro

---

## Deploy

[CLIQUE AQUI PARA ACESSAR O SISTEMA](https://despacho-econ-mico-em-python.onrender.com/)

## 📐 Modelagem Matemática

O núcleo do sistema é baseado na minimização de funções quadráticas convexas.

### 1. Função Objetivo (Custo)
Cada gerador possui uma curva de custo modelada por:
$$C_i(P_i) = a_i P_i^2 + b_i P_i + c_i$$

O objetivo é minimizar o Custo Total ($C_T$):
$$\text{Min } C_T = \sum_{i=1}^{n} C_i(P_i)$$

### 2. Restrições
* **Balanço de Potência:** A geração deve igualar a demanda ($D$).
    $$\sum P_i = D$$
* **Limites Físicos:**
    $$P_{min} \le P_i \le P_{max}$$

### 3. Solução (Lagrange)
Utilizamos o **SymPy** para resolver o sistema de equações derivado do Lagrangiano:
$$\mathcal{L} = C_T - \lambda (\sum P_i - D)$$
$$\frac{\partial \mathcal{L}}{\partial P_i} = 0 \implies \lambda = 2a_i P_i + b_i$$

Onde $\lambda$ (Lambda) representa o **Custo Incremental** do sistema.

---

## 🛠️ Tecnologias Utilizadas

### Backend (API & Cálculo)
* **Python 3:** Linguagem principal.
* **Flask:** Servidor Web e API REST.
* **SymPy:** Computação Simbólica (Cálculo de Derivadas e Resolução de Sistemas Lineares).
* **SQLite:** Banco de dados para persistência do histórico de simulações.

### Frontend (Interface)
* **HTML5 / CSS3:** Estrutura e Estilização.
* **Bootstrap 5:** Design responsivo e componentes de UI.
* **Chart.js:** Visualização interativa das parábolas de custo e pontos ótimos.
* **JavaScript (ES6):** Consumo da API e lógica de interface.

---

## 🚀 Como Rodar o Projeto

Siga os passos abaixo para executar o sistema na sua máquina local.

### Pré-requisitos
* Python 3.x instalado.

### 1. Clonar o Repositório
```bash
git clone [https://github.com/augustorodrigues-dev/Despacho-Econ-mico-em-python](https://github.com/augustorodrigues-dev/Despacho-Econ-mico-em-python)
cd despacho-economico-em-python
```
2. Criar Ambiente Virtual (Recomendado)
```bash
python -m venv venv
venv\Scripts\activate

python3 -m venv venv
source venv/bin/activate
```
3. Instalar Dependências
```Bash
pip install -r backend/requirements.txt
```
4. Executar o Backend
O banco de dados historico.db será criado automaticamente na primeira execução.
```Bash
python backend/app.py
```
O servidor iniciará em http://127.0.0.1:50005. 

## Acessar o Sistema
Abra o arquivo templates/index.html no seu navegador. (Dica: Se usar VS Code, utilize a extensão "Live Server" para evitar problemas de CORS, embora a API já esteja configurada para aceitá-los).

## 📊 Validação e Resultados
O sistema foi validado utilizando um cenário de caso real de 24 horas extraído do artigo científico de referência: Dey, B., et al. (2021), publicado no Journal of Cleaner Production.

A validação compara o custo total de operação obtido pelo nosso método exato (Lagrange) com o resultado do método aproximado (Metaheurística GWO) utilizado pelos autores no artigo.

``` bash
| Método | Abordagem | Custo Total (USD) | Desempenho |
| :--- | :--- | :--- | :--- |
| **Referência** | Metaheurística (GWO) | $ 176.165,00$ | Baseline |
| **Smart Dispatch** | Analítico (Cálculo) | **$ 170.460,88** | **-3,23%** (Economia) |
```

### ✅ Conclusão

O método analítico exato provou ser **3,23% mais econômico** que a abordagem heurística do estado da arte (GWO). Este resultado comprova o sucesso do projeto, pois o **Cálculo Diferencial** garantiu o encontro do **Mínimo Global Matemático**, sem sofrer as imprecisões de ótimos locais que afetam os algoritmos baseados em busca aleatória.

## 📂 Estrutura de Arquivos/
```bash

├── backend/
│   ├── app.py
│   ├── optimization.py
│   ├── database.py
│   ├── requirements.txt
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── style.css
│       └── script.js
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── data/
│   └── historico.db
│
├── validacao_artigo.ipynb
└── README.md
```   

## 📄 Licença
Este projeto é distribuido pelo Cesupa (Centro Universário do Estado do Pará).