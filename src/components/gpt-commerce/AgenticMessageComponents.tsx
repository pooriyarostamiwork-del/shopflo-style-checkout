import { Check, MapPin, CreditCard, Package, FileText, Pencil, Lock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  QuickReply, 
  OrderSummary, 
  DeliveryAddress, 
  PaymentOption,
  formatPersianPrice,
  toPersianNumber,
} from "@/data/gptCommerceData";

// Quick Reply Buttons Component
interface QuickReplyButtonsProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
}

export const QuickReplyButtons = ({ replies, onSelect }: QuickReplyButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {replies.map((reply) => (
        <button
          key={reply.id}
          onClick={() => onSelect(reply)}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
          style={{
            background: 'hsl(0 0% 100%)',
            border: '1px solid hsl(0 0% 0% / 0.1)',
            color: 'hsl(var(--foreground))',
          }}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
};

// CTA Button Component
interface CTAButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export const CTAButton = ({ label, onClick, disabled, disabledReason }: CTAButtonProps) => {
  return (
    <div className="mt-4">
      <Button
        onClick={onClick}
        disabled={disabled}
        className="w-full h-12 rounded-xl text-sm font-medium transition-all duration-300"
        style={{
          background: disabled 
            ? 'hsl(0 0% 90%)' 
            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))',
          boxShadow: disabled ? 'none' : '0 4px 20px hsl(var(--primary) / 0.3)',
        }}
      >
        {disabled ? (
          <Lock className="w-4 h-4 ml-2" />
        ) : (
          <ChevronLeft className="w-4 h-4 ml-2" />
        )}
        {label}
      </Button>
      {disabled && disabledReason && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {disabledReason}
        </p>
      )}
    </div>
  );
};

// Cart Summary Card Component
interface CartSummaryCardProps {
  orderSummary: OrderSummary;
}

export const CartSummaryCard = ({ orderSummary }: CartSummaryCardProps) => {
  return (
    <div 
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        background: 'hsl(0 0% 100%)',
        border: '1px solid hsl(0 0% 0% / 0.08)',
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center gap-2"
        style={{ 
          background: 'hsl(var(--primary) / 0.05)',
          borderBottom: '1px solid hsl(0 0% 0% / 0.05)'
        }}
      >
        <Package className="w-5 h-5 text-primary" />
        <span className="font-medium text-sm">خلاصه سفارش</span>
        <span className="text-xs text-muted-foreground mr-auto">
          {toPersianNumber(orderSummary.totalItems)} کالا
        </span>
      </div>

      {/* Vendor Summaries */}
      <div className="divide-y" style={{ borderColor: 'hsl(0 0% 0% / 0.05)' }}>
        {orderSummary.vendorSummaries.map((vendor) => (
          <div key={vendor.merchant.id} className="p-4">
            {/* Vendor Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{vendor.merchant.logo}</span>
              <span className="font-medium text-sm">{vendor.merchant.name}</span>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-3">
              {vendor.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {toPersianNumber(item.quantity)} عدد
                    </p>
                  </div>
                  <span className="text-xs font-medium">
                    {formatPersianPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Vendor Totals */}
            <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'hsl(0 0% 0% / 0.05)' }}>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">جمع کالاها</span>
                <span>{formatPersianPrice(vendor.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">هزینه ارسال</span>
                <span className={vendor.deliveryFee === 0 ? 'text-green-600' : ''}>
                  {vendor.deliveryFee === 0 ? 'رایگان' : formatPersianPrice(vendor.deliveryFee)}
                </span>
              </div>
              {vendor.discount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">تخفیف</span>
                  <span className="text-red-500">-{formatPersianPrice(vendor.discount)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grand Total */}
      <div 
        className="px-4 py-3 flex justify-between items-center"
        style={{ background: 'hsl(var(--primary) / 0.05)' }}
      >
        <span className="font-medium">مجموع پرداختی</span>
        <span className="text-lg font-bold text-primary">
          {formatPersianPrice(orderSummary.grandTotal)}
        </span>
      </div>
    </div>
  );
};

// Address Confirmation Component
interface AddressConfirmationProps {
  address: DeliveryAddress;
  onConfirm: () => void;
  onEdit: () => void;
}

export const AddressConfirmation = ({ address, onConfirm, onEdit }: AddressConfirmationProps) => {
  return (
    <div 
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        background: 'hsl(0 0% 100%)',
        border: '1px solid hsl(0 0% 0% / 0.08)',
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center gap-2"
        style={{ 
          background: 'hsl(var(--primary) / 0.05)',
          borderBottom: '1px solid hsl(0 0% 0% / 0.05)'
        }}
      >
        <MapPin className="w-5 h-5 text-primary" />
        <span className="font-medium text-sm">آدرس تحویل</span>
        {address.isDefault && (
          <span 
            className="text-xs px-2 py-0.5 rounded-full mr-auto"
            style={{ 
              background: 'hsl(var(--primary) / 0.1)',
              color: 'hsl(var(--primary))'
            }}
          >
            پیش‌فرض
          </span>
        )}
      </div>

      {/* Address Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">{address.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {address.fullAddress}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{address.recipientName}</span>
              <span>•</span>
              <span dir="ltr">{address.phone}</span>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg transition-colors hover:bg-muted/50"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="px-4 pb-4">
        <Button
          onClick={onConfirm}
          className="w-full h-10 rounded-xl text-sm"
        >
          <Check className="w-4 h-4 ml-2" />
          تأیید آدرس
        </Button>
      </div>
    </div>
  );
};

// Payment Selector Component
interface PaymentSelectorProps {
  options: PaymentOption[];
  selectedPayment: string | null;
  onSelect: (paymentId: string) => void;
}

export const PaymentSelector = ({ options, selectedPayment, onSelect }: PaymentSelectorProps) => {
  return (
    <div 
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        background: 'hsl(0 0% 100%)',
        border: '1px solid hsl(0 0% 0% / 0.08)',
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center gap-2"
        style={{ 
          background: 'hsl(var(--primary) / 0.05)',
          borderBottom: '1px solid hsl(0 0% 0% / 0.05)'
        }}
      >
        <CreditCard className="w-5 h-5 text-primary" />
        <span className="font-medium text-sm">روش پرداخت</span>
      </div>

      {/* Payment Options */}
      <div className="p-4 space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => option.available && onSelect(option.id)}
            disabled={!option.available}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              !option.available 
                ? 'opacity-50 cursor-not-allowed' 
                : selectedPayment === option.id
                  ? 'ring-2 ring-primary'
                  : 'hover:bg-muted/50'
            }`}
            style={{
              background: selectedPayment === option.id 
                ? 'hsl(var(--primary) / 0.05)' 
                : 'hsl(0 0% 98%)',
              border: '1px solid hsl(0 0% 0% / 0.08)',
            }}
          >
            <span className="text-xl">{option.icon}</span>
            <span className="flex-1 text-sm font-medium text-right">{option.label}</span>
            {!option.available && option.tooltip && (
              <span className="text-xs text-muted-foreground">{option.tooltip}</span>
            )}
            {selectedPayment === option.id && (
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(var(--primary))' }}
              >
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Post Purchase Actions Component
interface PostPurchaseActionsProps {
  orderId: string;
  onTrackOrder: () => void;
  onModifyAddress: () => void;
  onViewInvoice: () => void;
}

export const PostPurchaseActions = ({ orderId, onTrackOrder, onModifyAddress, onViewInvoice }: PostPurchaseActionsProps) => {
  return (
    <div 
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsl(142 70% 45% / 0.1), hsl(142 70% 45% / 0.05))',
        border: '1px solid hsl(142 70% 45% / 0.2)',
      }}
    >
      {/* Success Header */}
      <div className="p-4 text-center">
        <div 
          className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
          style={{ background: 'hsl(142 70% 45%)' }}
        >
          <Check className="w-6 h-6 text-white" />
        </div>
        <h4 className="font-bold text-lg mb-1">سفارش ثبت شد! 🎉</h4>
        <p className="text-sm text-muted-foreground">
          شماره سفارش: <span className="font-medium text-foreground">{orderId}</span>
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 pt-0 flex flex-wrap gap-2 justify-center">
        <button
          onClick={onTrackOrder}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'hsl(0 0% 100%)',
            border: '1px solid hsl(0 0% 0% / 0.08)',
          }}
        >
          <Package className="w-4 h-4" />
          پیگیری سفارش
        </button>
        <button
          onClick={onModifyAddress}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'hsl(0 0% 100%)',
            border: '1px solid hsl(0 0% 0% / 0.08)',
          }}
        >
          <Pencil className="w-4 h-4" />
          ویرایش آدرس
        </button>
        <button
          onClick={onViewInvoice}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'hsl(0 0% 100%)',
            border: '1px solid hsl(0 0% 0% / 0.08)',
          }}
        >
          <FileText className="w-4 h-4" />
          مشاهده فاکتور
        </button>
      </div>
    </div>
  );
};