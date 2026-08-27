jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

import { AudioService, getReciterBaseUrl, RECITERS } from '../services/audio-service';

describe('reciter audio sources', () => {
  it('generates a zero-padded URL for every supported reciter (per-ayah or per-surah)', () => {
    for (const reciter of Object.values(RECITERS)) {
      const expected = reciter.baseUrl.includes('mp3quran.net')
        ? `${reciter.baseUrl}002.mp3`
        : `${reciter.baseUrl}002007.mp3`;
      expect(AudioService.getAyahAudioUrl(2, 7, reciter.id)).toBe(expected);
    }
  });

  it('keeps the repaired sources and removes the unavailable source', () => {
    expect(getReciterBaseUrl('ayyub')).toContain('/Muhammad_Ayyoub_128kbps/');
    expect(getReciterBaseUrl('shatiri')).toContain('/Abu_Bakr_Ash-Shaatree_64kbps/');
    expect(getReciterBaseUrl('shuraym')).toContain('/Saood_ash-Shuraym_128kbps/');
    expect(RECITERS).not.toHaveProperty('talib');
  });

  it('falls back safely for an old or unknown saved reciter id', () => {
    expect(getReciterBaseUrl('qatami')).toBe(RECITERS.qahtani.baseUrl);
    expect(getReciterBaseUrl('missing')).toBe(RECITERS.qahtani.baseUrl);
  });
});
