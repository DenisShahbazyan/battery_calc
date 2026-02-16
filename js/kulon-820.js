function calculateSettings() {
    const voltage = parseFloat(document.getElementById('voltage').value);
    const capacity = parseFloat(document.getElementById('capacity').value);
    const resultsDiv = document.getElementById('results');
    
    // Валидация
    if (!capacity || capacity <= 0) {
        resultsDiv.className = 'result show info';
        resultsDiv.innerHTML = 'Введите корректное значение ёмкости';
        return;
    }
    
    // Коэффициенты в зависимости от напряжения
    const voltageMultiplier = voltage / 12;
    
    // Расчёты
    const stage0 = {
        voltage: (12.0 * voltageMultiplier).toFixed(1),
        current: (capacity / 20).toFixed(1)
    };
    
    const stage1 = {
        maxVoltage: (14.7 * voltageMultiplier).toFixed(1),
        maxCurrent: (capacity / 10).toFixed(1),
        maxTime: 48,
        asymmetric: 'ВКЛ',
        chargeUntil: (capacity / 100).toFixed(1),
        chargeUntilAlt: (capacity / 50).toFixed(1)
    };
    
    const stage2 = {
        dischargeCurrent: (capacity / 50).toFixed(1),
        chargeTime: 5,
        dischargeTime: 2.5
    };
    
    const stage3 = {
        maxVoltage: (16.3 * voltageMultiplier).toFixed(1),
        minVoltage: (16.3 * voltageMultiplier).toFixed(1),
        current: (capacity / 30).toFixed(1),
        duration: '2-5',
        stopCurrent: (capacity / 200).toFixed(2)
    };
    
    const stage4 = {
        voltage: (13.5 * voltageMultiplier).toFixed(1),
        current: (capacity / 100).toFixed(1)
    };
    
    // Формирование HTML с результатами
    resultsDiv.className = 'results-container show';
    resultsDiv.innerHTML = `
        <div class="stage-card">
            <div class="stage-header stage-0">
                <h3>Этап 0: Предзаряд</h3>
                <span class="stage-badge">Защита от глубокого разряда</span>
            </div>
            <div class="stage-body">
                <div class="param-row">
                    <span class="param-name">Напряжение:</span>
                    <span class="param-value">${stage0.voltage} В</span>
                    <span class="param-note">До какого напряжения заряжать</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Ток:</span>
                    <span class="param-value">${stage0.current} А</span>
                    <span class="param-note">1/20С — мягкий пробуждающий ток</span>
                </div>
                <div class="info-note">
                    <strong>Зачем:</strong> если АКБ разряжен ниже 10.5–11В, полный ток опасен. Предзаряд "будит" батарею малым током до 12В, затем автоматический переход к основному этапу.
                </div>
            </div>
        </div>

        <div class="stage-card">
            <div class="stage-header stage-1">
                <h3>Этап 1: Основной заряд</h3>
                <span class="stage-badge">Основная ёмкость</span>
            </div>
            <div class="stage-body">
                <div class="param-row">
                    <span class="param-name">Макс. напряжение:</span>
                    <span class="param-value">${stage1.maxVoltage} В</span>
                    <span class="param-note">Стандарт для Ca/Ca (диапазон 14.4–14.8В)</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Макс. ток:</span>
                    <span class="param-value">${stage1.maxCurrent} А</span>
                    <span class="param-note">1/10С — золотой стандарт зарядки</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Макс. время:</span>
                    <span class="param-value">${stage1.maxTime} ч</span>
                    <span class="param-note">Защитный таймер от неисправных АКБ</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Асимметричный заряд:</span>
                    <span class="param-value">${stage1.asymmetric}</span>
                    <span class="param-note">Помогает при сульфатации</span>
                </div>
                <div class="param-row highlight">
                    <span class="param-name">Заряжать до:</span>
                    <span class="param-value">${stage1.chargeUntil} А</span>
                    <span class="param-note">1/100С — рекомендуется для глубокого заряда</span>
                </div>
                <div class="param-row-alt">
                    <span class="param-note">Альтернатива: ${stage1.chargeUntilAlt} А (1/50С) — быстрее, но заряд на ~75–85%</span>
                </div>
                <div class="info-note">
                    <strong>Принцип:</strong> в начале АКБ потребляет максимальный ток (${stage1.maxCurrent}А). По мере заполнения ток естественно падает. При падении до ${stage1.chargeUntil}А зарядник переходит к следующему этапу — АКБ заряжен на ~85–90%.
                </div>
            </div>
        </div>

        <div class="stage-card">
            <div class="stage-header stage-2">
                <h3>Этап 2: Асимметричный заряд</h3>
                <span class="stage-badge">В рамках основного этапа</span>
            </div>
            <div class="stage-body">
                <div class="param-row">
                    <span class="param-name">Ток разряда:</span>
                    <span class="param-value">${stage2.dischargeCurrent} А</span>
                    <span class="param-note">1/50С — десульфатация</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Длительность заряда:</span>
                    <span class="param-value">${stage2.chargeTime} с</span>
                    <span class="param-note">Стандартное значение</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Длительность разряда:</span>
                    <span class="param-value">${stage2.dischargeTime} с</span>
                    <span class="param-note">50% от времени заряда (2:1)</span>
                </div>
                <div class="info-note">
                    Чередование заряда и разряда помогает разрушить сульфат свинца на пластинах. Разряд короче заряда, чтобы АКБ набирал ёмкость.
                </div>
            </div>
        </div>

        <div class="stage-card">
            <div class="stage-header stage-3">
                <h3>Этап 3: Дозаряд повышенным напряжением</h3>
                <span class="stage-badge">Критичен для Ca/Ca</span>
            </div>
            <div class="stage-body">
                <div class="param-row">
                    <span class="param-name">Макс. напряжение:</span>
                    <span class="param-value">${stage3.maxVoltage} В</span>
                    <span class="param-note">Спец. для Ca/Ca (диапазон 16.0–16.5В)</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Мин. напряжение:</span>
                    <span class="param-value">${stage3.minVoltage} В</span>
                    <span class="param-note">Равно макс. для стабильности</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Ток дозаряда:</span>
                    <span class="param-value">${stage3.current} А</span>
                    <span class="param-note">1/30С — низкий ток при высоком напряжении</span>
                </div>
                <div class="param-row highlight">
                    <span class="param-name">Продолжительность:</span>
                    <span class="param-value">${stage3.duration} ч</span>
                    <span class="param-note">Старый/разряженный: 4–5ч, нормальный: 2–3ч</span>
                </div>
                <div class="info-note">
                    <strong>Когда завершать:</strong> следите за током. Когда он упадёт до ${stage3.stopCurrent}–0.5А и стабилизируется на 30–60 мин — АКБ взял всё, можно отключать.
                </div>
                <div class="warning-note">
                    ⚠️ <strong>Важно:</strong> следите за температурой корпуса АКБ. Если горячий на ощупь — прервать зарядку. Кипение электролита при 16В+ — нормально.
                </div>
                <div class="info-note">
                    <strong>Проверка после дозаряда:</strong><br>
                    1. Отключить зарядник, оставить АКБ в покое на <strong>12 часов</strong><br>
                    2. Измерить напряжение:<br>
                    • 12.7–12.9В — полностью заряжен ✅<br>
                    • 12.3–12.6В — возможно расслоение электролита, повторить дозаряд<br>
                    • Ниже 12.3В — АКБ не принял заряд, проблема
                </div>
            </div>
        </div>

        <div class="stage-card">
            <div class="stage-header stage-4">
                <h3>Этап 4: Хранение (буферный режим)</h3>
                <span class="stage-badge">Опционально</span>
            </div>
            <div class="stage-body">
                <div class="param-row">
                    <span class="param-name">Напряжение:</span>
                    <span class="param-value">${stage4.voltage} В</span>
                    <span class="param-note">Стандарт буферного режима (13.2–13.8В)</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Ток хранения:</span>
                    <span class="param-value">${stage4.current} А</span>
                    <span class="param-note">1/100С — минимальный поддерживающий</span>
                </div>
                <div class="info-note">
                    Этот этап нужен только при длительном хранении АКБ вне автомобиля. Если ставите батарею в машину сразу — можно пропустить.
                </div>
            </div>
        </div>

        <div class="reference-card">
            <h3>Справка: типичные токи для ${capacity}Ач</h3>
            <table>
                <thead>
                    <tr>
                        <th>Обозначение</th>
                        <th>Расчёт</th>
                        <th>Ток</th>
                        <th>Где применяется</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1/10С</td>
                        <td>${capacity} ÷ 10</td>
                        <td>${(capacity/10).toFixed(1)}А</td>
                        <td>Основной заряд</td>
                    </tr>
                    <tr>
                        <td>1/20С</td>
                        <td>${capacity} ÷ 20</td>
                        <td>${(capacity/20).toFixed(1)}А</td>
                        <td>Предзаряд</td>
                    </tr>
                    <tr>
                        <td>1/30С</td>
                        <td>${capacity} ÷ 30</td>
                        <td>${(capacity/30).toFixed(1)}А</td>
                        <td>Дозаряд повышенным напряжением</td>
                    </tr>
                    <tr>
                        <td>1/50С</td>
                        <td>${capacity} ÷ 50</td>
                        <td>${(capacity/50).toFixed(1)}А</td>
                        <td>Асимметричный разряд</td>
                    </tr>
                    <tr>
                        <td>1/100С</td>
                        <td>${capacity} ÷ 100</td>
                        <td>${(capacity/100).toFixed(1)}А</td>
                        <td>Хранение, порог окончания заряда</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// Автоматический расчёт при загрузке страницы
window.addEventListener('DOMContentLoaded', function() {
    calculateSettings();
});

// Расчёт при изменении значений
document.getElementById('voltage').addEventListener('input', function() {
    clearTimeout(window.calcTimeout);
    window.calcTimeout = setTimeout(calculateSettings, 500);
});

document.getElementById('capacity').addEventListener('input', function() {
    clearTimeout(window.calcTimeout);
    window.calcTimeout = setTimeout(calculateSettings, 500);
});
