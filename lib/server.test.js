import { debouncePayload } from './server';

describe('debouncePayload', () => {
  let storage;
  let persistPayload;
  let fetchPayload;
  beforeEach(() => {
    storage = {};
    fetchPayload = async (k) => storage[k] || null;
    persistPayload = async (k, i) => {
      storage[k] = i;
    };
  });
  afterEach(() => {
    storage = null;
  });

  test('debounces payload', async () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload = {
      userId,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };

    const debouncedPayload1 = await debouncePayload(
      payload,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload2 = await debouncePayload(
      payload,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(debouncedPayload1).toEqual(payload);
    expect(debouncedPayload2).toBe(null);
  });

  test('debounces payload with anonymousId', async () => {
    const anonymousId = 1;
    const key = `${anonymousId}-previousSegmentPayload`;
    const payload = {
      anonymousId,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };

    const debouncedPayload1 = await debouncePayload(
      payload,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload2 = await debouncePayload(
      payload,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(debouncedPayload1).toEqual(payload);
    expect(debouncedPayload2).toBe(null);
  });

  test('debounces payload with traits', async () => {
    const key = `no-id-previousSegmentPayload`;
    const payload = {
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };

    const debouncedPayload1 = await debouncePayload(
      payload,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload2 = await debouncePayload(
      payload,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(debouncedPayload1).toEqual(payload);
    expect(debouncedPayload2).toBe(null);
  });

  test('debounces payload with new anonymousId', async () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      userId,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const payload2 = {
      userId,
      anonymousId: 2,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };

    const debouncedPayload1 = await debouncePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload2 = await debouncePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload2);
  });

  test('debounces payload with new traits', async () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      userId,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const payload2 = {
      userId,
      traits: {
        phoneNumber: '123-45678',
        address: '1 Main St',
      },
    };

    const debouncedPayload1 = await debouncePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload2 = await debouncePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual({
      ...payload2,
      traits: {
        ...payload2.traits,
        firstName: 'Test',
        lastName: 'User',
      },
    });
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload2);
  });

  test('debounces payload with different traits', async () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      userId,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };
    const payload2 = {
      userId,
      traits: {
        firstName: 'Test',
        lastName: 'Tester',
      },
    };
    const payload3 = {
      userId,
      traits: {
        lastName: 'Tester',
      },
    };

    const debouncedPayload1 = await debouncePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload2 = await debouncePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload3);
  });

  test('debounces payload with different array traits', async () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      userId,
      traits: {
        colors: ['blue', 'orange', 'red'],
      },
    };
    const payload2 = {
      userId,
      traits: {
        colors: ['blue', 'orange', 'red', 'green'],
      },
    };

    const debouncedPayload1 = await debouncePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload2 = await debouncePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload2);
  });

  it('debounces payload with multiple calls', async () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payloads = [...Array(4)].map((_, i) => ({
      userId,
      traits: {
        firstName: 'Test',
        lastName: 'Tester',
        uniqueId: i,
      },
    }));

    const debouncedPayloads = [];
    for (const payload of payloads) {
      const debouncedPayload = await debouncePayload(
        payload,
        fetchPayload,
        persistPayload,
      );
      debouncedPayloads.push(debouncedPayload);
    }

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payloads[3]);
    expect(debouncedPayloads[0]).toEqual({
      userId,
      traits: {
        firstName: 'Test',
        lastName: 'Tester',
        uniqueId: 0,
      },
    });
    [...Array(3)].forEach((_, i) =>
      expect(debouncedPayloads[i + 1]).toEqual({
        userId,
        traits: {
          uniqueId: i + 1,
        },
      }),
    );
  });

  it('debounces payload with repeated different traits', async () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      userId,
      traits: {
        color: 'blue',
      },
    };
    const payload2 = {
      userId,
      traits: {
        color: 'orange',
      },
    };

    const debouncedPayload1 = await debouncePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload2 = await debouncePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload3 = await debouncePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const debouncedPayload4 = await debouncePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload2);
    expect(debouncedPayload3).toEqual(payload1);
    expect(debouncedPayload4).toEqual(payload2);
  });
});
