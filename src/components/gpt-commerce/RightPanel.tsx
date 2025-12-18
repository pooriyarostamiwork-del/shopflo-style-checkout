import { useState } from "react";
import { ShoppingCart, Eye, Heart, Plus, Minus, Trash2, ChevronLeft } from "lucide-react";
import { CartItem, Product, formatPersianPrice, toPersianNumber, recentlyViewed, favorites } from "@/data/gptCommerceData";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface RightPanelProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onAddToCart: (product: Product) => void;
}

type TabType = 'cart' | 'recent' | 'favorites';

export const RightPanel = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onAddToCart,
}: RightPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('cart');
  const [autoBuyPriceDrop, setAutoBuyPriceDrop] = useState(false);
  const [autoBuyMonthly, setAutoBuyMonthly] = useState(false);
  const [notifyPriceDrop, setNotifyPriceDrop] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'cart', label: 'سبد خرید', icon: <ShoppingCart className="w-4 h-4" />, count: cartItems.length },
    { id: 'recent', label: 'اخیراً دیده‌شده', icon: <Eye className="w-4 h-4" /> },
    { id: 'favorites', label: 'علاقه‌مندی‌ها', icon: <Heart className="w-4 h-4" /> },
  ];

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Group cart items by merchant
  const groupedItems = cartItems.reduce((acc, item) => {
    const merchantId = item.merchant.id;
    if (!acc[merchantId]) {
      acc[merchantId] = {
        merchant: item.merchant,
        items: [],
      };
    }
    acc[merchantId].items.push(item);
    return acc;
  }, {} as Record<string, { merchant: typeof cartItems[0]['merchant']; items: CartItem[] }>);

  return (
    <div className="w-[340px] h-screen bg-white border-r border-[#E5E7EB] flex flex-col" dir="rtl">
      {/* Tab Bar */}
      <div className="p-3 border-b border-[#E5E7EB]">
        <div className="flex bg-[#F9FAFB] rounded-xl p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                  {toPersianNumber(tab.count)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'cart' && (
          <div className="p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">سبد خریدت خالیه</p>
                <p className="text-xs text-muted-foreground mt-1">از چت بخواه محصول پیدا کنه!</p>
              </div>
            ) : (
              <>
                {/* Grouped by Merchant */}
                {Object.values(groupedItems).map(({ merchant, items }) => (
                  <div key={merchant.id} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <span>{merchant.logo}</span>
                      <span>{merchant.name}</span>
                    </div>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 p-3 bg-[#F9FAFB] rounded-xl"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground line-clamp-2">
                            {item.name}
                          </h4>
                          <p className="text-xs text-primary font-medium mt-1">
                            {formatPersianPrice(item.price)}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 bg-white rounded-lg border border-[#E5E7EB]">
                              <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                className="p-1 hover:bg-[#F9FAFB] rounded-r-lg"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-sm font-medium">
                                {toPersianNumber(item.quantity)}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                className="p-1 hover:bg-[#F9FAFB] rounded-l-lg"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Auto-buy Options */}
                <div className="space-y-2 pt-4 border-t border-[#E5E7EB]">
                  <p className="text-xs font-medium text-muted-foreground mb-2">گزینه‌های خرید هوشمند</p>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <Checkbox
                      checked={autoBuyPriceDrop}
                      onCheckedChange={(checked) => setAutoBuyPriceDrop(checked as boolean)}
                    />
                    خرید خودکار وقتی قیمت کمتر شد
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <Checkbox
                      checked={autoBuyMonthly}
                      onCheckedChange={(checked) => setAutoBuyMonthly(checked as boolean)}
                    />
                    خرید ماهانه
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <Checkbox
                      checked={notifyPriceDrop}
                      onCheckedChange={(checked) => setNotifyPriceDrop(checked as boolean)}
                    />
                    اطلاع بده ارزان‌تر شد
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="p-4 space-y-3">
            {recentlyViewed.map((product) => (
              <div key={product.id} className="flex gap-3 p-3 bg-[#F9FAFB] rounded-xl">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-primary font-medium mt-1">
                    {formatPersianPrice(product.price)}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs mt-1 p-0 text-primary"
                    onClick={() => onAddToCart(product)}
                  >
                    <Plus className="w-3 h-3 ml-1" />
                    افزودن به سبد
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="p-4 space-y-3">
            {favorites.map((product) => (
              <div key={product.id} className="flex gap-3 p-3 bg-[#F9FAFB] rounded-xl">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-primary font-medium mt-1">
                    {formatPersianPrice(product.price)}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs mt-1 p-0 text-primary"
                    onClick={() => onAddToCart(product)}
                  >
                    <Plus className="w-3 h-3 ml-1" />
                    افزودن به سبد
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {activeTab === 'cart' && cartItems.length > 0 && (
        <div className="p-4 border-t border-[#E5E7EB] bg-white space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">جمع کل:</span>
            <span className="text-lg font-bold text-foreground">
              {formatPersianPrice(totalPrice)}
            </span>
          </div>
          <Button
            onClick={onCheckout}
            className="w-full h-12 rounded-xl text-sm font-medium"
          >
            ادامه به پرداخت
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
