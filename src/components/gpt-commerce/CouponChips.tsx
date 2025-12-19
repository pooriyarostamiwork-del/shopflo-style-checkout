import { useState } from "react";
import { Truck, Percent, Flame, Gift, Check } from "lucide-react";

interface Coupon {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  glowColor: string;
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
    bgColor: 'hsl(217 91% 60% / 0.15)',
    glowColor: 'hsl(217 91% 60% / 0.4)'
  },
  { 
    id: 'discount-10', 
    label: '۱۰٪ تخفیف', 
    icon: <Percent className="w-3.5 h-3.5" />,
    color: 'hsl(142 71% 45%)',
    bgColor: 'hsl(142 71% 45% / 0.15)',
    glowColor: 'hsl(142 71% 45% / 0.4)'
  },
  { 
    id: 'flash-sale', 
    label: 'فروش ویژه', 
    icon: <Flame className="w-3.5 h-3.5" />,
    color: 'hsl(0 84% 60%)',
    bgColor: 'hsl(0 84% 60% / 0.15)',
    glowColor: 'hsl(0 84% 60% / 0.4)'
  },
  { 
    id: 'gift', 
    label: 'هدیه خرید', 
    icon: <Gift className="w-3.5 h-3.5" />,
    color: 'hsl(280 80% 60%)',
    bgColor: 'hsl(280 80% 60% / 0.15)',
    glowColor: 'hsl(280 80% 60% / 0.4)'
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
              backgroundColor: coupon.bgColor,
              color: coupon.color,
              border: `1px solid ${coupon.color}33`,
              boxShadow: isHovered && !isApplied 
                ? `0 0 20px ${coupon.glowColor}, inset 0 1px 0 hsl(0 0% 100% / 0.2)`
                : `0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.2)`
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
