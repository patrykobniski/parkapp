import { loadState, saveState, navTo, getQueryParam } from '../../scripts/storage.js';
import { CYCLIC_PACKAGE } from '../../scripts/mock-data.js';

const resultParam = getQueryParam('result');
const state = loadState();

const targets = {
  success: 'availability-success.html',
  alternative: 'availability-alternative.html',
  unavailable: 'availability-unavailable.html',
};

function resolveResult() {
  if (resultParam && targets[resultParam]) return resultParam;
  if (state.spotMode === 'best') return 'success';
  if (state.spotMode === 'pick') return 'alternative';
  return 'success';
}

const items = document.querySelectorAll('.check-list__item');
let step = 0;

const interval = setInterval(() => {
  if (step > 0 && items[step - 1]) {
    items[step - 1].classList.add('check-list__item--done');
    items[step - 1].querySelector('.check-list__spinner')?.replaceWith(createCheck());
  }
  step++;
  if (step > items.length) {
    clearInterval(interval);
    const result = resolveResult();
    saveState({
      availabilityResult: result,
      confirmedSpot: result === 'alternative' ? CYCLIC_PACKAGE.alternativeSpot : CYCLIC_PACKAGE.preferredSpot,
    });
    setTimeout(() => navTo(targets[result] || targets.success), 400);
  }
}, 700);

function createCheck() {
  const s = document.createElement('span');
  s.textContent = '✓';
  s.style.color = '#059669';
  s.style.fontWeight = '700';
  s.setAttribute('aria-hidden', 'true');
  return s;
}
