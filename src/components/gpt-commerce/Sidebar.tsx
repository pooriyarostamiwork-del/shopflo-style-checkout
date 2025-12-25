import { useState } from "react";
import { 
  User, Package, Gift, ChevronDown, MessageSquare, Plus, 
  MoreHorizontal, Trash2, Merge, Bookmark, ShoppingCart, ArrowRight
} from "lucide-react";
import { toPersianNumber } from "@/data/gptCommerceData";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Get active basket's saved items
  const activeBasket = baskets.find(b => b.id === activeBasketId);
  const activeSavedItems = activeBasket?.savedItems || [];

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
          {/* New Basket Button */}
          <button
            onClick={onCreateBasket}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 rounded-xl transition-all duration-200 hover:bg-muted/60 border border-dashed border-border/60 hover:border-primary/30 group"
          >
            <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              ایجاد سبد جدید
            </span>
          </button>

          {/* Section Title */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <ShoppingCart className="w-4 h-4 text-foreground/70" />
            <span className="text-sm font-semibold text-foreground">سبدهای فعال</span>
            {cartItemCount > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground mr-auto">
                {toPersianNumber(cartItemCount)}
              </span>
            )}
          </div>

          {/* Basket List */}
          <div className="space-y-2">
            {baskets.map((basket) => (
              <div
                key={basket.id}
                className={`relative group rounded-xl transition-all duration-150 ${
                  activeBasketId === basket.id 
                    ? 'bg-primary/8 border-r-2 border-r-primary' 
                    : 'hover:bg-muted/40'
                }`}
              >
                <button
                  onClick={() => onBasketSelect?.(basket.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-right"
                >
                  <div 
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      activeBasketId === basket.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/60 text-foreground/50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${
                      activeBasketId === basket.id 
                        ? 'font-medium text-foreground' 
                        : 'text-foreground/80'
                    }`}>
                      {basket.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {toPersianNumber(basket.itemCount)} آیتم · {basket.lastActivity}
                    </p>
                  </div>
                </button>

                {/* Three-dot Menu */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={() => onDeleteBasket(basket.id)}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف سبد
                      </DropdownMenuItem>
                      
                      {/* Merge submenu */}
                      {baskets.length > 1 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-muted rounded-sm cursor-pointer">
                              <Merge className="w-4 h-4 ml-2" />
                              ادغام با سبد دیگر
                              <ChevronDown className="w-3 h-3 mr-auto rotate-90" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left" className="w-44">
                            {baskets.filter(b => b.id !== basket.id).map(targetBasket => (
                              <DropdownMenuItem
                                key={targetBasket.id}
                                onClick={() => onMergeBasket(basket.id, targetBasket.id)}
                                className="cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                                <span className="truncate">{targetBasket.title}</span>
                                <span className="text-xs text-muted-foreground mr-auto">
                                  {toPersianNumber(targetBasket.itemCount)}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {baskets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                هنوز سبدی نداری
              </p>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 2 — Reference Contexts (Secondary)
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="px-4 py-3 border-t border-border/30">
          {/* Saved Items - Basket Scoped */}
          <button
            onClick={() => toggleSection('saved-items')}
            className="w-full flex items-center justify-between py-2 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-foreground/60" />
              <span className="text-sm text-foreground/70">ذخیره‌شده‌ها</span>
              {activeSavedItems.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {toPersianNumber(activeSavedItems.length)}
                </span>
              )}
            </div>
            <ChevronDown 
              className={`w-3.5 h-3.5 text-foreground/40 transition-transform duration-200 ${
                expandedSections['saved-items'] ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          {expandedSections['saved-items'] && (
            <div className="mt-2 space-y-2">
              {activeSavedItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                  محصولی ذخیره نشده
                </p>
              ) : (
                activeSavedItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/30 group"
                  >
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover bg-muted/50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {toPersianNumber(item.price.toLocaleString())} تومان
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onTransferToCart?.(activeBasketId!, item.id)}
                        className="p-1.5 rounded-md hover:bg-primary/10 transition-colors"
                        title="انتقال به سبد خرید"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-primary" />
                      </button>
                      <button
                        onClick={() => onRemoveSavedItem?.(activeBasketId!, item.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                      </button>
                    </div>
                  </div>
                ))
              )}
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