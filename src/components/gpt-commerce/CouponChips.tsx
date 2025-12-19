import { useState } from "react";
import { Truck, Percent, Flame, Gift, Check } from "lucide-react";

interface Coupon {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}

interface CouponChipsProps {
  onApplyCoupon: (couponId: string) => void;
  appliedCoupons: string[];
}

const coupons: Coupon[] = [
  { 
    id: 'free-shipping', 
    label: 'ارسال رایگان', 
    icon: <Truck className="w-3.5 h-3.5" />,
    color: 'hsl(217 91% 60%)',
    borderColor: 'hsl(217 91% 60%)'
  },
  { 
    id: 'discount-10', 
    label: '۱۰٪ تخفیف', 
    icon: <Percent className="w-3.5 h-3.5" />,
    color: 'hsl(142 71% 45%)',
    borderColor: 'hsl(142 71% 45%)'
  },
  { 
    id: 'flash-sale', 
    label: 'فروش ویژه', 
    icon: <Flame className="w-3.5 h-3.5" />,
    color: 'hsl(0 84% 60%)',
    borderColor: 'hsl(0 84% 60%)'
  },
  { 
    id: 'gift', 
    label: 'هدیه خرید', 
    icon: <Gift className="w-3.5 h-3.5" />,
    color: 'hsl(280 80% 60%)',
    borderColor: 'hsl(280 80% 60%)'
  },
];

export const CouponChips = ({ onApplyCoupon, appliedCoupons }: CouponChipsProps) => {
  const [hoveredCoupon, setHoveredCoupon] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-2" dir="rtl">
      {coupons.map((coupon) => {
        const isApplied = appliedCoupons.includes(coupon.id);
        const isHovered = hoveredCoupon === coupon.id;
        
        return (
          <button
            key={coupon.id}
            onClick={() => !isApplied && onApplyCoupon(coupon.id)}
            onMouseEnter={() => setHoveredCoupon(coupon.id)}
            onMouseLeave={() => setHoveredCoupon(null)}
            disabled={isApplied}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              backdrop-blur-xl transition-all duration-300 ease-out
              ${isApplied 
                ? 'opacity-60 cursor-default' 
                : 'cursor-pointer hover:scale-105 active:scale-95'
              }
            `}
            style={{
              backgroundColor: 'hsl(0 0% 100% / 0.8)',
              color: coupon.color,
              border: isHovered && !isApplied 
                ? `2px solid ${coupon.borderColor}` 
                : '1px solid hsl(0 0% 0% / 0.08)',
              boxShadow: 'inset 0 1px 0 hsl(0 0% 100% / 0.5)'
            }}
          >
            {isApplied ? <Check className="w-3.5 h-3.5" /> : coupon.icon}
            <span>{coupon.label}</span>
          </button>
        );
      })}
    </div>
  );
};
