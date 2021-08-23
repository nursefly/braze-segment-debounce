import _get from 'lodash/get';
import debugLib from 'debug';

import { debouncePayloads } from './index';
import { getPayloadKey, combinePreviousPayloads } from './utils';

/**
 * `debouncePayloadSync` provides a full solution that integrates with the
 * Analytics.js Source Middleware to debounce data before it is sent
 * to the Braze destination. It stores previous payloads in `localStorage`,
 * or a similar solution which you can override, and compares the `payload`
 * provided by this middleware against the previous versions so that it
 * only sends new or updated `traits`.
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
