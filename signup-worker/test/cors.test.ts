import { describe, expect, it } from 'vitest';
import { getAllowedOrigin } from '../src/cors';

describe('getAllowedOrigin', () => {
  const allowed = 'https://www.sasktoday.ca,https://sasktoday.ca';

  it('rejects missing origin', () => {
    expect(getAllowedOrigin(null, allowed)).toBeNull();
  });

  it('rejects unknown origin', () => {
    expect(getAllowedOrigin('https://evil.example', allowed)).toBeNull();
  });

  it('allows exact match', () => {
    expect(getAllowedOrigin('https://www.sasktoday.ca', allowed)).toBe(
      'https://www.sasktoday.ca'
    );
  });

  it('allows any localhost / 127.0.0.1 http port for local previews', () => {
    expect(getAllowedOrigin('http://127.0.0.1:8766', allowed)).toBe(
      'http://127.0.0.1:8766'
    );
    expect(getAllowedOrigin('http://localhost:9999', allowed)).toBe(
      'http://localhost:9999'
    );
  });
});
