import { useState } from "react";
import { Calendar, Bell } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useLanguage } from "@/i18n";

interface AutoReorderOptionsLocalizedProps {
  onOptionsChange?: (options: {
    autoReorderMonthly: boolean;
    priceDecreaseNotify: boolean;
  }) => void;
}

export const AutoReorderOptionsLocalized = ({ onOptionsChange }: AutoReorderOptionsLocalizedProps) => {
  const { t, isRTL } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setSelectedOption(value);
    onOptionsChange?.({
      autoReorderMonthly: value === 'monthly',
      priceDecreaseNotify: value === 'notify'
    });
  };

  const options = [
    {
      id: 'monthly',
      icon: Calendar,
      title: isRTL ? "خرید خودکار ماهانه" : "Monthly Auto-Reorder",
      description: isRTL ? "هر ماه خودکار سفارش می‌دهیم" : "Auto-order every month"
    },
    {
      id: 'notify',
      icon: Bell,
      title: isRTL ? "اطلاع‌رسانی کاهش قیمت" : "Price Drop Notification",
      description: isRTL ? "وقتی قیمت کاهش یافت مطلعم کن" : "Get notified on price drops"
    }
  ];

  return (
    <div className={`border-t border-border/50 pt-6 mt-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className={`text-base font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}>
        {t.checkout.autoReorder.title}
      </h3>
      
      <RadioGroup value={selectedOption || ''} onValueChange={handleChange} className="space-y-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedOption === option.id;
          
          return (
            <div
              key={option.id}
              className={`
                flex items-center p-4 rounded-xl border transition-all cursor-pointer
                ${isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border/50 hover:border-border'
                }
                ${isRTL ? 'flex-row-reverse' : ''}
              `}
              onClick={() => handleChange(option.id)}
            >
              <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
              <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted/50'}`}>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <p className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {option.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>
              </div>
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${isSelected ? 'border-primary bg-primary' : 'border-border'}
              `}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};
