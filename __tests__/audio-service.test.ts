jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

import { AudioService, getReciterBaseUrl, RECITERS } from '../services/audio-service';

describe('reciter audio sources', () => {
  it('generates a zero-padded EveryAyah ayah URL for every supported reciter', () => {
    for (const reciter of Object.values(RECITERS)) {
      expect(AudioService.getAyahAudioUrl(2, 7, reciter.id)).toBe(`${reciter.baseUrl}002007.mp3`);
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
