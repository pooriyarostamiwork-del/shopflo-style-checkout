import { useState } from "react";
import { Search, User, ShoppingCart, Menu, X, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage, formatCurrency } from "@/i18n";
import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  cartItemCount: number;
}

export const HeaderLocalized = ({ cartItemCount }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, isRTL, language } = useLanguage();
  const location = useLocation();

  const navItems = [
    { key: 'home', label: t.common.home },
    { key: 'newArrivals', label: t.common.newArrivals },
    { key: 'electronics', label: t.common.electronics },
    { key: 'accessories', label: t.common.accessories },
    { key: 'lifestyle', label: t.common.lifestyle },
    { key: 'sale', label: t.common.sale },
  ];

  const switchUrl = isRTL ? '/' : '/farsi';

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        {/* Desktop Header */}
        <div className={`flex items-center justify-between py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">{isRTL ? 'ش' : 'S'}</span>
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h1 className="text-xl font-bold text-foreground">{t.header.brandName}</h1>
              <p className="text-xs text-muted-foreground">{t.header.tagline}</p>
            </div>
          </div>

          {/* Navigation (Desktop) */}
          <nav className={`hidden lg:flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {navItems.map((item) => (
              <a
                key={item.key}
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {item.label}
                <span className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full`} />
              </a>
            ))}
          </nav>

          {/* Right: Search, Language, User, Cart */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Search Bar (Desktop) */}
            <div className={`hidden md:flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t.common.search}
                className={`bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48 ${isRTL ? 'text-right' : ''}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Language Switcher */}
            <Link to={switchUrl}>
              <Button variant="ghost" size="icon" className="rounded-full" title={isRTL ? 'Switch to English' : 'تغییر به فارسی'}>
                <Globe className="w-5 h-5 text-muted-foreground" />
              </Button>
            </Link>

            {/* User Icon */}
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5 text-muted-foreground" />
            </Button>

            {/* Cart Icon */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </Button>
              {cartItemCount > 0 && (
                <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse-glow`}>
                  {cartItemCount}
                </span>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 animate-fade-in">
            {/* Mobile Search */}
            <div className={`flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t.common.search}
                className={`bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1 ${isRTL ? 'text-right' : ''}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href="#"
                  className={`text-sm text-muted-foreground hover:text-primary transition-colors py-2 ${isRTL ? 'text-right' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
