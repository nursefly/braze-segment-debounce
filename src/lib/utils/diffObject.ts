import { isObject, isEqual, transform, type TransformResult } from './index';

export type DiffObjectOptions = {
  diffArray?: boolean;
};

const diffObjectRecursively = (
  object: unknown,
  base: unknown,
  { diffArray = true }: DiffObjectOptions = {},
): TransformResult => {
  const changes = (_object: unknown, _base: unknown): TransformResult => {
    let arrayIndexCounter = 0;
    const baseRecord: TransformResult = isObject(_base) ? _base : {};
    return transform(_object, (result, value, key) => {
      const baseValue = baseRecord[key];
      if (!isEqual(value, baseValue)) {
        let resultKey: string | number = key;
        if (Array.isArray(_base)) {
          resultKey = arrayIndexCounter;
          arrayIndexCounter += 1;
        }
        const bothObjects = isObject(value) && isObject(baseValue);
        const bothNonArrays =
          !Array.isArray(value) && !Array.isArray(baseValue);
        result[resultKey] =
          bothObjects && (diffArray || bothNonArrays)
            ? changes(value, baseValue)
            : value;
      }
    });
  };
  return changes(object, base);
};

export const diffObject = (
  object: unknown,
  base: unknown,
  { diffArray = true }: DiffObjectOptions = {},
): TransformResult | null => {
  const diff = diffObjectRecursively(object, base, { diffArray });
  return !Object.keys(diff).length ? null : diff;
};
