/**
 * Checks if value is an Object
 * @param {*} value The object to check
 * @return {boolean} Whether the value is an object or not
 */
export const isObject = (value) => {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
};

/**
 * Checks if two values are deeply equal
 * @param {*} a The first value to check
 * @param {*} b The second value to check
 * @return {boolean} Whether the two values are deeply equal
 */
export const isEqual = function (a, b) {
  if (a === b) {
    return true;
  } else if (isObject(a) && isObject(b)) {
    if (Object.keys(a).length !== Object.keys(b).length) {
      return false;
    }
    for (const prop in a) {
      if (Object.prototype.hasOwnProperty.call(b, prop)) {
        if (!isEqual(a[prop], b[prop])) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
};

/**
 * Deeply merges a source object into a target object
 * @param {object} target The target object
 * @param {object} source The source object
 * @return {object} The deeply merged objects
 */
export const merge = (target, source) => {
  for (const prop in source) {
    const targetValue = target[prop];
    const sourceValue = source[prop];
    if (isObject(targetValue) && isObject(sourceValue)) {
      target[prop] = merge(targetValue, sourceValue);
      continue;
    }
    target[prop] = source[prop];
  }
  return target;
};

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
    combinedPayload = merge(combinedPayload, previousPayload);
    return combinedPayload;
  }, {});
};
