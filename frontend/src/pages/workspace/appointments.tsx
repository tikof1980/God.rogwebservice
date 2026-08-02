import { useEffect, useState } from 'react';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { api } from '@/lib/api';

type Client = { id: string; fullName: string };
type Appointment = {
  id: string;
  serviceLabel: string;
  startTime: string;
  status: string;
  estimatedPrice: number | null;
  client: { id: string; fullName: string };
};

const STATUS_LABEL: Record<string, [string, string]> = {
  pending: ['En attente', 'var(--text-lo)'],
  confirmed: ['Confirmé', 'var(--blue)'],
  completed: ['Terminé', 'var(--green)'],
  cancelled: ['Annulé', 'var(--red)'],
  no_show: ['Absent', 'var(--red)'],
};

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    clientId: '', serviceLabel: '', startTime: '', estimatedPrice: '',
  });

  async function load() {
    try {
      const [a, c] = await Promise.all([api.listAppointments(), api.listClients()]);
      setAppts(a);
      setClients(c);
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
      await api.createAppointment({
        ...form,
        estimatedPrice: form.estimatedPrice ? Number(form.estimatedPrice) : undefined,
        startTime: new Date(form.startTime).toISOString(),
      });
      setForm({ clientId: '', serviceLabel: '', startTime: '', estimatedPrice: '' });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await api.updateAppointmentStatus(id, status);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <WorkspaceLayout active="appointments">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, margin: 0 }}>Rendez-vous</h1>
        <button
          onClick={() => setShowForm(true)}
          disabled={clients.length === 0}
          style={{ background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, opacity: clients.length === 0 ? 0.5 : 1 }}
        >
          + Nouveau rendez-vous
        </button>
      </div>

      {clients.length === 0 && !loading && (
        <div style={{ color: 'var(--gold)', fontSize: 13, marginBottom: 16 }}>
          Ajoutez d&apos;abord un client dans l&apos;onglet Clients avant de créer un rendez-vous.
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--red)', background: 'rgba(242,104,92,0.1)', border: '1px solid rgba(242,104,92,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <FormField label="Client">
              <select required style={inputStyle} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">Sélectionner…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </FormField>
            <FormField label="Prestation">
              <input required style={inputStyle} value={form.serviceLabel} onChange={(e) => setForm({ ...form, serviceLabel: e.target.value })} placeholder="Ex: Coupe + Barbe" />
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <FormField label="Date et heure">
              <input required type="datetime-local" style={inputStyle} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </FormField>
            <FormField label="Prix estimé (FCFA)">
              <input type="number" style={inputStyle} value={form.estimatedPrice} onChange={(e) => setForm({ ...form, estimatedPrice: e.target.value })} />
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" style={{ background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13 }}>
              Créer
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1px solid var(--hairline)', color: 'var(--text-hi)', borderRadius: 8, padding: '9px 16px', fontSize: 13 }}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-lo)' }}>Chargement…</div>
      ) : appts.length === 0 ? (
        <div style={{ color: 'var(--text-lo)', textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--hairline)', borderRadius: 10 }}>
          Aucun rendez-vous. Créez le premier.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {appts.map((a) => {
            const [label, color] = STATUS_LABEL[a.status] || [a.status, 'var(--text-lo)'];
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '14px 18px' }}>
                <div className="mono" style={{ fontSize: 12, minWidth: 130, color: 'var(--text-lo)' }}>
                  {new Date(a.startTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{a.client.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>{a.serviceLabel}</div>
                </div>
                <span style={{ fontSize: 11, color, border: `1px solid ${color}`, borderRadius: 999, padding: '3px 10px' }}>
                  {label}
                </span>
                {(a.status === 'pending' || a.status === 'confirmed') && (
                  <button
                    onClick={() => setStatus(a.id, 'cancelled')}
                    style={{ fontSize: 12, background: 'transparent', border: '1px solid var(--hairline)', color: 'var(--text-hi)', borderRadius: 6, padding: '6px 10px' }}
                  >
                    Annuler
                  </button>
                )}
              </div>
            );
          })}
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
