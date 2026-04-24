function calculateWeight() {
    const capacityInput = document.getElementById('capacity');
    const resultDiv = document.getElementById('result');
    const capacity = parseFloat(capacityInput.value);
    
    // Валидация
    if (!capacity || capacity <= 0) {
        resultDiv.className = 'result show info';
        resultDiv.innerHTML = 'Введите корректное значение ёмкости';
        return;
    }
    
    // Расчёт веса
    const weight = (0.28 * capacity).toFixed(2);
    
    // Вывод результата
    resultDiv.className = 'result show success';
    resultDiv.innerHTML = `
        <div>Идеальный вес АКБ: <strong>${weight} кг</strong></div>
        <div style="margin-top: 10px; font-size: 0.9em; font-weight: normal;">
            Для аккумулятора ёмкостью ${capacity} Ач
        </div>
    `;
}

// Расчёт при нажатии Enter
document.getElementById('capacity').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calculateWeight();
    }
});
