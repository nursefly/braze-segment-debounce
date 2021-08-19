import _get from 'lodash/get';

import { dedupePayloads } from './index';

describe('dedupePayloads', () => {
  test('dedups payload', () => {
    const payload = {
      userId: 1,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const { nextPayload, newOrUpdatedTraits } = dedupePayloads(
      payload,
      payload,
      _get,
    );
    expect(nextPayload).toBe(null);
    expect(newOrUpdatedTraits).toBe(null);
  });

  test('dedups payload with anonymousId', () => {
    const payload = {
      anonymousId: 1,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const { nextPayload, newOrUpdatedTraits } = dedupePayloads(
      payload,
      payload,
      _get,
    );
    expect(nextPayload).toBe(null);
    expect(newOrUpdatedTraits).toBe(null);
  });

  test('dedups payload with traits', () => {
    const payload = {
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const { nextPayload, newOrUpdatedTraits } = dedupePayloads(
      payload,
      payload,
      _get,
    );
    expect(nextPayload).toBe(null);
    expect(newOrUpdatedTraits).toBe(null);
  });

  test('dedups payload with new anonymousId', () => {
    const payload1 = {
      userId: 1,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const payload2 = {
      userId: 1,
      anonymousId: 2,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const { nextPayload, newOrUpdatedTraits } = dedupePayloads(
      payload1,
      payload2,
      _get,
    );
    expect(nextPayload).toEqual(payload2);
    expect(newOrUpdatedTraits).toBe(null);
  });

  test('dedups payload with new traits', () => {
    const payload1 = {
      userId: 1,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const payload2 = {
      userId: 1,
      traits: {
        phoneNumber: '123-45678',
        address: '1 Main St',
      },
    };
    const { nextPayload, newOrUpdatedTraits } = dedupePayloads(
      payload1,
      payload2,
      _get,
    );
    expect(nextPayload).toEqual(payload2);
    expect(newOrUpdatedTraits).toEqual({
      phoneNumber: '123-45678',
      address: '1 Main St',
    });
  });

  test('dedups payload with different traits', () => {
    const payload1 = {
      userId: 1,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const payload2 = {
      userId: 1,
      traits: {
        firstName: 'Test',
        lastName: 'Tester',
      },
    };
    const { nextPayload, newOrUpdatedTraits } = dedupePayloads(
      payload1,
      payload2,
      _get,
    );
    expect(nextPayload).toEqual(payload2);
    expect(newOrUpdatedTraits).toEqual({
      lastName: 'Tester',
    });
  });

  test('dedups payload with different array traits', () => {
    const payload1 = {
      userId: 1,
      traits: {
        colors: ['blue', 'orange', 'red'],
      },
    };
    const payload2 = {
      userId: 1,
      traits: {
        colors: ['blue', 'orange', 'red', 'green'],
      },
    };
    const { nextPayload, newOrUpdatedTraits } = dedupePayloads(
      payload1,
      payload2,
      _get,
    );
    expect(nextPayload).toEqual(payload2);
    expect(newOrUpdatedTraits).toEqual({
      colors: ['blue', 'orange', 'red', 'green'],
    });
  });
});
