/**
 * foodSafetyConfig.js
 * Frontend configuration for Time-Based Food Safety thresholds and rules.
 */

export const FOOD_SAFETY_CONFIG = {
  THRESHOLDS: {
    SAFE_PERCENT: 50,
    URGENT_PERCENT: 75,
  },

  STORAGE_METHODS: [
    { value: 'refrigerated', label: '❄️ Refrigerated' },
    { value: 'covered', label: '🍲 Covered Container' },
    { value: 'room_temperature', label: '🌡️ Room Temperature' },
  ],

  MESSAGES: {
    SAFE: 'Recently prepared and appropriately stored. Safe to review.',
    URGENT: "Approaching the platform's safe-use time limit. Accept only if you can pick up soon.",
    DO_NOT_DISTRIBUTE: 'Exceeds the configured safe-use limit. This food must not be distributed.',
  },

  PICKUP_CHECKLIST_ITEMS: [
    { id: 'packagingIntact', label: 'Packaging intact' },
    { id: 'noSpoilage', label: 'No obvious spoilage' },
    { id: 'correctLabeling', label: 'Correct labeling/time information' },
    { id: 'appropriateStorage', label: 'Storage condition is appropriate' },
    { id: 'quantityMatches', label: 'Quantity matches the listing' },
  ],
};

export default FOOD_SAFETY_CONFIG;
