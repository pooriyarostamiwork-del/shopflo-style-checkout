import { useState } from "react";
import { Plus, Check, MapPin, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useLanguage, toPersianNumber, formatCurrency } from "@/i18n";

export interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressSelectorLocalizedProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddAddress: (address: Address) => void;
  onEditAddress: (address: Address) => void;
  onSetDefault: (id: string) => void;
}

export const AddressSelectorLocalized = ({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddAddress,
  onEditAddress,
  onSetDefault
}: AddressSelectorLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false
  });

  const handleSaveAddress = () => {
    if (editingAddress) {
      onEditAddress({ ...editingAddress, ...formData } as Address);
      setEditingAddress(null);
    } else {
      const newAddress: Address = {
        id: Date.now().toString(),
        ...formData as Omit<Address, 'id'>
      };
      onAddAddress(newAddress);
      setIsAddingNew(false);
    }
    setFormData({
      name: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false
    });
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setIsAddingNew(true);
  };

  const formatPhone = (phone: string) => {
    if (isRTL) {
      return toPersianNumber(phone);
    }
    return phone;
  };

  const AddressForm = () => (
    <div className={`space-y-4 mt-4 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`grid grid-cols-2 gap-4 ${isRTL ? 'direction-rtl' : ''}`}>
        <div>
          <Label htmlFor="name">{t.checkout.address.name}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={isRTL ? "نام و نام خانوادگی" : "John Doe"}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
        <div>
          <Label htmlFor="phone">{t.checkout.address.phone}</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder={isRTL ? "۰۹۱۲۳۴۵۶۷۸۹" : "98765 43210"}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="line1">{t.checkout.address.street}</Label>
        <Input
          id="line1"
          value={formData.line1}
          onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
          placeholder={isRTL ? "خیابان، پلاک، واحد" : "House No., Building Name"}
          className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      <div>
        <Label htmlFor="line2">{isRTL ? "آدرس تکمیلی" : "Address Line 2"}</Label>
        <Input
          id="line2"
          value={formData.line2}
          onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
          placeholder={isRTL ? "محله، منطقه" : "Road, Area, Locality"}
          className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      <div className={`grid grid-cols-3 gap-4 ${isRTL ? 'direction-rtl' : ''}`}>
        <div>
          <Label htmlFor="city">{t.checkout.address.city}</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder={isRTL ? "تهران" : "Bangalore"}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
        <div>
          <Label htmlFor="state">{t.checkout.address.state}</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder={isRTL ? "تهران" : "Karnataka"}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
        <div>
          <Label htmlFor="pincode">{t.checkout.address.pincode}</Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            placeholder={isRTL ? "۱۲۳۴۵۶۷۸۹۰" : "560034"}
            maxLength={10}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir="ltr"
          />
        </div>
      </div>

      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <input
          type="checkbox"
          id="default"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
        />
        <Label htmlFor="default" className="font-normal">{t.checkout.address.setDefault}</Label>
      </div>

      <div className={`flex gap-2 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setIsAddingNew(false);
            setEditingAddress(null);
            setFormData({
              name: "",
              phone: "",
              line1: "",
              line2: "",
              city: "",
              state: "",
              pincode: "",
              isDefault: false
            });
          }}
        >
          {t.common.cancel}
        </Button>
        <Button
          className="flex-1"
          onClick={handleSaveAddress}
          disabled={!formData.name || !formData.phone || !formData.line1 || !formData.city || !formData.state || !formData.pincode}
        >
          {t.checkout.address.save}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`space-y-3 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Label className="text-base font-semibold">{t.checkout.address.title}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className={`text-primary ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
          {t.checkout.address.addNew}
        </Button>
      </div>

      {isAddingNew && <AddressForm />}

      <div className="space-y-2">
        {addresses.map((address) => {
          const isSelected = selectedAddress?.id === address.id;
          
          return (
            <div
              key={address.id}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
              `}
              onClick={() => onSelectAddress(address)}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-start gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`
                    mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'border-primary bg-primary' : 'border-border'}
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <p className="font-semibold text-foreground">{address.name}</p>
                      {address.isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent-foreground rounded-full">
                          {t.checkout.address.default}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1" dir="ltr">
                      {isRTL ? toPersianNumber(address.phone) : `+91 ${address.phone}`}
                    </p>
                    
                    {isSelected && (
                      <div className={`text-sm text-muted-foreground mt-2 ${isRTL ? 'text-right' : ''}`}>
                        <p>{address.line1}</p>
                        <p>{address.line2}</p>
                        <p>
                          {address.city}، {address.state} - {isRTL ? toPersianNumber(address.pincode) : address.pincode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex gap-1 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(address);
                    }}
                    className="p-1.5 hover:bg-muted rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDefault(address.id);
                      }}
                      className="p-1.5 hover:bg-muted rounded text-xs text-muted-foreground"
                      title={t.checkout.address.setDefault}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
