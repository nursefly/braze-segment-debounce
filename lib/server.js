import _get from 'lodash/get';
import debugLib from 'debug';

import { debouncePayloads } from './index';
import { getPayloadKey, combinePreviousPayloads } from './utils';

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

/*
 * `debouncePayload` is meant to work with `anayltics-node`. It does not
 * require middleware like the frontend but it does rely on a caching
 * or storage mechanism that the user provides. Similar to
 * `debouncePayloadSync`, it stores previous payloads using the storage
 * mechanism, and compares the `payload` to be sent to Segment/Braze
 * against the previous versions so that it only sends new or updated
 * `traits`.
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
 *   import { debouncePayload } from 'braze-segment-debounce/server';
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
