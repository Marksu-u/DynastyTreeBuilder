import { describe, it, expect, afterEach, vi } from 'vitest';
import { safeStorage } from '@/lib/safe-storage';

describe('safeStorage', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('reads nothing on the server, where there is no storage', () => {
    expect(safeStorage.getItem('k')).toBeNull();
  });

  it('survives storage that throws — private mode, quota, lockdown', () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    });

    expect(safeStorage.getItem('k')).toBeNull();
    expect(() => safeStorage.setItem('k', 'v')).not.toThrow();
    expect(() => safeStorage.removeItem('k')).not.toThrow();
  });

  it('round-trips through storage that works', () => {
    const backing = new Map<string, string>();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => { backing.set(k, v); },
      removeItem: (k: string) => { backing.delete(k); },
    });

    safeStorage.setItem('k', 'v');
    expect(safeStorage.getItem('k')).toBe('v');
    safeStorage.removeItem('k');
    expect(safeStorage.getItem('k')).toBeNull();
  });
});
