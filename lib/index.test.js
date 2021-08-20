import _get from 'lodash/get';

import { dedupePayloads, dedupePayload, dedupePayloadSync } from './index';

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

describe('dedupePayloadSync', () => {
  let storage;
  let persistPayload;
  let fetchPayload;
  beforeEach(() => {
    storage = {};
    fetchPayload = (k) => storage[k] || null;
    persistPayload = (k, i) => {
      storage[k] = i;
    };
  });
  afterEach(() => {
    storage = null;
  });

  test('dedups payload', () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload = {
      obj: {
        userId,
        traits: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    };

    const dedupedPayload1 = dedupePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload2 = dedupePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(dedupedPayload1).toEqual(payload);
    expect(dedupedPayload2).toBe(null);
  });

  test('dedups payload with anonymousId', () => {
    const anonymousId = 1;
    const key = `${anonymousId}-previousSegmentPayload`;
    const payload = {
      obj: {
        anonymousId,
        traits: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    };

    const dedupedPayload1 = dedupePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload2 = dedupePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(dedupedPayload1).toEqual(payload);
    expect(dedupedPayload2).toBe(null);
  });

  test('dedups payload with traits', () => {
    const key = `no-id-previousSegmentPayload`;
    const payload = {
      obj: {
        traits: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    };

    const dedupedPayload1 = dedupePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload2 = dedupePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(dedupedPayload1).toEqual(payload);
    expect(dedupedPayload2).toBe(null);
  });

  test('dedups payload with new anonymousId', () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      obj: {
        userId,
        traits: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    };
    const payload2 = {
      obj: {
        userId,
        anonymousId: 2,
        traits: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    };

    const dedupedPayload1 = dedupePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload2 = dedupePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload2);
  });

  test('dedups payload with new traits', () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      obj: {
        userId,
        traits: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    };
    const payload2 = {
      obj: {
        userId,
        traits: {
          phoneNumber: '123-45678',
          address: '1 Main St',
        },
      },
    };

    const dedupedPayload1 = dedupePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload2 = dedupePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual({
      obj: {
        ...payload2.obj,
        traits: {
          ...payload2.obj.traits,
          firstName: 'Test',
          lastName: 'User',
        },
      },
    });
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload2);
  });

  test('dedups payload with different traits', () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      obj: {
        userId,
        traits: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    };
    const payload2 = {
      obj: {
        userId,
        traits: {
          firstName: 'Test',
          lastName: 'Tester',
        },
      },
    };
    const payload3 = {
      obj: {
        userId,
        traits: {
          lastName: 'Tester',
        },
      },
    };

    const dedupedPayload1 = dedupePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload2 = dedupePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload3);
  });

  test('dedups payload with different array traits', () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      obj: {
        userId,
        traits: {
          colors: ['blue', 'orange', 'red'],
        },
      },
    };
    const payload2 = {
      obj: {
        userId,
        traits: {
          colors: ['blue', 'orange', 'red', 'green'],
        },
      },
    };

    const dedupedPayload1 = dedupePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload2 = dedupePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload2);
  });

  it('dedups payload with multiple calls', () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payloads = [...Array(4)].map((_, i) => ({
      obj: {
        userId,
        traits: {
          firstName: 'Test',
          lastName: 'Tester',
          uniqueId: i,
        },
      },
    }));

    const dedupedPayloads = payloads.map((payload) => {
      return dedupePayloadSync(payload, { fetchPayload, persistPayload });
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payloads[3]);
    expect(dedupedPayloads[0]).toEqual({
      obj: {
        userId,
        traits: {
          firstName: 'Test',
          lastName: 'Tester',
          uniqueId: 0,
        },
      },
    });
    [...Array(3)].forEach((_, i) =>
      expect(dedupedPayloads[i + 1]).toEqual({
        obj: {
          userId,
          traits: {
            uniqueId: i + 1,
          },
        },
      }),
    );
  });

  it('dedups payload with repeated different traits', () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload1 = {
      obj: {
        userId,
        traits: {
          color: 'blue',
        },
      },
    };
    const payload2 = {
      obj: {
        userId,
        traits: {
          color: 'orange',
        },
      },
    };

    const dedupedPayload1 = dedupePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload2 = dedupePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload3 = dedupePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const dedupedPayload4 = dedupePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload2);
    expect(dedupedPayload3).toEqual(payload1);
    expect(dedupedPayload4).toEqual(payload2);
  });
});

describe('dedupePayload', () => {
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

  test('dedups payload', async () => {
    const userId = 1;
    const key = `${userId}-previousSegmentPayload`;
    const payload = {
      userId,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };

    const dedupedPayload1 = await dedupePayload(
      payload,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload2 = await dedupePayload(
      payload,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(dedupedPayload1).toEqual(payload);
    expect(dedupedPayload2).toBe(null);
  });

  test('dedups payload with anonymousId', async () => {
    const anonymousId = 1;
    const key = `${anonymousId}-previousSegmentPayload`;
    const payload = {
      anonymousId,
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };

    const dedupedPayload1 = await dedupePayload(
      payload,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload2 = await dedupePayload(
      payload,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(dedupedPayload1).toEqual(payload);
    expect(dedupedPayload2).toBe(null);
  });

  test('dedups payload with traits', async () => {
    const key = `no-id-previousSegmentPayload`;
    const payload = {
      traits: {
        firstName: 'Test',
        lastName: 'User',
      },
    };

    const dedupedPayload1 = await dedupePayload(
      payload,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload2 = await dedupePayload(
      payload,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(dedupedPayload1).toEqual(payload);
    expect(dedupedPayload2).toBe(null);
  });

  test('dedups payload with new anonymousId', async () => {
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

    const dedupedPayload1 = await dedupePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload2 = await dedupePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload2);
  });

  test('dedups payload with new traits', async () => {
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

    const dedupedPayload1 = await dedupePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload2 = await dedupePayload(
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
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload2);
  });

  test('dedups payload with different traits', async () => {
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

    const dedupedPayload1 = await dedupePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload2 = await dedupePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload3);
  });

  test('dedups payload with different array traits', async () => {
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

    const dedupedPayload1 = await dedupePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload2 = await dedupePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload2);
  });

  it('dedups payload with multiple calls', async () => {
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

    const dedupedPayloads = [];
    for (const payload of payloads) {
      const dedupedPayload = await dedupePayload(
        payload,
        fetchPayload,
        persistPayload,
      );
      dedupedPayloads.push(dedupedPayload);
    }

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payloads[3]);
    expect(dedupedPayloads[0]).toEqual({
      userId,
      traits: {
        firstName: 'Test',
        lastName: 'Tester',
        uniqueId: 0,
      },
    });
    [...Array(3)].forEach((_, i) =>
      expect(dedupedPayloads[i + 1]).toEqual({
        userId,
        traits: {
          uniqueId: i + 1,
        },
      }),
    );
  });

  it('dedups payload with repeated different traits', async () => {
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

    const dedupedPayload1 = await dedupePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload2 = await dedupePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload3 = await dedupePayload(
      payload1,
      fetchPayload,
      persistPayload,
    );
    const dedupedPayload4 = await dedupePayload(
      payload2,
      fetchPayload,
      persistPayload,
    );

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(dedupedPayload1).toEqual(payload1);
    expect(dedupedPayload2).toEqual(payload2);
    expect(dedupedPayload3).toEqual(payload1);
    expect(dedupedPayload4).toEqual(payload2);
  });
});
