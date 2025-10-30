const db = require('../config/database');
const { getCurrentISTTime } = require('./timeUtils');

function getEnvBool(v, def = true) {
    if (v === undefined || v === null || v === '') return def;
    const s = String(v).toLowerCase();
    return !(s === 'false' || s === '0' || s === 'no' || s === 'off');
}

function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function computeNextOpen(ist, startMin, endMin, blockWeekends) {
    let d = new Date(ist);
    const advanceToNextDay = () => {
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0);
    };
    const currentMin = ist.getHours() * 60 + ist.getMinutes();
    if (currentMin > endMin) advanceToNextDay();
    if (blockWeekends) {
        while ([0, 6].includes(d.getDay())) advanceToNextDay();
    }
    d.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    return d.toISOString();
}

async function getSettings() {
    // Admin toggle and message come ONLY from DB. Timings from env.
    let enabledFromDb = true; // default enabled daily
    try {
        const res = await db.query('SELECT withdrawals_enabled FROM system_settings WHERE id = 1');
        const row = res.rows[0];
        if (row) {
            enabledFromDb = row.withdrawals_enabled;
        }
    } catch (e) {
        console.warn('withdrawalWindow: system_settings not available, assuming enabled');
    }

    return {
        enabled: enabledFromDb,
        start: process.env.WITHDRAWALS_START || '08:30',
        end: process.env.WITHDRAWALS_END || '17:30',
    };
}

async function getWithdrawalWindow() {
    const { enabled, start, end } = await getSettings();

    if (!enabled) {
        return {
            allowed: false,
            reason: `Withdrawals are disabled on weekends/holidays and enabled only between ${start}–${end} IST.`
        };
    }

    const ist = getCurrentISTTime();

    const nowMin = ist.getHours() * 60 + ist.getMinutes();
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    const inWindow = nowMin >= startMin && nowMin <= endMin;

    if (!inWindow) {
        return {
            allowed: false,
            reason: `Withdrawals are available between ${start}–${end} IST.`,
            nextOpen: computeNextOpen(ist, startMin, endMin, false),
            start,
            end
        };
    }

    return { allowed: true, start, end };
}

module.exports = { getWithdrawalWindow };


