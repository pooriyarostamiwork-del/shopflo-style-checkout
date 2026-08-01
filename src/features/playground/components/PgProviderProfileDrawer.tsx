// Provider profile drawer opened from provider cards during booking.
// Bio, specialties, ratings breakdown, review highlights and policies.
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  CalendarDays,
  GraduationCap,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
  Video,
} from "lucide-react";
import {
  PgProvider,
  PgService,
  faDuration,
  faPrice,
  toFa,
} from "../data/mockBooking";

const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="pt-4 mt-4 border-t border-border first:mt-0 first:pt-0 first:border-0">
    <p className="flex items-center gap-1.5 text-[12px] font-medium mb-2">
      <span className="text-primary">{icon}</span>
      {title}
    </p>
    {children}
  </div>
);

export const PgProviderProfileDrawer = ({
  provider,
  service,
  onClose,
  onPick,
}: {
  provider: PgProvider | null;
  service?: PgService;
  onClose: () => void;
  onPick?: (p: PgProvider) => void;
}) => {
  const full = provider?.nextOpenIn === 99;

  return (
    <Sheet open={!!provider} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        dir="rtl"
        className="w-full sm:max-w-md bg-background p-0 flex flex-col"
      >
        {provider && (
          <>
            <div className="px-5 pt-6 pb-4 border-b border-border">
              <div className="flex items-start gap-3">
                <img
                  src={provider.avatar}
                  alt={provider.name}
                  loading="lazy"
                  className="w-14 h-14 rounded-full object-cover border border-border shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-medium">{provider.name}</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {provider.title} · {provider.specialty}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
                    <Star className="w-3 h-3 text-primary" />
                    <span className="text-foreground">{toFa(provider.rating)}</span>
                    <span>({toFa(provider.reviews)} نظر)</span>
                    <span>·</span>
                    <span>{toFa(provider.years)} سال تجربه</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                {provider.modes.includes("online") ? (
                  <Video className="w-3 h-3" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                <span className="truncate">{provider.location}</span>
                <span
                  className={`ms-auto text-[10px] px-1.5 py-0.5 rounded-md border shrink-0 ${
                    full
                      ? "border-border text-muted-foreground"
                      : "border-primary/40 text-primary"
                  }`}
                >
                  {full
                    ? "ظرفیت تکمیل"
                    : provider.nextOpenIn === 0
                      ? "نوبت خالی امروز"
                      : `اولین نوبت ${toFa(provider.nextOpenIn)} روز دیگر`}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <Section icon={<ShieldCheck className="w-3.5 h-3.5" />} title="درباره">
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {provider.bio}
                </p>
              </Section>

              <Section icon={<Star className="w-3.5 h-3.5" />} title="تخصص‌ها">
                <div className="flex flex-wrap gap-1.5">
                  {provider.specialties.map((s) => (
                    <span
                      key={s}
                      className="text-[11px] px-2 py-1 rounded-lg border border-border text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Section>

              <Section icon={<Star className="w-3.5 h-3.5" />} title="امتیاز بیماران">
                <div className="space-y-1.5">
                  {provider.ratingBreakdown.map((r) => (
                    <div key={r.stars} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-8 shrink-0">
                        {toFa(r.stars)} ★
                      </span>
                      <span className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <span
                          className="block h-full bg-primary"
                          style={{ width: `${r.share}%` }}
                        />
                      </span>
                      <span className="text-[11px] text-muted-foreground w-9 text-left shrink-0">
                        {toFa(r.share)}٪
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mt-3">
                  {provider.reviewHighlights.map((rv, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-border">
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="text-foreground">{rv.author}</span>
                        <Star className="w-3 h-3 text-primary" />
                        {toFa(rv.rating)}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                        {rv.text}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section icon={<GraduationCap className="w-3.5 h-3.5" />} title="تحصیلات">
                <ul className="space-y-1">
                  {provider.education.map((e) => (
                    <li key={e} className="text-[12px] text-muted-foreground">
                      · {e}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section icon={<Languages className="w-3.5 h-3.5" />} title="زبان‌ها">
                <p className="text-[12px] text-muted-foreground">
                  {provider.languages.join("، ")}
                </p>
              </Section>

              <Section icon={<ShieldCheck className="w-3.5 h-3.5" />} title="قوانین نوبت">
                <div className="space-y-2">
                  {provider.policies.map((p) => (
                    <div key={p.title}>
                      <p className="text-[12px]">{p.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {p.text}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <div className="px-5 py-4 border-t border-border">
              {service && (
                <p className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2.5">
                  <CalendarDays className="w-3 h-3" />
                  <span>{service.name}</span>
                  <span>· {faDuration(service.duration)}</span>
                  <span className="ms-auto text-foreground">{faPrice(service.price)}</span>
                </p>
              )}
              <button
                onClick={() => {
                  onPick?.(provider);
                  onClose();
                }}
                disabled={full}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs disabled:opacity-40"
              >
                {full ? "ظرفیت تکمیل است" : "انتخاب وقت"}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
