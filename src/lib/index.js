import { diffObject } from './utils/diffObject';

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
 *   import { debouncePayloads } from 'braze-segment-debounce';
 *
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
  if (!(nextPayload == null) && !(previousPayload == null)) {
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
    if (newOrUpdatedTraits == null) {
      return { nextPayload: null, newOrUpdatedTraits };
    }

    // Braze charges for every trait sent to it even if that trait isn't
    // changed. So we only want to include traits that have changed in the
    // final payload.
    return { nextPayload, newOrUpdatedTraits };
  }
  return { nextPayload, newOrUpdatedTraits };
};
