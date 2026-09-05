import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({ signedIn: true }));
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (cookies: unknown[]) => void } }) => ({
    auth: { getUser: async () => {
      options.cookies.setAll([{ name: 'boh-shared-auth', value: 'refreshed', options: { path: '/', domain: '.bagofholdingtools.com', secure: true, sameSite: 'lax' } }]);
      return { data: { user: state.signedIn ? { id: 'test-user' } : null } };
    } },
  }),
}));
vi.mock('next-intl/middleware', async () => {
  const { NextResponse } = await import('next/server');
  return { default: () => () => NextResponse.next() };
});

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); state.signedIn = true; });

describe('shared subdomain authentication', () => {
  it('keeps local/preview cookies host-only and uses a distinct shared cookie in production', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN', '');
    const local = await import('./supabase/cookie-options');
    expect(local.cookieOptions).not.toHaveProperty('domain');
    expect(local.cookieOptions).not.toHaveProperty('name');
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN', '.bagofholdingtools.com');
    const shared = await import('./supabase/cookie-options');
    expect(shared.cookieOptions).toMatchObject({ name: 'boh-shared-auth', domain: '.bagofholdingtools.com', secure: true, path: '/', sameSite: 'lax' });
  });

  it('preserves refreshed cookies on the signed-in login redirect', async () => {
    const { proxy } = await import('../proxy');
    const response = await proxy(new NextRequest('https://dynasty.bagofholdingtools.com/login'));
    expect(response.headers.get('location')).toBe('https://dynasty.bagofholdingtools.com/dashboard');
    expect(response.cookies.get('boh-shared-auth')).toMatchObject({ value: 'refreshed', domain: '.bagofholdingtools.com', secure: true });
  });

  it('preserves cookie updates when protecting a signed-out dashboard', async () => {
    state.signedIn = false;
    const { proxy } = await import('../proxy');
    const response = await proxy(new NextRequest('https://dynasty.bagofholdingtools.com/dashboard'));
    expect(response.headers.get('location')).toBe('https://dynasty.bagofholdingtools.com/login');
    expect(response.cookies.get('boh-shared-auth')?.value).toBe('refreshed');
  });

  it('shows callback sync errors without immediately redirecting to dashboard', async () => {
    const { proxy } = await import('../proxy');
    const response = await proxy(new NextRequest('https://dynasty.bagofholdingtools.com/login?error=sync_failed'));
    expect(response.headers.has('location')).toBe(false);
  });
});
