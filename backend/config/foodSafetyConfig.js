/**
 * foodSafetyConfig.js
 * Central configuration file for Time-Based Food Safety thresholds and rules.
 */

module.exports = {
  // Configurable thresholds for percent of safe-use time consumed
  THRESHOLDS: {
    SAFE_PERCENT: 50,    // percentUsed < 50% => Safe
    URGENT_PERCENT: 75,  // 50% <= percentUsed <= 75% => Urgent
    // percentUsed > 75% => Do Not Distribute (Red)
  },

  // Storage methods allowed and their display labels
  STORAGE_METHODS: [
    { value: 'refrigerated', label: '❄️ Refrigerated (Cold chain maintained)' },
    { value: 'covered', label: '🍲 Covered Container (Room temp, sealed)' },
    { value: 'room_temperature', label: '🌡️ Room Temperature (Open/Ambient)' },
  ],

  // Default safe-use duration in hours if donor specifies cooking time without an explicit expiry
  DEFAULT_SAFE_USE_HOURS: {
    refrigerated: 12,
    covered: 6,
    room_temperature: 4,
  },

  // Pop-up messages required by system
  MESSAGES: {
    SAFE: 'Recently prepared and appropriately stored. Safe to review.',
    URGENT: "Approaching the platform's safe-use time limit. Accept only if you can pick up soon.",
    DO_NOT_DISTRIBUTE: 'Exceeds the configured safe-use limit. This food must not be distributed.',
  },

  // Verification Checklist Items for pickup of Urgent orders
  PICKUP_CHECKLIST_ITEMS: [
    { id: 'packagingIntact', label: 'Packaging intact' },
    { id: 'noSpoilage', label: 'No obvious spoilage' },
    { id: 'correctLabeling', label: 'Correct labeling/time information' },
    { id: 'appropriateStorage', label: 'Storage condition is appropriate' },
    { id: 'quantityMatches', label: 'Quantity matches the listing' },
  ],
};
