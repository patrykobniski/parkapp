/**
 * ParkApp — mock data & package configuration
 */

export const PARKING = {
  id: 'warszawska-12',
  name: 'Parking Warszawska 12',
  address: 'ul. Warszawska 12, Warszawa',
  standardPrice: 52,
  standardPricePerHour: '2,60 zł/h',
};

export const CYCLIC_PACKAGE = {
  id: 'weekend-4',
  name: '4 kolejne weekendy',
  hoursLabel: 'Pt 18:00 – pon 7:00',
  hoursFull: 'Piątek 18:00 – poniedziałek 7:00',
  reservationCount: 4,
  periodDays: 28,
  totalPrice: 160,
  pricePerWeekend: 40,
  badge: 'Najczęściej wybierany',
  savingsBadge: 'Oszczędzasz 40 zł',
  preferredSpot: 'Miejsce 12',
  alternativeSpot: 'Miejsce 14',
  startHour: 18,
  endHour: 7,
};

export const PRICING_PACKAGE = {
  id: 'calodobowy',
  name: 'Całodobowy',
  duration: '24h',
  price: 79.9,
  priceHint: 'Tylko 3,90 zł/h',
  badge: 'Popularny',
};

export const VEHICLE = {
  label: 'Toyota Corolla',
  plate: 'WA 12345',
};

/** Pojazdy przypisane do konta użytkownika (mock) */
export const ACCOUNT_VEHICLES = [
  { label: 'Toyota Corolla', plate: 'WA 12345' },
  { label: 'Skoda Octavia', plate: 'WW 98765' },
];

export const VEHICLE_PACKAGE_HEADLINE = 'Bez wyboru pojazdu';

export function getVehiclePackageNote(spotLabel) {
  return `Każdy pojazd przypisany do konta może parkować na ${spotLabel}. Nie musisz wybierać auta przy zakupie pakietu.`;
}

export function formatVehicleLine(vehicle) {
  return `${vehicle.label} · ${vehicle.plate}`;
}

export const PAYMENT_METHOD = 'BLIK';
