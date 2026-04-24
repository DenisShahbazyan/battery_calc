// SAE J537: минимум под нагрузкой ½ CCA в зависимости от температуры АКБ
const MIN_VOLTAGE_BY_TEMP = [[21, 9.6], [16, 9.5], [10, 9.4], [4, 9.3], [-1, 9.1], [-7, 8.9], [-12, 8.7], [-18, 8.5]];
const FULL_OCV = 12.6;

function minLoadVoltage(temp) {
    const row = MIN_VOLTAGE_BY_TEMP.find(([t]) => temp >= t);
    return row ? row[1] : 8.5;
}

function fmt(v, digits = 1) {
    return v.toFixed(digits).replace('.', ',');
}

function showMessage(text, cls = 'info') {
    const resultDiv = document.getElementById('result');
    resultDiv.className = `result show ${cls}`;
    resultDiv.innerHTML = text;
}

// Нормы теста для введённой батареи; null — если тест проводить нельзя (сообщение уже показано)
function getNorms() {
    const type = document.getElementById('batteryType').value;
    const capacity = parseFloat(document.getElementById('capacity').value);
    const ccaRaw = parseFloat(document.getElementById('cca').value);
    const ccaStandard = document.getElementById('ccaStandard');
    const ccaFactor = parseFloat(ccaStandard.value);
    const cca = ccaRaw * ccaFactor; // приводим к EN
    const ocvInput = parseFloat(document.getElementById('ocv').value);
    const temp = parseFloat(document.getElementById('temperature').value);
    const fork = parseFloat(document.getElementById('forkCurrent').value);

    if (type === 'deep') {
        showMessage('Гелевые, тяговые и АКБ для ИБП не рассчитаны на стартерные токи — нагрузочная вилка не покажет их реальное состояние и может навредить. Проверяйте контрольным разрядом током 0,05 × C20 до 10,5 В с замером времени.');
        return null;
    }
    const missing = [
        !(capacity > 0) && 'ёмкость',
        !(ocvInput > 0) && 'начальный заряд',
        isNaN(temp) && 'температуру АКБ',
    ].filter(Boolean);
    if (missing.length) {
        showMessage(`Введите ${missing.join(', ')}`);
        return null;
    }

    const ocv = ocvInput;
    const soc = Math.round(Math.min(100, Math.max(0, (ocv - 11.8) / 0.8 * 100)));
    if (ocv < 12.4) {
        showMessage(`Начальное напряжение ${fmt(ocv, 2)} В — заряд около ${soc} %. Тест проводят при заряде не ниже 75 % (12,4 В). Сначала зарядите АКБ, иначе даже исправная батарея провалит тест.`);
        return null;
    }

    const useCca = cca > 0 && type !== 'moto';
    const recCurrent = Math.round(useCca ? cca / 2 : capacity * 3);
    const current = fork > 0 ? fork : recCurrent;
    const ratio = current / recCurrent;

    // shortcut: линейная модель (U = НРЦ − I·R): недозаряд сдвигает пороги вниз, иной ток вилки — пропорционально; это оценка, а не норматив
    const socShift = Math.max(0, FULL_OCV - ocv);
    const scale = v => ocv - (ocv - (v - socShift)) * ratio;

    return {
        type, temp, ocv, soc, fork, useCca, recCurrent, ratio,
        overload: ratio > 1.5,
        ccaNote: useCca && ccaFactor !== 1 ? `, ${ccaStandard.selectedOptions[0].text.split(' — ')[0]} ${ccaRaw} А ≈ EN ${Math.round(cca)} А` : '',
        adjusted: socShift > 0 || Math.abs(ratio - 1) > 0.1,
        holdTime: type === 'moto' || ratio > 1.5 ? '3–5' : (useCca ? '10–15' : '5–10'),
        minV: scale(minLoadVoltage(temp)),
        goodV: scale(10.2),
        recoveryV: Math.min(12.4, ocv - 0.2),
    };
}

function forkNote(n) {
    if (!n.fork) return '';
    if (n.ratio > 1.5) {
        return `<div style="margin-top: 10px;">⚠️ Вилка ${n.fork} А — перегруз в ${fmt(n.ratio)} раза по сравнению с рекомендуемыми ${n.recCurrent} А. Держите не дольше 3–5 с${n.type === 'moto' ? ', а лучше возьмите вилку слабее' : ''}.</div>`;
    }
    if (n.ratio < 0.9) {
        return `<div style="margin-top: 10px;">Вилка ${n.fork} А слабее рекомендуемых ${n.recCurrent} А — батарея недогружена, поэтому порог просадки поднят.</div>`;
    }
    return `<div style="margin-top: 10px;">Вилка ${n.fork} А подходит для этой батареи.</div>`;
}

function renderSelection(n) {
    const currentText = n.fork
        ? `рекомендуется ${n.recCurrent} А (${n.useCca ? '½ CCA' : '3 × C20'}${n.ccaNote}), у вас ${n.fork} А`
        : `${n.recCurrent} А (${n.useCca ? '½ CCA' : '3 × C20'}${n.ccaNote})`;
    const dropText = n.overload
        ? `при таком перегрузе нормы нет — нужна вилка ≈ ${n.recCurrent} А`
        : `не ниже ${fmt(n.minV)} В при ${n.temp} °C; отлично — ${fmt(n.goodV)} В и выше${n.adjusted ? ' (пересчитано под заряд и ток — оценка)' : ''}`;
    showMessage(`
        <div style="margin-bottom: 10px;"><strong>Ток на вилке:</strong> ${currentText}</div>
        <div style="margin-bottom: 10px;"><strong>Держать нагрузку:</strong> ${n.holdTime} с, повтор — не раньше чем через 1–2 мин</div>
        <div style="margin-bottom: 10px;"><strong>Начальный заряд:</strong> ${fmt(n.ocv, 2)} В ≈ ${n.soc} %</div>
        <div style="margin-bottom: 10px;"><strong>Нормальная просадка:</strong> ${dropText}</div>
        <div><strong>Восстановление:</strong> через ~5 с после снятия нагрузки — ${fmt(n.recoveryV, 2)} В и выше</div>
        ${forkNote(n)}
        ${n.temp < -18 ? '<div style="margin-top: 10px;">⚠️ Ниже −18 °C тест недостоверен — отогрейте АКБ.</div>' : ''}
    `, 'success');
}

function renderVerdict(n) {
    const loadV = parseFloat(document.getElementById('loadV').value);
    const recoveryV = parseFloat(document.getElementById('recoveryV').value);
    const falling = document.getElementById('behavior').value === 'falling';

    if (isNaN(loadV)) {
        showMessage('Введите напряжение под нагрузкой');
        return;
    }
    if (n.overload) {
        showMessage(`Вилка ${n.fork} А перегружает эту батарею в ${fmt(n.ratio)} раза — по такому тесту вывод сделать нельзя. Нужна вилка ≈ ${n.recCurrent} А.`);
        return;
    }

    let verdict;
    if (loadV < n.minV - 1.5) {
        verdict = '❌ Провал намного ниже нормы — вероятно, замыкание или обрыв в одной из банок. АКБ под замену.';
    } else if (loadV < n.minV) {
        verdict = '❌ Ниже нормы. Полностью зарядите АКБ и повторите тест. Если результат тот же — батарея изношена.';
    } else if (falling) {
        verdict = '⚠️ Порог выдержан, но напряжение сползало — признак сульфатации или осыпания пластин, ёмкость снижена.';
    } else if (loadV >= n.goodV) {
        verdict = '✅ Отличное состояние.';
    } else {
        verdict = '✅ Исправна, но износ заметен.';
    }
    if (!isNaN(recoveryV) && recoveryV < n.recoveryV && loadV >= n.minV) {
        verdict += ` Восстановление медленное (${fmt(recoveryV, 2)} В, норма от ${fmt(n.recoveryV, 2)} В) — недозаряд или сульфатация: зарядите и проверьте ещё раз.`;
    }

    showMessage(`
        <div style="margin-bottom: 10px;"><strong>Под нагрузкой:</strong> ${fmt(loadV)} В — норма не ниже ${fmt(n.minV)} В, отлично от ${fmt(n.goodV)} В</div>
        <div style="margin-bottom: 15px;"><strong>Ток / время:</strong> ${n.fork || n.recCurrent} А, ${n.holdTime} с</div>
        <div>${verdict}</div>
        ${forkNote(n)}
    `, loadV >= n.minV ? 'success' : 'info');
}

function calculateLoadTest() {
    const norms = getNorms();
    if (!norms) return;
    const mode = document.querySelector('input[name="mode"]:checked').value;
    mode === 'check' ? renderVerdict(norms) : renderSelection(norms);
}

document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
        document.getElementById('check-input').style.display = radio.value === 'check' ? 'block' : 'none';
        showMessage('', '');
        document.getElementById('result').className = 'result';
    });
});

document.querySelectorAll('.calculator input').forEach(input => {
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') calculateLoadTest();
    });
});
