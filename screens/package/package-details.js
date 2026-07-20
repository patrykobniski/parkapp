import { CYCLIC_PACKAGE, ACCOUNT_VEHICLES } from '../../scripts/mock-data.js';
import { loadState, saveState, navTo } from '../../scripts/storage.js';
import {
  resolvePackageStart, generateWeekendSlots, formatSlotRange,
  formatStartMessage, formatPeriod,
} from '../../scripts/package-dates.js';

let state = loadState();

const els = {
  startHint: document.getElementById('start-hint'),
  reservationsList: document.getElementById('reservations-list'),
  periodValue: document.getElementById('period-value'),
  customDateWrap: document.getElementById('custom-date-wrap'),
  customDate: document.getElementById('custom-date'),
  spotOptions: document.getElementById('spot-options'),
  checkBtn: document.getElementById('check-availability'),
  vehicleSpotLabel: document.getElementById('vehicle-spot-label'),
  vehiclesList: document.getElementById('account-vehicles-list'),
};

function getSpotLabelForCopy() {
  if (state.spotMode === 'best') return 'najlepszym dostępnym miejscu';
  if (state.spotMode === 'pick') return 'wybranym miejscu';
  return state.spotLabel || CYCLIC_PACKAGE.preferredSpot;
}

function getSlots() {
  const start = resolvePackageStart(state.startMode, state.customDate);
  return generateWeekendSlots(
    start,
    CYCLIC_PACKAGE.reservationCount,
    CYCLIC_PACKAGE.startHour,
    CYCLIC_PACKAGE.endHour
  );
}

function render() {
  const slots = getSlots();
  const startFriday = resolvePackageStart(state.startMode, state.customDate);

  els.startHint.textContent = formatStartMessage(startFriday, CYCLIC_PACKAGE.startHour);
  els.periodValue.textContent = formatPeriod(startFriday, slots);

  els.reservationsList.innerHTML = slots.map((slot) => `
    <li class="reservation-list__item">
      <span class="reservation-list__num" aria-hidden="true">${slot.index}</span>
      <span>${formatSlotRange(slot)}</span>
    </li>
  `).join('');

  els.customDateWrap.hidden = state.startMode !== 'custom';

  document.querySelectorAll('[data-start-mode]').forEach((el) => {
    const mode = el.dataset.startMode;
    el.classList.toggle('radio-option--selected', state.startMode === mode);
    el.setAttribute('aria-checked', state.startMode === mode ? 'true' : 'false');
  });

  document.querySelectorAll('[data-spot-mode]').forEach((el) => {
    const mode = el.dataset.spotMode;
    el.classList.toggle('radio-option--selected', state.spotMode === mode);
    el.setAttribute('aria-checked', state.spotMode === mode ? 'true' : 'false');
  });

  if (els.vehicleSpotLabel) {
    els.vehicleSpotLabel.textContent = getSpotLabelForCopy();
  }

  if (els.vehiclesList) {
    els.vehiclesList.innerHTML = ACCOUNT_VEHICLES.map((vehicle) => `
      <li class="vehicles-panel__item">
        <span class="vehicles-panel__item-name">${vehicle.label}</span>
        <span class="vehicles-panel__item-plate">${vehicle.plate}</span>
      </li>
    `).join('');
  }
}

document.querySelectorAll('[data-start-mode]').forEach((el) => {
  el.addEventListener('click', () => {
    state = saveState({ startMode: el.dataset.startMode });
    render();
  });
});

document.querySelectorAll('[data-spot-mode]').forEach((el) => {
  el.addEventListener('click', () => {
    const mode = el.dataset.spotMode;
    let spotLabel = CYCLIC_PACKAGE.preferredSpot;
    if (mode === 'best') spotLabel = 'Najlepsze dostępne';
    if (mode === 'pick') spotLabel = 'Inne miejsce';
    state = saveState({ spotMode: mode, spotLabel });
    render();
  });
});

els.customDate?.addEventListener('change', () => {
  state = saveState({ customDate: els.customDate.value });
  render();
});

if (els.customDate) {
  const t = new Date();
  els.customDate.min = t.toISOString().slice(0, 10);
}

els.checkBtn?.addEventListener('click', () => {
  saveState({
    packageSelected: true,
    packageId: CYCLIC_PACKAGE.id,
  });
  navTo('availability-loading.html');
});

document.getElementById('back-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  navTo('../parking-detail/index.html');
});

render();
