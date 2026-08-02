import { useEffect, useState } from 'react';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { api } from '@/lib/api';

type Payment = {
  id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  reference: string;
  subscriptionDaysGranted: number;
  createdAt: string;
};

const PROVIDERS = [
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'mtn_money', label: 'MTN Money' },
  { value: 'card', label: 'Carte bancaire' },
];

const STATUS_LABEL: Record<string, [string, string]> = {
  pending: ['En attente', 'var(--gold)'],
  success: ['Réussi', 'var(--green)'],
  failed: ['Échoué', 'var(--red)'],
  cancelled: ['Annulé', 'var(--text-lo)'],
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ provider: 'wave', amount: 15000, subscriptionDaysGranted: 30 });
  const [pendingCheckout, setPendingCheckout] = useState<{ reference: string; checkoutUrl?: string } | null>(null);

  async function load() {
    try {
      setPayments(await api.myPayments());
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
    setError('');
    setNotice('');
    try {
      const res = await api.initiatePayment(form);
      setPendingCheckout({ reference: res.payment.reference, checkoutUrl: res.checkoutUrl });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function simulateConfirm() {
    if (!pendingCheckout) return;
    try {
      await api.devConfirmPayment(pendingCheckout.reference);
      setNotice('Paiement confirmé — abonnement renouvelé.');
      setPendingCheckout(null);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <WorkspaceLayout active="payments">
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, marginBottom: 20 }}>
        Abonnement &amp; paiements
      </h1>

      <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text-lo)', marginBottom: 14 }}>
          Renouveler l&apos;abonnement de votre entreprise
        </div>
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <FormField label="Moyen de paiement">
            <select style={inputStyle} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
              {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </FormField>
          <FormField label="Montant (FCFA)">
            <input type="number" style={inputStyle} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </FormField>
          <FormField label="Jours accordés">
            <input type="number" style={inputStyle} value={form.subscriptionDaysGranted} onChange={(e) => setForm({ ...form, subscriptionDaysGranted: Number(e.target.value) })} />
          </FormField>
          <button type="submit" style={{ background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13 }}>
            Payer
          </button>
        </form>

        {pendingCheckout && (
          <div style={{ marginTop: 16, background: 'rgba(212,166,67,0.08)', border: '1px solid rgba(212,166,67,0.3)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 10 }}>
              Paiement initié ({pendingCheckout.reference}) — en attente de confirmation du provider.
              <br />
              <span style={{ color: 'var(--text-lo)', fontSize: 12 }}>
                Aucun provider réel n&apos;est branché en environnement de développement : utilisez le bouton
                ci-dessous pour simuler la confirmation qu&apos;enverrait normalement Wave/Orange Money/MTN.
              </span>
            </div>
            <button
              onClick={simulateConfirm}
              style={{ background: 'var(--green)', color: '#04170f', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13 }}
            >
              Simuler la confirmation (dev)
            </button>
          </div>
        )}

        {notice && <div style={{ marginTop: 12, color: 'var(--green)', fontSize: 13 }}>{notice}</div>}
      </div>

      {error && (
        <div style={{ color: 'var(--red)', background: 'rgba(242,104,92,0.1)', border: '1px solid rgba(242,104,92,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, marginBottom: 12 }}>Historique</h2>
      {loading ? (
        <div style={{ color: 'var(--text-lo)' }}>Chargement…</div>
      ) : payments.length === 0 ? (
        <div style={{ color: 'var(--text-lo)', textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--hairline)', borderRadius: 10 }}>
          Aucun paiement pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {payments.map((p) => {
            const [label, color] = STATUS_LABEL[p.status] || [p.status, 'var(--text-lo)'];
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '12px 18px' }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-lo)', minWidth: 130 }}>{p.reference}</div>
                <div style={{ flex: 1, fontSize: 13 }}>{p.provider.replace('_', ' ')} · {p.subscriptionDaysGranted}j</div>
                <div style={{ fontSize: 13 }}>{p.amount.toLocaleString('fr-FR')} {p.currency}</div>
                <span style={{ fontSize: 11, color, border: `1px solid ${color}`, borderRadius: 999, padding: '3px 10px' }}>{label}</span>
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
    <div>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-lo)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--ink)', border: '1px solid var(--hairline)', borderRadius: 8,
  padding: '9px 12px', color: 'var(--text-hi)', fontSize: 13,
};
