import { useState, useRef, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPersianNumber } from "@/features/shift/data/shiftData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Persian digits
const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

// Convert any digit (Persian or Latin) to Latin for internal storage
const toLatinDigits = (str: string): string => {
  return str.replace(/[۰-۹]/g, d => String(persianDigits.indexOf(d)));
};

// Convert phone number to Persian digits for display
const toPersianPhone = (phone: string): string => {
  return phone.split('').map(char => {
    const digit = parseInt(char);
    if (!isNaN(digit)) {
      return toPersianNumber(digit);
    }
    return char;
  }).join('');
};

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (isNewUser: boolean) => void;
}

type Step = 'phone' | 'otp' | 'name';

export const OTPModal = ({ isOpen, onClose, onVerified }: OTPModalProps) => {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [pendingIsNewUser, setPendingIsNewUser] = useState(false);
  const { setSessionFromOTP, setIsNewUser, updateProfileName } = useAuth();
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setPhone('');
      setOtp(['', '', '', '', '', '']);
      setFullName('');
      setError('');
      setCountdown(0);
      setPendingIsNewUser(false);
    }
  }, [isOpen]);

  const handlePhoneSubmit = async () => {
    if (phone.length < 10) {
      setError('شماره موبایل معتبر نیست');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });
      
      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }
      
      setStep('otp');
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('خطا در ارسال کد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    if (newOtp.every(d => d !== '') && index === 5) {
      handleOtpVerify(newOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = async (otpDigits: string[] = otp) => {
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('کد تأیید باید ۶ رقم باشد');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-otp', {
        body: { phone, code: otpCode },
      });
      
      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }
      
      // Set session in Supabase client
      if (data?.session) {
        await setSessionFromOTP(data.session);
      }
      
      const newUser = data?.isNewUser ?? false;
      const needsName = data?.needsName ?? false;
      setIsNewUser(newUser);
      
      // Show name step if truly new user OR if existing user has no name set
      if (newUser || needsName) {
        // pendingIsNewUser tracks whether this is a *truly* new auth account
        // (used later to decide address form mode)
        setPendingIsNewUser(!needsName || newUser);
        setStep('name');
      } else {
        onVerified(false);
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('خطا در تأیید کد. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async (skipName = false) => {
    setIsLoading(true);
    try {
      if (!skipName && fullName.trim()) {
        await updateProfileName(fullName.trim());
      }
      onVerified(pendingIsNewUser);
    } catch (err) {
      console.error('Update name error:', err);
      // Still complete the flow even if name update fails
      onVerified(pendingIsNewUser);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      await supabase.functions.invoke('send-otp', {
        body: { phone },
      });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('خطا در ارسال مجدد کد');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(0 0% 100%)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          border: '1px solid hsl(0 0% 0% / 0.08)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid hsl(0 0% 0% / 0.06)' }}
        >
          <h2 className="text-lg font-semibold text-foreground">
            {step === 'phone' && 'تأیید شماره موبایل'}
            {step === 'otp' && 'کد تأیید'}
            {step === 'name' && 'خوش اومدی! 🎉'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* ── Step: Phone ─────────────────────────────── */}
          {step === 'phone' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                برای ادامه ثبت سفارش، شماره موبایل خود را وارد کنید
              </p>
              
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      const normalized = toLatinDigits(e.target.value).replace(/\D/g, '');
                      if (normalized.length <= 11) {
                        setPhone(normalized);
                        setError('');
                      }
                    }}
                    className="w-full h-12 bg-transparent border rounded-md text-center text-lg tracking-wider text-transparent caret-foreground"
                    style={{
                      direction: 'ltr',
                      borderColor: error ? 'hsl(0 84% 60%)' : 'hsl(0 0% 0% / 0.12)'
                    }}
                    maxLength={11}
                    placeholder=""
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-lg tracking-wider pointer-events-none">
                    {phone ? toPersianPhone(phone) : <span className="text-muted-foreground/50">۰۹۱۲۳۴۵۶۷۸۹</span>}
                  </span>
                </div>
                {error && (
                  <p className="text-xs text-destructive text-center">{error}</p>
                )}
              </div>
              
              <Button
                onClick={handlePhoneSubmit}
                disabled={isLoading || phone.length < 10}
                className="w-full h-12 rounded-xl font-medium"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))',
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'ارسال کد تأیید'
                )}
              </Button>
            </div>
          )}

          {/* ── Step: OTP ───────────────────────────────── */}
          {step === 'otp' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                کد ۶ رقمی ارسال شده به {toPersianPhone(phone)} را وارد کنید
              </p>
              
              <div className="flex justify-center gap-2" dir="ltr">
                {otp.map((digit, index) => (
                  <div key={index} className="relative">
                    <input
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        const normalized = toLatinDigits(val).replace(/\D/g, '');
                        handleOtpChange(index, normalized);
                      }}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-semibold text-transparent caret-foreground bg-transparent rounded-md"
                      style={{
                        border: error ? '1px solid hsl(0 84% 60%)' : '1px solid hsl(0 0% 0% / 0.12)'
                      }}
                      maxLength={1}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold pointer-events-none">
                      {digit ? toPersianNumber(parseInt(digit)) : ''}
                    </span>
                  </div>
                ))}
              </div>
              
              {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}
              
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    ارسال مجدد کد تا {toPersianNumber(countdown)} ثانیه دیگر
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-sm text-primary hover:underline"
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </div>
              
              <Button
                onClick={() => handleOtpVerify()}
                disabled={isLoading || otp.some(d => d === '')}
                className="w-full h-12 rounded-xl font-medium"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))',
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'تأیید و ادامه'
                )}
              </Button>
              
              <button
                onClick={() => setStep('phone')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                تغییر شماره موبایل
              </button>
            </div>
          )}

          {/* ── Step: Name (new users only) ─────────────── */}
          {step === 'name' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  اسمت رو وارد کن تا بهتر بشناسمت
                </p>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && fullName.trim()) handleNameSubmit();
                  }}
                  className="w-full h-12 bg-transparent border rounded-md text-center text-base"
                  style={{ borderColor: 'hsl(0 0% 0% / 0.12)' }}
                  placeholder="مثلاً: پوریا رضایی"
                  autoFocus
                  dir="rtl"
                />
              </div>
              
              <Button
                onClick={() => handleNameSubmit(false)}
                disabled={isLoading || !fullName.trim()}
                className="w-full h-12 rounded-xl font-medium"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))',
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'ذخیره و ورود به فروشگاه شیفت'
                )}
              </Button>
              
              <button
                onClick={() => handleNameSubmit(true)}
                disabled={isLoading}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                بعداً تکمیل می‌کنم
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
