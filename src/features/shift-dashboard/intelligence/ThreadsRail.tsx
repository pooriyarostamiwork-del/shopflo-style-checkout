import { useMemo, useState } from "react";
import { MessageSquarePlus, Search, Trash2, Pencil, Check, X } from "lucide-react";
import { IntelThread } from "./types";

interface Props {
  threads: IntelThread[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

const DAY = 24 * 60 * 60 * 1000;

const groupThreads = (threads: IntelThread[]) => {
  const now = Date.now();
  const today: IntelThread[] = [];
  const week: IntelThread[] = [];
  const older: IntelThread[] = [];
  const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const t of sorted) {
    const age = now - t.updatedAt;
    if (age < DAY) today.push(t);
    else if (age < 7 * DAY) week.push(t);
    else older.push(t);
  }
  return [
    { label: "امروز", items: today },
    { label: "۷ روز گذشته", items: week },
    { label: "قدیمی‌تر", items: older },
  ].filter((g) => g.items.length > 0);
};

export const ThreadsRail = ({
  threads,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: Props) => {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.trim();
    return threads.filter(
      (t) =>
        t.title.includes(q) ||
        t.messages.some((m) => m.content.includes(q)),
    );
  }, [threads, query]);

  const groups = groupThreads(filtered);

  const startEdit = (t: IntelThread) => {
    setEditingId(t.id);
    setDraft(t.title);
  };
  const commitEdit = () => {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  };

  return (
    <aside className="sd-intel-rail">
      <div className="p-3 flex flex-col gap-2.5">
        <button
          onClick={onCreate}
          className="sd-btn-primary w-full !justify-center flex items-center gap-2 !py-2.5"
        >
          <MessageSquarePlus className="w-4 h-4" strokeWidth={2} />
          چت جدید
        </button>

        <div className="relative">
          <Search
            className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--sd-muted))] pointer-events-none"
            strokeWidth={2}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی چت‌ها"
            className="sd-input !py-2 !pr-9 !text-[12.5px]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 && (
          <div className="text-center text-[12px] text-[hsl(var(--sd-muted))] px-4 py-6">
            چتی پیدا نشد.
          </div>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mt-2">
            <div className="sd-nav-label">{g.label}</div>
            <div className="flex flex-col gap-0.5">
              {g.items.map((t) => {
                const isActive = t.id === activeId;
                const isEditing = editingId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`sd-intel-thread ${isActive ? "active" : ""}`}
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="sd-input !py-1.5 !text-[12.5px]"
                        />
                        <button
                          onClick={commitEdit}
                          className="sd-intel-thread-action"
                          aria-label="ذخیره"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="sd-intel-thread-action"
                          aria-label="لغو"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelect(t.id)}
                          className="sd-intel-thread-select"
                        >
                          <span className="truncate">{t.title}</span>
                        </button>
                        <div className="sd-intel-thread-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(t);
                            }}
                            className="sd-intel-thread-action"
                            aria-label="ویرایش عنوان"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("این چت حذف بشه؟")) onDelete(t.id);
                            }}
                            className="sd-intel-thread-action danger"
                            aria-label="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
