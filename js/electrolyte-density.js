function calculateDensity() {
    const voltageInput = document.getElementById('voltage');
    const resultDiv = document.getElementById('result');
    const voltage = parseFloat(voltageInput.value);
    
    // Валидация
    if (!voltage || voltage < 10 || voltage > 14) {
        resultDiv.className = 'result show info';
        resultDiv.innerHTML = 'Введите корректное значение напряжения (10-14 В)';
        return;
    }
    
    // Расчёт
    const cellVoltage = (voltage / 6).toFixed(2);
    const density = (cellVoltage - 0.84).toFixed(2);
    
    // Определение степени заряда
    let chargeLevel = '';
    let chargePercent = '';
    
    if (voltage >= 12.72) {
        chargeLevel = 'Полностью заряжен';
        chargePercent = '~100%';
    } else if (voltage >= 12.54) {
        chargeLevel = 'Хороший заряд';
        chargePercent = '~75%';
    } else if (voltage >= 12.36) {
        chargeLevel = 'Средний заряд';
        chargePercent = '~50%';
    } else if (voltage >= 12.18) {
        chargeLevel = 'Низкий заряд';
        chargePercent = '~25%';
    } else {
        chargeLevel = 'Разряжен';
        chargePercent = '~0%';
    }
    
    // Вывод результата
    resultDiv.className = 'result show success';
    resultDiv.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>Напряжение одного элемента:</strong> ${cellVoltage} В
        </div>
        <div style="margin-bottom: 10px;">
            <strong>Плотность электролита:</strong> ${density} г/см³
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #c3e6cb;">
            <div><strong>Степень заряда:</strong> ${chargeLevel}</div>
            <div style="font-size: 0.95em; margin-top: 5px;">${chargePercent}</div>
        </div>
    `;
}

// Расчёт при нажатии Enter
document.getElementById('voltage').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calculateDensity();
    }
});
