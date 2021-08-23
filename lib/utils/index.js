import _merge from 'lodash/merge';

/**
 * Creates the cache/storage key from the payload using one of `userId`,
 * `anonymousId` or the literal `no-id`, in that order.
 * @param {Object} payload The object from which to derive the key
 * @return {string} The payload key
 */
export const getPayloadKey = (payload, getPayloadProperty) => {
  const userId = getPayloadProperty(payload, 'userId');
  const anonymousId = getPayloadProperty(payload, 'anonymousId');
  return `${userId || anonymousId || 'no-id'}-previousSegmentPayload`;
};

/**
 * Merges an Array of payloads into a single object containing
 * all of the data.
 * @param {Arrray} previousPayloads The payloads to combine into one
 * @return {Object} The combined payloads
 */
export const combinePreviousPayloads = (previousPayloads) => {
  return previousPayloads.reduce((combinedPayload, previousPayload) => {
    combinedPayload = _merge(combinedPayload, previousPayload);
    return combinedPayload;
  }, {});
};
