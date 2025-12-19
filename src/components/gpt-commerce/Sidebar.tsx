import { User, MapPin, CreditCard, Settings, ShoppingCart, Clock, Star, Gift, Wallet, Flame, Package, RotateCcw, HeadphonesIcon, Zap } from "lucide-react";
import { toPersianNumber } from "@/data/gptCommerceData";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  cartItemCount: number;
  activeOrderCount: number;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export const Sidebar = ({ activeSection, onSectionChange, cartItemCount, activeOrderCount }: SidebarProps) => {
  const sections: SidebarSection[] = [
    {
      title: 'حساب کاربری',
      items: [
        { id: 'profile', label: 'پروفایل من', icon: <User className="w-4 h-4" /> },
        { id: 'addresses', label: 'آدرس‌ها', icon: <MapPin className="w-4 h-4" /> },
        { id: 'payments', label: 'روش‌های پرداخت', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'settings', label: 'تنظیمات', icon: <Settings className="w-4 h-4" /> },
      ],
    },
    {
      title: 'سبدهای خرید',
      items: [
        { id: 'active-cart', label: 'سبد فعال', icon: <ShoppingCart className="w-4 h-4" />, badge: cartItemCount > 0 ? `${toPersianNumber(cartItemCount)} آیتم` : undefined },
        { id: 'recent-carts', label: 'سبدهای اخیر', icon: <Clock className="w-4 h-4" /> },
        { id: 'saved', label: 'ذخیره‌شده‌ها', icon: <Star className="w-4 h-4" /> },
      ],
    },
    {
      title: 'فلو کلاب',
      items: [
        { id: 'points', label: 'امتیازها', icon: <Gift className="w-4 h-4" /> },
        { id: 'cashback', label: 'کش‌بک‌ها', icon: <Wallet className="w-4 h-4" /> },
        { id: 'deals', label: 'پیشنهادهای ویژه', icon: <Flame className="w-4 h-4" /> },
      ],
    },
    {
      title: 'سفارش‌ها',
      items: [
        { id: 'active-orders', label: 'سفارش‌های فعال', icon: <Package className="w-4 h-4" />, badge: activeOrderCount > 0 ? toPersianNumber(activeOrderCount) : undefined },
        { id: 'returns', label: 'مرجوعی‌ها', icon: <RotateCcw className="w-4 h-4" /> },
        { id: 'support', label: 'پشتیبانی هوشمند', icon: <HeadphonesIcon className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <aside 
      className="w-[260px] h-screen flex flex-col overflow-hidden backdrop-blur-xl" 
      dir="rtl"
      style={{
        background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.95), hsl(0 0% 100% / 0.85))',
        borderLeft: '1px solid hsl(0 0% 100% / 0.3)',
        boxShadow: '-4px 0 40px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* Header - Glass Logo */}
      <div 
        className="p-4"
        style={{ borderBottom: '1px solid hsl(0 0% 0% / 0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
              boxShadow: '0 4px 16px hsl(var(--primary) / 0.3), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
            }}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg">Flowcart</h1>
            <p className="text-xs text-muted-foreground">دستیار خرید هوشمند</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full h-11 flex items-center justify-between px-3 rounded-xl transition-all duration-300 ${
                    activeSection === item.id
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'
                  }`}
                  style={{
                    background: activeSection === item.id 
                      ? 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))'
                      : 'transparent',
                    border: activeSection === item.id 
                      ? '1px solid hsl(var(--primary) / 0.2)'
                      : '1px solid transparent',
                    boxShadow: activeSection === item.id
                      ? '0 4px 12px hsl(var(--primary) / 0.1)'
                      : 'none'
                  }}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
