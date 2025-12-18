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
    <aside className="w-[260px] h-screen bg-[#F9FAFB] border-l border-[#E5E7EB] flex flex-col overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
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
                  className={`w-full h-11 flex items-center justify-between px-3 rounded-[10px] transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-foreground hover:bg-[#EEF2FF]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
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
