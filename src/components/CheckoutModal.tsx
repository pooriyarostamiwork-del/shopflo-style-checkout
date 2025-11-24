import { useState, useEffect } from "react";
import { X, CreditCard, Smartphone, Banknote, ChevronRight, Phone, Check, Zap, Shield, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { UpsellCarousel } from "./UpsellCarousel";
import { CouponEngine } from "./CouponEngine";
import { Confetti } from "./Confetti";
import { AddressSelector, Address } from "./AddressSelector";
import { CouponSelector } from "./CouponSelector";
import { EnhancedUpsellCarousel } from "./EnhancedUpsellCarousel";
import { AutoReorderOptions } from "./AutoReorderOptions";
import { CheckoutMode, UpsellProduct, CouponTier } from "@/types/checkout";
import { CartProduct } from "./CartItem";

interface CheckoutModalProps {
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
type PaymentMethod = "upi" | "card" | "cod";

export const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  total: initialTotal, 
  onSuccess,
  mode,
  modeConfig,
  cartItems = [],
  upsellProducts = [],
  couponTiers = []
}: CheckoutModalProps) => {
  const [step, setStep] = useState<CheckoutStep>("phone");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveDetails, setSaveDetails] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [userName] = useState("Alex");
  const [displayedName, setDisplayedName] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [addedUpsells, setAddedUpsells] = useState<UpsellProduct[]>([]);
  const [addedUpsellIds, setAddedUpsellIds] = useState<string[]>([]);
  const [total, setTotal] = useState(initialTotal);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponTier | null>(null);
  const [currentSection, setCurrentSection] = useState<"address" | "payment" | "coupon" | "review">("address");

  // Address management
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      name: "Rahul Kumar",
      phone: "98765 43210",
      line1: "123, MG Road",
      line2: "Koramangala",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034",
      isDefault: true
    }
  ]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(addresses[0]);

  // Typewriter effect for name
  useEffect(() => {
    if (isOpen && step !== "phone" && step !== "otp") {
      let currentIndex = 0;
      setDisplayedName("");
      const interval = setInterval(() => {
        if (currentIndex <= userName.length) {
          setDisplayedName(userName.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isOpen, step, userName]);

  // Progress bar animation during processing
  useEffect(() => {
    if (isProcessing) {
      setProcessingProgress(0);
      const duration = 2000;
      const interval = 20;
      const increment = (interval / duration) * 100;
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
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const getDynamicBanner = () => {
    switch (currentSection) {
      case "address":
        return {
          icon: <Shield className="w-4 h-4" />,
          text: "Secure delivery powered by Flowcart"
        };
      case "payment":
        return {
          icon: <Clock className="w-4 h-4" />,
          text: "One tap and you're done"
        };
      case "coupon":
        return {
          icon: <Check className="w-4 h-4" />,
          text: "Smart savings unlocked"
        };
      case "review":
        return {
          icon: <Zap className="w-4 h-4" />,
          text: "Almost there! Review your order"
        };
      default:
        return {
          icon: <Shield className="w-4 h-4" />,
          text: "Secure checkout powered by Flowcart"
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

  const getModeSpecificContent = () => {
    if (!mode || !modeConfig) return null;

    return (
      <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
        {modeConfig.badge && (
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-xs font-medium text-primary mb-2">
            {modeConfig.badge}
          </div>
        )}
        
        {modeConfig.crossStoreData && (
          <p className="text-sm text-foreground mb-2">
            <span className="font-semibold">You have {modeConfig.crossStoreData.itemsInCart} items</span> waiting in your cart at <span className="font-semibold">{modeConfig.crossStoreData.storeName}</span>
          </p>
        )}

        {modeConfig.abandonmentReason && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
            <p className="text-sm text-yellow-800">
              💡 <span className="font-semibold">We noticed:</span> {modeConfig.abandonmentReason}
            </p>
          </div>
        )}

        {modeConfig.loyaltyPoints && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 mb-2">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              ⭐ Earn {modeConfig.loyaltyPoints} FlowPoints
            </p>
            <p className="text-xs text-amber-700">
              {modeConfig.incentiveMessage}
            </p>
          </div>
        )}

        {modeConfig.incentiveMessage && !modeConfig.loyaltyPoints && (
          <p className="text-sm font-medium text-primary">
            {modeConfig.incentiveMessage}
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const getProgressPercentage = () => {
    const steps = ["phone", "otp", "address", "payment", "review"];
    const currentIndex = steps.indexOf(step);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case "phone":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Login to Continue</h2>
              <p className="text-muted-foreground">Enter your mobile number to proceed</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-base">Mobile Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-4 h-12 bg-muted/30 border border-border rounded-lg">
                  <span className="font-medium">+91</span>
                </div>
                <Input 
                  id="phone"
                  type="tel"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="h-12 flex-1"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll send you a verification code
              </p>
            </div>

            <Button 
              variant="gradient" 
              className="w-full h-12 text-base rounded-xl"
              onClick={() => setStep("otp")}
              disabled={phoneNumber.length !== 10}
            >
              Send OTP <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

      case "otp":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setStep("phone")}
                className="text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <h2 className="text-2xl font-bold text-foreground">Verify OTP</h2>
            </div>

            <div className="text-center mb-6">
              <p className="text-muted-foreground">
                Code sent to +91 {phoneNumber}
              </p>
              <button 
                onClick={() => setStep("phone")}
                className="text-primary text-sm font-medium hover:underline mt-1"
              >
                Change number
              </button>
            </div>

            <div className="space-y-4">
              <Label className="text-base">Enter 6-digit OTP</Label>
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="text-center">
                <button className="text-sm text-muted-foreground hover:text-primary">
                  Didn't receive code? <span className="text-primary font-medium">Resend</span>
                </button>
              </div>
            </div>

            <Button 
              variant="gradient" 
              className="w-full h-12 text-base rounded-xl"
              onClick={() => setStep("address")}
              disabled={otp.length !== 6}
            >
              Verify & Continue <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

      case "address":
        return (
          <div className="space-y-4" onFocus={() => setCurrentSection("address")}>
            <h2 className="text-2xl font-bold text-foreground">Delivery Address</h2>
            
            <AddressSelector
              addresses={addresses}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onAddAddress={handleAddAddress}
              onEditAddress={handleEditAddress}
              onSetDefault={handleSetDefaultAddress}
            />

            <div>
              <Label className="text-base font-semibold mb-3 block">Delivery Method</Label>
              <RadioGroup defaultValue="standard" className="space-y-3">
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Standard Delivery</p>
                        <p className="text-sm text-muted-foreground">3-5 business days</p>
                      </div>
                      <span className="text-accent font-semibold">FREE</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                  <RadioGroupItem value="express" id="express" />
                  <Label htmlFor="express" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Express Delivery</p>
                        <p className="text-sm text-muted-foreground">1-2 business days</p>
                      </div>
                      <span className="font-semibold">₹49</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              variant="gradient" 
              className="w-full h-12 text-base rounded-xl"
              onClick={() => {
                setStep("payment");
                setCurrentSection("payment");
              }}
            >
              Continue to Payment <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4" onFocus={() => setCurrentSection("payment")}>
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => {
                  setStep("address");
                  setCurrentSection("address");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <h2 className="text-2xl font-bold text-foreground">Payment Method</h2>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                variant={paymentMethod === "upi" ? "default" : "outline"}
                className="flex-1 h-12"
                onClick={() => setPaymentMethod("upi")}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                UPI
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                className="flex-1 h-12"
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Card
              </Button>
              <Button
                variant={paymentMethod === "cod" ? "default" : "outline"}
                className="flex-1 h-12"
                onClick={() => setPaymentMethod("cod")}
              >
                <Banknote className="w-4 h-4 mr-2" />
                COD
              </Button>
            </div>

            {paymentMethod === "upi" && (
              <div className="space-y-3">
                <Label htmlFor="upi">UPI ID</Label>
                <Input 
                  id="upi" 
                  placeholder="yourname@paytm" 
                  className="h-12"
                />
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardname">Cardholder Name</Label>
                  <Input 
                    id="cardname" 
                    placeholder="Rahul Kumar" 
                    className="h-12 mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="cardnumber">Card Number</Label>
                  <Input 
                    id="cardnumber" 
                    placeholder="1234 5678 9012 3456" 
                    className="h-12 mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input 
                      id="expiry" 
                      placeholder="MM/YY" 
                      className="h-12 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input 
                      id="cvv" 
                      placeholder="123" 
                      type="password"
                      maxLength={3}
                      className="h-12 mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "cod" && (
              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  Pay with cash when your order is delivered. A nominal fee of ₹20 may apply.
                </p>
              </div>
            )}

            <Button 
              variant="gradient" 
              className="w-full h-12 text-base rounded-xl mt-6"
              onClick={() => {
                setStep("review");
                setCurrentSection("review");
              }}
            >
              Review Order <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4" onFocus={() => setCurrentSection("review")}>
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => {
                  setStep("payment");
                  setCurrentSection("payment");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <h2 className="text-2xl font-bold text-foreground">Review Order</h2>
            </div>

            {getModeSpecificContent()}

            {/* Coupon Selector */}
            {couponTiers.length > 0 && (
              <div onFocus={() => setCurrentSection("coupon")}>
                <CouponSelector
                  currentTotal={total}
                  tiers={couponTiers}
                  selectedCoupon={selectedCoupon}
                  onSelectCoupon={setSelectedCoupon}
                />
              </div>
            )}

            {/* Enhanced Upsell Carousel with Variants and Gamification */}
            {upsellProducts.length > 0 && (
              <EnhancedUpsellCarousel 
                products={upsellProducts as any}
                onAddProduct={handleAddUpsell}
                addedProductIds={addedUpsellIds}
                currentTotal={total}
                nextTierThreshold={nextTier?.threshold}
                nextTierReward={nextTier?.reward}
              />
            )}

            <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Delivering to</p>
                {selectedAddress ? (
                  <>
                    <p className="font-medium">{selectedAddress.name}, +91 {selectedAddress.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAddress.line1}, {selectedAddress.line2}, {selectedAddress.city} - {selectedAddress.pincode}
                    </p>
                  </>
                ) : (
                  <p className="font-medium">No address selected</p>
                )}
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium capitalize">{paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod.toUpperCase()}</p>
              </div>
              <div className="border-t border-border pt-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{initialTotal.toFixed(2)}</span>
                  </div>
                  {addedUpsells.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Added items ({addedUpsells.length})</span>
                      <span className="font-medium">₹{addedUpsells.reduce((sum, p) => sum + p.price, 0).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedCoupon && selectedCoupon.value && (
                    <div className="flex justify-between text-sm text-accent-foreground">
                      <span>Coupon Discount</span>
                      <span className="font-medium">-₹{selectedCoupon.value.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-xl font-bold text-primary">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Reorder Options */}
            <AutoReorderOptions />

            <div className="flex items-center space-x-2 py-2">
              <Checkbox 
                id="save" 
                checked={saveDetails}
                onCheckedChange={(checked) => setSaveDetails(checked as boolean)}
              />
              <Label 
                htmlFor="save" 
                className="text-sm cursor-pointer"
              >
                Save details for 1-click checkout next time
              </Label>
            </div>

            <Button 
              variant="checkout" 
              className="w-full h-14 text-lg rounded-xl"
              onClick={handlePlaceOrder}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing your order...
                </span>
              ) : (
                "Place Order Instantly"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-2">
              🔒 Your data is secure and encrypted
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <Confetti trigger={showConfetti} />
      <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-background rounded-2xl shadow-soft w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Customizable Header Bar */}
        {modeConfig?.header && (
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-border/50">
            <h3 className="text-lg font-semibold text-foreground">
              {modeConfig.header.title}
            </h3>
            {modeConfig.header.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {modeConfig.header.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Dynamic Banner */}
        {step !== "phone" && step !== "otp" && (
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 px-6 py-2.5 border-b border-border/50">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
              {getDynamicBanner().icon}
              <span>{getDynamicBanner().text}</span>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex-1">
            {step !== "phone" && step !== "otp" && (
              <div className="flex items-center gap-2">
                <span className="text-base text-foreground">
                  Hi <span className="font-semibold">{displayedName}</span>
                  <span className={displayedName === userName ? "" : "opacity-0"}>👋</span>
                  <span className="text-sm text-muted-foreground ml-1">ready to complete your order?</span>
                </span>
              </div>
            )}
            {(step === "phone" || step === "otp") && (
              <div className="flex gap-2">
                <div className={`w-2 h-2 rounded-full ${step === "phone" || step === "otp" ? "bg-primary" : "bg-muted"}`} />
                <div className={`w-2 h-2 rounded-full ${step === "phone" || step === "otp" ? "bg-primary" : "bg-muted"}`} />
                <div className={`w-2 h-2 rounded-full bg-muted`} />
                <div className={`w-2 h-2 rounded-full bg-muted`} />
                <div className={`w-2 h-2 rounded-full bg-muted`} />
              </div>
            )}
          </div>
          
          {/* Circular Progress Indicator */}
          {step !== "phone" && step !== "otp" && (
            <div className="relative w-12 h-12 mr-4">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="hsl(var(--muted))"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - getProgressPercentage() / 100)}`}
                  className="transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              {getProgressPercentage() === 100 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary animate-pulse" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-full max-w-xs">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-medium text-foreground">Processing your order…</p>
                <p className="text-sm text-muted-foreground">
                  {processingProgress < 100 ? "2 seconds to completion" : "Almost done!"}
                </p>
              </div>
            </div>
          ) : (
            renderStep()
          )}
        </div>
        
        {/* Powered by Flowcart Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
            <span className="text-sm font-medium text-muted-foreground">
              Powered by Flowcart
            </span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
