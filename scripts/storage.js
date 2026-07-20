/**
 * Session persistence for package flow state
 */

const KEY = 'parkapp_package_state';

/** @typedef {{
 *   packageSelected: boolean,
 *   packageId: string|null,
 *   startMode: 'nearest'|'next'|'custom',
 *   customDate: string|null,
 *   spotMode: 'preferred'|'pick'|'best',
 *   spotLabel: string,
 *   availabilityResult: 'success'|'alternative'|'unavailable'|null,
 *   confirmedSpot: string|null,
 *   pricingPackageApplied: boolean,
 *   reservationStart: string|null,
 *   reservationEnd: string|null,
 *   reservationDurationLabel: string|null,
 *   reservationPreset: 'weekend'|'24h'|'6h'|null,
 *   selectedParkingId: string|null,
 * }} PackageState
 */

/** @returns {PackageState} */
export function getDefaultState() {
  return {
    packageSelected: false,
    packageId: null,
    startMode: 'nearest',
    customDate: null,
    spotMode: 'preferred',
    spotLabel: 'Miejsce 12',
    availabilityResult: null,
    confirmedSpot: null,
    pricingPackageApplied: false,
    reservationStart: null,
    reservationEnd: null,
    reservationDurationLabel: null,
    reservationPreset: null,
    selectedParkingId: null,
  };
}

/** @returns {PackageState} */
export function loadState() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return getDefaultState();
    return { ...getDefaultState(), ...JSON.parse(raw) };
  } catch {
    return getDefaultState();
  }
}

/** @param {Partial<PackageState>} patch */
export function saveState(patch) {
  const next = { ...loadState(), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearPackageState() {
  sessionStorage.removeItem(KEY);
}

/** @param {string} path relative from site root e.g. screens/package/summary.html */
export function navTo(path, params = {}) {
  const url = new URL(path, window.location.href);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') url.searchParams.set(k, v);
  });
  window.location.href = url.pathname + url.search;
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Resolve path prefix for nested screens (works on GitHub Pages subpath)
 */
export function rootPrefix() {
  const path = window.location.pathname;
  if (path.includes('/screens/')) {
    const depth = (path.match(/\//g) || []).length;
    const idx = path.indexOf('/screens/');
    const before = path.slice(0, idx);
    const afterDepth = (path.slice(idx).match(/\//g) || []).length - 1;
    return '../'.repeat(afterDepth);
  }
  return './';
}
