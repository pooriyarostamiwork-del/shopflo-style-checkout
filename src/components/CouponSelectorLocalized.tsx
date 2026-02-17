import { useState } from "react";
import { Tag, Check, Gift, Truck, Percent, Sparkles, X } from "lucide-react";
import { Button } from "./ui/button";
import { CouponTier } from "@/types/checkout";
import { Progress } from "./ui/progress";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface CouponSelectorLocalizedProps {
  currentTotal: number;
  tiers: CouponTier[];
  selectedCoupon: CouponTier | null;
  onSelectCoupon: (tier: CouponTier | null) => void;
}

export const CouponSelectorLocalized = ({
  currentTotal,
  tiers,
  selectedCoupon,
  onSelectCoupon
}: CouponSelectorLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);
  const availableCoupons = sortedTiers.filter(tier => currentTotal >= tier.threshold);
  const unavailableCoupons = sortedTiers.filter(tier => currentTotal < tier.threshold);

  const getIcon = (type: string) => {
    switch (type) {
      case "shipping": return <Truck className="w-4 h-4" />;
      case "gift": return <Gift className="w-4 h-4" />;
      case "discount": return <Percent className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getProgress = (threshold: number) => Math.min((currentTotal / threshold) * 100, 100);
  const getAmountNeeded = (threshold: number) => threshold - currentTotal;

  return (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all"
      >
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 rounded-lg bg-primary/10">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <p className="font-medium text-foreground text-sm">
                {isRTL ? "کوپن های موجود" : "Available Coupons"}
                {availableCoupons.length > 0 && !selectedCoupon && (
                  <span className="text-xs text-muted-foreground font-normal mx-2">
                    {isRTL 
                      ? `${toPersianNumber(availableCoupons.length)} کوپن فعال`
                      : `${availableCoupons.length} active`
                    }
                  </span>
                )}
              </p>
              {selectedCoupon?.value && (
                <p className="text-xs text-primary font-medium mt-0.5">
                  {isRTL 
                    ? `${formatCurrency(selectedCoupon.value, language)} تخفیف اعمال شده`
                    : `${formatCurrency(selectedCoupon.value, language)} off applied`
                  }
                </p>
              )}
            </div>
          </div>
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
          </svg>
        </div>
      </button>

      {/* Coupon Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0 gap-0 rounded-2xl overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className={`text-lg font-bold ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? "کوپن های موجود" : "Available Coupons"}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Unlocked Coupons */}
            {availableCoupons.length > 0 && (
              <div className="space-y-2.5">
                <p className={`text-xs font-medium text-muted-foreground uppercase tracking-wider ${isRTL ? 'text-right' : ''}`}>
                  {isRTL ? "قابل استفاده" : "Available"}
                </p>
                {availableCoupons.map((tier, index) => {
                  const isSelected = selectedCoupon?.threshold === tier.threshold;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        onSelectCoupon(isSelected ? null : tier);
                        setIsOpen(false);
                      }}
                      className={`w-full p-4 rounded-xl transition-all text-right
                        ${isSelected 
                          ? 'bg-primary/8 border-2 border-primary' 
                          : 'bg-card border border-border/50 hover:border-primary/30'
                        }`}
                    >
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'}`}>
                          {getIcon(tier.type)}
                        </div>
                        <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p className="font-semibold text-sm text-foreground">{tier.reward}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isRTL 
                              ? `سفارش‌های بالای ${formatCurrency(tier.threshold, language)}`
                              : `Orders above ${formatCurrency(tier.threshold, language)}`
                            }
                          </p>
                          {tier.value && (
                            <p className="text-xs text-primary font-semibold mt-1">
                              {isRTL 
                                ? `صرفه‌جویی ${formatCurrency(tier.value, language)}`
                                : `Save ${formatCurrency(tier.value, language)}`
                              }
                            </p>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}>
                          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Locked Coupons */}
            {unavailableCoupons.length > 0 && (
              <div className="space-y-2.5">
                <p className={`text-xs font-medium text-muted-foreground uppercase tracking-wider ${isRTL ? 'text-right' : ''}`}>
                  {isRTL ? "بیشتر خرید کنید" : "Add more to unlock"}
                </p>
                {unavailableCoupons.map((tier, index) => {
                  const progress = getProgress(tier.threshold);
                  const amountNeeded = getAmountNeeded(tier.threshold);
                  return (
                    <div key={index} className="p-4 rounded-xl bg-muted/10 border border-border/30">
                      <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2.5 rounded-xl bg-muted/30 text-muted-foreground/50 flex-shrink-0">
                          {getIcon(tier.type)}
                        </div>
                        <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p className="font-semibold text-sm text-foreground/50">{tier.reward}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isRTL 
                              ? `سفارش‌های بالای ${formatCurrency(tier.threshold, language)}`
                              : `Orders above ${formatCurrency(tier.threshold, language)}`
                            }
                          </p>
                        </div>
                      </div>
                      <Progress value={progress} className="h-1.5 mb-2" />
                      <p className={`text-xs text-primary font-medium ${isRTL ? 'text-right' : ''}`}>
                        {isRTL 
                          ? `${formatCurrency(amountNeeded, language)} دیگر تا فعال‌سازی`
                          : `${formatCurrency(amountNeeded, language)} more to unlock`
                        }
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {availableCoupons.length === 0 && unavailableCoupons.length === 0 && (
              <div className="text-center py-10">
                <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "کوپنی موجود نیست" : "No coupons available"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Applied feedback */}
      {selectedCoupon && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
          <span className="text-xs text-accent-foreground font-medium">
            {isRTL ? "بهترین تخفیف اعمال شد" : "Best discount applied"}
          </span>
        </div>
      )}
    </div>
  );
};
