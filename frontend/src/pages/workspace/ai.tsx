import { useEffect, useState, useRef } from 'react';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { api } from '@/lib/api';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

export default function AiPage() {
  const [settings, setSettings] = useState({ aiEnabled: false, aiPersonality: '' });
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.aiSettings(), api.aiInfo()])
      .then(([s, i]) => {
        setSettings({ aiEnabled: s.aiEnabled, aiPersonality: s.aiPersonality || '' });
        setProvider(i.provider);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');
    try {
      await api.updateAiSettings(settings);
      setNotice('Réglages enregistrés.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function sendTestMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    setChat((c) => [...c, { role: 'user', content: userMsg }]);
    setInput('');
    setSending(true);
    setError('');
    try {
      const res = await api.aiTestChat(userMsg, 'test-widget');
      setChat((c) => [...c, { role: 'assistant', content: res.reply }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <WorkspaceLayout active="ai">
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, marginBottom: 20 }}>
        Assistant IA
      </h1>

      {error && (
        <div style={{ color: 'var(--red)', background: 'rgba(242,104,92,0.1)', border: '1px solid rgba(242,104,92,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-lo)' }}>Chargement…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Réglages */}
          <form onSubmit={saveSettings} style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-lo)' }}>
                Fournisseur actif : <span className="mono" style={{ color: 'var(--gold)' }}>{provider}</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={settings.aiEnabled}
                  onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })}
                />
                Activer l&apos;assistant
              </label>
            </div>

            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-lo)', marginBottom: 6 }}>
              Personnalité / instructions (laisser vide pour la valeur par défaut)
            </label>
            <textarea
              rows={8}
              style={{ width: '100%', background: 'var(--ink)', border: '1px solid var(--hairline)', borderRadius: 8, padding: 12, color: 'var(--text-hi)', fontSize: 13, resize: 'vertical' }}
              value={settings.aiPersonality}
              onChange={(e) => setSettings({ ...settings, aiPersonality: e.target.value })}
              placeholder="Ex: Tu es l'assistant du Salon Aya, chaleureux et professionnel. Tu réponds en français..."
            />

            {notice && <div style={{ marginTop: 12, color: 'var(--green)', fontSize: 13 }}>{notice}</div>}

            <button
              type="submit"
              disabled={saving}
              style={{ marginTop: 16, background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13 }}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>

          {/* Chat de test */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', height: 420 }}>
            <div style={{ fontSize: 13, color: 'var(--text-lo)', marginBottom: 12 }}>
              Tester l&apos;assistant en direct (simule un message client)
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {chat.length === 0 && (
                <div style={{ color: 'var(--text-lo)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                  Envoyez un message pour voir comment l&apos;assistant répond.
                </div>
              )}
              {chat.map((turn, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: turn.role === 'user' ? 'flex-end' : 'flex-start',
                    background: turn.role === 'user' ? 'var(--gold)' : 'var(--ink)',
                    color: turn.role === 'user' ? '#1a1200' : 'var(--text-hi)',
                    border: turn.role === 'assistant' ? '1px solid var(--hairline)' : 'none',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 13,
                    maxWidth: '80%',
                  }}
                >
                  {turn.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendTestMessage} style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1, background: 'var(--ink)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-hi)', fontSize: 13 }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrire un message client…"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending}
                style={{ background: 'var(--gold)', color: '#1a1200', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13 }}
              >
                {sending ? '…' : 'Envoyer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
