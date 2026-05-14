"use client";

import { useEffect, useState } from "react";

type Key = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export default function KeysPage() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"live" | "test">("test");
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/dashboard/keys");
    const body = await res.json();
    setKeys(body.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/dashboard/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, mode }),
    });
    const body = await res.json();
    setCreating(false);
    if (res.ok) {
      setRevealed(body.raw);
      setName("");
      refresh();
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Existing integrations will stop working.")) return;
    await fetch(`/api/dashboard/keys/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">API keys</h1>
        <p className="mt-1 text-sm text-ink-500">
          Use test keys (<code>cc_test_</code>) in sandbox, live keys (<code>cc_live_</code>) for production traffic.
        </p>
      </header>

      <section className="rounded-xl bg-white border border-ink-100 p-6">
        <h2 className="font-semibold text-ink-900">Create new key</h2>
        <form onSubmit={create} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[200px]">
            <span className="block text-sm font-medium text-ink-900">Label</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production backend"
              className="mt-1 w-full rounded-md border border-ink-100 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="block text-sm font-medium text-ink-900">Mode</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "live" | "test")}
              className="mt-1 rounded-md border border-ink-100 px-3 py-2 text-sm"
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create key"}
          </button>
        </form>

        {revealed && (
          <div className="mt-4 rounded-lg bg-ink-900 text-ink-50 p-4 text-sm">
            <div className="text-xs uppercase text-ink-100/70">Save this key now — it won&apos;t be shown again</div>
            <code className="block mt-2 font-mono break-all">{revealed}</code>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-ink-900">Existing keys</h2>
        <div className="mt-4 rounded-xl bg-white border border-ink-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left bg-ink-50 text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Prefix</th>
                <th className="px-4 py-3 font-medium">Last used</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">Loading…</td></tr>
              )}
              {!loading && keys.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">No keys yet.</td></tr>
              )}
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-ink-100">
                  <td className="px-4 py-3 font-medium text-ink-900">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{k.prefix}…</td>
                  <td className="px-4 py-3 text-ink-500">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {k.revokedAt ? (
                      <span className="text-xs text-ink-500">revoked</span>
                    ) : (
                      <button
                        onClick={() => revoke(k.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
