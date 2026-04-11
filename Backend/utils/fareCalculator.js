/**
 * Fare Calculation Utility — Pure functions, no side effects.
 *
 * All fare logic is centralized here so it can be:
 *   - Unit tested independently
 *   - Reused by both estimate and create-ride flows
 *   - Audited for correctness during disputes
 *
 * Business rules:
 *   - Base fare varies by vehicle type
 *   - Per-km and per-min rates by vehicle type
 *   - Night charge: 1.2x between 11pm–5am
 *   - Surge multiplier from surge zones
 *   - Promo code discount applied last
 *   - Minimum fares enforced
 *   - Final fare rounded to nearest ₹5
 */

const VEHICLE_CONFIG = {
    moto: { baseFare: 25, perKm: 8, perMin: 1.5, minFare: 30 },
    auto: { baseFare: 35, perKm: 12, perMin: 2, minFare: 50 },
    car:  { baseFare: 60, perKm: 16, perMin: 3, minFare: 80 },
};

/**
 * Check if current time is in night charge window (11pm–5am IST).
 * @param {Date} [date] - defaults to now
 * @returns {boolean}
 */
function isNightTime(date = new Date()) {
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    const hour = istDate.getUTCHours();
    return hour >= 23 || hour < 5;
}

/**
 * Calculate fare breakdown for a single vehicle type.
 *
 * @param {object} params
 * @param {string} params.vehicleType - 'moto' | 'auto' | 'car'
 * @param {number} params.distanceMeters - from Distance Matrix API
 * @param {number} params.durationSeconds - from Distance Matrix API
 * @param {number} [params.surgeMultiplier=1] - from surge zone
 * @param {number} [params.discount=0] - promo discount amount
 * @returns {object} fareBreakdown
 */
function calculateFare({
    vehicleType,
    distanceMeters,
    durationSeconds,
    surgeMultiplier = 1,
    discount = 0,
}) {
    const cfg = VEHICLE_CONFIG[vehicleType];
    if (!cfg) throw new Error(`Unknown vehicle type: ${vehicleType}`);

    const distanceKm = distanceMeters / 1000;
    const durationMin = durationSeconds / 60;

    const base = cfg.baseFare;
    const distanceCharge = distanceKm * cfg.perKm;
    const timeCharge = durationMin * cfg.perMin;

    // Night charge
    const nightMultiplier = isNightTime() ? 1.2 : 1;
    const nightCharge = isNightTime()
        ? (base + distanceCharge + timeCharge) * 0.2 // 20% extra
        : 0;

    // Subtotal before surge
    const subtotal = (base + distanceCharge + timeCharge + nightCharge);

    // Apply surge
    const surgeCharge = subtotal * (surgeMultiplier - 1);
    const preDiscount = subtotal + surgeCharge;

    // Apply discount (cannot go below 0)
    const totalBeforeRounding = Math.max(preDiscount - discount, 0);

    // Round to nearest ₹5
    const total = Math.max(
        Math.round(totalBeforeRounding / 5) * 5,
        cfg.minFare
    );

    return {
        base: Math.round(base),
        distance: Math.round(distanceCharge),
        time: Math.round(timeCharge),
        nightCharge: Math.round(nightCharge),
        surge: Math.round(surgeCharge),
        discount: Math.round(discount),
        total,
        currency: 'INR',
    };
}

/**
 * Calculate fares for ALL vehicle types (used by /get-fare endpoint).
 *
 * @param {object} params
 * @param {number} params.distanceMeters
 * @param {number} params.durationSeconds
 * @param {number} [params.surgeMultiplier=1]
 * @returns {object} { auto, car, moto, surgeMultiplier, isSurge, distanceText, durationText }
 */
function calculateAllFares({ distanceMeters, durationSeconds, surgeMultiplier = 1, distanceText, durationText }) {
    const result = {
        surgeMultiplier,
        isSurge: surgeMultiplier > 1,
        distanceText: distanceText || `${(distanceMeters / 1000).toFixed(1)} km`,
        durationText: durationText || `${Math.round(durationSeconds / 60)} min`,
    };

    for (const type of Object.keys(VEHICLE_CONFIG)) {
        const breakdown = calculateFare({
            vehicleType: type,
            distanceMeters,
            durationSeconds,
            surgeMultiplier,
        });
        result[type] = breakdown.total;
    }

    return result;
}

/**
 * Calculate cancellation fee based on time since acceptance.
 *
 * Policy:
 *   - Before acceptance: free
 *   - 0–2 min after acceptance: free
 *   - 2–5 min after acceptance: ₹10
 *   - 5+ min after acceptance: ₹25
 *   - Captain cancels: no fee to user
 *
 * @param {string} cancelledBy - 'user' | 'captain' | 'system'
 * @param {string} rideStatus - current ride status
 * @param {Date} [acceptedAt] - when ride was accepted
 * @returns {number} fee amount
 */
function calculateCancellationFee(cancelledBy, rideStatus, acceptedAt) {
    // Captain cancels: no fee to user, penalty tracked separately
    if (cancelledBy !== 'user') return 0;

    // User cancels before acceptance: free
    if (rideStatus === 'pending') return 0;

    // User cancels after acceptance
    if (rideStatus === 'accepted' && acceptedAt) {
        const minutesSinceAcceptance = (Date.now() - new Date(acceptedAt).getTime()) / 60000;
        if (minutesSinceAcceptance <= 2) return 0;
        if (minutesSinceAcceptance <= 5) return 10;
        return 25;
    }

    // Ongoing rides: higher fee
    if (rideStatus === 'ongoing') return 50;

    return 0;
}

module.exports = {
    VEHICLE_CONFIG,
    calculateFare,
    calculateAllFares,
    calculateCancellationFee,
    isNightTime,
};
