import _get from 'lodash/get';
import _isNil from 'lodash/isNil';
import _merge from 'lodash/merge';
import debugLib from 'debug';

import { diffObject } from './utils/diffObject';

/**
 * @param {object|array|null|string|number} value
 * @return {Buffer}
 */
const serializeAsJSONForCache = (value) => {
  return Buffer.from(JSON.stringify(value), 'utf8');
};

/**
 * @param {Buffer} serializedValue
 * @return {object|array|null|string|number}
 */
const deserializeFromJSONForCache = (serializedValue) => {
  return JSON.parse(serializedValue.toString('utf8'));
};

const getPayloadKey = (payload, getPayloadProperty) => {
  const userId = getPayloadProperty(payload, 'userId');
  const anonymousId = getPayloadProperty(payload, 'anonymousId');
  return `${userId || anonymousId || 'no-id'}-previousSegmentPayload`;
};

const combinePreviousPayloads = (previousPayloads) => {
  return previousPayloads.reduce((combinedPayload, previousPayload) => {
    combinedPayload = _merge(combinedPayload, previousPayload);
    return combinedPayload;
  }, {});
};

export const dedupePayloads = (
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

export const dedupePayloadSync = (
  payload,
  {
    fetchPayload = _get(global, 'localStorage.getItem'),
    persistPayload = _get(global, 'localStorage.setItem'),
  } = {},
) => {
  const debug = debugLib('dedupePayloadSync');
  const getPayloadProperty = (payload, prop) => _get(payload, `obj.${prop}`);

  const key = getPayloadKey(payload, getPayloadProperty);
  let parsedPreviousPayload = null;
  try {
    const rawPreviousPayload = fetchPayload(key);
    if (rawPreviousPayload) {
      parsedPreviousPayload = JSON.parse(rawPreviousPayload);
    }
  } catch {
    debug('failed to fetch previous payload for deduping');
  }
  const previousPayload = parsedPreviousPayload || {};

  // Remove undefined fields
  const sanitizedPayload = JSON.parse(JSON.stringify(payload));

  const { nextPayload, newOrUpdatedTraits } = dedupePayloads(
    previousPayload,
    sanitizedPayload,
    getPayloadProperty,
  );
  if (nextPayload) {
    const dedupedPayload = {
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
    return dedupedPayload;
  }

  return null;
};

export const dedupePayload = async (
  payload,
  fetchPayload,
  persistPayload,
  {
    serializePayload = serializeAsJSONForCache,
    deserializePayload = deserializeFromJSONForCache,
  } = {},
) => {
  const debug = debugLib('dedupePayload');
  const key = getPayloadKey(payload, _get);
  let parsedPreviousPayload = null;
  try {
    const rawPreviousPayload = await fetchPayload(key);
    if (rawPreviousPayload) {
      parsedPreviousPayload = deserializePayload(rawPreviousPayload);
    }
  } catch (storeError) {
    debug('failed to fetch previous payload for deduping');
  }
  const previousPayload = parsedPreviousPayload || {};

  // Remove undefined fields
  const sanitizedPayload = deserializePayload(serializePayload(payload));

  const { nextPayload, newOrUpdatedTraits } = dedupePayloads(
    previousPayload,
    sanitizedPayload,
    _get,
  );

  if (nextPayload) {
    const dedupedPayload = {
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
      debug('failed to store previous payload for deduping');
    }
    return dedupedPayload;
  }

  return null;
};
