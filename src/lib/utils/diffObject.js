import _transform from 'lodash/transform';
import { isObject, isEqual } from './index';

const _diffObject = (object, base, { diffArray = true } = {}) => {
  const changes = (_object, _base) => {
    let arrayIndexCounter = 0;
    return _transform(_object, (result, value, key) => {
      if (!isEqual(value, _base[key])) {
        let resultKey = key;
        if (Array.isArray(_base)) {
          resultKey = arrayIndexCounter;
          arrayIndexCounter += 1;
        }
        if (diffArray) {
          result[resultKey] =
            isObject(value) && isObject(_base[key])
              ? changes(value, _base[key])
              : value;
        } else {
          result[resultKey] =
            isObject(value) &&
            isObject(_base[key]) &&
            !Array.isArray(value) &&
            !Array.isArray(_base[key])
              ? changes(value, _base[key])
              : value;
        }
      }
    });
  };
  return changes(object, base);
};

/*
 * Returns Finds the differece between two objects
 * @param {Object} object The first object to compare
 * @param {Object} base The object to compare against
 * @param {boolean} options.diffArray Whether to also diff the contents
 * of any Array. Defaults to true.
 */
export const diffObject = (object, base, { diffArray = true } = {}) => {
  const diff = _diffObject(object, base, { diffArray });
  return !Object.keys(diff).length ? null : diff;
};
