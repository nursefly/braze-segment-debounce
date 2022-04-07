import { diffObject } from './diffObject';

const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj));

test('diffs different objects', () => {
  const obj1 = {
    id: 1,
    email: 'test@user',
    name: {
      first: 'Test',
      last: 'User',
    },
    preferences: [
      { name: 'first' },
      { name: 'second' },
      { stage: { fourth: 'sixth' } },
      { stage: { seventh: 'eighth' } },
      { stage: { ninth: 'tenth' } },
    ],
    requirements: {
      first: ['one', 'two', 'three'],
      second: ['four', 'five', 'six'],
      tenth: 'eleven',
    },
    songs: {
      fee: null,
    },
    tests: undefined, // eslint-disable-line no-undefined
  };

  const obj2 = {
    id: 2,
    email: 'test@guest',
    name: {
      first: 'Test',
      last: 'Guest',
    },
    preferences: [
      { name: 'first' },
      { name: 'third' },
      { stage: { fourth: 'fifth' } },
      { stage: { seventh: 'eighth' } },
    ],
    requirements: {
      first: ['one', 'two', 'three', 'four'],
      third: ['seven', 'eight', 'nine'],
      tenth: 'twelve',
    },
    songs: {
      fo: null,
      fi: 'fum',
    },
    tests: {
      foo: {
        bar: 'baz',
      },
    },
  };

  const obj1Clone = cloneDeep(obj1);
  const obj2Clone = cloneDeep(obj2);

  const diff = diffObject(obj2, obj1);
  expect(diff).toEqual({
    id: 2,
    email: 'test@guest',
    name: {
      last: 'Guest',
    },
    preferences: [{ name: 'third' }, { stage: { fourth: 'fifth' } }],
    requirements: {
      first: ['four'],
      third: ['seven', 'eight', 'nine'],
      tenth: 'twelve',
    },
    songs: {
      fo: null,
      fi: 'fum',
    },
    tests: {
      foo: {
        bar: 'baz',
      },
    },
  });
  expect(obj1).toEqual(obj1Clone);
  expect(obj2).toEqual(obj2Clone);
});

test('does not diff equal objects', () => {
  const obj1 = {
    id: 1,
    email: 'test@user',
    name: {
      first: 'Test',
      last: 'User',
    },
    preferences: [
      { name: 'first' },
      { name: 'second' },
      { stage: { fourth: 'sixth' } },
      { stage: { seventh: 'eighth' } },
      { stage: { ninth: 'tenth' } },
    ],
    requirements: {
      first: ['one', 'two', 'three'],
      second: ['four', 'five', 'six'],
      tenth: 'eleven',
    },
    songs: {
      fee: null,
    },
    tests: undefined, // eslint-disable-line no-undefined
  };

  const obj2 = {
    id: 1,
    email: 'test@user',
    name: {
      first: 'Test',
      last: 'User',
    },
    preferences: [
      { name: 'first' },
      { name: 'second' },
      { stage: { fourth: 'sixth' } },
      { stage: { seventh: 'eighth' } },
      { stage: { ninth: 'tenth' } },
    ],
    requirements: {
      first: ['one', 'two', 'three'],
      second: ['four', 'five', 'six'],
      tenth: 'eleven',
    },
    songs: {
      fee: null,
    },
    tests: undefined, // eslint-disable-line no-undefined
  };

  const obj1Clone = cloneDeep(obj1);
  const obj2Clone = cloneDeep(obj2);

  const diff = diffObject(obj2, obj1);
  expect(diff).toEqual(null);
  expect(obj1).toEqual(obj1Clone);
  expect(obj2).toEqual(obj2Clone);
});

test('does not diff array', () => {
  const obj1 = {
    first: ['one', 'two'],
  };

  const obj2 = {
    first: ['one', 'two', 'three'],
  };

  const diff = diffObject(obj2, obj1, { diffArray: false });
  expect(diff).toEqual({
    first: ['one', 'two', 'three'],
  });
});
