import { loadState, saveState, navTo } from '../../scripts/storage.js';
import {
  resolvePackageStart, generateWeekendSlots, formatPeriod, formatSlotRange,
} from '../../scripts/package-dates.js';
import { CYCLIC_PACKAGE, PARKING } from '../../scripts/mock-data.js';

export function renderPackageContext() {
  const state = loadState();
  const start = resolvePackageStart(state.startMode, state.customDate);
  const slots = generateWeekendSlots(start, 4, 18, 7);
  const spot = state.confirmedSpot || CYCLIC_PACKAGE.preferredSpot;
  return { state, start, slots, spot, period: formatPeriod(start, slots) };
}

export function fillReservationsList(containerId) {
  const { slots } = renderPackageContext();
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = slots.map((s) => `<li class="reservation-list__item"><span class="reservation-list__num">${s.index}</span><span>${formatSlotRange(s)}</span></li>`).join('');
}

export function fillSummaryRows() {
  const { slots, spot, period } = renderPackageContext();
  const map = {
    'summary-package': 'Pakiet: 4 kolejne weekendy',
    'summary-period': period,
    'summary-hours': 'pt 18:00 – pon 7:00',
    'summary-count': '4',
    'summary-spot': spot,
    'summary-parking': PARKING.name,
    'summary-address': PARKING.address,
    'summary-price': '160 zł',
  };
  Object.entries(map).forEach(([id, text]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  });
  return { slots, spot, period };
}
