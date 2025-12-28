import { useMemo, useState } from "react";
import { Check, MapPin, Truck, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeliveryAddress, Merchant, toPersianNumber } from "@/data/gptCommerceData";

export type AddressShippingMode = "existing" | "new";

export interface MerchantShippingMethod {
  id: string;
  label: string;
  deliveryWindow: string;
  priceLabel: string;
  isDefault?: boolean;
}

export interface MerchantShipping {
  merchant: Merchant;
  methods: MerchantShippingMethod[];
}

interface AddressShippingSelectorProps {
  mode: AddressShippingMode;
  addresses?: DeliveryAddress[];
  selectedAddressId: string | null;
  onSelectAddressId: (id: string) => void;
  merchantShipping: MerchantShipping[];
  selectedShippingByMerchant: Record<string, string>;
  onSelectShipping: (merchantId: string, shippingId: string) => void;
  onSubmitNewAddress: (address: Omit<DeliveryAddress, "id">) => void;
  onAddNewAddress: (address: Omit<DeliveryAddress, "id">) => void;
  onConfirm: () => void;
}

export const AddressShippingSelector = ({
  mode,
  addresses = [],
  selectedAddressId,
  onSelectAddressId,
  merchantShipping,
  selectedShippingByMerchant,
  onSelectShipping,
  onSubmitNewAddress,
  onAddNewAddress,
  onConfirm,
}: AddressShippingSelectorProps) => {
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const [showAddForm, setShowAddForm] = useState(mode === "new" && addresses.length === 0);
  const [newAddress, setNewAddress] = useState({
    title: "",
    province: "",
    city: "",
    addressLine: "",
    postalCode: "",
  });
  
  // Track expanded state for each merchant (collapsed by default)
  const [expandedMerchants, setExpandedMerchants] = useState<Record<string, boolean>>({});

  // All merchants must have a shipping method selected
  const allShippingSelected = merchantShipping.every(
    (ms) => selectedShippingByMerchant[ms.merchant.id]
  );
  const canConfirm = Boolean(selectedAddressId) && allShippingSelected;

  const handleSubmitNewAddress = () => {
    if (!newAddress.title || !newAddress.province || !newAddress.city || !newAddress.addressLine || !newAddress.postalCode) {
      return;
    }
    const fullAddress = `${newAddress.province}، ${newAddress.city}، ${newAddress.addressLine}، کد پستی: ${newAddress.postalCode}`;
    onAddNewAddress({
      title: newAddress.title,
      fullAddress,
      recipientName: "",
      phone: "",
      isDefault: addresses.length === 0,
    });
    setNewAddress({ title: "", province: "", city: "", addressLine: "", postalCode: "" });
    setShowAddForm(false);
  };

  const toggleMerchant = (merchantId: string) => {
    setExpandedMerchants(prev => ({ ...prev, [merchantId]: !prev[merchantId] }));
  };

  const isNewAddressValid = newAddress.title && newAddress.province && newAddress.city && newAddress.addressLine && newAddress.postalCode;

  return (
    <div
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        background: "hsl(0 0% 100%)",
        border: "1px solid hsl(0 0% 0% / 0.08)",
      }}
      dir="rtl"
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: "hsl(var(--primary) / 0.05)",
          borderBottom: "1px solid hsl(0 0% 0% / 0.05)",
        }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">آدرس و نحوه ارسال</span>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن آدرس جدید
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Add New Address Form */}
        {showAddForm && (
          <div 
            className="rounded-xl p-4 space-y-3 animate-fade-in"
            style={{ 
              background: "hsl(var(--primary) / 0.03)",
              border: "1px solid hsl(var(--primary) / 0.1)"
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">آدرس جدید</span>
              {addresses.length > 0 && (
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  انصراف
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">عنوان آدرس *</Label>
              <Input
                value={newAddress.title}
                onChange={(e) => setNewAddress((p) => ({ ...p, title: e.target.value }))}
                placeholder="مثال: خانه، محل کار"
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">استان / شهر *</Label>
                <Input
                  value={newAddress.province}
                  onChange={(e) => setNewAddress((p) => ({ ...p, province: e.target.value }))}
                  placeholder="تهران"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">شهر / منطقه *</Label>
                <Input
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                  placeholder="منطقه ۳"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">آدرس دقیق *</Label>
              <Input
                value={newAddress.addressLine}
                onChange={(e) => setNewAddress((p) => ({ ...p, addressLine: e.target.value }))}
                placeholder="خیابان، کوچه، پلاک، واحد"
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">کد پستی *</Label>
              <Input
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress((p) => ({ ...p, postalCode: e.target.value }))}
                placeholder="۱۲۳۴۵۶۷۸۹۰"
                className="h-10 text-sm"
                dir="ltr"
              />
            </div>

            <Button
              className="w-full h-10 rounded-xl text-sm"
              disabled={!isNewAddressValid}
              onClick={handleSubmitNewAddress}
            >
              <Plus className="w-4 h-4 ml-2" />
              ثبت و انتخاب آدرس
            </Button>
          </div>
        )}

        {/* Existing Addresses */}
        {!showAddForm && addresses.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">آدرس تحویل</span>
            <div className="space-y-2">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  onClick={() => onSelectAddressId(address.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 text-right ${
                    selectedAddressId === address.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  style={{
                    background: selectedAddressId === address.id ? "hsl(var(--primary) / 0.05)" : "hsl(0 0% 98%)",
                    border: "1px solid hsl(0 0% 0% / 0.08)",
                  }}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                      selectedAddressId === address.id ? "" : "border-2"
                    }`}
                    style={{
                      background: selectedAddressId === address.id ? "hsl(var(--primary))" : "transparent",
                      borderColor: selectedAddressId === address.id ? "transparent" : "hsl(0 0% 70%)",
                    }}
                  >
                    {selectedAddressId === address.id && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{address.title}</h4>
                      {address.isDefault && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "hsl(var(--primary) / 0.1)",
                            color: "hsl(var(--primary))",
                          }}
                        >
                          پیشفرض
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{address.fullAddress}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No addresses and form not shown - show prompt */}
        {!showAddForm && addresses.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">هنوز آدرسی ثبت نکردی</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 ml-2" />
              افزودن آدرس جدید
            </Button>
          </div>
        )}

        {/* Divider */}
        {selectedAddressId && merchantShipping.length > 0 && (
          <div className="h-px" style={{ background: "hsl(0 0% 0% / 0.06)" }} />
        )}

        {/* Per-Merchant Shipping Selection - Expandable */}
        {selectedAddressId && merchantShipping.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">نحوه ارسال برای هر فروشگاه</span>
            </div>

            {merchantShipping.map((ms) => {
              const selectedMethodId = selectedShippingByMerchant[ms.merchant.id];
              const selectedMethod = ms.methods.find(m => m.id === selectedMethodId);
              const defaultMethod = ms.methods.find(m => m.isDefault) || ms.methods[0];
              const isExpanded = expandedMerchants[ms.merchant.id] ?? false;
              const displayMethod = selectedMethod || defaultMethod;
              
              return (
                <div 
                  key={ms.merchant.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "hsl(0 0% 99%)",
                    border: "1px solid hsl(0 0% 0% / 0.06)",
                  }}
                >
                  {/* Merchant Header - Clickable to expand */}
                  <button 
                    onClick={() => toggleMerchant(ms.merchant.id)}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-right transition-colors hover:bg-muted/30"
                    style={{ 
                      background: "hsl(0 0% 0% / 0.02)",
                      borderBottom: isExpanded ? "1px solid hsl(0 0% 0% / 0.04)" : "none"
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ms.merchant.logo}</span>
                      <span className="font-medium text-sm">{ms.merchant.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Show selected/default shipping summary WITH PRICE when collapsed */}
                      {!isExpanded && displayMethod && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">{displayMethod.label}</span>
                          <span className="text-muted-foreground">—</span>
                          <span className="text-muted-foreground">{displayMethod.deliveryWindow}</span>
                          <span className="text-muted-foreground">—</span>
                          <span className={displayMethod.priceLabel === 'رایگان' ? 'text-green-600 font-medium' : 'font-medium text-foreground'}>
                            {displayMethod.priceLabel}
                          </span>
                          {displayMethod.isDefault && !selectedMethod && (
                            <span 
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium mr-1"
                              style={{ 
                                background: "hsl(var(--primary) / 0.1)", 
                                color: "hsl(var(--primary))" 
                              }}
                            >
                              پیش‌فرض
                            </span>
                          )}
                          {selectedMethod && (
                            <Check className="w-3.5 h-3.5 text-green-600 mr-1" />
                          )}
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Shipping Methods - Expandable with smooth animation */}
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{
                      maxHeight: isExpanded ? '500px' : '0px',
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div className="p-2 space-y-1.5">
                      {ms.methods.map((method) => {
                        const isSelected = selectedMethodId === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => {
                              onSelectShipping(ms.merchant.id, method.id);
                              // Auto-collapse after selection
                              setTimeout(() => setExpandedMerchants(prev => ({ ...prev, [ms.merchant.id]: false })), 150);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-right ${
                              isSelected ? "ring-1 ring-primary" : "hover:bg-muted/30"
                            }`}
                            style={{
                              background: isSelected ? "hsl(var(--primary) / 0.05)" : "transparent",
                            }}
                          >
                            <div
                              className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                                isSelected ? "" : "border-[1.5px]"
                              }`}
                              style={{
                                background: isSelected ? "hsl(var(--primary))" : "transparent",
                                borderColor: isSelected ? "transparent" : "hsl(0 0% 65%)",
                              }}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                            </div>
                            
                            {/* Shipping info in exact format: Method — Delivery — Price */}
                            <div className="flex-1 text-xs">
                              <span className="font-medium">{method.label}</span>
                              <span className="text-muted-foreground mx-1.5">—</span>
                              <span className="text-muted-foreground">{method.deliveryWindow}</span>
                              <span className="text-muted-foreground mx-1.5">—</span>
                              <span className={method.priceLabel === 'رایگان' ? 'text-green-600 font-medium' : 'font-medium'}>
                                {method.priceLabel}
                              </span>
                              {method.isDefault && (
                                <>
                                  <span className="text-muted-foreground mx-1.5">|</span>
                                  <span 
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{ 
                                      background: "hsl(var(--primary) / 0.1)", 
                                      color: "hsl(var(--primary))" 
                                    }}
                                  >
                                    پیش‌فرض
                                  </span>
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button className="w-full h-11 rounded-xl" disabled={!canConfirm} onClick={onConfirm}>
          <Check className="w-4 h-4 ml-2" />
          تأیید آدرس و نحوه ارسال
        </Button>
      </div>
    </div>
  );
};
