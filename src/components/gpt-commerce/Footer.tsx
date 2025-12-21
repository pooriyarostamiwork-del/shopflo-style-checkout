import { Shield, RefreshCw, Headphones, Truck, User } from "lucide-react";

interface FooterProps {
  onSupportClick: () => void;
  onSignInClick: () => void;
}

export const Footer = ({ onSupportClick, onSignInClick }: FooterProps) => {
  const confidenceItems = [
    { icon: Shield, label: 'پرداخت امن' },
    { icon: RefreshCw, label: 'تضمین بازگشت وجه' },
    { icon: Headphones, label: 'پشتیبانی ۲۴/۷' },
    { icon: Truck, label: 'ارسال سریع' },
  ];

  const ctaItems = [
    { label: 'فروشنده هستی؟', action: () => {} },
    { label: 'دانلود اپ', action: () => {} },
    { label: 'پشتیبانی', action: onSupportClick },
  ];

  const legalItems = [
    { label: 'قوانین استفاده', href: '#' },
    { label: 'حریم خصوصی', href: '#' },
    { label: 'چطور خرید انجام میشه؟', href: '#' },
  ];

  return (
    <footer className="w-full py-12 mt-auto" dir="rtl">
      <div className="max-w-[960px] mx-auto px-4 space-y-8">
        {/* 1️⃣ Confidence Strip */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {confidenceItems.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-70"
            >
              <item.icon 
                className="w-5 h-5 text-muted-foreground/60" 
                strokeWidth={1.5}
              />
              <span className="text-sm font-medium text-muted-foreground/80">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* 2️⃣ CTA Row */}
        <div className="flex items-center justify-center gap-2">
          {ctaItems.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              <button
                onClick={item.action}
                className="text-sm text-muted-foreground/70 hover:underline hover:text-muted-foreground transition-colors duration-200"
              >
                {item.label}
              </button>
              {index < ctaItems.length - 1 && (
                <span className="text-muted-foreground/30">·</span>
              )}
            </span>
          ))}
        </div>

        {/* 3️⃣ Soft Legal */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {legalItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="text-xs text-muted-foreground/40 hover:underline hover:text-muted-foreground/60 transition-colors duration-200 leading-loose"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};