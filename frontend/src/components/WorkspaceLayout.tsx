import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { clearToken, getSession } from '@/lib/api';

export function WorkspaceLayout({ children, active }: { children: ReactNode; active: string }) {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
    } else if (session.role === 'super_admin') {
      router.replace('/dashboard');
    }
  }, [router]);

  function logout() {
    clearToken();
    router.push('/login');
  }

  const tabs = [
    { key: 'today', label: "Aujourd'hui", href: '/workspace' },
    { key: 'appointments', label: 'Rendez-vous', href: '/workspace/appointments' },
    { key: 'clients', label: 'Clients', href: '/workspace/clients' },
    { key: 'payments', label: 'Abonnement', href: '/workspace/payments' },
    { key: 'notifications', label: 'Notifications', href: '/workspace/notifications' },
    { key: 'ai', label: 'Assistant IA', href: '/workspace/ai' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <header
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 32px', borderBottom: '1px solid var(--hairline)',
        }}
      >
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 17 }}>
          <span style={{ color: 'var(--gold)' }}>GOD.</span>ROGWEBSERVICE
        </div>
        <nav style={{ display: 'flex', gap: 4 }}>
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              style={{
                fontSize: 13,
                padding: '7px 14px',
                borderRadius: 6,
                color: active === t.key ? 'var(--ink)' : 'var(--text-lo)',
                background: active === t.key ? 'var(--gold)' : 'transparent',
                textDecoration: 'none',
                fontWeight: active === t.key ? 600 : 400,
              }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={logout}
          style={{
            background: 'transparent', border: '1px solid var(--hairline)', color: 'var(--text-lo)',
            borderRadius: 6, padding: '6px 12px', fontSize: 13,
          }}
        >
          Déconnexion
        </button>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
    </div>
  );
}
