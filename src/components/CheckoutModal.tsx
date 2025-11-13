import { useState, useEffect } from "react";
import { X, CreditCard, Smartphone, Banknote, ChevronRight, Phone, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onSuccess: () => void;
}

type CheckoutStep = "phone" | "otp" | "address" | "payment" | "review";
type PaymentMethod = "upi" | "card" | "cod";

export const CheckoutModal = ({ isOpen, onClose, total, onSuccess }: CheckoutModalProps) => {
  const [step, setStep] = useState<CheckoutStep>("phone");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveDetails, setSaveDetails] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [userName] = useState("Alex");
  const [displayedName, setDisplayedName] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

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
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Delivery Address</h2>
            
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">Rahul Kumar</p>
                  <p className="text-sm text-muted-foreground">+91 98765 43210</p>
                </div>
                <button className="text-primary text-sm font-medium hover:underline">
                  Change
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                123, MG Road, Koramangala<br />
                Bangalore, Karnataka - 560034
              </p>
            </div>

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
                      <span className="text-secondary font-semibold">FREE</span>
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
              onClick={() => setStep("payment")}
            >
              Continue to Payment <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setStep("address")}
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
              onClick={() => setStep("review")}
            >
              Review Order <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setStep("payment")}
                className="text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <h2 className="text-2xl font-bold text-foreground">Review Order</h2>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Delivering to</p>
                <p className="font-medium">Rahul Kumar, +91 98765 43210</p>
                <p className="text-sm text-muted-foreground">123, MG Road, Koramangala, Bangalore - 560034</p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium capitalize">{paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod.toUpperCase()}</p>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="text-xl font-bold text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

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
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-background rounded-2xl shadow-soft w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
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
      </div>
    </div>
  );
};
