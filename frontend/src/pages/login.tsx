import { useState } from 'react';
import { useRouter } from 'next/router';
import { api, setToken } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('serykouame@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(identifier, password);
      setToken(res.accessToken);
      router.push(res.user.role === 'super_admin' ? '/dashboard' : '/workspace');
    } catch (err: any) {
      setError(err.message || 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.grain} />
      <form onSubmit={onSubmit} style={styles.card}>
        <div style={styles.mark}>
          <span style={{ color: 'var(--gold)' }}>GOD.</span>ROGWEBSERVICE
        </div>
        <div style={styles.sub}>Console Super Administrateur</div>

        <label style={styles.label}>Email ou téléphone</label>
        <input
          style={styles.input}
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />

        <label style={styles.label}>Mot de passe</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Connexion…' : 'Entrer dans la console'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'radial-gradient(1200px 600px at 50% -10%, #1a2338 0%, #0b0f16 60%)',
    position: 'relative',
  },
  grain: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  card: {
    width: 380,
    background: 'var(--panel)',
    border: '1px solid var(--hairline)',
    borderRadius: 12,
    padding: '36px 32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  mark: {
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: '-0.02em',
  },
  sub: { color: 'var(--text-lo)', fontSize: 13, marginTop: 4, marginBottom: 28 },
  label: {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-lo)',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    width: '100%',
    background: 'var(--ink)',
    border: '1px solid var(--hairline)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'var(--text-hi)',
    fontSize: 14,
    fontFamily: 'IBM Plex Mono, monospace',
  },
  error: {
    marginTop: 16,
    color: 'var(--red)',
    fontSize: 13,
    background: 'rgba(242,104,92,0.1)',
    border: '1px solid rgba(242,104,92,0.3)',
    borderRadius: 8,
    padding: '8px 10px',
  },
  button: {
    marginTop: 24,
    width: '100%',
    background: 'var(--gold)',
    color: '#1a1200',
    border: 'none',
    borderRadius: 8,
    padding: '11px 0',
    fontWeight: 600,
    fontSize: 14,
  },
};
