import { useState } from "react";
import { Tag, ChevronRight, ChevronLeft, Check, Gift, Truck, Percent } from "lucide-react";
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={`w-full h-12 justify-between text-left font-normal border-dashed ${isRTL ? 'flex-row-reverse text-right' : ''}`}
        >
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-foreground">
              {selectedCoupon 
                ? `${t.checkout.coupons.applied}: ${selectedCoupon.reward}`
                : `${t.checkout.coupons.title} (${isRTL ? toPersianNumber(availableCoupons.length) : availableCoupons.length})`
              }
            </span>
          </div>
          <ChevronIcon className="w-4 h-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className={`text-xl font-bold ${isRTL ? 'text-right' : ''}`}>
            {t.checkout.coupons.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Available Coupons */}
          {availableCoupons.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide ${isRTL ? 'text-right' : ''}`}>
                {t.checkout.coupons.unlocked}
              </h3>
              {availableCoupons.map((tier, index) => {
                const isSelected = selectedCoupon?.threshold === tier.threshold;
                
                return (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl border-2 transition-all cursor-pointer
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
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
                          mt-0.5 p-2 rounded-lg
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
                            <p className="text-xs text-primary font-medium mt-1">
                              {t.checkout.coupons.savingsOf} {formatCurrency(tier.value, language)}
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
            <div className="space-y-3 pt-4">
              <h3 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide ${isRTL ? 'text-right' : ''}`}>
                {t.checkout.coupons.addMore}
              </h3>
              {unavailableCoupons.map((tier, index) => {
                const progress = getProgress(tier.threshold);
                const amountNeeded = getAmountNeeded(tier.threshold);
                
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-border bg-muted/20"
                  >
                    <div className={`flex items-start gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="mt-0.5 p-2 rounded-lg bg-muted text-muted-foreground opacity-60">
                        {getIcon(tier.type)}
                      </div>
                      
                      <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                        <h4 className="font-semibold text-foreground mb-1 opacity-60">
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
                      <p className={`text-xs text-primary font-medium ${isRTL ? 'text-right' : ''}`}>
                        {isRTL 
                          ? `${formatCurrency(amountNeeded, language)} دیگر برای فعال‌سازی`
                          : `Add ${formatCurrency(amountNeeded, language)} more to unlock this offer`
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
                {isRTL ? "کوپنی موجود نیست" : "No coupons available"}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
