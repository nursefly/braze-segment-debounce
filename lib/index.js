import _get from 'lodash/get';
import _isNil from 'lodash/isNil';
import _merge from 'lodash/merge';
import debugLib from 'debug';

import { diffObject } from './utils/diffObject';

/**
 * Default serialize function for the server
 * @param {object|array|null|string|number} value
 * @return {Buffer}
 */
const serializeAsJSONForCache = (value) => {
  return Buffer.from(JSON.stringify(value), 'utf8');
};

/**
 * Default deserialize function for frontend
 * @param {Buffer} serializedValue
 * @return {object|array|null|string|number}
 */
const deserializeFromJSONForCache = (serializedValue) => {
  return JSON.parse(serializedValue.toString('utf8'));
};

/**
 * Creates the cache/storage key from the payload using one of `userId`,
 * `anonymousId` or the literal `no-id`, in that order.
 * @param {Object} payload The object from which to derive the key
 * @return {string} The payload key
 */
const getPayloadKey = (payload, getPayloadProperty) => {
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
const combinePreviousPayloads = (previousPayloads) => {
  return previousPayloads.reduce((combinedPayload, previousPayload) => {
    combinedPayload = _merge(combinedPayload, previousPayload);
    return combinedPayload;
  }, {});
};

/**
 * A base function used by `debouncePayloadSync` and `debouncePayload`
 * which takes two payloads and runs them through the debouncing algorithm.
 * @param {Object} previousPayload The first payload to compare
 * @param {Object} nextPayload The other payload to compare
 * @param {Function} getPayloadProperty A function to help retrieve the
 * basic values of the payload: `userId`, `anonymousId` and `traits`.This
 * is needed because the Segment Analytics.js middleware, used in
 * `debouncePayloadSync`, nests the payload inside an `obj` object. But,
 * this is is not true for the server side. The function can simply be
 * `lodash`'s `_get` for `debouncePayload` or `` _get(payload,
 * `obj.${prop}`)`` for `debouncePayloadSync`.
 * @return { Object || null, Object || null } { nextPayload,
 * newOrUpdatedTraits } where `nextPayload` is the payload to send to
 * Segment/Braze and `newOrUpdatedTraits` are any updates to the `traits`
 * for that payload that should be included before it is sent.
 * @example
 * ```
 *   const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
 *     previousPayload,
 *     sanitizedPayload,
 *     (payload, prop) => _get(payload, `obj.${prop}`),
 *   );
 *   if (nextPayload) {
 *     const debouncedPayload = {
 *       ...nextPayload,
 *       obj: {
 *         ...nextPayload.obj,
 *         traits: newOrUpdatedTraits || nextPayload.obj.traits,
 *       },
 *     };
 *     // do something smart with `debouncedPayload`
 *   }
 * ```
 */
export const debouncePayloads = (
  previousPayload,
  nextPayload,
  getPayloadProperty,
) => {
  let newOrUpdatedTraits = null;
  if (!_isNil(nextPayload) && !_isNil(previousPayload)) {
    const nextAnonymousId = getPayloadProperty(nextPayload, 'anonymousId');
    const previousAnonymousId = getPayloadProperty(
      previousPayload,
      'anonymousId',
    );
    const nextUserId = getPayloadProperty(nextPayload, 'userId');
    const previousUserId = getPayloadProperty(previousPayload, 'userId');
    if (
      nextAnonymousId !== previousAnonymousId ||
      nextUserId !== previousUserId
    ) {
      return { nextPayload, newOrUpdatedTraits };
    }

    const nextTraits = getPayloadProperty(nextPayload, 'traits');
    const previousTraits = getPayloadProperty(previousPayload, 'traits');
    newOrUpdatedTraits = diffObject(nextTraits, previousTraits || {}, {
      diffArray: false,
    });
    if (_isNil(newOrUpdatedTraits)) {
      return { nextPayload: null, newOrUpdatedTraits };
    }

    // Braze charges for every trait sent to it even if that trait isn't
    // changed. So we only want to include traits that have changed in the
    // final payload.
    return { nextPayload, newOrUpdatedTraits };
  }
  return { nextPayload, newOrUpdatedTraits };
};

/**
 * `debouncePayloadSync` provides a full solution that integrates with the
 * Analytics.js Source Middleware to debounce data being before it is sent
 * to the Braze destination. It stores previous payloads in `localStorage`,
 * or a similar solution which you can override, and compares the `payload`
 * provided by this middleware against the previous versions to only send
 * new or updated `traits`.
 * @param {Object} payload The data provided by the Analytics.js middleware
 * @param {Function} options.fetchPayload An optional function to override `localStorage.getItem`
 * @param {Function} options.storePayload An optional function to override `localStorage.setItem`
 * @return {Object} The debounced payload to send to Braze. If `null`,
 * there is no new or updated data to send.
 * @example
 * ```
 *   const _identifyDebounceSourceMiddleware = ({ payload, next, integrations }) => {
 *     // TODO filter Braze integration, called `AppBoy`
 *     if (payload.type() !== 'identify') {
 *       next(payload);
 *       return;
 *     }
 *     const identifyPayload = debouncePayloadSync(payload);
 *     if (identifyPayload) {
 *       next(identifyPayload);
 *     }
 *   }
 *   analytics.addSourceMiddleware(_identifyDebounceSourceMiddleware);
 * ```
 *
 */
export const debouncePayloadSync = (
  payload,
  {
    fetchPayload = _get(global, 'localStorage.getItem'),
    persistPayload = _get(global, 'localStorage.setItem'),
  } = {},
) => {
  const debug = debugLib('debouncePayloadSync');
  const getPayloadProperty = (payload, prop) => _get(payload, `obj.${prop}`);

  const key = getPayloadKey(payload, getPayloadProperty);
  let parsedPreviousPayload = null;
  try {
    const rawPreviousPayload = fetchPayload(key);
    if (rawPreviousPayload) {
      parsedPreviousPayload = JSON.parse(rawPreviousPayload);
    }
  } catch {
    debug('failed to fetch previous payload for debouncing');
  }
  const previousPayload = parsedPreviousPayload || {};

  // Remove undefined fields
  const sanitizedPayload = JSON.parse(JSON.stringify(payload));

  const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
    previousPayload,
    sanitizedPayload,
    getPayloadProperty,
  );
  if (nextPayload) {
    const debouncedPayload = {
      ...nextPayload,
      obj: {
        ...nextPayload.obj,
        traits: newOrUpdatedTraits || nextPayload.obj.traits,
      },
    };
    const previousPayloadToStore = combinePreviousPayloads([
      previousPayload,
      sanitizedPayload,
    ]);
    try {
      persistPayload(key, JSON.stringify(previousPayloadToStore));
    } catch {
      // no-op
    }
    return debouncedPayload;
  }

  return null;
};

/*
 * `debouncePayload` is meant to work with `anayltics-node`. It does not
 * require middleware like the frontend but it does rely on a caching
 * or storage mechanism that the user provides. Similar to
 * `debouncePayloadSync`, it stores previous payloads using the storage
 * mechanism, and compares the `payload` to be sent to Segment/Braze
 * against the previous versions to only send new or updated `traits`.
 * @param {Object} payload The data to be sent to Segment/Braze
 * @param {Function} fetchPayload A function to retrieve previous payloads
 * @param {Function} storePayload A function to store previous payloads
 * @param {Function} options.serializePayload An optional function to
 * override the default serializer
 * @param {Function} options.deserializePayload An optional function to
 * override the default deserialize
 * @return {Object} The debounced payload to send to Braze. If `null`,
 * there is no new or updated data to send.
 * @example
 * ```
 *   import _isNil from 'lodash/isNil';
 *   import Analytics from 'analytics-node';
 *   import memjs from 'memjs';
 *   import { debouncePayload } from 'braze-segment-debounce';
 *
 *   const segmentWriteKey = 'YOUR-SEGMENT-WRITE-KEY';
 *   const analytics = new Analytics(segmentWriteKey);
 *   const cache = memjs.Client.create();
 *   const fetchPayload = async (k) => cache.get(k);
 *   const persistPayload = async (k, v) => {
 *     await cache.set(k, v, { expires: 3600 });
 *   };
 *
 *   const identifyWithDebounce = async (payload) => {
 *     // TODO filter Braze integration, called `AppBoy`, if possible
 *     const identifyPayload = await debouncePayload(
 *       payload,
 *       fetchPayload,
 *       persistPayload,
 *     );
 *     if (!_isNil(identifyPayload)) {
 *       return analytics.identify(identifyPayload);
 *     }
 *     return null;
 *   };
 * ```
 */
export const debouncePayload = async (
  payload,
  fetchPayload,
  persistPayload,
  {
    serializePayload = serializeAsJSONForCache,
    deserializePayload = deserializeFromJSONForCache,
  } = {},
) => {
  const debug = debugLib('debouncePayload');
  const key = getPayloadKey(payload, _get);
  let parsedPreviousPayload = null;
  try {
    const rawPreviousPayload = await fetchPayload(key);
    if (rawPreviousPayload) {
      parsedPreviousPayload = deserializePayload(rawPreviousPayload);
    }
  } catch (storeError) {
    debug('failed to fetch previous payload for debouncing');
  }
  const previousPayload = parsedPreviousPayload || {};

  // Remove undefined fields
  const sanitizedPayload = deserializePayload(serializePayload(payload));

  const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
    previousPayload,
    sanitizedPayload,
    _get,
  );

  if (nextPayload) {
    const debouncedPayload = {
      ...nextPayload,
      traits: newOrUpdatedTraits || nextPayload.traits,
    };
    const previousPayloadToStore = combinePreviousPayloads([
      previousPayload,
      sanitizedPayload,
    ]);
    try {
      await persistPayload(key, serializePayload(previousPayloadToStore));
    } catch {
      debug('failed to store previous payload for debouncing');
    }
    return debouncedPayload;
  }

  return null;
};
