import { useState, useEffect, useRef } from "react";
import { X, CreditCard, Smartphone, Banknote, ChevronRight, ChevronLeft, Phone, Check, Zap, Shield, Clock, ArrowRight, ArrowLeft } from "lucide-react";
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
type CheckoutStep = "phone" | "otp" | "address" | "payment" | "review";
type PaymentMethod = "gateway" | "card" | "cod";

// Step configuration for RTL-aware dot progress
const STEPS_CONFIG: {
  key: CheckoutStep;
  labelFa: string;
  labelEn: string;
  microFa?: string;
  microEn?: string;
}[] = [{
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
  key: "review",
  labelFa: "بررسی سفارش",
  labelEn: "Review",
  microFa: "اطلاعات نهایی خرید شما",
  microEn: "Final order details"
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
  const {
    t,
    isRTL,
    language
  } = useLanguage();
  const [step, setStep] = useState<CheckoutStep>("phone");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("gateway");
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
  
  // OTP resend countdown timer
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Track if greeting has been animated
  const hasAnimatedGreeting = useRef(false);

  // Address management
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

  // Typewriter effect for name - ONLY on first render after phone/otp
  useEffect(() => {
    if (isOpen && step !== "phone" && step !== "otp" && !hasAnimatedGreeting.current) {
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
    } else if (isOpen && step !== "phone" && step !== "otp" && hasAnimatedGreeting.current) {
      // Already animated, just show the name immediately
      setDisplayedName(userName);
    }
  }, [isOpen, step, userName]);

  // Reset greeting animation state when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasAnimatedGreeting.current = false;
      setDisplayedName("");
      setOtpCountdown(60);
      setCanResendOtp(false);
    }
  }, [isOpen]);

  // OTP countdown timer effect
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

  // Handle OTP resend
  const handleResendOtp = () => {
    setOtpCountdown(60);
    setCanResendOtp(false);
    setOtp("");
  };

  // Progress bar animation during processing
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

  // Update total when upsells are added
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
    if (selectedAddress?.id === address.id) {
      setSelectedAddress(address);
    }
  };
  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === id
    })));
  };
  const getDynamicBanner = () => {
    switch (currentSection) {
      case "address":
        return {
          icon: <Shield className="w-4 h-4" />,
          text: t.checkout.banners.address
        };
      case "payment":
        return {
          icon: <Clock className="w-4 h-4" />,
          text: t.checkout.banners.payment
        };
      case "coupon":
        return {
          icon: <Check className="w-4 h-4" />,
          text: t.checkout.banners.coupon
        };
      case "review":
        return {
          icon: <Zap className="w-4 h-4" />,
          text: t.checkout.banners.review
        };
      default:
        return {
          icon: <Shield className="w-4 h-4" />,
          text: t.checkout.banners.address
        };
    }
  };

  // Calculate total with coupon discount
  const calculateTotal = () => {
    const upsellTotal = addedUpsells.reduce((sum, product) => sum + product.price, 0);
    let finalTotal = initialTotal + upsellTotal;
    if (selectedCoupon && selectedCoupon.value) {
      finalTotal -= selectedCoupon.value;
    }
    return Math.max(finalTotal, 0);
  };
  const finalTotal = calculateTotal();

  // Get next tier for gamification
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

  // Format phone for display - remove country code prefix
  const formatPhoneDisplay = (phone: string) => {
    if (isRTL) {
      // Format as ۰۹۱۲ *** ****
      const formatted = phone.length >= 4 ? `${phone.slice(0, 4)} *** ****` : phone;
      return toPersianNumber(formatted);
    }
    return phone;
  };

  // Dot-style progress indicator component
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

  // Step header component with proper hierarchy
  const StepHeader = ({
    showBack = false,
    onBack
  }: {
    showBack?: boolean;
    onBack?: () => void;
  }) => <div className="mb-6 pb-4 border-b border-border/50">
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
    </div>;
  const renderStep = () => {
    switch (step) {
      case "phone":
        return <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <StepHeader />
            
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
                {/* Persian digit overlay for RTL */}
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
              <p className="text-muted-foreground">
                {isRTL ? `کد ارسال شده به ${formatPhoneDisplay(phoneNumber)}` : `Code sent to +91 ${phoneNumber}`}
              </p>
              <button onClick={() => setStep("phone")} className="text-primary text-sm font-medium hover:underline mt-2">
                {isRTL ? "تغییر شماره" : "Change number"}
              </button>
            </div>

            <div className="space-y-6">
              <Label className="text-base font-medium block text-center">
                {isRTL ? "کد ۶ رقمی را وارد کنید" : "Enter 6-digit OTP"}
              </Label>
              <div className="flex justify-center gap-2" dir="ltr">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div 
                    key={index} 
                    className={`
                      relative w-12 h-14 rounded-xl border-2 flex items-center justify-center
                      transition-all duration-200
                      ${otp.length === index 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : otp[index] 
                          ? 'border-primary/50 bg-primary/5' 
                          : 'border-border'
                      }
                    `}
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
                {/* Hidden input for OTP */}
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="absolute opacity-0 w-0 h-0"
                  autoFocus
                />
              </div>
              {/* Clickable area to focus the hidden input */}
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="sr-only"
                id="otp-input"
                autoFocus
              />
              <div className="text-center">
                {canResendOtp ? (
                  <button 
                    onClick={handleResendOtp}
                    className="text-sm text-primary font-medium hover:underline transition-colors"
                  >
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
              <RadioGroup defaultValue="standard" className="space-y-3">
                <div className={`flex items-center p-4 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors ${isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'}`}>
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="flex-1 cursor-pointer">
                    <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="font-medium">{t.checkout.delivery.standard}</p>
                        <p className="text-sm text-muted-foreground">{t.checkout.delivery.standardTime}</p>
                      </div>
                      <span className="text-accent font-semibold">{t.common.free}</span>
                    </div>
                  </Label>
                </div>
                <div className={`flex items-center p-4 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors ${isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'}`}>
                  <RadioGroupItem value="express" id="express" />
                  <Label htmlFor="express" className="flex-1 cursor-pointer">
                    <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="font-medium">{t.checkout.delivery.express}</p>
                        <p className="text-sm text-muted-foreground">{t.checkout.delivery.expressTime}</p>
                      </div>
                      <span className="font-semibold">{formatCurrency(49, language)}</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button variant="gradient" className={`w-full h-14 text-base rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => {
            setStep("review");
            setCurrentSection("review");
          }}>
              {isRTL ? "ادامه به بررسی سفارش" : "Continue to Review"} 
              <ChevronIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
            </Button>
          </div>;
      case "payment":
        return <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} onFocus={() => setCurrentSection("payment")} dir={isRTL ? 'rtl' : 'ltr'}>
            <StepHeader showBack onBack={() => {
            setStep("review");
            setCurrentSection("review");
          }} />

            {/* Order Total Summary */}
            <div className="bg-muted/20 p-4 rounded-xl border border-border/50">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="font-medium text-foreground">{isRTL ? "مبلغ قابل پرداخت" : "Amount to Pay"}</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(finalTotal, language)}</span>
              </div>
            </div>

            {/* Payment Method Cards - Full Width Selectable */}
            <div className="space-y-3">
              <button onClick={() => setPaymentMethod("gateway")} className={`w-full p-4 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${paymentMethod === "gateway" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-lg ${paymentMethod === "gateway" ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <p className="font-semibold text-foreground">{isRTL ? "درگاه پرداخت" : "Payment Gateway"}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? "پرداخت آنلاین با درگاه بانکی" : "Online payment via bank gateway"}</p>
                  </div>
                  {paymentMethod === "gateway" && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>}
                </div>
              </button>

              <button onClick={() => setPaymentMethod("card")} className={`w-full p-4 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${paymentMethod === "card" ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-3 rounded-lg ${paymentMethod === "card" ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <p className="font-semibold text-foreground">{isRTL ? "کارت به کارت" : "Card Transfer"}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? "انتقال وجه به کارت بانکی" : "Transfer to bank card"}</p>
                  </div>
                  {paymentMethod === "card" && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>}
                </div>
              </button>

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

            {paymentMethod === "cod" && <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                  {isRTL ? "پرداخت هنگام تحویل سفارش. هزینه اضافی ۲۰٬۰۰۰ تومان ممکن است اعمال شود." : "Pay when you receive your order. A nominal fee of ₹20 may apply."}
                </p>
              </div>}

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
      case "review":
        return <div className={`space-y-6 ${isRTL ? 'text-right' : ''}`} onFocus={() => setCurrentSection("review")} dir={isRTL ? 'rtl' : 'ltr'}>
            <StepHeader showBack onBack={() => {
            setStep("address");
            setCurrentSection("address");
          }} />

            {/* Coupon Selector */}
            {couponTiers.length > 0 && <div onFocus={() => setCurrentSection("coupon")}>
                <CouponSelectorLocalized currentTotal={total} tiers={couponTiers} selectedCoupon={selectedCoupon} onSelectCoupon={setSelectedCoupon} />
              </div>}

            {/* Enhanced Upsell Carousel with Variants and Gamification */}
            {upsellProducts.length > 0 && <EnhancedUpsellCarouselLocalized products={upsellProducts as any} onAddProduct={handleAddUpsell} addedProductIds={addedUpsellIds} currentTotal={total} nextTierThreshold={nextTier?.threshold} nextTierReward={nextTier?.reward} />}

            {/* Order Summary */}
            <div className="bg-muted/20 p-5 rounded-xl border border-border/50 space-y-4">
              <div>
                <p className={`text-sm text-muted-foreground mb-1 ${isRTL ? 'text-right' : ''}`}>
                  {isRTL ? "تحویل به" : "Delivering to"}
                </p>
                {selectedAddress ? <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-medium">
                      {selectedAddress.name}، {isRTL ? formatPhoneDisplay(selectedAddress.phone) : `+91 ${selectedAddress.phone}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAddress.line1}، {selectedAddress.line2}، {selectedAddress.city} - {isRTL ? toPersianNumber(selectedAddress.pincode) : selectedAddress.pincode}
                    </p>
                  </div> : <p className="font-medium">{isRTL ? "آدرسی انتخاب نشده" : "No address selected"}</p>}
              </div>
              
              <div className="border-t border-border/50 pt-4">
                <div className="space-y-3">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm text-muted-foreground">{t.orderSummary.subtotal}</span>
                    <span className="text-sm font-medium">{formatCurrency(initialTotal, language)}</span>
                  </div>
                  {addedUpsells.length > 0 && <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm text-muted-foreground">
                        {isRTL ? `اقلام اضافه شده (${toPersianNumber(addedUpsells.length)})` : `Added items (${addedUpsells.length})`}
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(addedUpsells.reduce((sum, p) => sum + p.price, 0), language)}
                      </span>
                    </div>}
                  {selectedCoupon && selectedCoupon.value && <div className={`flex items-center justify-between text-accent-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm">{isRTL ? "تخفیف کد" : "Coupon Discount"}</span>
                      <span className="text-sm font-medium">-{formatCurrency(selectedCoupon.value, language)}</span>
                    </div>}
                  <div className={`flex items-center justify-between pt-3 border-t border-border/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="font-semibold">{t.orderSummary.total}</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(finalTotal, language)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Reorder Options */}
            <AutoReorderOptionsLocalized />


            <Button variant="gradient" className={`w-full h-14 text-base rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => {
              setStep("payment");
              setCurrentSection("payment");
            }}>
              {isRTL ? "ادامه به پرداخت" : "Continue to Payment"} 
              <ChevronIcon className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
            </Button>
          </div>;
    }
  };
  return <>
      <Confetti trigger={showConfetti} />
      <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-background rounded-2xl shadow-soft w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col ${isRTL ? 'font-vazirmatn' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Phone Step Header - Only visible on phone step */}
          {step === "phone" && (
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-border/50">
              <div className={`flex items-center justify-center gap-2 text-sm font-medium text-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Zap className="w-4 h-4 text-primary" />
                <span>
                  {isRTL 
                    ? "سفارش خود را در ۱۰ ثانیه تکمیل کنید — بدون نیاز به ورود، سریع و امن"
                    : "Complete your order in 10 seconds - No login required — fast & secure"
                  }
                </span>
              </div>
            </div>
          )}

          {/* Dynamic Banner - Not visible on phone/otp steps */}
          {step !== "phone" && step !== "otp" && <div className="bg-gradient-to-r from-accent/10 to-accent/5 px-6 py-2.5 border-b border-border/50">
              <div className={`flex items-center justify-center gap-2 text-sm font-medium text-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                {getDynamicBanner().icon}
                <span>{getDynamicBanner().text}</span>
              </div>
            </div>}
          
          {/* Header with Close Button on LEFT (RTL convention) */}
          <div className={`sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
            {/* Close button + Greeting - on left for RTL */}
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
              
              {/* Greeting message - right next to close button */}
              {step !== "phone" && step !== "otp" && <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-lg font-medium text-foreground">
                    {isRTL ? "سلام" : "Hi"} <span className="font-semibold">{displayedName}</span>
                    <span className={displayedName === userName ? "" : "opacity-0"}> 👋</span>
                  </span>
                </div>}
            </div>
            
            {/* Progress dots - centered or at end */}
            <div className="flex items-center">
              <DotProgress />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isProcessing ? <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-full max-w-xs">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-100 rounded-full" style={{
                  width: `${processingProgress}%`
                }} />
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
          
          {/* Powered by Flowcart Footer */}
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