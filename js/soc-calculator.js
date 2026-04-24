// Таблицы SOC на основе изображения
const socDataStandard = {
    // Wet Low Maintenance (Sb/Ca) or Wet Standard (Sb/Sb)
    100: { density: 1.265, voltage: 12.663 },
    75: { density: 1.225, voltage: 12.463 },
    50: { density: 1.186, voltage: 12.253 },
    25: { density: 1.155, voltage: 12.073 },
    0: { density: 1.112, voltage: 11.903 }
};

const socDataCaCa = {
    // Wet Maintenance Free (Ca/Ca) or AGM/Gel Cell
    100: { density: 1.28, voltage: 12.813 },
    75: { density: 1.24, voltage: 12.613 },
    50: { density: 1.20, voltage: 12.413 },
    25: { density: 1.16, voltage: 12.013 },
    0: { density: 1.12, voltage: 11.813 }
};

function switchMethod() {
    const method = document.querySelector('input[name="method"]:checked').value;
    const voltageInput = document.getElementById('voltage-input');
    const densityInput = document.getElementById('density-input');
    
    if (method === 'voltage') {
        voltageInput.style.display = 'block';
        densityInput.style.display = 'none';
    } else {
        voltageInput.style.display = 'none';
        densityInput.style.display = 'block';
    }
    
    // Очистить результат
    document.getElementById('result').className = 'result';
    document.getElementById('result').innerHTML = '';
}

function applyTemperatureCorrection(density, temperature) {
    // Температурная коррекция: 0.0007 г/см³ на каждый градус от +25°C
    const referenceTemp = 25;
    const tempDifference = temperature - referenceTemp;
    const correction = tempDifference * 0.0007;
    const correctedDensity = density - correction;
    
    return {
        corrected: correctedDensity,
        correction: correction
    };
}

function interpolateSOC(value, data, key) {
    // Сортировка уровней SOC
    const levels = [100, 75, 50, 25, 0];
    
    // Допуск округления (±0.02 для напряжения, ±0.005 для плотности)
    const tolerance = key === 'voltage' ? 0.02 : 0.005;
    
    // Проверка на близость к эталонным значениям
    for (const level of levels) {
        const refValue = data[level][key];
        if (Math.abs(value - refValue) <= tolerance) {
            return { soc: level, exact: true };
        }
    }
    
    // Проверка границ
    if (value >= data[100][key]) {
        return { soc: 100, exact: false };
    }
    if (value <= data[0][key]) {
        return { soc: 0, exact: false };
    }
    
    // Интерполяция между уровнями
    for (let i = 0; i < levels.length - 1; i++) {
        const upperLevel = levels[i];
        const lowerLevel = levels[i + 1];
        const upperValue = data[upperLevel][key];
        const lowerValue = data[lowerLevel][key];
        
        if (value <= upperValue && value >= lowerValue) {
            // Линейная интерполяция
            const ratio = (value - lowerValue) / (upperValue - lowerValue);
            const soc = lowerLevel + ratio * (upperLevel - lowerLevel);
            return { soc: Math.round(soc), exact: false };
        }
    }
    
    return { soc: 0, exact: false };
}

function getSOCColor(soc) {
    if (soc >= 90) return '#4CAF50';
    if (soc >= 75) return '#8BC34A';
    if (soc >= 50) return '#FFC107';
    if (soc >= 25) return '#FF9800';
    return '#F44336';
}

function getSOCStatus(soc) {
    if (soc >= 90) return 'Полный заряд';
    if (soc >= 75) return 'Хороший заряд';
    if (soc >= 50) return 'Средний заряд';
    if (soc >= 25) return 'Низкий заряд';
    return 'Разряжен';
}

function calculateSOC() {
    const method = document.querySelector('input[name="method"]:checked').value;
    const batteryType = document.getElementById('batteryType').value;
    const resultDiv = document.getElementById('result');
    
    // Выбор таблицы данных
    const socData = batteryType === 'caca' ? socDataCaCa : socDataStandard;
    
    let soc, details = '';
    
    if (method === 'voltage') {
        const voltage = parseFloat(document.getElementById('voltage').value);
        
        if (!voltage || voltage < 10 || voltage > 14) {
            resultDiv.className = 'result show info';
            resultDiv.innerHTML = 'Введите корректное значение напряжения (10-14 В)';
            return;
        }
        
        const result = interpolateSOC(voltage, socData, 'voltage');
        soc = result.soc;
        
        details = `
            <div class="result-detail">
                <span class="detail-label">Измеренное напряжение:</span>
                <span class="detail-value">${voltage.toFixed(2)} В</span>
            </div>
        `;
        
    } else {
        const density = parseFloat(document.getElementById('density').value);
        const temperature = parseFloat(document.getElementById('temperature').value);
        
        if (!density || density < 1.0 || density > 1.35) {
            resultDiv.className = 'result show info';
            resultDiv.innerHTML = 'Введите корректное значение плотности (1.0-1.35 г/см³)';
            return;
        }
        
        if (isNaN(temperature) || temperature < -20 || temperature > 50) {
            resultDiv.className = 'result show info';
            resultDiv.innerHTML = 'Введите корректную температуру (-20 до +50 °C)';
            return;
        }
        
        // Применение температурной коррекции
        const tempCorrection = applyTemperatureCorrection(density, temperature);
        const result = interpolateSOC(tempCorrection.corrected, socData, 'density');
        soc = result.soc;
        
        details = `
            <div class="result-detail">
                <span class="detail-label">Измеренная плотность:</span>
                <span class="detail-value">${density.toFixed(3)} г/см³</span>
            </div>
            <div class="result-detail">
                <span class="detail-label">Температура:</span>
                <span class="detail-value">${temperature}°C</span>
            </div>
            ${temperature !== 25 ? `
            <div class="result-detail correction">
                <span class="detail-label">Температурная коррекция:</span>
                <span class="detail-value">${tempCorrection.correction > 0 ? '+' : ''}${tempCorrection.correction.toFixed(4)} г/см³</span>
            </div>
            <div class="result-detail">
                <span class="detail-label">Приведено к +25°C:</span>
                <span class="detail-value">${tempCorrection.corrected.toFixed(3)} г/см³</span>
            </div>
            ` : ''}
        `;
    }
    
    const color = getSOCColor(soc);
    const status = getSOCStatus(soc);
    
    resultDiv.className = 'result show success';
    resultDiv.innerHTML = `
        <div class="soc-result-header">
            <div class="soc-gauge">
                <div class="soc-gauge-fill" style="width: ${soc}%; background: ${color};"></div>
                <div class="soc-gauge-text">${soc}%</div>
            </div>
            <div class="soc-status" style="color: ${color};">${status}</div>
        </div>
        <div class="result-details">
            ${details}
            <div class="result-detail highlight">
                <span class="detail-label">Тип батареи:</span>
                <span class="detail-value">${batteryType === 'caca' ? 'Ca/Ca / AGM/Gel' : 'Sb/Ca / Sb/Sb'}</span>
            </div>
        </div>
    `;
}

// Переключение метода
document.querySelectorAll('input[name="method"]').forEach(radio => {
    radio.addEventListener('change', switchMethod);
});

// Расчёт при нажатии Enter
document.getElementById('voltage').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateSOC();
});

document.getElementById('density').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateSOC();
});

document.getElementById('temperature').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') calculateSOC();
});
