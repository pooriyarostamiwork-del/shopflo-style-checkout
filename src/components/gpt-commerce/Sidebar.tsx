import { useState } from "react";
import { User, Package, Gift, ChevronDown, MessageSquare, Plus, MoreHorizontal, Trash2, Merge, Bookmark, ShoppingCart, Play, Archive } from "lucide-react";
import { toPersianNumber } from "@/data/gptCommerceData";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FlowcartBrandLockup } from "./FlowcartBrand";

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
  isSaved?: boolean; // Whether this basket is saved (archived)
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
  onSaveBasket?: (basketId: string) => void;
  onResumeBasket?: (basketId: string) => void;
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
  onSaveBasket,
  onResumeBasket
}: SidebarProps) => {
  const {
    getLogoSettings
  } = useHomepageSettings();
  const chatModeLogo = getLogoSettings('chatMode');

  // Section expand state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'recent-baskets': false,
    'saved-baskets': true
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

  // Separate baskets into zones: active (max 7), recent (overflow max 14), finalized (isSaved)
  const unsavedBaskets = baskets.filter(b => !b.isSaved);
  const activeBaskets = unsavedBaskets.slice(0, 7);
  const recentBaskets = unsavedBaskets.slice(7, 12);
  const finalizedBaskets = baskets.filter(b => b.isSaved);

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

  const handleSaveBasket = (basketId: string) => {
    setOpenMenuId(null);
    setShowMergeOptions(false);
    onSaveBasket?.(basketId);
  };

  return (
    <aside className="w-[260px] h-screen flex flex-col overflow-hidden bg-background border-l border-border/40" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-border/40 py-[17px]">
        <FlowcartBrandLockup
          imageUrl={chatModeLogo.imageUrl || undefined}
          subtitle={chatModeLogo.subtitle || 'دستیار خرید هوشمند'}
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 1 — Active Contexts (Primary)
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-4 pb-8">
          {/* New Basket Button - Standout with primary color */}
          <button 
            onClick={onCreateBasket} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-6 rounded-xl transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">ایجاد سبد جدید</span>
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

          {/* Basket List - Modern minimal cards */}
          <div className="space-y-3">
            {activeBaskets.map(basket => {
              const isActive = activeBasketId === basket.id;
              return (
                <div 
                  key={basket.id} 
                  className={`relative group rounded-xl transition-all duration-200 border ${
                    isActive 
                      ? 'bg-primary/8 border-primary/40 shadow-sm' 
                      : 'bg-background border-border/40 hover:border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <button 
                    onClick={() => onBasketSelect?.(basket.id)} 
                    className={`w-full flex items-center gap-3 text-right ${isActive ? 'px-4 py-4' : 'px-3 py-3'}`}
                  >
                    <div className={`rounded-xl flex items-center justify-center flex-shrink-0 transition-colors border ${
                      isActive 
                        ? 'w-10 h-10 bg-primary text-primary-foreground border-primary' 
                        : 'w-8 h-8 bg-muted/40 text-foreground/50 border-border/40'
                    }`}>
                      <MessageSquare className={isActive ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${isActive ? 'text-sm font-medium text-foreground' : 'text-sm text-foreground/80'}`}>
                        {basket.title}
                      </p>
                      <p className={`text-muted-foreground truncate ${isActive ? 'text-xs mt-1' : 'text-[11px] mt-0.5'}`}>
                        {toPersianNumber(basket.itemCount)} آیتم · {basket.lastActivity}
                      </p>
                    </div>
                  </button>

                  {/* Three-dot Menu - Always visible position */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <Popover 
                      open={openMenuId === basket.id} 
                      onOpenChange={open => {
                        setOpenMenuId(open ? basket.id : null);
                        if (!open) setShowMergeOptions(false);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button 
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            openMenuId === basket.id 
                              ? 'bg-muted/80' 
                              : 'opacity-0 group-hover:opacity-100 hover:bg-muted/60'
                          }`}
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        align="start" 
                        side="left" 
                        className="w-52 p-2 border border-border/60 shadow-xl bg-background rounded-xl" 
                        onClick={e => e.stopPropagation()}
                      >
                        {!showMergeOptions ? (
                          <div className="space-y-1">
                            {/* Save Basket */}
                            <button 
                              onClick={() => handleSaveBasket(basket.id)} 
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                            >
                              <Archive className="w-4 h-4 text-muted-foreground" />
                              ذخیره سبد
                            </button>
                            
                            {/* Merge */}
                            {activeBaskets.length > 1 && (
                              <button 
                                onClick={() => setShowMergeOptions(true)} 
                                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Merge className="w-4 h-4 text-muted-foreground" />
                                  ادغام با سبد دیگر
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-muted-foreground" />
                              </button>
                            )}

                            <div className="border-t border-border/40 my-1" />
                            
                            {/* Delete */}
                            <button 
                              onClick={() => handleDeleteBasket(basket.id)} 
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف سبد
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <button 
                              onClick={() => setShowMergeOptions(false)} 
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                            >
                              <ChevronDown className="w-3 h-3 rotate-90" />
                              بازگشت
                            </button>
                            <div className="text-xs text-muted-foreground px-3 py-2 border-b border-border/40">
                              ادغام با:
                            </div>
                            {activeBaskets.filter(b => b.id !== basket.id).map(targetBasket => (
                              <button 
                                key={targetBasket.id} 
                                onClick={() => handleMergeBasket(basket.id, targetBasket.id)} 
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
                              >
                                <div className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center">
                                  <MessageSquare className="w-3 h-3 text-muted-foreground" />
                                </div>
                                <span className="flex-1 truncate text-right">{targetBasket.title}</span>
                                <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
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

            {activeBaskets.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6 bg-muted/20 rounded-xl border border-border/30">
                هنوز سبدی نداری
              </p>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 2 — سبدهای اخیر (Recent Baskets)
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 py-5 border-t border-border/30">
          <button 
            onClick={() => toggleSection('recent-baskets')} 
            className="w-full flex items-center justify-between py-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-foreground/60" />
              <span className="text-sm font-medium text-foreground/70">سبدهای اخیر</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-foreground/50 transition-transform duration-200 ${expandedSections['recent-baskets'] ? 'rotate-180' : ''}`} />
          </button>
          
        {expandedSections['recent-baskets'] && (
            <div className="mt-4 space-y-2">
              {recentBaskets.length > 0 ? (
                recentBaskets.map(basket => (
                  <div 
                    key={basket.id} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-border/50 transition-all cursor-pointer"
                    onClick={() => onBasketSelect?.(basket.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/80 truncate">{basket.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {toPersianNumber(basket.itemCount)} آیتم · {basket.lastActivity}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-5 bg-muted/20 rounded-xl border border-border/30">
                  سبدی اخیری وجود ندارد
                </p>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 3 — ذخیره‌شده‌ها (Saved Baskets)
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 py-5 border-t border-border/30">
          <button 
            onClick={() => toggleSection('saved-baskets')} 
            className="w-full flex items-center justify-between py-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-foreground/60" />
              <span className="text-sm font-medium text-foreground/70">سبدهای نهایی شده</span>
              {finalizedBaskets.length > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {toPersianNumber(finalizedBaskets.length)}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-foreground/50 transition-transform duration-200 ${expandedSections['saved-baskets'] ? 'rotate-180' : ''}`} />
          </button>
          
          {expandedSections['saved-baskets'] && (
            <div className="mt-4 space-y-2">
              {finalizedBaskets.length > 0 ? (
                finalizedBaskets.map(basket => (
                  <div 
                    key={basket.id} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30 hover:border-border/50 transition-all cursor-pointer"
                    onClick={() => onBasketSelect?.(basket.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/80 truncate">{basket.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {toPersianNumber(basket.itemCount)} آیتم
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-5 bg-muted/20 rounded-xl border border-border/30">
                  سبد نهایی شده‌ای وجود ندارد
                </p>
              )}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1 min-h-[24px]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 4 — System & Account (Utility)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-border/40 bg-muted/20 p-3 space-y-1">
        <button 
          onClick={() => onSectionChange('account')} 
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 border border-transparent ${
            activeSection === 'account' 
              ? 'bg-background text-foreground' 
              : 'text-foreground/60 hover:bg-background/60 hover:text-foreground hover:border-border/60'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-sm">حساب کاربری</span>
        </button>
        
        <button 
          onClick={() => onSectionChange('orders')} 
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 border border-transparent ${
            activeSection === 'orders' 
              ? 'bg-background text-foreground' 
              : 'text-foreground/60 hover:bg-background/60 hover:text-foreground hover:border-border/60'
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
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 border ${
            activeSection === 'flowclub' 
              ? 'bg-[hsl(142_76%_92%)] text-[hsl(142_50%_30%)] border-[hsl(142_60%_75%)]' 
              : 'bg-[hsl(142_76%_95%)] text-[hsl(142_50%_35%)] border-[hsl(142_60%_85%)] hover:bg-[hsl(142_76%_90%)] hover:border-[hsl(142_60%_75%)]'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span className="text-sm font-medium">فلوکلاب</span>
        </button>
      </div>
    </aside>
  );
};
