// 1. Seleccionar elementos del DOM
const transactionForm = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');

const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const transactionListEl = document.getElementById('transaction-list');
const filterTypeEl = document.getElementById('filter-type');
const chartCanvas = document.getElementById('expenses-chart').getContext('2d');
let expensesChart = null; // Guardará la instancia de la gráfica para poder actualizarla

// 2. Estado inicial: Cargar transacciones desde localStorage o iniciar arreglo vacío
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// 3. Función para guardar en localStorage
function saveToLocalStorage() 
{
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// 4. Escuchar el envío del formulario
transactionForm.addEventListener('submit', function(event) 
{
    // Evita que la página se recargue al enviar el formulario
    event.preventDefault();

    // Crear el objeto de la nueva transacción
    const newTransaction = {
        id: Date.now(), // Genera un ID único basado en los milisegundos actuales
        description: descriptionInput.value.trim(),
        amount: parseFloat(amountInput.value), // Convierte el texto a número decimal
        type: typeInput.value,
        category: categoryInput.value
    };

    // Agregar al arreglo, guardar y limpiar el formulario
    transactions.push(newTransaction);
    saveToLocalStorage();
    transactionForm.reset();
    updateUI();
});

// 5. Función para calcular y mostrar Balance, Ingresos y Gastos
function updateSummary() 
{
    const incomeTotal = transactions
        .filter(item => item.type === 'income')
        .reduce((acc, item) => acc + item.amount, 0);

    const expenseTotal = transactions
        .filter(item => item.type === 'expense')
        .reduce((acc, item) => acc + item.amount, 0);

    const balance = incomeTotal - expenseTotal;

    totalIncomeEl.textContent = `$${incomeTotal.toFixed(2)}`;
    totalExpenseEl.textContent = `$${expenseTotal.toFixed(2)}`;
    totalBalanceEl.textContent = `$${balance.toFixed(2)}`;
}

// 6. Función para dibujar la lista del historial en pantalla
function renderTransactions() 
{
    const filterValue = filterTypeEl.value;
    transactionListEl.innerHTML = ''; // Limpia la lista antes de volver a dibujarla

    // Filtrar según lo que esté seleccionado en el <select>
    const filteredTransactions = transactions.filter(item => {
        if (filterValue === 'all') return true;
        return item.type === filterValue;
    });

    filteredTransactions.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('transaction-item', item.type);

        const sign = item.type === 'income' ? '+' : '-';

        li.innerHTML = `
            <div class="transaction-info">
                <h4>${item.description}</h4>
                <span>${item.category}</span>
            </div>
            <div class="transaction-actions">
                <span class="transaction-amount">${sign}$${item.amount.toFixed(2)}</span>
                <button class="btn-delete" onclick="deleteTransaction(${item.id})">Eliminar</button>
            </div>
        `;

        transactionListEl.appendChild(li);
    });
}

// 7. Función para eliminar una transacción por su ID
function deleteTransaction(id) {
    transactions = transactions.filter(item => item.id !== id);
    saveToLocalStorage();
    updateUI();
}

// 8. Función para agrupar gastos por categoría y dibujar la gráfica
function renderChart() {
    // Filtrar solo los gastos
    const expenses = transactions.filter(item => item.type === 'expense');

    // Agrupar y sumar montos por categoría
    const categoryTotals = {};
    expenses.forEach(item => {
        if (categoryTotals[item.category]) {
            categoryTotals[item.category] += item.amount;
        } else {
            categoryTotals[item.category] = item.amount;
        }
    });

    const labels = Object.keys(categoryTotals); // Ej: ['Comida', 'Transporte']
    const data = Object.values(categoryTotals);  // Ej: [45.50, 20.00]

    // Si ya había una gráfica dibujada, la destruimos para volver a crearla actualizada
    if (expensesChart) {
        expensesChart.destroy();
    }

    // Dibujar gráfica tipo Dona (Doughnut)
    expensesChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#2563eb', // Azul
                    '#10b981', // Verde
                    '#f59e0b', // Amarillo/Naranja
                    '#ef4444', // Rojo
                    '#8b5cf6', // Morado
                    '#64748b'  // Gris
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 9. Función maestra que actualiza toda la interfaz
function updateUI() {
    updateSummary();
    renderTransactions();
    renderChart();
}

// Escuchar cambios en el filtro (Todos / Ingresos / Gastos)
filterTypeEl.addEventListener('change', renderTransactions);

// Ejecutar al cargar la página por primera vez para mostrar lo guardado en localStorage
updateUI();