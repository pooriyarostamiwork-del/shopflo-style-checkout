// In-chat provider profile block (bio, specialties, ratings, policies).
// Rendered as a chat message when the user taps «توضیحات» on a provider card.
import { useState } from "react";
import {
  ChevronDown,
  GraduationCap,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
  Video,
} from "lucide-react";
import { PgBookingCard } from "./PgBookingBlocks";
import { PgProvider, PgService, faDuration, faPrice, toFa } from "../data/mockBooking";

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2.5 rounded-xl border border-border">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-[12px] mt-0.5 leading-tight">{value}</p>
  </div>
);

export const PgProviderProfile = ({
  provider,
  service,
  onPick,
}: {
  provider: PgProvider;
  service?: PgService;
  onPick?: (p: PgProvider) => void;
}) => {
  const [openReviews, setOpenReviews] = useState(false);
  const [openPolicies, setOpenPolicies] = useState(false);
  const full = provider.nextOpenIn === 99;

  return (
    <PgBookingCard
      icon={<ShieldCheck className="w-4 h-4" />}
      title={`پروفایل ${provider.name}`}
      hint={`${provider.title} · ${provider.specialty}`}
    >
      {/* identity */}
      <div className="flex items-start gap-3">
        <img
          src={provider.avatar}
          alt={provider.name}
          loading="lazy"
          className="w-14 h-14 rounded-2xl object-cover border border-border shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="w-3 h-3 text-primary" />
            <span className="text-foreground text-[13px] font-medium">
              {toFa(provider.rating)}
            </span>
            <span>از {toFa(provider.reviews)} نظر</span>
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5">
            {provider.modes.includes("online") ? (
              <Video className="w-3 h-3" />
            ) : (
              <MapPin className="w-3 h-3" />
            )}
            <span className="truncate">{provider.location}</span>
          </p>
          <span
            className={`inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded-md border ${
              full ? "border-border text-muted-foreground" : "border-primary/40 text-primary"
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

      <p className="text-[12px] text-muted-foreground leading-relaxed mt-3">
        {provider.bio}
      </p>

      {/* specialties */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {provider.specialties.map((s) => (
          <span
            key={s}
            className="text-[11px] px-2 py-1 rounded-lg border border-border text-muted-foreground"
          >
            {s}
          </span>
        ))}
      </div>

      {/* facts */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <Row label="سابقه" value={`${toFa(provider.years)} سال`} />
        <Row label="زبان‌ها" value={provider.languages.join("، ")} />
      </div>

      {/* ratings breakdown */}
      <div className="mt-3 p-3 rounded-xl border border-border">
        <p className="text-[11px] text-muted-foreground mb-2">توزیع امتیازها</p>
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

        <button
          onClick={() => setOpenReviews((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-primary mt-2.5"
        >
          نظرهای منتخب
          <ChevronDown
            className={`w-3 h-3 transition-transform ${openReviews ? "rotate-180" : ""}`}
          />
        </button>
        {openReviews && (
          <div className="space-y-2 mt-2">
            {provider.reviewHighlights.map((rv, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-border">
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
        )}
      </div>

      {/* education */}
      <div className="mt-3">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-primary" />
          تحصیلات و مدارک
        </p>
        <ul className="space-y-1">
          {provider.education.map((e) => (
            <li key={e} className="text-[12px] text-muted-foreground">
              · {e}
            </li>
          ))}
        </ul>
      </div>

      {/* policies */}
      <button
        onClick={() => setOpenPolicies((v) => !v)}
        className="w-full mt-3 h-9 rounded-xl border border-border flex items-center gap-1.5 px-3 text-[11px] text-muted-foreground hover:border-primary/40 transition-colors"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        قوانین نوبت و لغو
        <ChevronDown
          className={`w-3.5 h-3.5 ms-auto transition-transform ${
            openPolicies ? "rotate-180" : ""
          }`}
        />
      </button>
      {openPolicies && (
        <div className="space-y-2 mt-2">
          {provider.policies.map((p) => (
            <div key={p.title} className="p-2.5 rounded-lg border border-border">
              <p className="text-[12px]">{p.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                {p.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* footer */}
      <div className="mt-3 pt-3 border-t border-border">
        {service && (
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2.5">
            <Languages className="w-3 h-3 opacity-0" />
            <span>{service.name}</span>
            <span>· {faDuration(service.duration)}</span>
            <span className="ms-auto text-foreground">{faPrice(service.price)}</span>
          </p>
        )}
        <button
          onClick={() => onPick?.(provider)}
          disabled={full}
          className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs disabled:opacity-40"
        >
          {full ? "ظرفیت تکمیل است" : "انتخاب وقت"}
        </button>
      </div>
    </PgBookingCard>
  );
};
