import type { Jsonify } from 'type-fest' with { 'resolution-mode': 'import' };
import { debouncePayloads, type Traits } from './index';
import {
  getPayloadKey,
  getPayloadKeyForId,
  isPayloadKey,
  combinePreviousPayloads,
  type GetPayloadProperty,
  type UnknownRecord,
} from './utils';

export type BrowserPayload = {
  obj: {
    userId?: unknown;
    anonymousId?: unknown;
    traits?: unknown;
  };
};

export type PayloadCleanupStore = {
  listPayloadKeys: () => string[];
  removePayload: (key: string) => void;
};

export type PayloadCleanupOptions =
  PayloadCleanupStore | { listPayloadKeys?: never; removePayload?: never };

export type BrowserStorageOptions = {
  fetchPayload?: (key: string) => string | null | undefined;
  persistPayload?: (key: string, serializedPayload: string) => void;
} & PayloadCleanupOptions;

export type ClearPreviousPayloadsOptions = {
  exceptId?: string | number | null;
} & PayloadCleanupOptions;

type StoredPayload = {
  obj: {
    userId: unknown;
    anonymousId: unknown;
    traits: unknown;
  };
};

const requireLocalStorage = (optionName: string): Storage => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  throw new Error(
    `Unable to access localStorage outside of a browser environment by default. Please specify ${optionName}.`,
  );
};

const defaultFetchPayload = (key: string) =>
  requireLocalStorage('fetchPayload').getItem(key);

const defaultPersistPayload = (key: string, serializedPayload: string) =>
  requireLocalStorage('persistPayload').setItem(key, serializedPayload);

const defaultListPayloadKeys = () => {
  const storage = requireLocalStorage('listPayloadKeys');
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key !== null) {
      keys.push(key);
    }
  }
  return keys;
};

const defaultRemovePayload = (key: string) =>
  requireLocalStorage('removePayload').removeItem(key);

const noopCleanupStore: PayloadCleanupStore = {
  listPayloadKeys: () => [],
  removePayload: () => {},
};

const defaultCleanupStore: PayloadCleanupStore = {
  listPayloadKeys: defaultListPayloadKeys,
  removePayload: defaultRemovePayload,
};

let warnedAboutLoneOverride = false;

const resolveCleanupStore = ({
  listPayloadKeys,
  removePayload,
  fallback,
}: Partial<PayloadCleanupStore> & {
  fallback: PayloadCleanupStore;
}): PayloadCleanupStore => {
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

const getPayloadProperty: GetPayloadProperty<Partial<BrowserPayload>> = (
  payload,
  prop,
) => payload?.obj?.[prop];

const toStoredPayload = (payload: Partial<BrowserPayload>): StoredPayload => ({
  obj: {
    userId: getPayloadProperty(payload, 'userId'),
    anonymousId: getPayloadProperty(payload, 'anonymousId'),
    traits: getPayloadProperty(payload, 'traits'),
  },
});

const removePayloadKeys = ({
  keptKey,
  listPayloadKeys,
  removePayload,
}: PayloadCleanupStore & { keptKey: string | null }): string[] => {
  const removedKeys: string[] = [];
  let keys: string[] = [];
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
    } catch {}
  });
  return removedKeys;
};

export const clearPreviousPayloads = ({
  exceptId = null,
  listPayloadKeys,
  removePayload,
}: ClearPreviousPayloadsOptions = {}): string[] =>
  removePayloadKeys({
    keptKey: exceptId === null ? null : getPayloadKeyForId(exceptId),
    ...resolveCleanupStore({
      listPayloadKeys,
      removePayload,
      fallback: defaultCleanupStore,
    }),
  });

/**
 * Returns a JSON copy of the payload with only new or updated `traits`, or
 * `null` when there is nothing new to send. Overriding `persistPayload`
 * without `listPayloadKeys` and `removePayload` disables stale payload removal.
 */
export const debouncePayloadSync = <Payload extends BrowserPayload>(
  payload: Payload,
  {
    fetchPayload = defaultFetchPayload,
    persistPayload = defaultPersistPayload,
    listPayloadKeys: listPayloadKeysOverride,
    removePayload: removePayloadOverride,
  }: BrowserStorageOptions = {},
): Jsonify<Payload> | null => {
  const { listPayloadKeys, removePayload } = resolveCleanupStore({
    listPayloadKeys: listPayloadKeysOverride,
    removePayload: removePayloadOverride,
    fallback:
      persistPayload === defaultPersistPayload
        ? defaultCleanupStore
        : noopCleanupStore,
  });

  const key = getPayloadKey(payload, getPayloadProperty);
  let parsedPreviousPayload: Partial<BrowserPayload> | null = null;
  try {
    const rawPreviousPayload = fetchPayload(key);
    if (rawPreviousPayload) {
      parsedPreviousPayload = JSON.parse(
        rawPreviousPayload,
      ) as Partial<BrowserPayload>;
    }
  } catch {
    console.error(
      'debouncePayloadSync: failed to fetch previous payload for debouncing',
    );
  }
  const previousPayload: Partial<BrowserPayload> = parsedPreviousPayload || {};

  const sanitizedPayload = JSON.parse(JSON.stringify(payload)) as Jsonify<
    BrowserPayload & Payload
  >;

  const { nextPayload, newOrUpdatedTraits } = debouncePayloads<
    Partial<BrowserPayload>
  >(previousPayload, sanitizedPayload, getPayloadProperty);
  if (nextPayload) {
    const debouncedPayload = {
      ...sanitizedPayload,
      obj: {
        ...sanitizedPayload.obj,
        traits: (newOrUpdatedTraits || sanitizedPayload.obj.traits) as
          Traits | undefined,
      },
    } as Jsonify<Payload>;
    const previousPayloadToStore = toStoredPayload(
      combinePreviousPayloads<UnknownRecord>([
        previousPayload,
        sanitizedPayload,
      ]),
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
