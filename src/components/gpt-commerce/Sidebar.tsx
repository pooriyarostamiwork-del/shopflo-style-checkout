import { useState } from "react";
import { User, MapPin, CreditCard, Settings, ShoppingCart, Clock, Star, Gift, Wallet, Flame, Package, RotateCcw, HeadphonesIcon, Zap, ChevronDown, MessageSquare } from "lucide-react";
import { toPersianNumber } from "@/data/gptCommerceData";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  cartItemCount: number;
  activeOrderCount: number;
  onBasketSelect?: (basketId: string) => void;
  activeBasketId?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
  defaultOpen?: boolean;
}

// Mock baskets as conversations
interface Basket {
  id: string;
  title: string;
  itemCount: number;
  lastActivity: string;
  isActive?: boolean;
}

const mockBaskets: Basket[] = [
  { id: 'basket-1', title: 'هدفون‌های بی‌سیم', itemCount: 2, lastActivity: 'الان', isActive: true },
  { id: 'basket-2', title: 'لوازم جانبی موبایل', itemCount: 1, lastActivity: '۲ ساعت پیش' },
  { id: 'basket-3', title: 'کیف و کوله پشتی', itemCount: 3, lastActivity: 'دیروز' },
];

const mockSavedCarts: Basket[] = [
  { id: 'saved-1', title: 'لیست خرید ماهانه', itemCount: 5, lastActivity: '۳ روز پیش' },
  { id: 'saved-2', title: 'هدیه تولد', itemCount: 2, lastActivity: 'هفته پیش' },
];

export const Sidebar = ({
  activeSection,
  onSectionChange,
  cartItemCount,
  activeOrderCount,
  onBasketSelect,
  activeBasketId = 'basket-1',
}: SidebarProps) => {
  const { getLogoSettings } = useHomepageSettings();
  const chatModeLogo = getLogoSettings('chatMode');
  
  // Collapsible state - baskets open by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'baskets': true,
    'recent-carts': false,
    'saved-carts': false,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const sections: SidebarSection[] = [
    {
      id: 'account',
      title: 'حساب کاربری',
      items: [
        { id: 'profile', label: 'پروفایل من', icon: <User className="w-4 h-4" /> },
        { id: 'addresses', label: 'آدرس‌ها', icon: <MapPin className="w-4 h-4" /> },
        { id: 'payments', label: 'روش‌های پرداخت', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'settings', label: 'تنظیمات', icon: <Settings className="w-4 h-4" /> },
      ],
    },
    {
      id: 'flowclub',
      title: 'فلو کلاب',
      items: [
        { id: 'points', label: 'امتیازها', icon: <Gift className="w-4 h-4" /> },
        { id: 'cashback', label: 'کش‌بک‌ها', icon: <Wallet className="w-4 h-4" /> },
        { id: 'deals', label: 'پیشنهادهای ویژه', icon: <Flame className="w-4 h-4" /> },
      ],
    },
    {
      id: 'orders',
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
      className="w-[240px] h-screen flex flex-col overflow-hidden bg-background border-l border-border/50" 
      dir="rtl"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          {chatModeLogo.imageUrl ? (
            <img src={chatModeLogo.imageUrl} alt="فلوکارت" className="w-9 h-9 rounded-lg object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary">
              <Zap className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="font-semibold text-foreground text-[15px]">Flowcart</h1>
            <p className="text-[11px] text-muted-foreground">{chatModeLogo.subtitle || 'دستیار خرید هوشمند'}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* Shopping Baskets Section */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('baskets')}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50 group"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-foreground/70" />
              <span className="text-sm font-medium text-foreground">سبدهای خرید</span>
              {cartItemCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                  {toPersianNumber(cartItemCount)}
                </span>
              )}
            </div>
            <ChevronDown 
              className={`w-3.5 h-3.5 text-foreground/50 transition-transform duration-200 ${
                expandedSections['baskets'] ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {expandedSections['baskets'] && (
            <div className="space-y-0.5 mr-2">
              {mockBaskets.map((basket) => (
                <button
                  key={basket.id}
                  onClick={() => onBasketSelect?.(basket.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 text-right group ${
                    activeBasketId === basket.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/40 border border-transparent'
                  }`}
                >
                  <div 
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                      activeBasketId === basket.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/60 text-foreground/60 group-hover:bg-muted'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] truncate ${
                      activeBasketId === basket.id 
                        ? 'font-medium text-foreground' 
                        : 'text-foreground/80'
                    }`}>
                      {basket.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {toPersianNumber(basket.itemCount)} آیتم · {basket.lastActivity}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Carts */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('recent-carts')}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-foreground/70" />
              <span className="text-sm font-medium text-foreground">سبدهای اخیر</span>
            </div>
            <ChevronDown 
              className={`w-3.5 h-3.5 text-foreground/50 transition-transform duration-200 ${
                expandedSections['recent-carts'] ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {expandedSections['recent-carts'] && (
            <div className="mr-2 px-2 py-2">
              <p className="text-xs text-muted-foreground">سبدهای اخیر شما اینجا نمایش داده می‌شوند.</p>
            </div>
          )}
        </div>

        {/* Saved Carts */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('saved-carts')}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-foreground/70" />
              <span className="text-sm font-medium text-foreground">ذخیره‌شده‌ها</span>
            </div>
            <ChevronDown 
              className={`w-3.5 h-3.5 text-foreground/50 transition-transform duration-200 ${
                expandedSections['saved-carts'] ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {expandedSections['saved-carts'] && (
            <div className="space-y-0.5 mr-2">
              {mockSavedCarts.map((cart) => (
                <button
                  key={cart.id}
                  onClick={() => onBasketSelect?.(cart.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all hover:bg-muted/40 text-right group border border-transparent"
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-muted/60 text-foreground/60 group-hover:bg-muted">
                    <Star className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate text-foreground/80">{cart.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {toPersianNumber(cart.itemCount)} آیتم · {cart.lastActivity}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-muted/30 my-3" />

        {/* Other Sections */}
        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50"
            >
              <span className="text-sm font-medium text-foreground/60">{section.title}</span>
              <ChevronDown 
                className={`w-3.5 h-3.5 text-foreground/50 transition-transform duration-200 ${
                  expandedSections[section.id] ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections[section.id] && (
              <div className="space-y-0.5 mr-2">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all duration-150 ${
                      activeSection === item.id 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-foreground/70 hover:bg-muted/40 hover:text-foreground border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={activeSection === item.id ? 'text-primary' : 'text-foreground/50'}>
                        {item.icon}
                      </span>
                      <span className="text-[13px]">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};
