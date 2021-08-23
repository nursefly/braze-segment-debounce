import { debouncePayloadSync } from './web';

describe('debouncePayloadSync', () => {
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

  test('debounces payload', () => {
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

    const debouncedPayload1 = debouncePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload2 = debouncePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(debouncedPayload1).toEqual(payload);
    expect(debouncedPayload2).toBe(null);
  });

  test('debounces payload with anonymousId', () => {
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

    const debouncedPayload1 = debouncePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload2 = debouncePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(debouncedPayload1).toEqual(payload);
    expect(debouncedPayload2).toBe(null);
  });

  test('debounces payload with traits', () => {
    const key = `no-id-previousSegmentPayload`;
    const payload = {
      obj: {
        traits: {
          firstName: 'Test',
          lastName: 'User',
        },
      },
    };

    const debouncedPayload1 = debouncePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload2 = debouncePayloadSync(payload, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload);
    expect(debouncedPayload1).toEqual(payload);
    expect(debouncedPayload2).toBe(null);
  });

  test('debounces payload with new anonymousId', () => {
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

    const debouncedPayload1 = debouncePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload2 = debouncePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload2);
  });

  test('debounces payload with new traits', () => {
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

    const debouncedPayload1 = debouncePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload2 = debouncePayloadSync(payload2, {
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
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload2);
  });

  test('debounces payload with different traits', () => {
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

    const debouncedPayload1 = debouncePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload2 = debouncePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload3);
  });

  test('debounces payload with different array traits', () => {
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

    const debouncedPayload1 = debouncePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload2 = debouncePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload2);
  });

  it('debounces payload with multiple calls', () => {
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

    const debouncedPayloads = payloads.map((payload) => {
      return debouncePayloadSync(payload, { fetchPayload, persistPayload });
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payloads[3]);
    expect(debouncedPayloads[0]).toEqual({
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
      expect(debouncedPayloads[i + 1]).toEqual({
        obj: {
          userId,
          traits: {
            uniqueId: i + 1,
          },
        },
      }),
    );
  });

  it('debounces payload with repeated different traits', () => {
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

    const debouncedPayload1 = debouncePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload2 = debouncePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload3 = debouncePayloadSync(payload1, {
      fetchPayload,
      persistPayload,
    });
    const debouncedPayload4 = debouncePayloadSync(payload2, {
      fetchPayload,
      persistPayload,
    });

    expect(Object.keys(storage).length).toBe(1);
    expect(JSON.parse(storage[key])).toEqual(payload2);
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload2);
    expect(debouncedPayload3).toEqual(payload1);
    expect(debouncedPayload4).toEqual(payload2);
  });
});
