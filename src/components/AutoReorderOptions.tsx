import { useState } from "react";
import { Bell, Calendar, TrendingDown } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface AutoReorderOptionsProps {
  onOptionsChange?: (options: {
    priceDropAlert: boolean;
    priceDropThreshold?: number;
    autoReorderMonthly: boolean;
    priceDecreaseNotify: boolean;
  }) => void;
}

export const AutoReorderOptions = ({ onOptionsChange }: AutoReorderOptionsProps) => {
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
    <div className="border-t border-border pt-4 mt-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Smart Reorder Options</h3>
      
      <div className="space-y-3">
        {/* Price Drop Alert */}
        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="priceDrop"
              checked={priceDropAlert}
              onChange={(e) => handleChange('priceDropAlert', e.target.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="priceDrop" className="flex items-center gap-2 font-medium cursor-pointer">
              <TrendingDown className="w-4 h-4 text-primary" />
              Auto-buy when price drops below
            </Label>
            {priceDropAlert && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xl">₹</span>
                <Input
                  type="number"
                  value={priceDropThreshold}
                  onChange={(e) => handleChange('priceDropThreshold', e.target.value)}
                  placeholder="Enter price"
                  className="h-9 w-32"
                />
              </div>
            )}
          </div>
        </div>

        {/* Monthly Auto-Reorder */}
        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="monthly"
              checked={autoReorderMonthly}
              onChange={(e) => handleChange('autoReorderMonthly', e.target.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="monthly" className="flex items-center gap-2 font-medium cursor-pointer">
              <Calendar className="w-4 h-4 text-primary" />
              Auto-reorder monthly
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              We'll automatically place this order every month
            </p>
          </div>
        </div>

        {/* Price Decrease Notification */}
        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="notify"
              checked={priceDecreaseNotify}
              onChange={(e) => handleChange('priceDecreaseNotify', e.target.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="notify" className="flex items-center gap-2 font-medium cursor-pointer">
              <Bell className="w-4 h-4 text-primary" />
              Notify me if price decreases
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Get alerts when prices drop
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
