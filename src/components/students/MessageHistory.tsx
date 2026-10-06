import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";
import type { Format } from "@/lib/format";
import type { Message } from "@/lib/types";

const KIND_LABEL: Record<Message["kind"], string> = {
  receipt: "Receipt",
  balance_reminder: "Balance reminder",
  instalment_due: "Instalment due soon",
  instalment_overdue: "Instalment overdue",
  test: "Test",
};

const STATUS: Record<Message["status"], { label: string; variant: "ok" | "due" | "late" }> = {
  sent: { label: "Sent", variant: "ok" },
  dry_run: { label: "Not sent (no provider)", variant: "due" },
  skipped: { label: "No address", variant: "due" },
  failed: { label: "Failed", variant: "late" },
};

/** Every email the app has sent, or tried to send, about this student. */
export function MessageHistory({ messages, fmt }: { messages: Message[]; fmt: Format }) {
  if (messages.length === 0) return <EmptyState message="No emails sent yet." />;
  return (
    <div className="flex flex-col">
      {messages.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3 first:border-t-0">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{m.subject}</div>
            <div className="truncate text-[11.5px] text-ink-soft">
              {KIND_LABEL[m.kind]} · {fmt.date(m.created_at.slice(0, 10))}
              {m.to_email && ` · ${m.to_email}`}
            </div>
            {m.error && <div className="mt-0.5 text-[11.5px] text-danger">{m.error}</div>}
          </div>
          <Tag variant={STATUS[m.status].variant}>{STATUS[m.status].label}</Tag>
        </div>
      ))}
    </div>
  );
}
