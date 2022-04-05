import _transform from 'lodash/transform';

const isObject = (value) => {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
};

const isEqual = function (a, b) {
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
