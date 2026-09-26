/** Global connectivity banner — makes backend mismatch instantly visible. */
import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { API_BASE } from '@/services/api';

interface Health {
  ok: boolean;
  code_version?: string;
  database?: string;
  counts?: Record<string, number>;
}

export default function ApiStatusBanner() {
  const [state, setState] = useState<
    | { kind: 'checking' }
    | { kind: 'ok'; health: Health }
    | { kind: 'down'; error: string }
    | { kind: 'wrong-app'; health: Health }
    | { kind: 'dismissed' }
  >({ kind: 'checking' });

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/health`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((health: Health) => {
        if (!alive) return;
        // Foreign app guard: our API always stamps code_version.
        if (!health.code_version) {
          setState({ kind: 'wrong-app', health });
        } else {
          setState({ kind: 'ok', health });
        }
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({ kind: 'down', error: e instanceof Error ? e.message : 'unreachable' });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state.kind === 'checking' || state.kind === 'ok' || state.kind === 'dismissed') {
    return null;
  }

  return (
    <div role="alert"
      className="flex flex-wrap items-center gap-2.5 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800">
      <AlertTriangle size={15} className="shrink-0 text-amber-500" />
      {state.kind === 'down' ? (
        <span>
          <b>Backend not reachable</b> at <code className="rounded bg-white px-1">{API_BASE}</code>
          ({state.error}). Check the Render service is running — data cannot be saved.
        </span>
      ) : (
        <span>
          <b>Wrong backend detected</b> — the API at{' '}
          <code className="rounded bg-white px-1">{API_BASE}</code> is running a different app
          (version <code className="rounded bg-white px-1">{String(state.health.code_version ?? 'unknown')}</code>).
          Point the frontend at the Kabadiwala Connect API service (v1.0.0-sih26229) — see DEPLOYMENT.md.
        </span>
      )}
      <button type="button" onClick={() => setState({ kind: 'dismissed' })}
        className="ml-auto rounded-lg p-1 hover:bg-amber-100" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
