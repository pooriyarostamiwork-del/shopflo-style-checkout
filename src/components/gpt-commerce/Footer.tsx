import { Shield, RefreshCw, Headphones, Truck, CreditCard, Phone } from "lucide-react";

interface FooterProps {
  onSupportClick: () => void;
  onSignInClick: () => void;
}

export const Footer = ({ onSupportClick, onSignInClick }: FooterProps) => {
  const trustBadges = [
    { icon: Shield, label: 'پرداخت امن' },
    { icon: RefreshCw, label: 'ضمانت بازگشت' },
    { icon: Headphones, label: 'پشتیبانی ۲۴/۷' },
    { icon: Truck, label: 'ارسال سریع' },
  ];

  return (
    <footer className="w-full border-t border-border/40 mt-auto" dir="rtl">
      {/* Trust Badges */}
      <div className="py-6 border-b border-border/20">
        <div className="max-w-[960px] mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {trustBadges.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-muted-foreground/70"
              >
                <item.icon className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-8">
        <div className="max-w-[960px] mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-right">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-sm font-semibold text-foreground mb-3">فلوکارت</h3>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                خرید هوشمند با کمک هوش مصنوعی
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold text-foreground/80 mb-3">دسترسی سریع</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors">درباره ما</a></li>
                <li><button onClick={onSupportClick} className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors">پشتیبانی</button></li>
                <li><a href="#" className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors">سوالات متداول</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold text-foreground/80 mb-3">قوانین</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors">حریم خصوصی</a></li>
                <li><a href="#" className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors">شرایط استفاده</a></li>
                <li><a href="#" className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors">نحوه خرید</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-semibold text-foreground/80 mb-3">تماس</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <Phone className="w-3 h-3" />
                  <span>۰۲۱-۱۲۳۴۵۶۷۸</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <CreditCard className="w-3 h-3" />
                  <span>پرداخت آنلاین</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="py-4 border-t border-border/20">
        <div className="max-w-[960px] mx-auto px-4">
          <p className="text-[10px] text-muted-foreground/40 text-center">
            © ۱۴۰۳ فلوکارت. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  );
};