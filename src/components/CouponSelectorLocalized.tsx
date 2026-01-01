import { useState } from "react";
import { Tag, ChevronRight, ChevronLeft, Check, Gift, Truck, Percent, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { CouponTier } from "@/types/checkout";
import { Progress } from "./ui/progress";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";

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

  // Auto-apply best coupon feedback
  const bestCoupon = availableCoupons.length > 0 
    ? availableCoupons.reduce((best, current) => 
        (current.value || 0) > (best.value || 0) ? current : best
      )
    : null;

  const getIcon = (type: string) => {
    switch (type) {
      case "shipping":
        return <Truck className="w-4 h-4" />;
      case "gift":
        return <Gift className="w-4 h-4" />;
      case "discount":
        return <Percent className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getProgress = (threshold: number) => {
    return Math.min((currentTotal / threshold) * 100, 100);
  };

  const getAmountNeeded = (threshold: number) => {
    return threshold - currentTotal;
  };

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Accordion-style Coupon Section */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className={`w-full p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-border/30 hover:border-primary/30 transition-all ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Tag className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {isRTL ? "کدهای تخفیف موجود" : "Available Discount Codes"}
                  </p>
                  {selectedCoupon ? (
                    <p className="text-sm text-primary font-medium">
                      {selectedCoupon.value && (
                        <>
                          {isRTL 
                            ? `${formatCurrency(selectedCoupon.value, language)} تخفیف`
                            : `${formatCurrency(selectedCoupon.value, language)} off`
                          }
                        </>
                      )}
                    </p>
                  ) : availableCoupons.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? `${toPersianNumber(availableCoupons.length)} کد فعال`
                        : `${availableCoupons.length} code${availableCoupons.length > 1 ? 's' : ''} available`
                      }
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? "برای فعال‌سازی بیشتر خرید کنید" : "Add more to unlock"}
                    </p>
                  )}
                </div>
              </div>
              <ChevronIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className={`text-xl font-bold ${isRTL ? 'text-right' : ''}`}>
              {isRTL ? "کدهای تخفیف موجود" : "Available Discount Codes"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Available Coupons */}
            {availableCoupons.length > 0 && (
              <div className="space-y-3">
                <h3 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide ${isRTL ? 'text-right' : ''}`}>
                  {isRTL ? "فعال شده" : "Unlocked"}
                </h3>
                {availableCoupons.map((tier, index) => {
                  const isSelected = selectedCoupon?.threshold === tier.threshold;
                  
                  return (
                    <div
                      key={index}
                      className={`
                        p-4 rounded-xl transition-all cursor-pointer
                        ${isSelected 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'bg-muted/20 border border-border/50 hover:border-primary/30 hover:bg-muted/30'
                        }
                      `}
                      onClick={() => {
                        onSelectCoupon(isSelected ? null : tier);
                        setIsOpen(false);
                      }}
                    >
                      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-start gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`
                            mt-0.5 p-2.5 rounded-xl
                            ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                          `}>
                            {getIcon(tier.type)}
                          </div>
                          
                          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                            <h4 className="font-semibold text-foreground mb-1">
                              {tier.reward}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {isRTL 
                                ? `سفارش‌های بالای ${formatCurrency(tier.threshold, language)}`
                                : `On orders above ${formatCurrency(tier.threshold, language)}`
                              }
                            </p>
                            {tier.value && (
                              <p className="text-sm text-primary font-semibold mt-2">
                                {isRTL 
                                  ? `${formatCurrency(tier.value, language)} تخفیف`
                                  : `Save ${formatCurrency(tier.value, language)}`
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'border-primary bg-primary' : 'border-border'}
                        `}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unavailable Coupons with Progress */}
            {unavailableCoupons.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide ${isRTL ? 'text-right' : ''}`}>
                  {isRTL ? "برای فعال‌سازی بیشتر خرید کنید" : "Add more to unlock"}
                </h3>
                {unavailableCoupons.map((tier, index) => {
                  const progress = getProgress(tier.threshold);
                  const amountNeeded = getAmountNeeded(tier.threshold);
                  
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-muted/10 border border-border/30"
                    >
                      <div className={`flex items-start gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="mt-0.5 p-2.5 rounded-xl bg-muted/50 text-muted-foreground opacity-60">
                          {getIcon(tier.type)}
                        </div>
                        
                        <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                          <h4 className="font-semibold text-foreground/60 mb-1">
                            {tier.reward}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {isRTL 
                              ? `سفارش‌های بالای ${formatCurrency(tier.threshold, language)}`
                              : `On orders above ${formatCurrency(tier.threshold, language)}`
                            }
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className={`text-sm text-primary font-medium ${isRTL ? 'text-right' : ''}`}>
                          {isRTL 
                            ? `${formatCurrency(amountNeeded, language)} دیگر برای فعال‌سازی`
                            : `Add ${formatCurrency(amountNeeded, language)} more to unlock`
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {availableCoupons.length === 0 && unavailableCoupons.length === 0 && (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">
                  {isRTL ? "کدی موجود نیست" : "No codes available"}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Auto-applied feedback message */}
      {selectedCoupon && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Sparkles className="w-4 h-4 text-accent-foreground" />
          <span className="text-sm text-accent-foreground font-medium">
            {isRTL ? "بهترین تخفیف به‌صورت خودکار اعمال شد" : "Best discount auto-applied"}
          </span>
        </div>
      )}
    </div>
  );
};
