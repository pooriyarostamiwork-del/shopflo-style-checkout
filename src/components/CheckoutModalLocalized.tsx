import { useState, useEffect, useRef } from "react";
import { X, CreditCard, Smartphone, Banknote, ChevronRight, ChevronLeft, Phone, Check, Zap, Shield, Clock, ArrowRight, ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Truck, Calendar, Star, Hash } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";

import { Confetti } from "./Confetti";
import { AddressSelectorLocalized, Address } from "./AddressSelectorLocalized";
import { CouponSelectorLocalized } from "./CouponSelectorLocalized";
import { EnhancedUpsellCarouselLocalized } from "./EnhancedUpsellCarouselLocalized";
import { AutoReorderOptionsLocalized } from "./AutoReorderOptionsLocalized";
import { CheckoutMode, UpsellProduct, CouponTier } from "@/types/checkout";
import { CartProduct } from "./CartItem";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";

interface CheckoutModalLocalizedProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onSuccess: () => void;
  mode?: CheckoutMode;
  modeConfig?: {
    tagline?: string;
    badge?: string;
    incentiveMessage?: string;
    abandonmentReason?: string;
    loyaltyPoints?: number;
    crossStoreData?: {
      storeName: string;
      itemsInCart: number;
      discount: number;
    };
    header?: {
      title: string;
      subtitle?: string;
    };
  };
  cartItems?: CartProduct[];
  upsellProducts?: UpsellProduct[];
  couponTiers?: CouponTier[];
}

// Removed "review" step
type CheckoutStep = "cart" | "phone" | "otp" | "address" | "payment";
type PaymentMethod = "gateway" | "card" | "cod" | "bnpl" | "direct-debit";

const STEPS_CONFIG: {
  key: CheckoutStep;
  labelFa: string;
  labelEn: string;
  microFa?: string;
  microEn?: string;
}[] = [{
  key: "cart",
  labelFa: "سبد خرید",
  labelEn: "Cart",
  microFa: "آخرین بررسی قبل از نهایی سازی",
  microEn: "Final review before checkout"
}, {
  key: "phone",
  labelFa: "ورود",
  labelEn: "Login",
  microFa: "برای ادامه، شماره موبایل خود را وارد کنید",
  microEn: "Enter your mobile to continue"
}, {
  key: "otp",
  labelFa: "تأیید شماره",
  labelEn: "Verify OTP",
  microFa: "کد ارسال شده را وارد کنید",
  microEn: "Enter the code sent to your phone"
}, {
  key: "address",
  labelFa: "آدرس تحویل",
  labelEn: "Delivery Address",
  microFa: "آدرس و روش تحویل را انتخاب کنید",
  microEn: "Choose address and delivery method"
}, {
  key: "payment",
  labelFa: "روش پرداخت",
  labelEn: "Payment",
  microFa: "روش پرداخت را انتخاب کنید",
  microEn: "Select your payment method"
}];

export const CheckoutModalLocalized = ({
  isOpen,
  onClose,
  total: initialTotal,
  onSuccess,
  mode,
  modeConfig,
  cartItems = [],
  upsellProducts = [],
  couponTiers = []
}: CheckoutModalLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [localCartItems, setLocalCartItems] = useState(cartItems);
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("gateway");
  const [deliveryMethod, setDeliveryMethod] = useState<string>("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveDetails, setSaveDetails] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [userName] = useState(isRTL ? "علی" : "Alex");
  const [displayedName, setDisplayedName] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [addedUpsells, setAddedUpsells] = useState<UpsellProduct[]>([]);
  const [addedUpsellIds, setAddedUpsellIds] = useState<string[]>([]);
  const [total, setTotal] = useState(initialTotal);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponTier | null>(null);
  const [currentSection, setCurrentSection] = useState<"address" | "payment" | "coupon" | "review">("address");
  const [flowpointsActive, setFlowpointsActive] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const hasAnimatedGreeting = useRef(false);

  const [addresses, setAddresses] = useState<Address[]>([{
    id: "1",
    name: isRTL ? "علی احمدی" : "Rahul Kumar",
    phone: isRTL ? "09123456789" : "98765 43210",
    line1: isRTL ? "خیابان ولیعصر، پلاک ۱۲۳" : "123, MG Road",
    line2: isRTL ? "منطقه ۶" : "Koramangala",
    city: isRTL ? "تهران" : "Bangalore",
    state: isRTL ? "تهران" : "Karnataka",
    pincode: isRTL ? "1234567890" : "560034",
    isDefault: true
  }]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(addresses[0]);
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (isOpen && step !== "cart" && step !== "phone" && step !== "otp" && !hasAnimatedGreeting.current) {
      let currentIndex = 0;
      setDisplayedName("");
      const interval = setInterval(() => {
        if (currentIndex <= userName.length) {
          setDisplayedName(userName.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          hasAnimatedGreeting.current = true;
        }
      }, 100);
      return () => clearInterval(interval);
    } else if (isOpen && step !== "cart" && step !== "phone" && step !== "otp" && hasAnimatedGreeting.current) {
      setDisplayedName(userName);
    }
  }, [isOpen, step, userName]);

  useEffect(() => {
    if (!isOpen) {
      hasAnimatedGreeting.current = false;
      setDisplayedName("");
      setOtpCountdown(60);
      setCanResendOtp(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === "otp" && otpCountdown > 0) {
      const timer = setTimeout(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (otpCountdown === 0) {
      setCanResendOtp(true);
    }
  }, [step, otpCountdown]);

  const handleResendOtp = () => {
    setOtpCountdown(60);
    setCanResendOtp(false);
    setOtp("");
  };

  useEffect(() => {
    if (isProcessing) {
      setProcessingProgress(0);
      const duration = 2000;
      const interval = 20;
      const increment = interval / duration * 100;
      const timer = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + increment;
        });
      }, interval);
      return () => clearInterval(timer);
    }
  }, [isProcessing]);

  useEffect(() => {
    const upsellTotal = addedUpsells.reduce((sum, product) => sum + product.price, 0);
    setTotal(initialTotal + upsellTotal);
  }, [addedUpsells, initialTotal]);

  const handleAddUpsell = (product: UpsellProduct, variant?: string) => {
    setAddedUpsells(prev => [...prev, product]);
    const productId = variant ? `${product.id}-${variant}` : product.id.toString();
    setAddedUpsellIds(prev => [...prev, productId]);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 100);
  };

  const handleAddAddress = (address: Address) => {
    setAddresses(prev => [...prev, address]);
    setSelectedAddress(address);
  };
  const handleEditAddress = (address: Address) => {
    setAddresses(prev => prev.map(a => a.id === address.id ? address : a));
    if (selectedAddress?.id === address.id) setSelectedAddress(address);
  };
  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const getDynamicBanner = () => {
    switch (currentSection) {
      case "address":
        return { icon: <Shield className="w-4 h-4" />, text: t.checkout.banners.address };
      case "payment":
        return { icon: <Clock className="w-4 h-4" />, text: t.checkout.banners.payment };
      case "coupon":
        return { icon: <Check className="w-4 h-4" />, text: t.checkout.banners.coupon };
      case "review":
        return { icon: <Zap className="w-4 h-4" />, text: t.checkout.banners.review };
      default:
        return { icon: <Shield className="w-4 h-4" />, text: t.checkout.banners.address };
    }
  };

  // calculateTotal moved below flowpointsValue declaration

  const sortedTiers = [...couponTiers].sort((a, b) => a.threshold - b.threshold);
  const nextTier = sortedTiers.find(tier => total >= tier.threshold && (!selectedCoupon || tier.threshold > selectedCoupon.threshold));

  if (!isOpen) return null;

  const currentStepIndex = STEPS_CONFIG.findIndex(s => s.key === step);
  const currentStepConfig = STEPS_CONFIG[currentStepIndex];

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  const formatPhoneDisplay = (phone: string) => {
    if (isRTL && phone.length >= 11) {
      const formatted = `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
      return toPersianNumber(formatted);
    } else if (isRTL) {
      return toPersianNumber(phone);
    }
    return phone;
  };

  const DotProgress = () => {
    const stepsForDisplay = isRTL ? [...STEPS_CONFIG].reverse() : STEPS_CONFIG;
    return <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {stepsForDisplay.map((stepConfig, index) => {
        const actualIndex = isRTL ? STEPS_CONFIG.length - 1 - index : index;
        const isCompleted = actualIndex < currentStepIndex;
        const isActive = stepConfig.key === step;
        return <div key={stepConfig.key} className={`
          w-2.5 h-2.5 rounded-full transition-all duration-300
          ${isActive ? 'bg-primary scale-125 ring-4 ring-primary/20' : isCompleted ? 'bg-primary/50' : 'border-2 border-muted-foreground/30 bg-transparent'}
        `} />;
      })}
    </div>;
  };

  const StepHeader = ({ showBack = false, onBack }: { showBack?: boolean; onBack?: () => void; }) => (
    <div className="mb-6 pb-4 border-b border-border/50">
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {showBack && onBack && <button onClick={onBack} className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
          <BackArrow className="w-5 h-5" />
        </button>}
        <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
            <h2 className="text-lg font-semibold text-foreground">
              {isRTL ? currentStepConfig.labelFa : currentStepConfig.labelEn}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? currentStepConfig.microFa : currentStepConfig.microEn}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const handleUpdateQuantity = (id: number, quantity: number) => {
    setLocalCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const handleRemoveItem = (id: number) => {
    setLocalCartItems(prev => prev.filter(item => item.id !== id));
  };

  const cartSubtotal = localCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = 0;
  const cartDiscount = selectedCoupon?.value || 0;
  const cartTotal = Math.max(cartSubtotal + shippingCost - cartDiscount, 0);

  // Flowpoints calculation - 1 point per 100,000 toman
  const flowpointsEarned = Math.floor(cartSubtotal / 100000);
  const flowpointsRedeemable = 42; // Mock existing points
  const flowpointsValue = flowpointsRedeemable * 1000; // 1 point = 1000 toman
  const flowpointsDiscount = flowpointsActive ? flowpointsValue : 0;

  // Direct debit discount: 5% up to 100,000 toman
  const directDebitDiscountValue = paymentMethod === "direct-debit" ? Math.min(Math.floor(cartSubtotal * 0.05), 100000) : 0;

  const calculateTotal = () => {
    const upsellTotal = addedUpsells.reduce((sum, product) => sum + product.price, 0);
    let finalTotal = initialTotal + upsellTotal;
    if (selectedCoupon && selectedCoupon.value) {
      finalTotal -= selectedCoupon.value;
    }
    if (flowpointsActive) {
      finalTotal -= flowpointsValue;
    }
    if (directDebitDiscountValue > 0) {
      finalTotal -= directDebitDiscountValue;
    }
    return Math.max(finalTotal, 0);
  };
  const finalTotal = calculateTotal();

  const renderStep = () => {
    switch (step) {
      case "cart":
        // Higher threshold so progress bar is NOT full for demo
        const discountThreshold = 18000000;
        const progressPercent = Math.min((cartSubtotal / discountThreshold) * 100, 100);
        const remainingForDiscount = Math.max(discountThreshold - cartSubtotal, 0);
        const isDiscountUnlocked = cartSubtotal >= discountThreshold;

        return <div className={`space-y-5 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <StepHeader />

          {/* Discount Progress Task */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDiscountUnlocked ? 'bg-accent/20' : 'bg-primary/10'}`}>
                <ShoppingBag className={`w-5 h-5 ${isDiscountUnlocked ? 'text-accent' : 'text-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-foreground ${isRTL ? 'text-right' : ''}`}>
                  {isDiscountUnlocked
                    ? (isRTL ? "🎉 ۱۵٪ تخفیف فعال شد!" : "🎉 15% discount unlocked!")
                    : (isRTL ? "سبد خود را به ۱۸ میلیون تومان برسانید و ۱۵٪ تخفیف بگیرید" : "Get 15% off by reaching 18M cart value")
                  }
                </p>
                {!isDiscountUnlocked && (
                  <div className={`mt-1.5 text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                    {isRTL ? (
                      <span>
                        <span dir="ltr" className="inline-block unicode-bidi-isolate">{toPersianNumber(cartSubtotal.toLocaleString())}</span>
                        {" / "}
                        <span dir="ltr" className="inline-block unicode-bidi-isolate">{toPersianNumber(discountThreshold.toLocaleString())}</span>
                        {" تومان"}
                      </span>
                    ) : (
                      <span>{cartSubtotal.toLocaleString()} / {discountThreshold.toLocaleString()} ₹</span>
                    )}
                  </div>
                )}
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${isDiscountUnlocked ? 'bg-accent' : 'bg-primary'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="space-y-3">
            {localCartItems.map((item) => {
              const displayName = isRTL && item.nameFa ? item.nameFa : item.name;
              const displayQuantity = isRTL ? toPersianNumber(item.quantity) : item.quantity;
              const hasDiscount = item.originalPrice && item.originalPrice > item.price;

              return (
                <div
                  key={item.id}
                  className={`flex gap-3 p-3 rounded-xl border border-border/50 bg-card ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted/30 border border-border/30 flex-shrink-0">
                    <img src={item.image} alt={displayName} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex flex-col items-center justify-between flex-shrink-0">
                    <div className={`flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5`}>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-background rounded-md transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{displayQuantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-background rounded-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                    <h4 className="font-medium text-sm text-foreground line-clamp-2">{displayName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isRTL ? "رنگ مشکی · حافظه ۱۲۸ گیگ" : "Black · 128GB"}
                    </p>
                    <div className={`flex items-center gap-2 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="font-semibold text-sm text-foreground">
                        {formatCurrency(item.price, language)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(item.originalPrice!, language)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upsell Carousel */}
          {upsellProducts.length > 0 && (
            <EnhancedUpsellCarouselLocalized
              products={upsellProducts.map(p => ({
                ...p,
                nameFa: p.name
              }))}
              onAddProduct={handleAddUpsell}
              addedProductIds={addedUpsellIds}
              currentTotal={cartSubtotal}
              nextTierThreshold={discountThreshold}
              nextTierReward={isRTL ? "۱۵٪ تخفیف" : "15% off"}
            />
          )}

          {/* Shipping Summary */}
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 rounded-lg bg-accent/10">
              <Truck className="w-4 h-4 text-accent" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm font-medium text-foreground">{isRTL ? "ارسال رایگان" : "Free Shipping"}</p>
              <p className="text-xs text-muted-foreground">{isRTL ? "تحویل فوری · ارسال امروز" : "Express · Ships today"}</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full">
              {isRTL ? "ارسال امروز" : "Ships Today"}
            </span>
          </div>

          {/* Coupon Section - moved here from review */}
          <div className="rounded-xl border border-border/50 p-3">
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Input
                placeholder={isRTL ? "کد تخفیف را وارد کنید" : "Enter discount code"}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 h-10"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <Button variant="outline" size="sm" className="h-10 px-4">
                {isRTL ? "اعمال" : "Apply"}
              </Button>
            </div>
            {selectedCoupon && (
              <div className={`mt-2 p-2 rounded-lg bg-accent/5 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Check className="w-4 h-4 text-accent" />
                <span className="text-sm text-accent font-medium">
                  {isRTL ? `${toPersianNumber(selectedCoupon.value?.toLocaleString() || '0')} تومان تخفیف اعمال شد` : `${selectedCoupon.value} saved!`}
                </span>
              </div>
            )}
          </div>

          {/* Coupon Tiers Selector - moved here from review */}
          {couponTiers.length > 0 && (
            <CouponSelectorLocalized
              currentTotal={total}
              tiers={couponTiers}
              selectedCoupon={selectedCoupon}
              onSelectCoupon={setSelectedCoupon}
            />
          )}

          {/* Price Breakdown */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{isRTL ? "مجموع کالاها" : "Subtotal"}</span>
              <span className="text-sm font-medium">{formatCurrency(cartSubtotal, language)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{isRTL ? "هزینه ارسال" : "Shipping"}</span>
              <span className="text-sm font-medium text-accent">{isRTL ? "رایگان" : "Free"}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex items-center justify-between text-accent">
                <span className="text-sm">{isRTL ? "تخفیف" : "Discount"}</span>
                <span className="text-sm font-medium">-{formatCurrency(cartDiscount, language)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="font-semibold text-foreground">{isRTL ? "مبلغ نهایی" : "Total"}</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(cartTotal, language)}</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            variant="gradient"
            className={`w-full h-14 text-base rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}
            onClick={() => setStep("phone")}
            disabled={localCartItems.length === 0}
          >
            {isRTL ? "ادامه به پرداخت" : "Continue to Checkout"}
            <ChevronIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
          </Button>
        </div>;

      case "phone":
        return <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <StepHeader showBack onBack={() => setStep("cart")} />
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="space-y-4">
            <Label htmlFor="phone" className="text-base font-medium">
              {isRTL ? "شماره موبایل" : "Mobile Number"}
            </Label>
            <div className="relative">
              <Input id="phone" type="tel" placeholder={isRTL ? "۰۹۱۲۳۴۵۶۷۸۹" : "98765 43210"} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))} className={`h-14 flex-1 text-lg text-center ${isRTL ? 'text-transparent caret-transparent' : ''}`} maxLength={11} dir="ltr" />
              {isRTL && phoneNumber && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-lg font-medium text-foreground">
                {toPersianNumber(phoneNumber)}
              </div>}
            </div>
          </div>
          <Button variant="gradient" className={`w-full h-14 text-base rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => setStep("otp")} disabled={phoneNumber.length < 10}>
            {isRTL ? "ارسال کد تأیید" : "Send OTP"}
            <ChevronIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
          </Button>
        </div>;

      case "otp":
        return <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <StepHeader showBack onBack={() => setStep("phone")} />
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-center" dir={isRTL ? 'rtl' : 'ltr'}>
              {isRTL ? (
                <>
                  <span>کد ارسال شده به </span>
                  <span dir="ltr" className="inline-block" style={{ unicodeBidi: 'isolate' }}>{toPersianNumber(phoneNumber.slice(0, 4) + ' ' + phoneNumber.slice(4, 7) + ' ' + phoneNumber.slice(7))}</span>
                </>
              ) : (
                <>Code sent to +91 {phoneNumber}</>
              )}
            </p>
            <button onClick={() => setStep("phone")} className="text-primary text-sm font-medium hover:underline mt-2">
              {isRTL ? "تغییر شماره" : "Change number"}
            </button>
          </div>
          <div className="space-y-6 flex flex-col items-center">
            <Label className="text-base font-medium block text-center w-full">
              {isRTL ? "کد ۶ رقمی را وارد کنید" : "Enter 6-digit OTP"}
            </Label>
            <div className="relative">
              <div className="flex justify-center gap-2" dir="ltr">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className={`
                      relative w-12 h-14 rounded-xl border-2 flex items-center justify-center
                      transition-all duration-200 cursor-text
                      ${otp.length === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : otp[index]
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border'
                      }
                    `}
                    onClick={() => {
                      const input = document.getElementById('otp-input-main') as HTMLInputElement;
                      input?.focus();
                    }}
                  >
                    <span className="text-xl font-semibold text-foreground">
                      {otp[index] ? (isRTL ? toPersianNumber(otp[index]) : otp[index]) : ''}
                    </span>
                    {otp.length === index && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-0.5 h-6 bg-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                id="otp-input-main"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="absolute inset-0 opacity-0 w-full h-full cursor-text"
                autoFocus
              />
            </div>
            <div className="text-center">
              {canResendOtp ? (
                <button onClick={handleResendOtp} className="text-sm text-primary font-medium hover:underline transition-colors">
                  {isRTL ? "ارسال مجدد کد" : "Resend code"}
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? <>ارسال مجدد کد تا <span className="text-primary font-medium">{toPersianNumber(otpCountdown)}</span> ثانیه دیگر</>
                    : <>Resend code in <span className="text-primary font-medium">{otpCountdown}</span> seconds</>
                  }
                </p>
              )}
            </div>
          </div>
          <Button variant="gradient" className={`w-full h-14 text-base rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => setStep("address")} disabled={otp.length !== 6}>
            {isRTL ? "تأیید و ادامه" : "Verify & Continue"}
            <ChevronIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
          </Button>
        </div>;

      case "address":
        return <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} onFocus={() => setCurrentSection("address")} dir={isRTL ? 'rtl' : 'ltr'}>
          <StepHeader showBack onBack={() => setStep("otp")} />
          <AddressSelectorLocalized addresses={addresses} selectedAddress={selectedAddress} onSelectAddress={setSelectedAddress} onAddAddress={handleAddAddress} onEditAddress={handleEditAddress} onSetDefault={handleSetDefaultAddress} />
          <div className="pt-4">
            <Label className="text-base font-semibold mb-4 block">{t.checkout.delivery.title}</Label>
            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="space-y-3">
              {[
                 { id: 'standard', title: t.checkout.delivery.standard, description: t.checkout.delivery.standardTime, price: t.common.free, priceClass: 'text-accent' },
                 { id: 'express', title: t.checkout.delivery.express, description: t.checkout.delivery.expressTime, price: formatCurrency(49000, language), priceClass: '' }
               ].map((option) => {
                 const isSelected = deliveryMethod === option.id;
                 return (
                   <div key={option.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'}`} onClick={() => setDeliveryMethod(option.id)}>
                     <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}>
                       {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                     </div>
                     <div className="flex-1">
                       <p className={`font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{option.title}</p>
                       <p className={`text-sm text-muted-foreground mt-0.5 ${isRTL ? 'text-right' : 'text-left'}`}>{option.description}</p>
                     </div>
                     <span className={`font-semibold flex-shrink-0 min-w-[80px] ${isRTL ? 'text-left' : 'text-right'} ${option.priceClass}`}>{option.price}</span>
                   </div>
                 );
               })}
            </RadioGroup>
          </div>
          <Button variant="gradient" className={`w-full h-14 text-base rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => {
            setStep("payment");
            setCurrentSection("payment");
          }}>
            {isRTL ? "ادامه به پرداخت" : "Continue to Payment"}
            <ChevronIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
          </Button>
        </div>;

      case "payment":
        return <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} onFocus={() => setCurrentSection("payment")} dir={isRTL ? 'rtl' : 'ltr'}>
          <StepHeader showBack onBack={() => {
            setStep("address");
            setCurrentSection("address");
          }} />

          {/* Order Summary - moved here from review (تحویل به…) */}
          <div className="bg-muted/20 p-5 rounded-xl border border-border/50 space-y-4">
            <div>
              <p className={`text-sm text-muted-foreground mb-1 ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? "تحویل به" : "Delivering to"}
              </p>
              {selectedAddress ? <div className={isRTL ? 'text-right' : ''}>
                <p className="font-medium">
                  {selectedAddress.name}، {isRTL ? <span dir="ltr" className="inline-block" style={{ unicodeBidi: 'isolate' }}>{formatPhoneDisplay(selectedAddress.phone)}</span> : `+91 ${selectedAddress.phone}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedAddress.line1}، {selectedAddress.line2}، {selectedAddress.city} - {isRTL ? <span dir="ltr" className="inline-block" style={{ unicodeBidi: 'isolate' }}>{toPersianNumber(selectedAddress.pincode)}</span> : selectedAddress.pincode}
                </p>
              </div> : <p className="font-medium">{isRTL ? "آدرسی انتخاب نشده" : "No address selected"}</p>}
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t.orderSummary.subtotal}</span>
                  <span className="text-sm font-medium">{formatCurrency(initialTotal, language)}</span>
                </div>
                {addedUpsells.length > 0 && <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {isRTL ? `اقلام اضافه شده (${toPersianNumber(addedUpsells.length)})` : `Added items (${addedUpsells.length})`}
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(addedUpsells.reduce((sum, p) => sum + p.price, 0), language)}
                  </span>
                </div>}
                {selectedCoupon && selectedCoupon.value && <div className="flex items-center justify-between text-accent-foreground">
                  <span className="text-sm">{isRTL ? "تخفیف کد" : "Coupon Discount"}</span>
                  <span className="text-sm font-medium">-{formatCurrency(selectedCoupon.value, language)}</span>
                </div>}
                {flowpointsActive && <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-sm">{isRTL ? "تخفیف فلوپوینت" : "Flowpoints Discount"}</span>
                  <span className="text-sm font-medium">-{formatCurrency(flowpointsValue, language)}</span>
                </div>}
                {directDebitDiscountValue > 0 && <div className="flex items-center justify-between text-accent">
                  <span className="text-sm">{isRTL ? "تخفیف پرداخت مستقیم" : "Direct Debit Discount"}</span>
                  <span className="text-sm font-medium">-{formatCurrency(directDebitDiscountValue, language)}</span>
                </div>}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="font-semibold">{isRTL ? "مبلغ قابل پرداخت" : "Amount to Pay"}</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(finalTotal, language)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flowpoints Component with Radio Buttons */}
          <div className={`p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 transition-all`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">
                {isRTL ? "فلوپوینت" : "Flowpoints"}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700">
                  {isRTL ? "امتیاز کسب شده از این خرید" : "Points earned from this cart"}
                </span>
                <span className="text-sm font-bold text-emerald-800">
                  +{isRTL ? toPersianNumber(flowpointsEarned) : flowpointsEarned}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700">
                  {isRTL ? "امتیاز قابل استفاده" : "Redeemable points"}
                </span>
                <span className="text-sm font-bold text-emerald-800">
                  {isRTL ? toPersianNumber(flowpointsRedeemable) : flowpointsRedeemable}
                </span>
              </div>
              <div className={`pt-2 border-t border-emerald-200 ${isRTL ? 'text-right' : ''}`}>
                <p className="text-xs text-emerald-600">
                  {isRTL
                    ? `۱۰ فلوپوینت ≈ ${toPersianNumber("10,000")} تومان`
                    : "10 Flowpoints ≈ 10,000 Toman"
                  }
                </p>
              </div>
            </div>

            {/* Radio buttons like auto-reorder style */}
            <RadioGroup value={flowpointsActive ? 'use' : 'save'} onValueChange={(v) => setFlowpointsActive(v === 'use')} className="space-y-2 pt-2">
              {[
                {
                  id: 'use',
                  title: isRTL ? "استفاده از فلوپوینت" : "Use Flowpoints",
                  description: isRTL ? `${toPersianNumber(flowpointsRedeemable)} امتیاز = ${formatCurrency(flowpointsValue, language)} تخفیف` : `${flowpointsRedeemable} points = ${formatCurrency(flowpointsValue, language)} discount`
                },
                {
                  id: 'save',
                  title: isRTL ? "ذخیره برای بعد" : "Save for later",
                  description: isRTL ? "امتیازها را برای خرید بعدی نگه دار" : "Keep points for next purchase"
                }
              ].map((option) => {
                const isSelected = (option.id === 'use' && flowpointsActive) || (option.id === 'save' && !flowpointsActive);
                return (
                  <div
                    key={option.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
                      ${isSelected
                        ? 'border-emerald-400 bg-emerald-100/60'
                        : 'border-emerald-200/60 hover:border-emerald-300'
                      }
                    `}
                    onClick={() => setFlowpointsActive(option.id === 'use')}
                  >
                    <RadioGroupItem value={option.id} id={`fp-${option.id}`} className="sr-only" />
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-emerald-300'}
                    `}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                      <p className={`text-sm font-medium ${isSelected ? 'text-emerald-800' : 'text-emerald-600'}`}>
                        {option.title}
                      </p>
                      <p className="text-xs text-emerald-500 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Payment Method Cards */}
          <div className="space-y-3">
            {/* Payment Gateway */}
            <button onClick={() => setPaymentMethod("gateway")} className={`w-full p-4 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${paymentMethod === "gateway" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-3 rounded-lg ${paymentMethod === "gateway" ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <p className="font-semibold text-foreground">{isRTL ? "درگاه پرداخت" : "Payment Gateway"}</p>
                </div>
                {paymentMethod === "gateway" && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>}
              </div>
            </button>

            {/* Direct Debit */}
            <button onClick={() => setPaymentMethod("direct-debit")} className={`w-full p-4 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${paymentMethod === "direct-debit" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-3 rounded-lg ${paymentMethod === "direct-debit" ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-500 border border-red-200 whitespace-nowrap">
                      {isRTL ? "۵٪ تخفیف تا سقف ۱۰۰ هزار تومان" : "5% off up to 100K"}
                    </span>
                    <p className="font-semibold text-foreground">{isRTL ? "پرداخت مستقیم یک کلیکی" : "Direct Debit — One Click"}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{isRTL ? "برداشت مستقیم از حساب بانکی" : "Direct debit from bank account"}</p>
                </div>
                {paymentMethod === "direct-debit" && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>}
              </div>
            </button>

            {/* Card Transfer */}
            <div className={`rounded-xl border-2 transition-all overflow-hidden ${paymentMethod === "card" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <button onClick={() => setPaymentMethod("card")} className={`w-full p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-lg ${paymentMethod === "card" ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <p className="font-semibold text-foreground">{isRTL ? "کارت به کارت" : "Card Transfer"}</p>
                  </div>
                  {paymentMethod === "card" && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>}
                </div>
              </button>
              {paymentMethod === "card" && (
                <div className="px-4 pb-4 space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {isRTL ? "شماره کارت مقصد" : "Destination card number"}
                    </p>
                    <p className="text-base font-semibold text-foreground tracking-widest" dir="ltr" style={{ fontFamily: 'inherit' }}>
                      {isRTL ? toPersianNumber("6037 - 9918 - 2541 - 7783") : "6037 - 9918 - 2541 - 7783"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRTL ? "به نام: فلوکارت" : "Name: Flowcart"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {isRTL ? "کد رهگیری تراکنش" : "Transaction tracking code"}
                    </Label>
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="relative flex-1">
                        <Hash className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          placeholder={isRTL ? "کد رهگیری را وارد کنید" : "Enter tracking code"}
                          value={trackingCode}
                          onChange={(e) => setTrackingCode(e.target.value)}
                          className={`h-10 ${isRTL ? 'pr-9' : 'pl-9'}`}
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BNPL - Pastel purple */}
            <button onClick={() => setPaymentMethod("bnpl")} className={`w-full p-4 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${paymentMethod === "bnpl" ? 'border-violet-400 bg-violet-50' : 'border-violet-200 bg-violet-50/30 hover:border-violet-300'}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-3 rounded-lg ${paymentMethod === "bnpl" ? 'bg-violet-500 text-white' : 'bg-violet-100 text-violet-500'}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <p className="font-semibold text-foreground">{isRTL ? "الان بخر بعدا پرداخت کن" : "Buy Now, Pay Later"}</p>
                  <p className="text-sm text-violet-600">{isRTL ? "خرید ۴ قسطه با اعتبار فلوپی" : "Pay in 4 installments with Flowpay"}</p>
                </div>
                {paymentMethod === "bnpl" && <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>}
              </div>
            </button>

            {/* Cash on Delivery */}
            <button onClick={() => setPaymentMethod("cod")} className={`w-full p-4 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${paymentMethod === "cod" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-3 rounded-lg ${paymentMethod === "cod" ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <p className="font-semibold text-foreground">{isRTL ? "پرداخت در محل" : "Cash on Delivery"}</p>
                  <p className="text-sm text-muted-foreground">{isRTL ? "پرداخت هنگام تحویل سفارش" : "Pay when you receive your order"}</p>
                </div>
                {paymentMethod === "cod" && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>}
              </div>
            </button>
          </div>

          {/* Auto-Reorder Options - moved here from review */}
          <AutoReorderOptionsLocalized />

          <Button variant="checkout" className="w-full h-14 text-lg rounded-xl" onClick={handlePlaceOrder} disabled={isProcessing}>
            {isProcessing ? <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.checkout.review.processing}
            </span> : isRTL ? "ثبت سفارش و پرداخت" : t.checkout.review.placeOrder}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-2">
            🔒 {isRTL ? "اطلاعات شما امن و رمزگذاری شده است" : "Your data is secure and encrypted"}
          </p>
        </div>;
    }
  };

  return <>
    <Confetti trigger={showConfetti} />
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-background rounded-2xl shadow-soft w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col ${isRTL ? 'font-vazirmatn' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Cart/Phone Step Header */}
        {(step === "cart" || step === "phone") && (
          <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-3 rounded-t-2xl">
            <div className={`flex items-center justify-center gap-2 text-sm font-medium text-primary-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Zap className="w-4 h-4" />
              <span>
                {isRTL
                  ? "سفارش خود را در ۱۰ ثانیه تکمیل کنید — بدون نیاز به ورود، سریع و امن"
                  : "Complete your order in 10 seconds - No login required — fast & secure"
                }
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Banner */}
        {step !== "cart" && step !== "phone" && step !== "otp" && <div className="bg-gradient-to-r from-accent/10 to-accent/5 px-6 py-2.5 border-b border-border/50">
          <div className={`flex items-center justify-center gap-2 text-sm font-medium text-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
            {getDynamicBanner().icon}
            <span>{getDynamicBanner().text}</span>
          </div>
        </div>}

        {/* Header */}
        <div className={`sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
            {step !== "cart" && step !== "phone" && step !== "otp" && <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-lg font-medium text-foreground">
                {isRTL
                  ? (step === "payment"
                    ? <>قابلتم نداشت <span className="font-semibold">{displayedName}</span> جان<span className={displayedName === userName ? "" : "opacity-0"}> 😊</span></>
                    : <>سلام <span className="font-semibold">{displayedName}</span><span className={displayedName === userName ? "" : "opacity-0"}> 👋</span></>
                  )
                  : <>Hi <span className="font-semibold">{displayedName}</span><span className={displayedName === userName ? "" : "opacity-0"}> 👋</span></>
                }
              </span>
            </div>}
          </div>
          <div className="flex items-center">
            <DotProgress />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isProcessing ? <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-full max-w-xs">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-100 rounded-full" style={{ width: `${processingProgress}%` }} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-base font-medium text-foreground">{t.checkout.review.processing}</p>
              <p className="text-sm text-muted-foreground">
                {processingProgress < 100 ? `${isRTL ? toPersianNumber(2) : "2"} ${t.checkout.review.secondsToComplete}` : isRTL ? "تقریباً تمام!" : "Almost done!"}
              </p>
            </div>
          </div> : renderStep()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-6 py-3">
          <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Zap className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
            <span className="text-sm font-medium text-muted-foreground">
              {t.common.poweredBy}
            </span>
          </div>
        </div>
      </div>
    </div>
  </>;
};
