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
});
