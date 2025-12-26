import { useMemo, useState } from "react";
import { Check, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeliveryAddress, ShippingMethod } from "@/data/gptCommerceData";

export type AddressShippingMode = "existing" | "new";

interface AddressShippingSelectorProps {
  mode: AddressShippingMode;
  addresses?: DeliveryAddress[];
  selectedAddressId: string | null;
  onSelectAddressId: (id: string) => void;
  shippingMethods: ShippingMethod[];
  selectedShippingId: string | null;
  onSelectShippingId: (id: string) => void;
  onSubmitNewAddress: (address: Omit<DeliveryAddress, "id">) => void;
  onConfirm: () => void;
}

export const AddressShippingSelector = ({
  mode,
  addresses = [],
  selectedAddressId,
  onSelectAddressId,
  shippingMethods,
  selectedShippingId,
  onSelectShippingId,
  onSubmitNewAddress,
  onConfirm,
}: AddressShippingSelectorProps) => {
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const [newAddress, setNewAddress] = useState({
    recipientName: "",
    phone: "",
    province: "",
    city: "",
    addressLine: "",
    postalCode: "",
  });

  const canConfirm = Boolean(selectedShippingId) && (mode === "existing" ? Boolean(selectedAddressId) : true);

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
        className="px-4 py-3 flex items-center gap-2"
        style={{
          background: "hsl(var(--primary) / 0.05)",
          borderBottom: "1px solid hsl(0 0% 0% / 0.05)",
        }}
      >
        <MapPin className="w-5 h-5 text-primary" />
        <span className="font-medium text-sm">آدرس و نحوه ارسال را انتخاب کنید</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Address */}
        {mode === "existing" ? (
          <div className="space-y-3">
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
                        پیشفرض
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{address.fullAddress}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{address.recipientName}</span>
                    <span>•</span>
                    <span dir="ltr">{address.phone}</span>
                  </div>
                </div>
              </button>
            ))}

            {selectedAddress && (
              <div
                className="rounded-xl p-3"
                style={{ background: "hsl(0 0% 98%)", border: "1px solid hsl(0 0% 0% / 0.06)" }}
              >
                <p className="text-xs text-muted-foreground">ارسال به:</p>
                <p className="text-sm font-medium mt-1">{selectedAddress.title}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>نام و نام خانوادگی</Label>
                <Input
                  value={newAddress.recipientName}
                  onChange={(e) => setNewAddress((p) => ({ ...p, recipientName: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-1">
                <Label>شماره موبایل</Label>
                <Input
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress((p) => ({ ...p, phone: e.target.value }))}
                  className="h-11"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>استان</Label>
                <Input
                  value={newAddress.province}
                  onChange={(e) => setNewAddress((p) => ({ ...p, province: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-1">
                <Label>شهر</Label>
                <Input
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>آدرس</Label>
              <Input
                value={newAddress.addressLine}
                onChange={(e) => setNewAddress((p) => ({ ...p, addressLine: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-1">
              <Label>کد پستی</Label>
              <Input
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress((p) => ({ ...p, postalCode: e.target.value }))}
                className="h-11"
                dir="ltr"
              />
            </div>

            <Button
              className="w-full h-11 rounded-xl"
              disabled={
                !newAddress.recipientName ||
                !newAddress.phone ||
                !newAddress.province ||
                !newAddress.city ||
                !newAddress.addressLine ||
                !newAddress.postalCode
              }
              onClick={() => {
                onSubmitNewAddress({
                  title: "آدرس جدید",
                  fullAddress: `${newAddress.province}، ${newAddress.city}، ${newAddress.addressLine}، کد پستی ${newAddress.postalCode}`,
                  recipientName: newAddress.recipientName,
                  phone: newAddress.phone,
                  isDefault: true,
                });
              }}
            >
              ثبت آدرس
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="h-px" style={{ background: "hsl(0 0% 0% / 0.06)" }} />

        {/* Shipping */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">نحوه ارسال</span>
          </div>

          <div className="space-y-2">
            {shippingMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectShippingId(m.id)}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-200 ${
                  selectedShippingId === m.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                }`}
                style={{
                  background: selectedShippingId === m.id ? "hsl(var(--primary) / 0.05)" : "hsl(0 0% 98%)",
                  border: "1px solid hsl(0 0% 0% / 0.08)",
                }}
              >
                <div className="text-right">
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{m.priceLabel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.etaLabel}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button className="w-full h-11 rounded-xl" disabled={!canConfirm} onClick={onConfirm}>
          <Check className="w-4 h-4 ml-2" />
          تأیید آدرس و نحوه ارسال
        </Button>
      </div>
    </div>
  );
};
