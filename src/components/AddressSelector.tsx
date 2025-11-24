import { useState } from "react";
import { Plus, Check, MapPin, Edit2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

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

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddAddress: (address: Address) => void;
  onEditAddress: (address: Address) => void;
  onSetDefault: (id: string) => void;
}

export const AddressSelector = ({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddAddress,
  onEditAddress,
  onSetDefault
}: AddressSelectorProps) => {
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

  const AddressForm = () => (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            className="h-10 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="98765 43210"
            className="h-10 mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="line1">Address Line 1</Label>
        <Input
          id="line1"
          value={formData.line1}
          onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
          placeholder="House No., Building Name"
          className="h-10 mt-1"
        />
      </div>

      <div>
        <Label htmlFor="line2">Address Line 2</Label>
        <Input
          id="line2"
          value={formData.line2}
          onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
          placeholder="Road, Area, Locality"
          className="h-10 mt-1"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Bangalore"
            className="h-10 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="Karnataka"
            className="h-10 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            placeholder="560034"
            maxLength={6}
            className="h-10 mt-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="default"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
        />
        <Label htmlFor="default" className="font-normal">Set as default address</Label>
      </div>

      <div className="flex gap-2 pt-2">
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
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSaveAddress}
          disabled={!formData.name || !formData.phone || !formData.line1 || !formData.city || !formData.state || !formData.pincode}
        >
          Save Address
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Delivery Address</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="text-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add New
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
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`
                    mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'border-primary bg-primary' : 'border-border'}
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{address.name}</p>
                      {address.isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent-foreground rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">+91 {address.phone}</p>
                    
                    {isSelected && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <p>{address.line1}</p>
                        <p>{address.line2}</p>
                        <p>{address.city}, {address.state} - {address.pincode}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 ml-2">
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
                      title="Set as default"
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
