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
  
  // Collapsible state - all collapsed by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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
        style={{ borderBottom: '1px solid hsl(0 0% 0% / 0.05)' }} 
        className="p-4 py-[15px]"
      >
        <div className="flex items-center gap-3">
          {chatModeLogo.imageUrl ? (
            <img src={chatModeLogo.imageUrl} alt="فلوکارت" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                boxShadow: '0 4px 16px hsl(var(--primary) / 0.3), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
              }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-foreground text-lg">Flowcart</h1>
            <p className="text-xs text-muted-foreground">{chatModeLogo.subtitle || 'دستیار خرید هوشمند'}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        
        {/* Shopping Baskets Section - Conversation-like */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(0 0% 100% / 0.4)' }}>
          <button
            onClick={() => toggleSection('baskets')}
            className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">سبدهای خرید</span>
              {cartItemCount > 0 && (
                <span 
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
                >
                  {toPersianNumber(cartItemCount)}
                </span>
              )}
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                expandedSections['baskets'] ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {expandedSections['baskets'] && (
            <div className="px-2 pb-2 space-y-1">
              {mockBaskets.map((basket) => (
                <button
                  key={basket.id}
                  onClick={() => onBasketSelect?.(basket.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-right ${
                    activeBasketId === basket.id ? 'bg-primary/10' : 'hover:bg-muted/30'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: activeBasketId === basket.id 
                        ? 'hsl(var(--primary))' 
                        : 'hsl(0 0% 0% / 0.05)' 
                    }}
                  >
                    <MessageSquare 
                      className={`w-4 h-4 ${activeBasketId === basket.id ? 'text-white' : 'text-muted-foreground'}`} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${activeBasketId === basket.id ? 'font-medium text-primary' : 'text-foreground'}`}>
                      {basket.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{toPersianNumber(basket.itemCount)} آیتم</span>
                      <span>•</span>
                      <span>{basket.lastActivity}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Carts - Collapsed */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(0 0% 100% / 0.4)' }}>
          <button
            onClick={() => toggleSection('recent-carts')}
            className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">سبدهای اخیر</span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                expandedSections['recent-carts'] ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {expandedSections['recent-carts'] && (
            <div className="px-2 pb-2 space-y-1">
              <p className="text-xs text-muted-foreground px-3 py-2">سبدهای اخیر شما اینجا نمایش داده می‌شوند.</p>
            </div>
          )}
        </div>

        {/* Saved Carts - Collapsed */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(0 0% 100% / 0.4)' }}>
          <button
            onClick={() => toggleSection('saved-carts')}
            className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">ذخیره‌شده‌ها</span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                expandedSections['saved-carts'] ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {expandedSections['saved-carts'] && (
            <div className="px-2 pb-2 space-y-1">
              {mockSavedCarts.map((cart) => (
                <button
                  key={cart.id}
                  onClick={() => onBasketSelect?.(cart.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-muted/30 text-right"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'hsl(0 0% 0% / 0.05)' }}
                  >
                    <Star className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-foreground">{cart.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{toPersianNumber(cart.itemCount)} آیتم</span>
                      <span>•</span>
                      <span>{cart.lastActivity}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-muted/30 my-3" />

        {/* Other Sections - Collapsible */}
        {sections.map((section) => (
          <div key={section.id} className="rounded-xl overflow-hidden" style={{ background: 'hsl(0 0% 100% / 0.4)' }}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <span className="text-xs font-semibold text-muted-foreground">{section.title}</span>
              <ChevronDown 
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                  expandedSections[section.id] ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections[section.id] && (
              <div className="px-2 pb-2 space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full h-10 flex items-center justify-between px-3 rounded-lg transition-all duration-300 ${
                      activeSection === item.id ? 'text-primary' : 'text-foreground hover:text-primary'
                    }`}
                    style={{
                      background: activeSection === item.id 
                        ? 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))' 
                        : 'transparent',
                      border: activeSection === item.id 
                        ? '1px solid hsl(var(--primary) / 0.2)' 
                        : '1px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
                      >
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
