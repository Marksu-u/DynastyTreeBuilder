import { describe, it, expect, beforeEach } from 'vitest';
import { useGuestDynastyStore, DEFAULT_HOUSE_NAME } from '@/store/guest-dynasty';

describe('guest house identity', () => {
  beforeEach(() => {
    useGuestDynastyStore.getState().resetHouse();
  });

  it('starts as an unnamed fantasy house', () => {
    const { name, setting } = useGuestDynastyStore.getState();
    expect(name).toBe(DEFAULT_HOUSE_NAME);
    expect(setting).toBe('FANTASY');
  });

  it('gives every guest their own arms', () => {
    // Must satisfy CrestSeedSchema so the seed survives a round-trip through
    // the export file and importGuestWorld.
    expect(useGuestDynastyStore.getState().crestSeed).toMatch(/^[a-z0-9-]{1,64}$/i);
  });

  it('leaves the crest alone when other fields change', () => {
    const seed = useGuestDynastyStore.getState().crestSeed;
    useGuestDynastyStore.getState().setHouse({ name: 'House Vale', setting: 'HORROR' });
    const next = useGuestDynastyStore.getState();
    expect(next.crestSeed).toBe(seed);
    expect(next.name).toBe('House Vale');
    expect(next.setting).toBe('HORROR');
  });

  it('adopts the seeded example house wholesale', () => {
    useGuestDynastyStore.getState().adoptExample('House Thorne', 'thorne-arms');
    const { name, crestSeed } = useGuestDynastyStore.getState();
    expect(name).toBe('House Thorne');
    expect(crestSeed).toBe('thorne-arms');
  });

  it('resets to a blank house with arms nobody else has', () => {
    useGuestDynastyStore.getState().adoptExample('House Thorne', 'thorne-arms');
    useGuestDynastyStore.getState().resetHouse();
    const { name, crestSeed } = useGuestDynastyStore.getState();
    expect(name).toBe(DEFAULT_HOUSE_NAME);
    expect(crestSeed).not.toBe('thorne-arms');
  });

  it('mints arms when a house has none yet', () => {
    useGuestDynastyStore.getState().setHouse({ crestSeed: '' });
    useGuestDynastyStore.getState().ensureCrestSeed();
    expect(useGuestDynastyStore.getState().crestSeed).toMatch(/^[a-z0-9-]{1,64}$/i);
  });

  it('never re-rolls arms a house already has', () => {
    useGuestDynastyStore.getState().setHouse({ crestSeed: 'vale-arms' });
    useGuestDynastyStore.getState().ensureCrestSeed();
    expect(useGuestDynastyStore.getState().crestSeed).toBe('vale-arms');
  });
});
