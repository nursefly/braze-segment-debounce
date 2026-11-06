import { diffObject } from './utils/diffObject';
import type { GetPayloadProperty, UnknownRecord } from './utils';

export type { GetPayloadProperty, PayloadProperty } from './utils';

export type Traits = UnknownRecord;

export type DebouncedPayloads<Payload> = {
  nextPayload: Payload | null | undefined;
  newOrUpdatedTraits: Traits | null;
};

/**
 * `nextPayload` is `null` when nothing new needs sending; `newOrUpdatedTraits`
 * holds only the changed traits, since Braze bills for every trait sent.
 */
export const debouncePayloads = <Payload>(
  previousPayload: Payload | null | undefined,
  nextPayload: Payload | null | undefined,
  getPayloadProperty: GetPayloadProperty<Payload>,
): DebouncedPayloads<Payload> => {
  let newOrUpdatedTraits: Traits | null = null;
  if (nextPayload != null && previousPayload != null) {
    const nextAnonymousId = getPayloadProperty(nextPayload, 'anonymousId');
    const previousAnonymousId = getPayloadProperty(
      previousPayload,
      'anonymousId',
    );
    const nextUserId = getPayloadProperty(nextPayload, 'userId');
    const previousUserId = getPayloadProperty(previousPayload, 'userId');
    if (
      nextAnonymousId !== previousAnonymousId ||
      nextUserId !== previousUserId
    ) {
      return { nextPayload, newOrUpdatedTraits };
    }

    const nextTraits = getPayloadProperty(nextPayload, 'traits');
    const previousTraits = getPayloadProperty(previousPayload, 'traits');
    newOrUpdatedTraits = diffObject(nextTraits, previousTraits || {}, {
      diffArray: false,
    });
    if (newOrUpdatedTraits == null) {
      return { nextPayload: null, newOrUpdatedTraits };
    }
    return { nextPayload, newOrUpdatedTraits };
  }
  return { nextPayload, newOrUpdatedTraits };
};
