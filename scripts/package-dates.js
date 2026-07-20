/**
 * Generates 4 weekend reservation slots from a start anchor date.
 * Each slot: Friday 18:00 → Monday 7:00
 */

const MONTHS_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

/**
 * @param {Date} [referenceDate]
 * @returns {Date} nearest upcoming Friday at 00:00 local
 */
export function getNearestFriday(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun … 5 Fri
  let daysUntilFriday = (5 - day + 7) % 7;
  if (daysUntilFriday === 0 && referenceDate.getHours() >= 18) {
    daysUntilFriday = 7;
  }
  d.setDate(d.getDate() + daysUntilFriday);
  return d;
}

/**
 * @param {'nearest'|'next'|'custom'} mode
 * @param {string|null} customDateISO — yyyy-mm-dd
 * @param {Date} [referenceDate]
 * @returns {Date}
 */
export function resolvePackageStart(mode, customDateISO = null, referenceDate = new Date()) {
  if (mode === 'nearest') {
    return getNearestFriday(referenceDate);
  }
  if (mode === 'next') {
    const friday = getNearestFriday(referenceDate);
    friday.setDate(friday.getDate() + 7);
    return friday;
  }
  if (mode === 'custom' && customDateISO) {
    const picked = new Date(customDateISO + 'T12:00:00');
    return snapToWeekendStart(picked);
  }
  return getNearestFriday(referenceDate);
}

/**
 * Snap any date to the Friday of that week (or next Friday if weekend passed).
 * @param {Date} date
 */
export function snapToWeekendStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const add = (5 - day + 7) % 7;
  d.setDate(d.getDate() + add);
  return d;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * @param {Date} startFriday — Friday 00:00
 * @param {number} count
 * @param {number} startHour default 18
 * @param {number} endHour default 7 (Monday)
 */
export function generateWeekendSlots(startFriday, count = 4, startHour = 18, endHour = 7) {
  const slots = [];
  for (let i = 0; i < count; i++) {
    const friday = new Date(startFriday);
    friday.setDate(friday.getDate() + i * 7);
    friday.setHours(startHour, 0, 0, 0);

    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3);
    monday.setHours(endHour, 0, 0, 0);

    slots.push({ start: new Date(friday), end: new Date(monday), index: i + 1 });
  }
  return slots;
}

export function formatSlotShort(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatSlotRange(slot) {
  return `${formatSlotShort(slot.start)} – ${formatSlotShort(slot.end)}`;
}

export function formatDateShort(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatPeriod(startFriday, slots) {
  const last = slots[slots.length - 1];
  return `${formatDateShort(startFriday)} – ${formatDateShort(last.end)}`;
}

export function formatStartMessage(startFriday, startHour = 18) {
  const d = new Date(startFriday);
  d.setHours(startHour, 0, 0, 0);
  const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  const days = ['niedzieli', 'poniedziałku', 'wtorku', 'środy', 'czwartku', 'piątku', 'soboty'];
  return `Pakiet rozpocznie się w ${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} o ${pad(startHour)}:00.`;
}

export function getRegularTimeRange(referenceDate = new Date()) {
  const start = getNearestFriday(referenceDate);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  end.setHours(7, 0, 0, 0);
  return { start, end };
}

export function formatRegularBar(start, end) {
  return `${formatDateShort(start)}, ${pad(start.getHours())}:${pad(start.getMinutes())} → ${formatDateShort(end)}, ${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

export function formatPackageBar(slots) {
  if (!slots.length) return '';
  return `${formatDateShort(slots[0].start)} – ${formatDateShort(slots[slots.length - 1].end)}`;
}
