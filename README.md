# braze-segment-debounce

Segment utilities to debounce data before it reaches the Braze destination

## Introduction

[Segment](https://segment.com/), among others, provides an integration with
[Braze](https://www.braze.com/) to allow users to easily send data to both
platforms using a reduced number API calls and library/package
installations. Although this is of great efficiency, it has the drawback of
sending every [data point](https://www.braze.com/docs/user_guide/onboarding_with_braze/data_points/)
to Braze. Braze charges $$ for each of these data points, even if the data
points have not changed from the previous version. The goal of this package
is to provide an easy way for Segment/Braze customers to only send data
points that are new or have changed, savings lots of $$ in the process.

Although Segment provides a `Braze Debounce Identify` option on its
dashboard under the `Source -> [Source Name] -> Settings -> Analytics.js`,
this option does not include debouncing against multiple previous payloads.
The [Middleware and examples](https://github.com/segmentio/segment-braze-mobile-middleware)
provided by Braze also suffer from the same problem. **The biggest
advantage of this package is that it stores multiple, previous payloads to
debounce against, greatly saving on costs as compared to the current
solutions**.

This package and its examples focus on the `identify` call sent to
Segment/Braze since it's the most frequently used and the one most likely
to incur costs, but the functions can be applied to any call type.

## Usage

`braze-segment-debounce` supports debouncing for both `web` and `server`. Only
JavaScript/NodeJS is supported on the server side. The mechanisms for `web`
and `server` are similar but have a few, important distinctions. The
package exposes three main functions, `debouncePayloads` (base),
`debouncePayloadSync` (web), `debouncePayload` (server).

### Base

`debouncePayloads` is a base function used by `web` and `server` which takes
two payloads and runs them through the debouncing algorithm.

#### Arguments

- `previousPayload`: the first payload to compare
- `nextPayload`: the other payload to compare
- `getPayloadProperty`: a function to help retrieve the basic values of
  the payload: `userId`, `anonymousId` and `traits`. This is needed because
  the Segment Analytics.js middleware, used in `web`, nests the payload
  inside an `obj` object. But, this is is not true for the server side. The
  function can simply be `lodash`'s `_get` for `server` or `` _get(payload, `obj.${prop}`) ``for`web`.

#### Returns

- `{ nextPayload || null, newOrUpdatedTraits || null }` where
  `nextPayload` is the payload to send to Segment/Braze and
  `newOrUpdatedTraits` are any updates to the `traits` for that payload
  that should be included before it is sent.

#### Example

```
  const { nextPayload, newOrUpdatedTraits } = debouncePayloads(
    previousPayload,
    sanitizedPayload,
    (payload, prop) => _get(payload, `obj.${prop}`),
  );
  if (nextPayload) {
    const debouncedPayload = {
      ...nextPayload,
      obj: {
        ...nextPayload.obj,
        traits: newOrUpdatedTraits || nextPayload.obj.traits,
      },
    };
    // do something smart with `debouncedPayload`
  }
```

#### Note

`debouncePayloads` does not need to be used in most cases, but is exposed to
provide the user with flexibility if she/he needs to expand/replace the
functionality provided by `web` and `server`.

### Web

The integration of frontend portion of this package into Segment is
achieved via the [Analytics.js
Source Middleware](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/middleware/#using-source-middlewares).
Please note that this integration has been tested in production using
[Analytics
2.0](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/)
and we don't recommend using the previous version of Analytics.js.

`debouncePayloadSync` provides a full solution that integrates with the
Analytics.js Source Middleware to debounce data being before it is sent to
the Braze destination. It stores previous payloads in `localStorage`, or a
similar solution which you can override, and compares the `payload`
provided by this middleware against the previous versions to only send new
or updated `traits`.

#### Arguments

- `payload`: the data provided by the middleware
- `options.fetchPayload`: an optional function to override `localStorage.getItem`
- `options.storePayload`: an optional function to override `localStorage.setItem`

#### Returns

- `nextPayload || null`: the debounced payload to send to Braze. If `null`,
  there is no new or updated data to send.

#### Example

```
  const _identifyDebounceSourceMiddleware = ({ payload, next, integrations }) => {
    // TODO filter Braze integration, called `AppBoy`
    if (payload.type() !== 'identify') {
      next(payload);
      return;
    }
    const identifyPayload = debouncePayloadSync(payload);
    if (identifyPayload) {
      next(identifyPayload);
    }
  }
  analytics.addSourceMiddleware(_identifyDebounceSourceMiddleware);
```

### Server

The server-side integration is meant to work with
[anayltics-node](https://www.npmjs.com/package/analytics-node). It does not
require middleware but it does rely on a caching or storage mechanism that
the user provides. Similar to `web`, it stores previous payloads using the
storage mechanism, and compares the `payload` to be sent to Segment/Braze
against the previous versions to only send new or updated `traits`.

#### Arguments

- `payload`: the data to be sent to Segment/Braze
- `fetchPayload`: a function to retrieve previous payloads
- `storePayload`: a function to store previous payloads
- `options.serializePayload`: an optional function to override the default serializer
- `options.deserializePayload`: an optional function to override the default deserializer

#### Returns

- `nextPayload || null`: the debounced payload to send to Braze. If `null`,
  there is no new or updated data to send.

#### Example

```
import _isNil from 'lodash/isNil';
import Analytics from 'analytics-node';
import memjs from 'memjs';
import { debouncePayload } from 'braze-segment-debounce';

const cache = memjs.Client.create();
const analytics = new Analytics(segmentWriteKey);
const fetchPayload = async (k) => cache.get(k);
const persistPayload = async (k, v) => {
  await cache.set(k, v, { expires: 3600 });
};

const identifyWithDebounce = async (payload) => {
  // TODO filter Braze integration, called `AppBoy`, if possible
  const identifyPayload = await debouncePayload(
    payload,
    fetchPayload,
    persistPayload,
  );
  if (!_isNil(identifyPayload)) {
    return analytics.identify(identifyPayload);
  }
  return null;
};
```

## TODO

- [ ] Add details on how to debounce payload only for Braze, known as
      Appboy in the integration.
