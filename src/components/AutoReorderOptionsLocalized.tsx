import { useState } from "react";
import { Bell, Calendar, TrendingDown } from "lucide-react";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { useLanguage, toPersianNumber } from "@/i18n";

interface AutoReorderOptionsLocalizedProps {
  onOptionsChange?: (options: {
    priceDropAlert: boolean;
    priceDropThreshold?: number;
    autoReorderMonthly: boolean;
    priceDecreaseNotify: boolean;
  }) => void;
}

export const AutoReorderOptionsLocalized = ({ onOptionsChange }: AutoReorderOptionsLocalizedProps) => {
  const { t, isRTL } = useLanguage();
  const [priceDropAlert, setPriceDropAlert] = useState(false);
  const [priceDropThreshold, setPriceDropThreshold] = useState("");
  const [autoReorderMonthly, setAutoReorderMonthly] = useState(false);
  const [priceDecreaseNotify, setPriceDecreaseNotify] = useState(false);

  const handleChange = (
    field: string,
    value: boolean | string
  ) => {
    const updates: any = {
      priceDropAlert,
      priceDropThreshold: priceDropThreshold ? parseFloat(priceDropThreshold) : undefined,
      autoReorderMonthly,
      priceDecreaseNotify
    };
    
    if (field === 'priceDropAlert') {
      setPriceDropAlert(value as boolean);
      updates.priceDropAlert = value;
    } else if (field === 'priceDropThreshold') {
      setPriceDropThreshold(value as string);
      updates.priceDropThreshold = value ? parseFloat(value as string) : undefined;
    } else if (field === 'autoReorderMonthly') {
      setAutoReorderMonthly(value as boolean);
      updates.autoReorderMonthly = value;
    } else if (field === 'priceDecreaseNotify') {
      setPriceDecreaseNotify(value as boolean);
      updates.priceDecreaseNotify = value;
    }

    onOptionsChange?.(updates);
  };

  return (
    <div className={`border-t border-border/50 pt-6 mt-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className={`text-base font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}>
        {t.checkout.autoReorder.title}
      </h3>
      
      <div className="space-y-4">
        {/* Price Drop Alert */}
        <div className={`flex items-center justify-between py-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingDown className="w-4 h-4 text-primary" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm font-medium text-foreground">
                {t.checkout.autoReorder.priceDropBelow}
              </p>
              {priceDropAlert && (
                <div className={`mt-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Input
                    type="number"
                    value={priceDropThreshold}
                    onChange={(e) => handleChange('priceDropThreshold', e.target.value)}
                    placeholder={isRTL ? "مبلغ" : "Amount"}
                    className={`h-8 w-24 text-sm ${isRTL ? 'text-right' : ''}`}
                    dir="ltr"
                  />
                  <span className="text-sm text-muted-foreground">{isRTL ? 'تومان' : '₹'}</span>
                </div>
              )}
            </div>
          </div>
          <Switch
            checked={priceDropAlert}
            onCheckedChange={(checked) => handleChange('priceDropAlert', checked)}
          />
        </div>

        {/* Monthly Auto-Reorder */}
        <div className={`flex items-center justify-between py-3 border-t border-border/30 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm font-medium text-foreground">
                {t.checkout.autoReorder.monthlyReorder}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL 
                  ? "هر ماه خودکار سفارش می‌دهیم"
                  : "Auto-order every month"
                }
              </p>
            </div>
          </div>
          <Switch
            checked={autoReorderMonthly}
            onCheckedChange={(checked) => handleChange('autoReorderMonthly', checked)}
          />
        </div>

        {/* Price Decrease Notification */}
        <div className={`flex items-center justify-between py-3 border-t border-border/30 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm font-medium text-foreground">
                {t.checkout.autoReorder.notifyPriceDrop}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL 
                  ? "اطلاع‌رسانی کاهش قیمت"
                  : "Get notified on price drops"
                }
              </p>
            </div>
          </div>
          <Switch
            checked={priceDecreaseNotify}
            onCheckedChange={(checked) => handleChange('priceDecreaseNotify', checked)}
          />
        </div>
      </div>
    </div>
  );
};
