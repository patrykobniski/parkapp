import { loadState, saveState, navTo } from '../../scripts/storage.js';
import { formatRegularBar, getRegularTimeRange } from '../../scripts/package-dates.js';

let state = loadState();
state = saveState({ packageSelected: false, packageId: null });
const regularRange = getRegularTimeRange();

function renderTimeBar() {
  const rangeEl = document.getElementById('time-bar-regular-range');
  if (rangeEl) {
    rangeEl.textContent = formatRegularBar(regularRange.start, regularRange.end);
  }
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
      state = saveState({ pricingPackageApplied: true, packageSelected: false, packageId: null });
      renderPricingCard();
    });
  }
}

document.getElementById('cyclic-package-card')?.addEventListener('click', (e) => {
  if (e.target.closest('#cyclic-cta')) return;
  navTo('../package/details.html');
});

document.getElementById('cyclic-cta')?.addEventListener('click', (e) => {
  e.stopPropagation();
  navTo('../package/details.html');
});

renderTimeBar();
renderPricingCard();
