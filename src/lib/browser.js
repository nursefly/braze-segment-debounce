import { debouncePayloads } from './index';
import {
  getPayloadKey,
  getPayloadKeyForId,
  isPayloadKey,
  combinePreviousPayloads,
} from './utils';

const requireLocalStorage = (optionName) => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  throw new Error(
    `Unable to access localStorage outside of a browser environment by default. Please specify ${optionName}.`,
  );
};

const defaultFetchPayload = (key) =>
  requireLocalStorage('fetchPayload').getItem(key);

const defaultPersistPayload = (key, serializedPayload) =>
  requireLocalStorage('persistPayload').setItem(key, serializedPayload);

const defaultListPayloadKeys = () => {
  const storage = requireLocalStorage('listPayloadKeys');
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    keys.push(storage.key(index));
  }
  return keys;
};

const defaultRemovePayload = (key) =>
  requireLocalStorage('removePayload').removeItem(key);

const noopListPayloadKeys = () => [];
const noopRemovePayload = () => {};

const noopCleanupStore = {
  listPayloadKeys: noopListPayloadKeys,
  removePayload: noopRemovePayload,
};

const defaultCleanupStore = {
  listPayloadKeys: defaultListPayloadKeys,
  removePayload: defaultRemovePayload,
};

let warnedAboutLoneOverride = false;

const resolveCleanupStore = ({ listPayloadKeys, removePayload, fallback }) => {
  if (listPayloadKeys && removePayload) {
    return { listPayloadKeys, removePayload };
  }
  if (listPayloadKeys || removePayload) {
    if (!warnedAboutLoneOverride) {
      warnedAboutLoneOverride = true;
      console.error(
        'braze-segment-debounce: listPayloadKeys and removePayload must be overridden together; skipping stale payload cleanup.',
      );
    }
    return noopCleanupStore;
  }
  return fallback;
};

const getPayloadProperty = (payload, prop) => payload?.obj?.[prop];

const toStoredPayload = (payload) => ({
  obj: {
    userId: getPayloadProperty(payload, 'userId'),
    anonymousId: getPayloadProperty(payload, 'anonymousId'),
    traits: getPayloadProperty(payload, 'traits'),
  },
});

const removePayloadKeys = ({ keptKey, listPayloadKeys, removePayload }) => {
  const removedKeys = [];
  let keys = [];
  try {
    keys = listPayloadKeys();
  } catch {
    return removedKeys;
  }
  keys.forEach((key) => {
    if (!isPayloadKey(key) || key === keptKey) {
      return;
    }
    try {
      removePayload(key);
      removedKeys.push(key);
    } catch {
      // no-op
    }
  });
  return removedKeys;
};

/**
 * Removes every payload stored by `debouncePayloadSync`, optionally keeping
 * the one for a single `userId` or `anonymousId`.
 * @param {string|number|null} options.exceptId A `userId` or `anonymousId` whose payload is kept
 * @param {Function} options.listPayloadKeys Optional override for listing `localStorage` keys; pass with `removePayload`
 * @param {Function} options.removePayload Optional override for `localStorage.removeItem`; pass with `listPayloadKeys`
 * @return {string[]} The removed keys
 */
export const clearPreviousPayloads = ({
  exceptId = null,
  listPayloadKeys,
  removePayload,
} = {}) =>
  removePayloadKeys({
    keptKey: exceptId === null ? null : getPayloadKeyForId(exceptId),
    ...resolveCleanupStore({
      listPayloadKeys,
      removePayload,
      fallback: defaultCleanupStore,
    }),
  });

/**
 * `debouncePayloadSync` provides a full solution that integrates with the
 * Analytics.js Source Middleware to debounce data before it is sent
 * to the Braze destination. It stores previous payloads in `localStorage`,
 * or a similar solution which you can override, and compares the `payload`
 * provided by this middleware against the previous versions so that it
 * only sends new or updated `traits`.
 * @param {Object} payload The data provided by the Analytics.js middleware
 * @param {Function} options.fetchPayload An optional function to override `localStorage.getItem`
 * @param {Function} options.persistPayload An optional function to override `localStorage.setItem`
 * @param {Function} options.listPayloadKeys Optional override for listing `localStorage` keys; pass with `removePayload`
 * @param {Function} options.removePayload Optional override for `localStorage.removeItem`; pass with `listPayloadKeys`.
 * Overriding `persistPayload` without these two disables stale payload removal.
 * @return {Object} The debounced payload to send to Braze. If `null`,
 * there is no new or updated data to send.
 * @example
 * ```
 *   import { debouncePayloadSync } from 'braze-segment-debounce/browser';
 *
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
    fetchPayload = defaultFetchPayload,
    persistPayload = defaultPersistPayload,
    listPayloadKeys: listPayloadKeysOverride,
    removePayload: removePayloadOverride,
  } = {},
) => {
  const { listPayloadKeys, removePayload } = resolveCleanupStore({
    listPayloadKeys: listPayloadKeysOverride,
    removePayload: removePayloadOverride,
    fallback:
      persistPayload === defaultPersistPayload
        ? defaultCleanupStore
        : noopCleanupStore,
  });

  const key = getPayloadKey(payload, getPayloadProperty);
  let parsedPreviousPayload = null;
  try {
    const rawPreviousPayload = fetchPayload(key);
    if (rawPreviousPayload) {
      parsedPreviousPayload = JSON.parse(rawPreviousPayload);
    }
  } catch {
    console.error(
      'debouncePayloadSync: failed to fetch previous payload for debouncing',
    );
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
    const previousPayloadToStore = toStoredPayload(
      combinePreviousPayloads([previousPayload, sanitizedPayload]),
    );
    removePayloadKeys({ keptKey: key, listPayloadKeys, removePayload });
    try {
      persistPayload(key, JSON.stringify(previousPayloadToStore));
    } catch {
      console.error(
        'debouncePayloadSync: failed to persist previous payload for debouncing',
      );
      removePayloadKeys({ keptKey: null, listPayloadKeys, removePayload });
    }
    return debouncedPayload;
  }

  return null;
};
