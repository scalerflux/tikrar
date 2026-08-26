jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { getMarkazUstad, getUstadSessionDays } from '../services/ustad-session-service';

describe('Markaz Ustad schedules', () => {
  it('keeps each listed teacher tied to the correct weekly days', () => {
    expect(getMarkazUstad('Brother Fatin')).toMatchObject({ sessionDays: [4, 5] });
    expect(getMarkazUstad('Brother Abdullah Taim')).toMatchObject({ sessionDays: [0, 1, 2, 3, 4, 6] });
    expect(getMarkazUstad('Brother Muhammad Zain')).toMatchObject({ sessionDays: [1, 2, 3] });
  });

  it('returns no session days when no ustad is configured', () => {
    expect(getUstadSessionDays('')).toEqual([]);
  });
});
