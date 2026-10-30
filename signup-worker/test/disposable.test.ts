import { describe, expect, it } from 'vitest';
import {
  disposableListSize,
  emailDomainCandidates,
  isDisposableEmailDomain
} from '../src/disposable';

describe('disposable domain monitor', () => {
  it('loads a non-empty snapshot', () => {
    expect(disposableListSize()).toBeGreaterThan(1000);
  });

  it('builds domain suffix candidates', () => {
    expect(emailDomainCandidates('user@a.b.mailinator.com')).toEqual([
      'a.b.mailinator.com',
      'b.mailinator.com',
      'mailinator.com'
    ]);
  });

  it('flags known disposable domains', () => {
    expect(isDisposableEmailDomain('x@mailinator.com')).toBe(true);
    expect(isDisposableEmailDomain('x@guerrillamail.com')).toBe(true);
  });

  it('does not flag common freemail', () => {
    expect(isDisposableEmailDomain('person@gmail.com')).toBe(false);
    expect(isDisposableEmailDomain('person@harvardmedia.com')).toBe(false);
  });
});
