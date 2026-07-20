import { PARKING, CYCLIC_PACKAGE, PRICING_PACKAGE } from '../../scripts/mock-data.js';
import {
  loadState, saveState, navTo,
} from '../../scripts/storage.js';
import {
  resolvePackageStart, generateWeekendSlots, formatRegularBar,
  formatPackageBar, getRegularTimeRange,
} from '../../scripts/package-dates.js';

let state = loadState();
state = saveState({ packageSelected: false, packageId: null });
const regularRange = getRegularTimeRange();

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
  }
});

document.getElementById('cyclic-package-card')?.addEventListener('click', (e) => {
  if (e.target.closest('#cyclic-cta')) return;
  navTo('../package/details.html');
});

document.getElementById('cyclic-cta')?.addEventListener('click', (e) => {
  e.stopPropagation();
  navTo('../package/details.html');
});

renderTimeBar();
renderCyclicCard();
renderPricingCard();
