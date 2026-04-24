function calculateSettings() {
  const voltage = parseFloat(document.getElementById("voltage").value);
  const capacity = parseFloat(document.getElementById("capacity").value);
  const resultsDiv = document.getElementById("results");

  // Валидация
  if (!capacity || capacity <= 0) {
    resultsDiv.className = "result show info";
    resultsDiv.innerHTML = "Введите корректное значение ёмкости";
    return;
  }

  // Коэффициенты в зависимости от напряжения
  const voltageMultiplier = voltage / 12;

  // Округление тока вниз до 0.1А (в меньшую сторону, чтобы не превысить рекомендуемый режим)
  const floorCurrent = (value) => (Math.floor(value * 10) / 10).toFixed(1);
  const floorCurrent2 = (value) => (Math.floor(value * 100) / 100).toFixed(2);

  // Расчёты
  const stage0 = {
    voltage: (12.0 * voltageMultiplier).toFixed(1),
    current: floorCurrent(capacity / 20),
  };

  const stage1 = {
    maxVoltage: (14.7 * voltageMultiplier).toFixed(1),
    maxCurrent: floorCurrent(capacity / 10),
    maxTime: 48,
    chargeUntil: floorCurrent(capacity / 100),
    chargeUntilAlt: floorCurrent(capacity / 50),
    chargeUntilOff: "0.2",
  };

  const stage2 = {
    dischargeCurrent: floorCurrent(capacity / 50),
    chargeTime: 5,
    dischargeTime: 2.5,
  };

  const stage3 = {
    maxVoltage: (16.3 * voltageMultiplier).toFixed(1),
    minVoltage: (16.3 * voltageMultiplier).toFixed(1),
    current: floorCurrent(capacity / 30),
    duration: "2-5",
    stopCurrent: floorCurrent2(capacity / 200),
  };

  const stage4 = {
    voltage: (13.5 * voltageMultiplier).toFixed(1),
    current: floorCurrent(capacity / 100),
  };

  // Формирование HTML с результатами
  resultsDiv.className = "results-container show";
  resultsDiv.innerHTML = `
        <div class="stage-card disabled">
            <div class="stage-header stage-0">
                <label class="stage-toggle">
                    <input type="checkbox" class="stage-toggle-input">
                    <span class="stage-toggle-slider"></span>
                </label>
                <h3>Предзаряд</h3>
                <span class="stage-badge">Защита от глубокого разряда</span>
            </div>
            <div class="stage-body collapsed">
                <div class="param-row">
                    <span class="param-name">Напряжение:</span>
                    <span class="param-value">${stage0.voltage} В</span>
                    <span class="param-note">До какого напряжения заряжать</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Ток:</span>
                    <span class="param-value">${stage0.current} А</span>
                    <span class="param-note">1/20С (${capacity} ÷ 20 = ${stage0.current}А) — мягкий пробуждающий ток</span>
                </div>
                <div class="info-note">
                    <strong>Зачем:</strong> если АКБ разряжен ниже 10.5–11В, полный ток опасен. Предзаряд "будит" батарею малым током до 12В, затем автоматический переход к основному этапу.
                </div>
            </div>
        </div>

        <div class="stage-card disabled">
            <div class="stage-header stage-1">
                <label class="stage-toggle">
                    <input type="checkbox" class="stage-toggle-input">
                    <span class="stage-toggle-slider"></span>
                </label>
                <h3>Основной заряд</h3>
                <span class="stage-badge">Основная ёмкость</span>
            </div>
            <div class="stage-body collapsed">
                <div class="param-row">
                    <span class="param-name">Макс. напряжение:</span>
                    <span class="param-value">${stage1.maxVoltage} В</span>
                    <span class="param-note">Стандарт для Ca/Ca (диапазон 14.4–14.8В)</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Макс. ток:</span>
                    <span class="param-value">${stage1.maxCurrent} А</span>
                    <span class="param-note">1/10С (${capacity} ÷ 10 = ${stage1.maxCurrent}А) — золотой стандарт зарядки</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Макс. время:</span>
                    <span class="param-value">${stage1.maxTime} ч</span>
                    <span class="param-note">Защитный таймер от неисправных АКБ</span>
                </div>
                <div class="sub-stage disabled" data-sub-stage="asymmetric">
                    <div class="sub-stage-header">
                        <label class="stage-toggle">
                            <input type="checkbox" class="stage-toggle-input">
                            <span class="stage-toggle-slider"></span>
                        </label>
                        <span class="sub-stage-title">Асимметричный заряд</span>
                        <span class="sub-stage-note">Помогает при сульфатации. Для нового АКБ не обязателен</span>
                    </div>
                    <div class="sub-stage-body collapsed">
                        <div class="param-row">
                            <span class="param-name">Ток разряда:</span>
                            <span class="param-value">${stage2.dischargeCurrent} А</span>
                            <span class="param-note">1/50С (${capacity} ÷ 50 = ${stage2.dischargeCurrent}А) — десульфатация</span>
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
                <div class="param-row highlight">
                    <span class="param-name">Заряжать до:</span>
                    <span class="param-value" data-charge-until-value>${stage1.chargeUntilOff} А</span>
                    <span class="param-note" data-charge-until-note>Фиксированное значение 0.2А — для глубокого заряда без десульфатации</span>
                </div>
                <div class="info-note">
                    <strong>Принцип:</strong> в начале АКБ потребляет максимальный ток (${stage1.maxCurrent}А). По мере заполнения ток естественно падает. При падении до <span data-charge-until-inline>${stage1.chargeUntilOff}</span>А зарядник переходит к следующему этапу — АКБ заряжен на ~85–90%.
                </div>
            </div>
        </div>

        <div class="stage-card disabled">
            <div class="stage-header stage-3">
                <label class="stage-toggle">
                    <input type="checkbox" class="stage-toggle-input">
                    <span class="stage-toggle-slider"></span>
                </label>
                <h3>Дозаряд повышенным напряжением</h3>
                <span class="stage-badge">Критичен для Ca/Ca</span>
            </div>
            <div class="stage-body collapsed">
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
                    <span class="param-note">1/30С (${capacity} ÷ 30 = ${stage3.current}А) — низкий ток при высоком напряжении</span>
                </div>
                <div class="param-row highlight">
                    <span class="param-name">Продолжительность:</span>
                    <span class="param-value">${stage3.duration} ч</span>
                    <span class="param-note">Старый/разряженный: 4–5ч, нормальный: 2–3ч</span>
                </div>
                <div class="info-note">
                    <strong>Когда завершать — три сценария:</strong><br><br>
                    <strong>1. Штатное завершение (напряжение достигло ${stage3.maxVoltage}В):</strong> следите за током. Когда он упадёт до ${stage3.stopCurrent}А (1/200С: ${capacity} ÷ 200 = ${stage3.stopCurrent}А) и стабилизируется на 30–60 мин — АКБ взял всё, можно отключать.<br><br>
                    <strong>2. Напряжение «застопорилось» ниже ${stage3.maxVoltage}В, ток падает:</strong> если АКБ упёрся, например, в 15.8–16.0В и дальше не растёт, а ток при этом <em>снижается и стабилизируется</em> 30–60 мин на одном значении — это тоже признак «взял всё». Отключать.<br><br>
                    <strong>3. Ток «залип» на максимуме (${stage3.current}А), напряжение плавает в пределах 15.7–16.0В:</strong> АКБ ещё принимает заряд, зарядник работает в режиме ограничения по току. Небольшое <em>снижение</em> напряжения (например 15.9 → 15.7В) при неизменном токе — это прогрев электролита, не разряд. Что делать:<br>
                    • <strong>первые 1–3ч:</strong> продолжать, ждать когда ток начнёт падать (3.3А → 3.0А → 2.5А → ...);<br>
                    • <strong>после 3–4ч</strong> без снижения тока — отключать, АКБ принял максимум, что мог;<br>
                    • <strong>более 4–5ч</strong> держать нельзя — длительное кипение выкипячивает воду и вредит пластинам.<br><br>
                    <strong>Общий критерий:</strong> стабилизация тока в течение 30–60 мин (после 2–3 часов дозаряда) при любом напряжении ≥ 15.5В = АКБ принял заряд.<br><br>
                    <strong>Сигналы неисправности (отключать немедленно):</strong> корпус горячий (руку не удержать), кипение только в одной банке (возможен короткий), резкий запах сероводорода.
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

        <div class="stage-card disabled">
            <div class="stage-header stage-4">
                <label class="stage-toggle">
                    <input type="checkbox" class="stage-toggle-input">
                    <span class="stage-toggle-slider"></span>
                </label>
                <h3>Хранение (буферный режим)</h3>
                <span class="stage-badge">Опционально</span>
            </div>
            <div class="stage-body collapsed">
                <div class="param-row">
                    <span class="param-name">Напряжение:</span>
                    <span class="param-value">${stage4.voltage} В</span>
                    <span class="param-note">Стандарт буферного режима (13.2–13.8В)</span>
                </div>
                <div class="param-row">
                    <span class="param-name">Ток хранения:</span>
                    <span class="param-value">${stage4.current} А</span>
                    <span class="param-note">1/100С (${capacity} ÷ 100 = ${stage4.current}А) — минимальный поддерживающий</span>
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
                        <td>${floorCurrent(capacity / 10)}А</td>
                        <td>Основной заряд</td>
                    </tr>
                    <tr>
                        <td>1/20С</td>
                        <td>${capacity} ÷ 20</td>
                        <td>${floorCurrent(capacity / 20)}А</td>
                        <td>Предзаряд</td>
                    </tr>
                    <tr>
                        <td>1/30С</td>
                        <td>${capacity} ÷ 30</td>
                        <td>${floorCurrent(capacity / 30)}А</td>
                        <td>Дозаряд повышенным напряжением</td>
                    </tr>
                    <tr>
                        <td>1/50С</td>
                        <td>${capacity} ÷ 50</td>
                        <td>${floorCurrent(capacity / 50)}А</td>
                        <td>Асимметричный разряд</td>
                    </tr>
                    <tr>
                        <td>1/100С</td>
                        <td>${capacity} ÷ 100</td>
                        <td>${floorCurrent(capacity / 100)}А</td>
                        <td>Хранение, порог окончания заряда</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

  // Привязываем тоглы к разворачиванию/сворачиванию этапов и подэтапов
  resultsDiv.querySelectorAll(".stage-toggle-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const container = e.target.closest(".sub-stage, .stage-card");
      const body = container.querySelector(".sub-stage-body, .stage-body");
      if (e.target.checked) {
        container.classList.remove("disabled");
        body.classList.remove("collapsed");
      } else {
        container.classList.add("disabled");
        body.classList.add("collapsed");
      }

      // Специальная логика: асимметричный заряд меняет "Заряжать до"
      if (container.dataset.subStage === "asymmetric") {
        const valueEl = resultsDiv.querySelector("[data-charge-until-value]");
        const noteEl = resultsDiv.querySelector("[data-charge-until-note]");
        const inlineEl = resultsDiv.querySelector("[data-charge-until-inline]");
        if (e.target.checked) {
          valueEl.textContent = `${stage1.chargeUntil} А`;
          noteEl.textContent = `1/100С (${capacity} ÷ 100 = ${stage1.chargeUntil}А) — рекомендуется для глубокого заряда`;
          inlineEl.textContent = stage1.chargeUntil;
        } else {
          valueEl.textContent = `${stage1.chargeUntilOff} А`;
          noteEl.textContent = "Фиксированное значение 0.2А — для глубокого заряда без десульфатации";
          inlineEl.textContent = stage1.chargeUntilOff;
        }
      }
    });
  });
}

// Автоматический расчёт при загрузке страницы
window.addEventListener("DOMContentLoaded", function () {
  calculateSettings();
});

// Расчёт при изменении значений
document.getElementById("voltage").addEventListener("input", function () {
  clearTimeout(window.calcTimeout);
  window.calcTimeout = setTimeout(calculateSettings, 500);
});

document.getElementById("capacity").addEventListener("input", function () {
  clearTimeout(window.calcTimeout);
  window.calcTimeout = setTimeout(calculateSettings, 500);
});
