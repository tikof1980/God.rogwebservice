import { useEffect, useState } from 'react';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { api } from '@/lib/api';

type Client = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  visitsCount: number;
  totalSpent: number;
  loyaltyPoints: number;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' });

  async function load() {
    try {
      setClients(await api.listClients());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createClient(form);
      setForm({ fullName: '', phone: '', email: '' });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Supprimer la fiche de ${name} ?`)) return;
    try {
      await api.removeClient(id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <WorkspaceLayout active="clients">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, margin: 0 }}>Clients</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13 }}
        >
          + Ajouter un client
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', background: 'rgba(242,104,92,0.1)', border: '1px solid rgba(242,104,92,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 20, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-end' }}
        >
          <FormField label="Nom complet">
            <input required style={inputStyle} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </FormField>
          <FormField label="Téléphone">
            <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="Email">
            <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <button type="submit" style={{ background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13 }}>
            Enregistrer
          </button>
          <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1px solid var(--hairline)', color: 'var(--text-hi)', borderRadius: 8, padding: '9px 16px', fontSize: 13 }}>
            Annuler
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-lo)' }}>Chargement…</div>
      ) : clients.length === 0 ? (
        <div style={{ color: 'var(--text-lo)', textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--hairline)', borderRadius: 10 }}>
          Aucun client enregistré pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {clients.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ flex: 2 }}>
                <div style={{ fontWeight: 600 }}>{c.fullName}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-lo)' }}>{c.phone || '—'} {c.email ? `· ${c.email}` : ''}</div>
              </div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--text-lo)' }}>{c.visitsCount} visite(s)</div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--text-lo)' }}>{c.totalSpent.toLocaleString('fr-FR')} FCFA</div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--gold)' }}>{c.loyaltyPoints} pts</div>
              <button
                onClick={() => remove(c.id, c.fullName)}
                style={{ fontSize: 12, background: 'transparent', border: '1px solid rgba(242,104,92,0.4)', color: 'var(--red)', borderRadius: 6, padding: '6px 10px' }}
              >
                Suppr.
              </button>
            </div>
          ))}
        </div>
      )}
    </WorkspaceLayout>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-lo)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--ink)', border: '1px solid var(--hairline)', borderRadius: 8,
  padding: '9px 12px', color: 'var(--text-hi)', fontSize: 13,
};
