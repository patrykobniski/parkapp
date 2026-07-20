import { PARKING, CYCLIC_PACKAGE, PRICING_PACKAGE } from '../../scripts/mock-data.js';
import {
  loadState, saveState, navTo,
} from '../../scripts/storage.js';
import {
  resolvePackageStart, generateWeekendSlots, formatRegularBar,
  formatPackageBar, getReservationRange,
} from '../../scripts/package-dates.js';

const state = loadState();
const regularRange = getReservationRange(state);

function renderTimeBar() {
  const bar = document.getElementById('time-bar');
  const regularEl = document.getElementById('time-bar-regular');
  const packageEl = document.getElementById('time-bar-package');

  if (state.packageSelected) {
    bar.classList.add('time-bar--package');
    regularEl.hidden = true;
    packageEl.hidden = false;
    const start = resolvePackageStart(state.startMode, state.customDate);
    const slots = generateWeekendSlots(start, CYCLIC_PACKAGE.reservationCount, CYCLIC_PACKAGE.startHour, CYCLIC_PACKAGE.endHour);
    document.getElementById('time-bar-package-range').textContent = formatPackageBar(slots);
  } else {
    bar.classList.remove('time-bar--package');
    regularEl.hidden = false;
    packageEl.hidden = true;
    document.getElementById('time-bar-regular-range').textContent = formatRegularBar(regularRange.start, regularRange.end);
  }
}

function renderCyclicCard() {
  const card = document.getElementById('cyclic-package-card');
  const selected = state.packageSelected && state.packageId === CYCLIC_PACKAGE.id;
  card.classList.toggle('cyclic-package--selected', selected);
  card.setAttribute('aria-pressed', selected ? 'true' : 'false');
  const dismiss = document.getElementById('dismiss-package');
  if (dismiss) dismiss.hidden = !selected;
}

function renderPricingCard() {
  const card = document.getElementById('pricing-package');
  card.classList.toggle('pricing-package--applied', state.pricingPackageApplied);
  const foot = document.getElementById('pricing-foot');
  foot.innerHTML = state.pricingPackageApplied
    ? '<span class="pricing-package__foot-btn" aria-live="polite">✓ Zastosowano!</span>'
    : '<button type="button" class="pricing-package__foot-btn" id="apply-pricing">Wybierz pakiet →</button>';
  if (!state.pricingPackageApplied) {
    document.getElementById('apply-pricing')?.addEventListener('click', (e) => {
      e.stopPropagation();
      saveState({ pricingPackageApplied: true, packageSelected: false, packageId: null });
      renderPricingCard();
      renderCyclicCard();
      renderTimeBar();
    });
  }
}

document.getElementById('time-bar')?.addEventListener('click', () => {
  if (state.packageSelected) {
    navTo('../package/details.html');
  } else {
    navTo('../reservation-setup/');
  }
});

document.getElementById('cyclic-package-card')?.addEventListener('click', () => {
  saveState({
    packageSelected: true,
    packageId: CYCLIC_PACKAGE.id,
    pricingPackageApplied: false,
    availabilityResult: null,
    confirmedSpot: null,
  });
  navTo('../package/details.html');
});

document.getElementById('cyclic-cta')?.addEventListener('click', (e) => {
  e.stopPropagation();
  saveState({
    packageSelected: true,
    packageId: CYCLIC_PACKAGE.id,
    pricingPackageApplied: false,
  });
  navTo('../package/details.html');
});

document.getElementById('dismiss-package')?.addEventListener('click', (e) => {
  e.preventDefault();
  Object.assign(state, saveState({ packageSelected: false, packageId: null }));
  renderTimeBar();
  renderCyclicCard();
});

renderTimeBar();
renderCyclicCard();
renderPricingCard();
