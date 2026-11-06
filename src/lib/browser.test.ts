import {
  debouncePayloadSync,
  clearPreviousPayloads,
  type BrowserStorageOptions,
} from './browser';

const globalWithWindow = globalThis as { window?: unknown };

describe('debouncePayloadSync', () => {
  let storage: Record<string, string>;
  let persistPayload: NonNullable<BrowserStorageOptions['persistPayload']>;
  let fetchPayload: NonNullable<BrowserStorageOptions['fetchPayload']>;
  const parseStored = (key: string): unknown =>
    JSON.parse(storage[key] ?? 'null');
  beforeEach(() => {
    storage = {};
    fetchPayload = (k) => storage[k] || null;
    persistPayload = (k, i) => {
      storage[k] = i;
    };
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
    expect(parseStored(key)).toEqual(payload);
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
    expect(parseStored(key)).toEqual(payload);
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
    expect(parseStored(key)).toEqual(payload);
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
    expect(parseStored(key)).toEqual(payload2);
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
    expect(parseStored(key)).toEqual({
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
    expect(parseStored(key)).toEqual(payload2);
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
    expect(parseStored(key)).toEqual(payload2);
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
    expect(parseStored(key)).toEqual(payloads[3]);
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
    expect(parseStored(key)).toEqual(payload2);
    expect(debouncedPayload1).toEqual(payload1);
    expect(debouncedPayload2).toEqual(payload2);
    expect(debouncedPayload3).toEqual(payload1);
    expect(debouncedPayload4).toEqual(payload2);
  });
});

describe('debouncePayloadSync storage eviction', () => {
  test('drops a payload without obj and stores nothing', () => {
    const storage = makeStorage();
    expect(debouncePayloadSync({} as never, storage)).toBe(null);
    expect(storage.items).toEqual({});
  });

  const makeStorage = () => {
    const items: Record<string, string> = {};
    return {
      items,
      fetchPayload: (k: string) => items[k] || null,
      persistPayload: (k: string, v: string) => {
        items[k] = v;
      },
      listPayloadKeys: () => Object.keys(items),
      removePayload: (k: string) => {
        delete items[k];
      },
    };
  };
  const payloadFor = (userId: number, anonymousId: string) => ({
    obj: { userId, anonymousId, traits: { firstName: `User ${userId}` } },
  });

  test('keeps only the current identity payload', () => {
    const storage = makeStorage();
    storage.items['unrelated-key'] = 'kept';

    debouncePayloadSync(payloadFor(1, 'anon-1'), storage);
    debouncePayloadSync(payloadFor(2, 'anon-2'), storage);

    expect(Object.keys(storage.items).sort()).toEqual([
      '2-previousSegmentPayload',
      'unrelated-key',
    ]);
  });

  test('keeps the current payload across repeated identifies', () => {
    const storage = makeStorage();

    debouncePayloadSync(payloadFor(1, 'anon-1'), storage);
    const second = debouncePayloadSync(
      {
        obj: {
          userId: 1,
          anonymousId: 'anon-1',
          traits: { firstName: 'User 1', lastName: 'New' },
        },
      },
      storage,
    );

    expect(second?.obj?.traits).toEqual({ lastName: 'New' });
    expect(Object.keys(storage.items)).toEqual(['1-previousSegmentPayload']);
  });

  test('logs and removes every payload when persisting fails', () => {
    const storage = makeStorage();
    debouncePayloadSync(payloadFor(1, 'anon-1'), storage);
    storage.persistPayload = () => {
      throw new Error('QuotaExceededError');
    };
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      const debounced = debouncePayloadSync(payloadFor(2, 'anon-2'), storage);
      expect(debounced?.obj?.userId).toBe(2);
      expect(Object.keys(storage.items)).toEqual([]);
      expect(consoleError).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  test('stores only the identity and traits of the payload', () => {
    const storage = makeStorage();

    debouncePayloadSync(
      {
        obj: {
          userId: 1,
          anonymousId: 'anon-1',
          traits: { firstName: 'User 1' },
          context: { page: { path: '/home' } },
          messageId: 'ajs-1',
        },
        opts: { timestamp: 'now' },
      },
      storage,
    );

    expect(
      JSON.parse(storage.items['1-previousSegmentPayload'] ?? 'null'),
    ).toEqual({
      obj: {
        userId: 1,
        anonymousId: 'anon-1',
        traits: { firstName: 'User 1' },
      },
    });
  });

  test('skips cleanup when persist is overridden without list and remove', () => {
    const storage = makeStorage();
    const touchLocalStorage = jest.fn(() => {
      throw new Error('must not be called');
    });
    globalWithWindow.window = {
      localStorage: {
        length: 0,
        key: touchLocalStorage,
        removeItem: touchLocalStorage,
      },
    };
    try {
      const custom = {
        fetchPayload: storage.fetchPayload,
        persistPayload: storage.persistPayload,
      };
      debouncePayloadSync(payloadFor(1, 'anon-1'), custom);
      debouncePayloadSync(payloadFor(2, 'anon-2'), custom);
    } finally {
      delete globalWithWindow.window;
    }

    expect(touchLocalStorage).not.toHaveBeenCalled();
    expect(Object.keys(storage.items).sort()).toEqual([
      '1-previousSegmentPayload',
      '2-previousSegmentPayload',
    ]);
  });

  test('cleans localStorage when only fetch is overridden', () => {
    const items: Record<string, string> = {
      '1-previousSegmentPayload': '{}',
      other: 'kept',
    };
    globalWithWindow.window = {
      localStorage: {
        get length() {
          return Object.keys(items).length;
        },
        key: (index: number) => Object.keys(items)[index] ?? null,
        setItem: (k: string, v: string) => {
          items[k] = v;
        },
        removeItem: (k: string) => {
          delete items[k];
        },
      },
    };
    try {
      debouncePayloadSync(payloadFor(2, 'anon-2'), {
        fetchPayload: () => null,
      });
    } finally {
      delete globalWithWindow.window;
    }

    expect(Object.keys(items).sort()).toEqual([
      '2-previousSegmentPayload',
      'other',
    ]);
  });

  test('logs once and skips cleanup for a lone cleanup override', () => {
    const storage = makeStorage();
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    try {
      jest.isolateModules(() => {
        const isolated = require('./browser');
        isolated.debouncePayloadSync(payloadFor(1, 'anon-1'), storage);
        const debounced = isolated.debouncePayloadSync(
          payloadFor(2, 'anon-2'),
          {
            fetchPayload: storage.fetchPayload,
            persistPayload: storage.persistPayload,
            listPayloadKeys: storage.listPayloadKeys,
          },
        );
        expect(debounced?.obj?.userId).toBe(2);
        expect(Object.keys(storage.items).sort()).toEqual([
          '1-previousSegmentPayload',
          '2-previousSegmentPayload',
        ]);
        expect(
          isolated.clearPreviousPayloads({
            listPayloadKeys: storage.listPayloadKeys,
          }),
        ).toEqual([]);
      });
      expect(consoleError).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  test('reads entries stored by earlier versions and rewrites them trimmed', () => {
    const storage = makeStorage();
    storage.items['1-previousSegmentPayload'] = JSON.stringify({
      obj: {
        userId: 1,
        anonymousId: 'anon-1',
        traits: { firstName: 'User 1', lastName: 'Old' },
        context: { page: { path: '/home' } },
        messageId: 'ajs-old',
      },
      opts: { timestamp: 'then' },
      _rawEvent: { traits: { firstName: 'User 1', lastName: 'Old' } },
    });

    const debounced = debouncePayloadSync(
      {
        obj: {
          userId: 1,
          anonymousId: 'anon-1',
          traits: { firstName: 'User 1', lastName: 'New' },
        },
      },
      storage,
    );

    expect(debounced?.obj?.traits).toEqual({ lastName: 'New' });
    expect(
      JSON.parse(storage.items['1-previousSegmentPayload'] ?? 'null'),
    ).toEqual({
      obj: {
        userId: 1,
        anonymousId: 'anon-1',
        traits: { firstName: 'User 1', lastName: 'New' },
      },
    });
  });

  test('ignores listing failures', () => {
    const storage = makeStorage();
    storage.listPayloadKeys = () => {
      throw new Error('unavailable');
    };

    const debounced = debouncePayloadSync(payloadFor(1, 'anon-1'), storage);

    expect(debounced?.obj?.userId).toBe(1);
    expect(Object.keys(storage.items)).toEqual(['1-previousSegmentPayload']);
  });
});

describe('clearPreviousPayloads', () => {
  const makeStorage = () => {
    const items: Record<string, string> = {
      '1-previousSegmentPayload': '{}',
      '2-previousSegmentPayload': '{}',
      'anon-3-previousSegmentPayload': '{}',
      ajs_user_traits: '{}',
    };
    return {
      items,
      listPayloadKeys: () => Object.keys(items),
      removePayload: (k: string) => {
        delete items[k];
      },
    };
  };

  test('removes every payload and nothing else', () => {
    const storage = makeStorage();

    const removed = clearPreviousPayloads(storage);

    expect(removed.sort()).toEqual([
      '1-previousSegmentPayload',
      '2-previousSegmentPayload',
      'anon-3-previousSegmentPayload',
    ]);
    expect(Object.keys(storage.items)).toEqual(['ajs_user_traits']);
  });

  test('keeps the payload for exceptId, whether userId or anonymousId', () => {
    const storage = makeStorage();

    clearPreviousPayloads({ ...storage, exceptId: 2 });
    expect(Object.keys(storage.items).sort()).toEqual([
      '2-previousSegmentPayload',
      'ajs_user_traits',
    ]);

    clearPreviousPayloads({ ...storage, exceptId: 'anon-3' });
    expect(Object.keys(storage.items)).toEqual(['ajs_user_traits']);
  });

  test('uses window.localStorage by default', () => {
    const items: Record<string, string> = {
      '1-previousSegmentPayload': '{}',
      other: 'kept',
    };
    globalWithWindow.window = {
      localStorage: {
        get length() {
          return Object.keys(items).length;
        },
        key: (index: number) => Object.keys(items)[index] ?? null,
        removeItem: (k: string) => {
          delete items[k];
        },
      },
    };
    try {
      expect(clearPreviousPayloads()).toEqual(['1-previousSegmentPayload']);
      expect(Object.keys(items)).toEqual(['other']);
    } finally {
      delete globalWithWindow.window;
    }
  });
});
