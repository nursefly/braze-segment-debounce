import _isNil from 'lodash/isNil';

import { diffObject } from './utils/diffObject';

export const dedupePayloads = (
  previousPayload,
  nextPayload,
  getPayloadProperty,
) => {
  let newOrUpdatedTraits = null;
  if (!_isNil(nextPayload) && !_isNil(previousPayload)) {
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
    if (_isNil(newOrUpdatedTraits)) {
      return { nextPayload: null, newOrUpdatedTraits };
    }

    // Braze charges for every trait sent to it even if that trait isn't
    // changed. So we only want to include traits that have changed in the
    // final payload.
    return { nextPayload, newOrUpdatedTraits };
  }
  return { nextPayload, newOrUpdatedTraits };
};
