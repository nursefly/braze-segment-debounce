export type UnknownRecord = Record<string, unknown>;

export type PayloadProperty = 'userId' | 'anonymousId' | 'traits';

export type GetPayloadProperty<Payload> = (
  payload: Payload,
  prop: PayloadProperty,
) => unknown;

export const isObject = (value: unknown): value is UnknownRecord => {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
};

export const isEqual = (a: unknown, b: unknown): boolean => {
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

export const merge = <Target extends UnknownRecord>(
  target: Target,
  source: UnknownRecord,
): Target => {
  const result: UnknownRecord = target;
  for (const prop in source) {
    const targetValue = result[prop];
    const sourceValue = source[prop];
    if (isObject(targetValue) && isObject(sourceValue)) {
      result[prop] = merge(targetValue, sourceValue);
      continue;
    }
    result[prop] = sourceValue;
  }
  return target;
};

export type TransformResult = Record<string | number, unknown>;

export const transform = (
  object: unknown,
  fn: (accumulator: TransformResult, value: unknown, prop: string) => void,
  accumulator: TransformResult | null = null,
): TransformResult => {
  const result: TransformResult =
    accumulator ??
    (Array.isArray(object) ? ([] as unknown as TransformResult) : {});
  if (isObject(object)) {
    for (const prop in object) {
      fn(result, object[prop], prop);
    }
  }
  return result;
};

export const PAYLOAD_KEY_SUFFIX = '-previousSegmentPayload';

export const getPayloadKeyForId = (id: unknown): string =>
  `${id || 'no-id'}${PAYLOAD_KEY_SUFFIX}`;

export const isPayloadKey = (key: unknown): key is string =>
  typeof key === 'string' && key.endsWith(PAYLOAD_KEY_SUFFIX);

export const getPayloadKey = <Payload>(
  payload: Payload,
  getPayloadProperty: GetPayloadProperty<Payload>,
): string => {
  const userId = getPayloadProperty(payload, 'userId');
  const anonymousId = getPayloadProperty(payload, 'anonymousId');
  return getPayloadKeyForId(userId || anonymousId);
};

export const combinePreviousPayloads = <Payload extends UnknownRecord>(
  previousPayloads: Payload[],
): Payload =>
  previousPayloads.reduce(
    (combinedPayload, previousPayload) =>
      merge(combinedPayload, previousPayload),
    {} as Payload,
  );
