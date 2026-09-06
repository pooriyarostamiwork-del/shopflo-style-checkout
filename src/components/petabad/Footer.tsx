import { Shield, RefreshCw, Headphones, Truck, CreditCard, Phone } from "lucide-react";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import { PetabadBrandLockup } from "./PetabadBrand";

// Social media icons as inline SVGs
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface FooterProps {
  onSupportClick: () => void;
  onSignInClick: () => void;
}

export const Footer = ({ onSupportClick, onSignInClick }: FooterProps) => {
  const { getLogoSettings } = useHomepageSettings();
  const footerLogo = getLogoSettings('footer');

  const trustBadges = [
    { icon: Shield, label: 'پرداخت امن' },
    { icon: RefreshCw, label: 'ضمانت بازگشت' },
    { icon: Headphones, label: 'پشتیبانی ۲۴/۷' },
    { icon: Truck, label: 'ارسال سریع' },
  ];

  const socialLinks = [
    { icon: InstagramIcon, label: 'اینستاگرام', href: '#' },
    { icon: LinkedInIcon, label: 'لینکدین', href: '#' },
    { icon: TelegramIcon, label: 'تلگرام', href: '#' },
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
              <PetabadBrandLockup imageUrl={footerLogo.imageUrl || undefined} className="mb-3" />
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                {footerLogo.subtitle || 'خرید هوشمند با کمک هوش مصنوعی'}
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

            {/* Contact & Social */}
            <div>
              <h4 className="text-xs font-semibold text-foreground/80 mb-3">تماس</h4>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <Phone className="w-3 h-3" />
                  <span>۰۲۱-۱۲۳۴۵۶۷۸</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <CreditCard className="w-3 h-3" />
                  <span>پرداخت آنلاین</span>
                </li>
              </ul>
              {/* Social Media Icons */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    title={social.label}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    <social.icon />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="py-4 border-t border-border/20">
        <div className="max-w-[960px] mx-auto px-4">
          <p className="text-[10px] text-muted-foreground/40 text-center">
            © ۱۴۰۳ پت آباد. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  );
};
