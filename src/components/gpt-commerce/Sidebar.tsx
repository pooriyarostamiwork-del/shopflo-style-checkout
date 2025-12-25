import { useState } from "react";
import { 
  User, Package, Gift, ChevronDown, MessageSquare, Plus, 
  MoreHorizontal, Trash2, Merge, Bookmark, ShoppingCart, ArrowRight
} from "lucide-react";
import { toPersianNumber } from "@/data/gptCommerceData";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SavedItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
}

export interface Basket {
  id: string;
  title: string;
  itemCount: number;
  lastActivity: string;
  savedItems: SavedItem[];
}

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  cartItemCount: number;
  activeOrderCount: number;
  onBasketSelect?: (basketId: string) => void;
  activeBasketId?: string;
  baskets: Basket[];
  onCreateBasket: () => void;
  onDeleteBasket: (basketId: string) => void;
  onMergeBasket: (sourceId: string, targetId: string) => void;
  onRemoveSavedItem?: (basketId: string, itemId: string) => void;
  onTransferToCart?: (basketId: string, itemId: string) => void;
}

export const Sidebar = ({
  activeSection,
  onSectionChange,
  cartItemCount,
  activeOrderCount,
  onBasketSelect,
  activeBasketId,
  baskets,
  onCreateBasket,
  onDeleteBasket,
  onMergeBasket,
  onRemoveSavedItem,
  onTransferToCart,
}: SidebarProps) => {
  const { getLogoSettings } = useHomepageSettings();
  const chatModeLogo = getLogoSettings('chatMode');
  
  // Section expand state - only reference sections are collapsible
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'saved-items': false,
  });
  
  // Track which basket menu is open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showMergeOptions, setShowMergeOptions] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Get active basket's saved items
  const activeBasket = baskets.find(b => b.id === activeBasketId);
  const activeSavedItems = activeBasket?.savedItems || [];

  const handleDeleteBasket = (basketId: string) => {
    setOpenMenuId(null);
    setShowMergeOptions(false);
    onDeleteBasket(basketId);
  };

  const handleMergeBasket = (sourceId: string, targetId: string) => {
    setOpenMenuId(null);
    setShowMergeOptions(false);
    onMergeBasket(sourceId, targetId);
  };

  return (
    <aside 
      className="w-[260px] h-screen flex flex-col overflow-hidden bg-background border-l border-border/40" 
      dir="rtl"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          {chatModeLogo.imageUrl ? (
            <img src={chatModeLogo.imageUrl} alt="فلوکارت" className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="font-semibold text-foreground text-base">Flowcart</h1>
            <p className="text-xs text-muted-foreground">{chatModeLogo.subtitle || 'دستیار خرید هوشمند'}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 1 — Active Contexts (Primary)
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-4 pb-6">
          {/* New Basket Button - Standout with color */}
          <button
            onClick={onCreateBasket}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-5 rounded-xl transition-all duration-200 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 group"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              ایجاد سبد جدید
            </span>
          </button>

          {/* Section Title */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <ShoppingCart className="w-4 h-4 text-foreground/70" />
            <span className="text-sm font-semibold text-foreground">سبدهای فعال</span>
            {cartItemCount > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground mr-auto">
                {toPersianNumber(cartItemCount)}
              </span>
            )}
          </div>

          {/* Basket List - Compact minimal cards */}
          <div className="space-y-2">
            {baskets.map((basket) => {
              const isActive = activeBasketId === basket.id;
              return (
                <div
                  key={basket.id}
                  className={`relative group rounded-lg transition-all duration-200 border ${
                    isActive 
                      ? 'bg-primary/5 border-primary/30' 
                      : 'bg-background border-border/30 hover:border-border/50 hover:bg-muted/20'
                  }`}
                >
                  <button
                    onClick={() => onBasketSelect?.(basket.id)}
                    className={`w-full flex items-center gap-2.5 text-right ${
                      isActive ? 'px-3 py-3' : 'px-2.5 py-2'
                    }`}
                  >
                    <div 
                      className={`rounded-lg flex items-center justify-center flex-shrink-0 transition-colors border ${
                        isActive 
                          ? 'w-9 h-9 bg-primary text-primary-foreground border-primary' 
                          : 'w-7 h-7 bg-muted/30 text-foreground/40 border-border/30'
                      }`}
                    >
                      <MessageSquare className={isActive ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${
                        isActive 
                          ? 'text-sm font-medium text-foreground' 
                          : 'text-xs text-foreground/70'
                      }`}>
                        {basket.title}
                      </p>
                      <p className={`text-muted-foreground truncate ${
                        isActive ? 'text-xs mt-0.5' : 'text-[10px]'
                      }`}>
                        {toPersianNumber(basket.itemCount)} آیتم · {basket.lastActivity}
                      </p>
                    </div>
                  </button>

                  {/* Three-dot Menu */}
                  <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 transition-opacity ${
                    openMenuId === basket.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <Popover 
                      open={openMenuId === basket.id} 
                      onOpenChange={(open) => {
                        setOpenMenuId(open ? basket.id : null);
                        if (!open) setShowMergeOptions(false);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button 
                          className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        align="start" 
                        side="left"
                        className="w-48 p-1.5 border border-border/50 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!showMergeOptions ? (
                          <div className="space-y-0.5">
                            <button
                              onClick={() => handleDeleteBasket(basket.id)}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              حذف سبد
                            </button>
                            
                            {baskets.length > 1 && (
                              <button
                                onClick={() => setShowMergeOptions(true)}
                                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-xs text-foreground hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Merge className="w-3.5 h-3.5" />
                                  ادغام با سبد دیگر
                                </div>
                                <ChevronDown className="w-3 h-3 -rotate-90" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <button
                              onClick={() => setShowMergeOptions(false)}
                              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] text-muted-foreground hover:bg-muted/30 transition-colors"
                            >
                              <ChevronDown className="w-2.5 h-2.5 rotate-90" />
                              بازگشت
                            </button>
                            <div className="text-[10px] text-muted-foreground px-2.5 py-1 border-b border-border/30 mb-0.5">
                              ادغام با:
                            </div>
                            {baskets.filter(b => b.id !== basket.id).map(targetBasket => (
                              <button
                                key={targetBasket.id}
                                onClick={() => handleMergeBasket(basket.id, targetBasket.id)}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-foreground hover:bg-muted/50 transition-colors"
                              >
                                <div className="w-5 h-5 rounded-md bg-muted/50 flex items-center justify-center">
                                  <MessageSquare className="w-2.5 h-2.5 text-muted-foreground" />
                                </div>
                                <span className="flex-1 truncate text-right">{targetBasket.title}</span>
                                <span className="text-[9px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">
                                  {toPersianNumber(targetBasket.itemCount)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              );
            })}

            {baskets.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                هنوز سبدی نداری
              </p>
            )}
          </div>

          {/* سبدهای اخیر - Recent Baskets Section */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <button
              onClick={() => toggleSection('recent-baskets')}
              className="w-full flex items-center justify-between py-1.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-foreground/50" />
                <span className="text-xs text-foreground/60">سبدهای اخیر</span>
              </div>
              <ChevronDown 
                className={`w-3 h-3 text-foreground/40 transition-transform duration-200 ${
                  expandedSections['recent-baskets'] ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {expandedSections['recent-baskets'] && (
              <div className="mt-2 space-y-1.5">
                <p className="text-[10px] text-muted-foreground text-center py-3 bg-muted/10 rounded-lg border border-border/20">
                  سبدی اخیری وجود ندارد
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 2 — Reference Contexts (Secondary) - Saved Baskets
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 py-3 border-t border-border/30">
          {/* ذخیره‌شده‌ها - Saved Baskets (not products) */}
          <button
            onClick={() => toggleSection('saved-items')}
            className="w-full flex items-center justify-between py-1.5 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5 text-foreground/50" />
              <span className="text-xs text-foreground/60">ذخیره‌شده‌ها</span>
            </div>
            <ChevronDown 
              className={`w-3 h-3 text-foreground/40 transition-transform duration-200 ${
                expandedSections['saved-items'] ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {expandedSections['saved-items'] && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] text-muted-foreground text-center py-3 bg-muted/10 rounded-lg border border-border/20">
                سبدی ذخیره نشده
              </p>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1 min-h-[24px]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3 — System & Account (Utility)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-border/40 bg-muted/20 p-3 space-y-1">
        <button
          onClick={() => onSectionChange('account')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 ${
            activeSection === 'account' 
              ? 'bg-background text-foreground' 
              : 'text-foreground/60 hover:bg-background/60 hover:text-foreground'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-sm">حساب کاربری</span>
        </button>
        
        <button
          onClick={() => onSectionChange('orders')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 ${
            activeSection === 'orders' 
              ? 'bg-background text-foreground' 
              : 'text-foreground/60 hover:bg-background/60 hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-sm">سفارش‌ها</span>
          {activeOrderCount > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground mr-auto">
              {toPersianNumber(activeOrderCount)}
            </span>
          )}
        </button>
        
        <button
          onClick={() => onSectionChange('flowclub')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 ${
            activeSection === 'flowclub' 
              ? 'bg-background text-foreground' 
              : 'text-foreground/60 hover:bg-background/60 hover:text-foreground'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span className="text-sm">فلوکلاب</span>
        </button>
      </div>
    </aside>
  );
};
