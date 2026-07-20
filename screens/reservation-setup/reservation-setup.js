import { loadState, saveState } from '../../scripts/storage.js';
import {
  buildReservationPreset,
  formatRegularBar,
} from '../../scripts/package-dates.js';

const state = loadState();
let preset = state.reservationPreset || 'weekend';

function render() {
  const built = buildReservationPreset(preset);
  document.getElementById('duration-display').textContent = built.durationLabel;
  document.getElementById('range-display').textContent = formatRegularBar(built.start, built.end);

  document.querySelectorAll('input[name="preset"]').forEach((input) => {
    input.checked = input.value === preset;
    input.closest('.duration-pill')?.classList.toggle('duration-pill--active', input.checked);
  });
}
  const built = buildReservationPreset(preset);
  saveState({
    reservationStart: built.start.toISOString(),
    reservationEnd: built.end.toISOString(),
    reservationDurationLabel: built.durationLabel,
    reservationPreset: built.preset,
    packageSelected: false,
    packageId: null,
    pricingPackageApplied: false,
  });
}

document.querySelectorAll('input[name="preset"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    preset = input.value;
    render();
  });
});

document.getElementById('continue-btn')?.addEventListener('click', (e) => {
  persistReservation();
});

render();
persistReservation();
