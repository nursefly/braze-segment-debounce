import _transform from 'lodash/transform';
import _isEqual from 'lodash/isEqual';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import _isEmpty from 'lodash/isEmpty';

const _diffObject = (object, base, { diffArray = true } = {}) => {
  const changes = (_object, _base) => {
    let arrayIndexCounter = 0;
    return _transform(_object, (result, value, key) => {
      if (!_isEqual(value, _base[key])) {
        let resultKey = key;
        if (_isArray(_base)) {
          resultKey = arrayIndexCounter;
          arrayIndexCounter += 1;
        }
        if (diffArray) {
          result[resultKey] =
            _isObject(value) && _isObject(_base[key])
              ? changes(value, _base[key])
              : value;
        } else {
          result[resultKey] =
            _isObject(value) &&
            _isObject(_base[key]) &&
            !_isArray(value) &&
            !_isArray(_base[key])
              ? changes(value, _base[key])
              : value;
        }
      }
    });
  };
  return changes(object, base);
};

export const diffObject = (object, base, { diffArray = true } = {}) => {
  const diff = _diffObject(object, base, { diffArray });
  return _isEmpty(diff) ? null : diff;
};
