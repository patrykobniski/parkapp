/**
 * ParkApp — mock data & package configuration
 */

export const PARKING = {
  id: 'warszawska-12',
  name: 'Parking Warszawska 12',
  address: 'ul. Warszawska 12, Warszawa',
  standardPrice: 52,
  standardPricePerHour: '2,60 zł/h',
  hasCyclicPackage: true,
  amenities: ['Na powietrzu', 'Strzeżony', 'Ładowanie EV'],
};

/** @type {Array<{ id: string, name: string, address: string, price: number, pricePerHour: string, hasCyclicPackage?: boolean, highlighted?: boolean }>} */
export const PARKING_RESULTS = [
  {
    id: 'warszawska-12',
    name: PARKING.name,
    address: PARKING.address,
    price: PARKING.standardPrice,
    pricePerHour: PARKING.standardPricePerHour,
    hasCyclicPackage: true,
    highlighted: true,
  },
  {
    id: 'grunwaldzka-24h',
    name: 'Parking prywatny 24h',
    address: 'ul. Grunwaldzka 12, Warszawa',
    price: 10,
    pricePerHour: '5,00 zł/h',
  },
  {
    id: 'wola-galeria',
    name: 'Wola Parking — Galeria',
    address: 'ul. Marszałkowska 124F, Warszawa',
    price: 8.99,
    pricePerHour: '4,98 zł/h',
  },
];

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

export const PAYMENT_METHOD = 'BLIK';
