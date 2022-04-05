import { debouncePayloads } from './index';

const getPayloadProperty = (payload, prop) => payload[prop];

describe('debouncePayloads', () => {
  test('debounces payload', () => {
    const payload = {
      userId: 1,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
      payload,
      payload,
      getPayloadProperty,
    );
    expect(nextPayload).toBe(null);
    expect(newOrUpdatedTraits).toBe(null);
  });

  test('debounces payload with anonymousId', () => {
    const payload = {
      anonymousId: 1,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
      payload,
      payload,
      getPayloadProperty,
    );
    expect(nextPayload).toBe(null);
    expect(newOrUpdatedTraits).toBe(null);
  });

  test('debounces payload with traits', () => {
    const payload = {
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
      payload,
      payload,
      getPayloadProperty,
    );
    expect(nextPayload).toBe(null);
    expect(newOrUpdatedTraits).toBe(null);
  });

  test('debounces payload with new anonymousId', () => {
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
    const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
      payload1,
      payload2,
      getPayloadProperty,
    );
    expect(nextPayload).toEqual(payload2);
    expect(newOrUpdatedTraits).toBe(null);
  });

  test('debounces payload with new traits', () => {
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
    const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
      payload1,
      payload2,
      getPayloadProperty,
    );
    expect(nextPayload).toEqual(payload2);
    expect(newOrUpdatedTraits).toEqual({
      phoneNumber: '123-45678',
      address: '1 Main St',
    });
  });

  test('debounces payload with different traits', () => {
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
    const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
      payload1,
      payload2,
      getPayloadProperty,
    );
    expect(nextPayload).toEqual(payload2);
    expect(newOrUpdatedTraits).toEqual({
      lastName: 'Tester',
    });
  });

  test('debounces payload with different array traits', () => {
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
    const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
      payload1,
      payload2,
      getPayloadProperty,
    );
    expect(nextPayload).toEqual(payload2);
    expect(newOrUpdatedTraits).toEqual({
      colors: ['blue', 'orange', 'red', 'green'],
    });
  });
});
