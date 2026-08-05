import { parseFace, formatFace, parseFaceRange, faceOrdinalForDay, expectedFaceNumber, isValidFace } from '../utils/face';

describe('parseFace', () => {
  it('parses bare whole-page faces (days 1-2)', () => {
    expect(parseFace('1')).toBe(1);
    expect(parseFace('2')).toBe(3);
  });

  it('parses half-page faces', () => {
    expect(parseFace('106 h1')).toBe(211);
    expect(parseFace('106 h2')).toBe(212);
  });

  it('normalizes whitespace and case', () => {
    expect(parseFace(' 106  H1 ')).toBe(211);
  });

  it('rejects invalid faces', () => {
    expect(() => parseFace('')).toThrow();
    expect(() => parseFace('h1')).toThrow();
    expect(() => parseFace('106')).toThrow();
    expect(() => parseFace('106 h3')).toThrow();
    expect(() => parseFace('abc h1')).toThrow();
    expect(() => parseFace('0 h1')).toThrow();
    expect(() => parseFace('605 h1')).toThrow();
    expect(() => parseFace('605 h2')).toThrow();
  });
});

describe('formatFace', () => {
  it('formats whole pages as bare numbers', () => {
    expect(formatFace(1)).toBe('1');
    expect(formatFace(3)).toBe('2');
  });

  it('formats half pages', () => {
    expect(formatFace(211)).toBe('106 h1');
    expect(formatFace(212)).toBe('106 h2');
    expect(formatFace(1208)).toBe('604 h2');
  });

  it('round-trips through parseFace', () => {
    for (const f of ['1', '2', '3 h1', '3 h2', '106 h1', '106 h2', '604 h2']) {
      expect(formatFace(parseFace(f))).toBe(f);
    }
  });
});

describe('parseFaceRange', () => {
  it('parses two-face ranges', () => {
    expect(parseFaceRange('1 h1 → 1 h2')).toEqual({ start: 1, end: 2 });
    expect(parseFaceRange('209 h1 → 223 h1')).toEqual({ start: 417, end: 445 });
  });

  it('parses single bare faces as start=end', () => {
    expect(parseFaceRange('1')).toEqual({ start: 1, end: 1 });
    expect(parseFaceRange('2')).toEqual({ start: 3, end: 3 });
  });

  it('parses single half-page faces as start=end', () => {
    expect(parseFaceRange('3 h1')).toEqual({ start: 5, end: 5 });
    expect(parseFaceRange('38 h2')).toEqual({ start: 76, end: 76 });
  });

  it('rejects invalid ranges', () => {
    expect(() => parseFaceRange('')).toThrow();
    expect(() => parseFaceRange('1 h1 →')).toThrow();
    expect(() => parseFaceRange('106 h3 → 106 h2')).toThrow();
    expect(() => parseFaceRange('abc → def')).toThrow();
  });
});

describe('faceOrdinalForDay', () => {
  it('maps the first two days to whole-page faces', () => {
    expect(faceOrdinalForDay(1)).toBe(1);
    expect(faceOrdinalForDay(2)).toBe(3);
  });

  it('maps remaining days sequentially', () => {
    expect(faceOrdinalForDay(3)).toBe(5);
    expect(faceOrdinalForDay(38)).toBe(40);
    expect(faceOrdinalForDay(604)).toBe(606);
    expect(faceOrdinalForDay(1206)).toBe(1208);
  });

  it('throws for out-of-range days', () => {
    expect(() => faceOrdinalForDay(0)).toThrow();
    expect(() => faceOrdinalForDay(1207)).toThrow();
  });
});

describe('expectedFaceNumber', () => {
  it('computes the face for a day', () => {
    expect(expectedFaceNumber(1)).toBe('1');
    expect(expectedFaceNumber(2)).toBe('2');
    expect(expectedFaceNumber(37)).toBe('20 h1');
    expect(expectedFaceNumber(1205)).toBe('604 h1');
    expect(expectedFaceNumber(1206)).toBe('604 h2');
  });
});

describe('isValidFace', () => {
  it('validates face strings', () => {
    expect(isValidFace('1')).toBe(true);
    expect(isValidFace('604 h2')).toBe(true);
    expect(isValidFace('605 h1')).toBe(false);
    expect(isValidFace('604 h3')).toBe(false);
    expect(isValidFace('')).toBe(false);
  });
});
