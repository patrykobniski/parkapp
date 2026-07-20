import { PARKING_RESULTS } from '../../scripts/mock-data.js';
import { loadState, saveState } from '../../scripts/storage.js';
import { getReservationRange } from '../../scripts/package-dates.js';

const state = loadState();
const range = getReservationRange(state);

const durationLabel = state.reservationDurationLabel || range.durationLabel || '61h';
document.getElementById('time-chip-value').textContent = durationLabel;
document.getElementById('results-count').textContent = `${PARKING_RESULTS.length} parkingi w okolicy`;

const list = document.getElementById('parking-list');

PARKING_RESULTS.forEach((parking) => {
  const item = document.createElement('a');
  item.href = parking.id === 'warszawska-12' ? '../parking-detail/' : '#';
  item.className = `parking-list-card${parking.highlighted ? ' parking-list-card--highlighted' : ''}`;
  item.setAttribute('role', 'listitem');
  item.innerHTML = `
    <div class="parking-list-card__main">
      <div class="parking-list-card__pin" aria-hidden="true">P</div>
      <div class="parking-list-card__body">
        <p class="parking-list-card__name">${parking.name}</p>
        <p class="parking-list-card__address">📍 ${parking.address}</p>
        ${parking.hasCyclicPackage ? '<span class="badge badge--brand parking-list-card__badge">Pakiet weekendowy</span>' : ''}
      </div>
    </div>
    <div class="parking-list-card__price">
      <span class="parking-list-card__price-total">${formatPrice(parking.price)} zł</span>
      <span class="parking-list-card__price-hour">${parking.pricePerHour}</span>
    </div>
  `;

  item.addEventListener('click', (e) => {
    if (parking.id !== 'warszawska-12') {
      e.preventDefault();
      return;
    }
    saveState({ selectedParkingId: parking.id });
  });

  list.appendChild(item);
});

function formatPrice(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
}
