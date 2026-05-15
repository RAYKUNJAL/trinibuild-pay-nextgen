import { requireAdmin } from "../_lib/auth";

export const metadata = { title: "Announcements — Admin" };

export default async function AnnouncementsPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform announcements</h1>
        <p className="text-sm text-muted-foreground">
          Broadcast a message to every user on the platform. Use sparingly.
        </p>
      </div>

      <form
        action="/api/admin/announce"
        method="post"
        className="space-y-4 rounded-lg border bg-card p-4"
      >
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={120}
            placeholder="e.g. Carnival 2026 ticketing now open"
            className="w-full rounded border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-medium">
            Body
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={6}
            placeholder="Message body…"
            className="w-full rounded border bg-background p-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="target" className="mb-1 block text-sm font-medium">
            Target audience
          </label>
          <select
            id="target"
            name="target"
            className="w-full rounded border bg-background p-2 text-sm"
            defaultValue="all"
          >
            <option value="all">All users</option>
            <option value="promoters">Promoters only</option>
            <option value="attendees">Attendees only</option>
            <option value="island:tt">Trinidad & Tobago only</option>
            <option value="island:jm">Jamaica only</option>
            <option value="island:bb">Barbados only</option>
          </select>
        </div>

        <div>
          <label htmlFor="channel" className="mb-1 block text-sm font-medium">
            Channel
          </label>
          <select
            id="channel"
            name="channel"
            className="w-full rounded border bg-background p-2 text-sm"
            defaultValue="whatsapp"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="both">Both</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Queue broadcast
        </button>
        <p className="text-xs text-muted-foreground">
          The broadcast is created in <code>draft</code> status. Sending is handled by the
          background worker once it's queued.
        </p>
      </form>
    </div>
  );
}
