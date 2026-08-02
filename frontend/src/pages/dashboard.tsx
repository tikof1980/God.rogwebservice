import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { api, clearToken, getSession } from '@/lib/api';
import { LedgerBar } from '@/components/LedgerBar';

const BUSINESS_TYPES = [
  'salon_coiffure', 'barber_shop', 'institut_beaute', 'restaurant', 'hotel',
  'pressing', 'boutique', 'pharmacie', 'clinique', 'garage', 'ecole',
  'salle_de_sport', 'cabinet_medical', 'cabinet_juridique',
  'agence_immobiliere', 'supermarche', 'autre',
];

type Company = {
  id: string;
  tenantCode: string;
  name: string;
  businessType: string;
  status: 'active' | 'suspended' | 'expired';
  licenseKey: string;
  subscriptionEnd: string;
  subscriptionDurationDays: number;
};

function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export default function Dashboard() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
    } else if (session.role !== 'super_admin') {
      router.replace('/workspace');
    }
  }, [router]);

  const load = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([api.listCompanies(), api.stats()]);
      setCompanies(list);
      setStats(s);
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        router.push('/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(fn: () => Promise<any>) {
    try {
      await fn();
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.mark}>
          <span style={{ color: 'var(--gold)' }}>GOD.</span>ROGWEBSERVICE
        </div>
        <button onClick={logout} style={styles.logout}>Déconnexion</button>
      </header>

      <main style={styles.main}>
        <div style={styles.statsRow}>
          <StatCard label="Entreprises" value={stats?.totalCompanies ?? '—'} />
          <StatCard label="Actives" value={stats?.active ?? '—'} color="var(--green)" />
          <StatCard label="Suspendues" value={stats?.suspended ?? '—'} color="var(--text-lo)" />
          <StatCard label="Expirées" value={stats?.expired ?? '—'} color="var(--red)" />
        </div>

        {stats?.expiringSoon?.length > 0 && (
          <div style={styles.alertBanner}>
            <strong>{stats.expiringSoon.length} entreprise(s)</strong> expirent dans 7 jours ou moins —{' '}
            {stats.expiringSoon.map((c: any) => c.name).join(', ')}
          </div>
        )}

        <div style={styles.toolbar}>
          <h1 style={styles.title}>Entreprises</h1>
          <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
            + Ajouter une entreprise
          </button>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {loading ? (
          <div style={{ color: 'var(--text-lo)', padding: 40 }}>Chargement…</div>
        ) : companies.length === 0 ? (
          <div style={styles.empty}>
            Aucune entreprise pour le moment. Ajoutez la première pour démarrer.
          </div>
        ) : (
          <div style={styles.table}>
            {companies.map((c) => (
              <div key={c.id} style={styles.row}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-lo)' }}>
                    {c.tenantCode} · {c.businessType.replace(/_/g, ' ')}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <StatusPill status={c.status} />
                </div>
                <div style={{ flex: 1.4 }}>
                  <LedgerBar
                    daysRemaining={daysLeft(c.subscriptionEnd)}
                    totalDays={c.subscriptionDurationDays}
                    status={c.status}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {c.status === 'suspended' ? (
                    <ActionBtn onClick={() => handleAction(() => api.reactivate(c.id))}>
                      Réactiver
                    </ActionBtn>
                  ) : (
                    <ActionBtn onClick={() => handleAction(() => api.suspend(c.id))}>
                      Suspendre
                    </ActionBtn>
                  )}
                  <ActionBtn onClick={() => handleAction(() => api.renew(c.id, 30))}>
                    +30j
                  </ActionBtn>
                  <ActionBtn
                    danger
                    onClick={() => {
                      if (confirm(`Supprimer définitivement ${c.name} ?`)) {
                        handleAction(() => api.remove(c.id));
                      }
                    }}
                  >
                    Suppr.
                  </ActionBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <CreateCompanyModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div style={styles.statCard}>
      <div className="display" style={{ fontSize: 28, color: color || 'var(--text-hi)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active: ['Actif', 'var(--green)'],
    suspended: ['Suspendu', 'var(--text-lo)'],
    expired: ['Expiré', 'var(--red)'],
  };
  const [label, color] = map[status] || [status, 'var(--text-lo)'];
  return (
    <span
      style={{
        fontSize: 11,
        color,
        border: `1px solid ${color}`,
        borderRadius: 999,
        padding: '3px 10px',
      }}
    >
      {label}
    </span>
  );
}

function ActionBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12,
        background: 'transparent',
        border: `1px solid ${danger ? 'rgba(242,104,92,0.4)' : 'var(--hairline)'}`,
        color: danger ? 'var(--red)' : 'var(--text-hi)',
        borderRadius: 6,
        padding: '6px 10px',
      }}
    >
      {children}
    </button>
  );
}

function CreateCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', businessType: 'restaurant', phone: '', email: '',
    subscriptionDurationDays: 30, adminEmail: '', adminPassword: '', adminFullName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.createCompany(form);
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <form onSubmit={submit} style={styles.modal}>
        <h2 className="display" style={{ fontSize: 18, marginBottom: 20 }}>
          Nouvelle entreprise
        </h2>

        <Field label="Nom de l'entreprise">
          <input style={styles.input} required value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>

        <Field label="Type d'activité">
          <select style={styles.input} value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </Field>

        <div style={{ display: 'flex', gap: 12 }}>
          <Field label="Téléphone">
            <input style={styles.input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Durée abonnement (jours)">
            <input
              style={styles.input}
              type="number"
              value={form.subscriptionDurationDays}
              onChange={(e) => set('subscriptionDurationDays', Number(e.target.value))}
            />
          </Field>
        </div>

        <div style={{ height: 1, background: 'var(--hairline)', margin: '16px 0' }} />
        <div style={{ fontSize: 12, color: 'var(--text-lo)', marginBottom: 4 }}>
          Compte administrateur de l&apos;entreprise
        </div>

        <Field label="Nom complet">
          <input style={styles.input} required value={form.adminFullName} onChange={(e) => set('adminFullName', e.target.value)} />
        </Field>
        <Field label="Email admin">
          <input style={styles.input} type="email" required value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} />
        </Field>
        <Field label="Mot de passe admin">
          <input style={styles.input} type="password" required minLength={6} value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} />
        </Field>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={styles.secondaryBtn}>Annuler</button>
          <button type="submit" disabled={loading} style={{ ...styles.primaryBtn, flex: 1 }}>
            {loading ? 'Création…' : 'Créer l\'entreprise'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12, flex: 1 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-lo)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'var(--ink)' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 32px', borderBottom: '1px solid var(--hairline)',
  },
  mark: { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 17 },
  logout: {
    background: 'transparent', border: '1px solid var(--hairline)', color: 'var(--text-lo)',
    borderRadius: 6, padding: '6px 12px', fontSize: 13,
  },
  main: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 },
  statCard: {
    background: 'var(--panel)', border: '1px solid var(--hairline)',
    borderRadius: 10, padding: '18px 20px',
  },
  alertBanner: {
    background: 'rgba(212,166,67,0.08)', border: '1px solid rgba(212,166,67,0.3)',
    color: 'var(--gold)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20,
  },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, margin: 0 },
  primaryBtn: {
    background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 8,
    padding: '9px 16px', fontWeight: 600, fontSize: 13,
  },
  secondaryBtn: {
    background: 'transparent', border: '1px solid var(--hairline)', color: 'var(--text-hi)',
    borderRadius: 8, padding: '9px 16px', fontSize: 13,
  },
  empty: {
    color: 'var(--text-lo)', textAlign: 'center', padding: '60px 20px',
    border: '1px dashed var(--hairline)', borderRadius: 10,
  },
  table: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex', alignItems: 'center', gap: 16, background: 'var(--panel)',
    border: '1px solid var(--hairline)', borderRadius: 10, padding: '14px 18px',
  },
  errorBanner: {
    background: 'rgba(242,104,92,0.1)', border: '1px solid rgba(242,104,92,0.3)',
    color: 'var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 10,
  },
  modal: {
    width: 460, maxHeight: '90vh', overflowY: 'auto', background: 'var(--panel-raised)',
    border: '1px solid var(--hairline)', borderRadius: 12, padding: 28,
  },
  input: {
    width: '100%', background: 'var(--ink)', border: '1px solid var(--hairline)',
    borderRadius: 8, padding: '9px 12px', color: 'var(--text-hi)', fontSize: 13,
  },
};
