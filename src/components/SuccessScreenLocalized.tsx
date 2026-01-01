import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { CheckCircle2, Package } from "lucide-react";
import { useLanguage, toPersianNumber, formatCurrency } from "@/i18n";

interface SuccessScreenLocalizedProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export const SuccessScreenLocalized = ({ isOpen, onClose, orderId }: SuccessScreenLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Order ID should always be English digits for copy/paste compatibility
  const formatOrderId = (id: string) => {
    return id; // Keep English digits for Order ID
  };

  const getDeliveryDate = () => {
    if (isRTL) {
      return "۲۷-۲۹ آذر ۱۴۰۴";
    }
    return "Nov 18-20, 2025";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-md" />
      
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className={`relative bg-background rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 text-center ${isRTL ? 'font-vazirmatn' : ''}`}>
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <CheckCircle2 className="w-24 h-24 text-secondary" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-foreground">
          {t.success.title} 🎉
        </h1>
        
        <p className="text-muted-foreground mb-2">
          {isRTL ? "سفارش شما با موفقیت ثبت شد" : "Your order has been successfully placed"}
        </p>

        <p className="text-sm font-medium text-primary mb-6">
          {t.success.subtitle} {isRTL ? toPersianNumber("2.1") : "2.1"} {t.success.seconds} — {t.success.fasterThan}
        </p>

        <div className="bg-muted/30 rounded-xl p-4 mb-6 border border-border">
          <div className={`flex items-center justify-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">{t.success.orderId}</span>
          </div>
          <p className="text-xl font-bold font-mono" dir="ltr">{formatOrderId(orderId)}</p>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-1">{t.success.deliveryDate}</p>
          <p className="text-lg font-bold text-foreground">{getDeliveryDate()}</p>
        </div>

        <Button 
          variant="gradient" 
          className="w-full h-12 text-base rounded-xl"
          onClick={onClose}
        >
          {t.success.continueShopping}
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          {isRTL 
            ? "ایمیل تأییدیه با جزئیات پیگیری برای شما ارسال شد"
            : "We've sent a confirmation email with tracking details"
          }
        </p>
      </div>
    </div>
  );
};
