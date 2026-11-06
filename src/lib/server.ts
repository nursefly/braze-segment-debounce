import type { Jsonify } from 'type-fest' with { 'resolution-mode': 'import' };
import { debouncePayloads, type Traits } from './index';
import {
  getPayloadKey,
  combinePreviousPayloads,
  type GetPayloadProperty,
  type UnknownRecord,
} from './utils';

export type ServerPayload = {
  userId?: unknown;
  anonymousId?: unknown;
  traits?: unknown;
};

export type FetchPayload<Serialized> = (
  key: string,
) => Promise<Serialized | null | undefined> | Serialized | null | undefined;

export type PersistPayload<Serialized> = (
  key: string,
  serializedPayload: Serialized,
) => Promise<unknown> | unknown;

export type ServerSerializationOptions<Serialized> = {
  serializePayload: (value: unknown) => Serialized;
  deserializePayload: (serializedValue: Serialized) => unknown;
};

const serializeAsJSONForCache = (value: unknown): Buffer =>
  Buffer.from(JSON.stringify(value), 'utf8');

const deserializeFromJSONForCache = (serializedValue: Buffer): unknown =>
  JSON.parse(serializedValue.toString('utf8'));

const defaultSerializationOptions: ServerSerializationOptions<Buffer> = {
  serializePayload: serializeAsJSONForCache,
  deserializePayload: deserializeFromJSONForCache,
};

const getPayloadProperty: GetPayloadProperty<ServerPayload> = (payload, prop) =>
  payload[prop];

/**
 * Resolves to a JSON copy of the payload with only new or updated `traits`, or
 * `null` when there is nothing new to send. Each serializer defaults to the
 * JSON `Buffer` one when omitted.
 */
export function debouncePayload<Payload extends ServerPayload>(
  payload: Payload,
  fetchPayload: FetchPayload<Buffer>,
  persistPayload: PersistPayload<Buffer>,
): Promise<Jsonify<Payload> | null>;
export function debouncePayload<Payload extends ServerPayload, Serialized>(
  payload: Payload,
  fetchPayload: FetchPayload<Serialized>,
  persistPayload: PersistPayload<Serialized>,
  options: ServerSerializationOptions<Serialized>,
): Promise<Jsonify<Payload> | null>;
export async function debouncePayload<
  Payload extends ServerPayload,
  Serialized,
>(
  payload: Payload,
  fetchPayload: FetchPayload<Serialized>,
  persistPayload: PersistPayload<Serialized>,
  options?: ServerSerializationOptions<Serialized>,
): Promise<Jsonify<Payload> | null> {
  const {
    serializePayload = defaultSerializationOptions.serializePayload as unknown as (
      value: unknown,
    ) => Serialized,
    deserializePayload = defaultSerializationOptions.deserializePayload as unknown as (
      serializedValue: Serialized,
    ) => unknown,
  } = (options ?? {}) as Partial<ServerSerializationOptions<Serialized>>;

  const key = getPayloadKey(payload, getPayloadProperty);
  let parsedPreviousPayload: ServerPayload | null = null;
  try {
    const rawPreviousPayload = await fetchPayload(key);
    if (rawPreviousPayload) {
      parsedPreviousPayload = deserializePayload(
        rawPreviousPayload,
      ) as ServerPayload;
    }
  } catch {
    console.error(
      'debouncePayload: failed to fetch previous payload for debouncing',
    );
  }
  const previousPayload: ServerPayload = parsedPreviousPayload || {};

  const sanitizedPayload = deserializePayload(
    serializePayload(payload),
  ) as Jsonify<ServerPayload & Payload>;

  const { nextPayload, newOrUpdatedTraits } = debouncePayloads<ServerPayload>(
    previousPayload,
    sanitizedPayload,
    getPayloadProperty,
  );

  if (nextPayload) {
    const debouncedPayload = {
      ...sanitizedPayload,
      traits: (newOrUpdatedTraits || sanitizedPayload.traits) as
        Traits | undefined,
    } as Jsonify<Payload>;
    const previousPayloadToStore = combinePreviousPayloads<UnknownRecord>([
      previousPayload,
      sanitizedPayload,
    ]);
    try {
      await persistPayload(key, serializePayload(previousPayloadToStore));
    } catch {
      console.error(
        'debouncePayload: failed to store previous payload for debouncing',
      );
    }
    return debouncedPayload;
  }

  return null;
}
