import { useState } from "react";
import { User, MapPin, Package, Heart, ChevronLeft, Edit3, Trash2, Plus, Phone, Mail, AlertTriangle, Truck, Tag, CreditCard, MessageSquare, ChevronRight } from "lucide-react";
import { DeliveryAddress, toPersianNumber, formatPersianPrice, mockOrders, Order, OrderStatus } from "@/data/gptCommerceData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountTab = 'profile' | 'addresses' | 'orders' | 'saved';

interface AccountPanelProps {
  onBack: () => void;
  addresses: DeliveryAddress[];
  onAddAddress: (address: Omit<DeliveryAddress, "id">) => void;
  onDeleteAddress: (addressId: string) => void;
  onUpdateAddress: (address: DeliveryAddress) => void;
  activeAddressIds?: string[];
  initialTab?: AccountTab;
  onStartNewChat?: () => void;
}

const userProfile = {
  name: 'علی محمدی',
  phone: '۰۹۱۲۳۴۵۶۷۸۹',
  email: 'ali@example.com',
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'processing': return 'در حال پردازش';
    case 'shipped': return 'ارسال شده';
    case 'delivered': return 'تحویل داده شده';
    case 'cancelled': return 'لغو شده';
    case 'returned': return 'مرجوع شده';
  }
};

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'processing': return 'bg-amber-50 text-amber-700 border border-amber-200/60';
    case 'shipped': return 'bg-blue-50 text-blue-700 border border-blue-200/60';
    case 'delivered': return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
    case 'cancelled': return 'bg-red-50 text-red-600 border border-red-200/60';
    case 'returned': return 'bg-purple-50 text-purple-700 border border-purple-200/60';
  }
};

// ===== ORDER DETAIL VIEW =====
const OrderDetailView = ({ order, onBack }: { order: Order; onBack: () => void }) => {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">جزئیات سفارش</h3>
          <p className="text-xs text-muted-foreground">{order.id}</p>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${getStatusStyle(order.status)}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      {/* Order Summary Card */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.06)' }}
      >
        <h4 className="text-xs font-semibold text-muted-foreground">خلاصه سفارش</h4>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">شماره سفارش</span>
            <span className="font-medium text-foreground">{order.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">تاریخ ثبت</span>
            <span className="text-foreground">{new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(order.date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              روش پرداخت
            </span>
            <span className="text-foreground">{order.paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Items by Merchant */}
      {order.merchantGroups.map((group, idx) => (
        <div
          key={group.merchant.id + idx}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.06)' }}
        >
          {/* Merchant Header */}
          <div
            className="px-4 py-3 flex items-center gap-2.5"
            style={{ background: 'hsl(0 0% 0% / 0.02)', borderBottom: '1px solid hsl(0 0% 0% / 0.04)' }}
          >
            <span className="text-base">{group.merchant.logo}</span>
            <span className="text-sm font-medium text-foreground">{group.merchant.name}</span>
            <span className="text-[10px] text-muted-foreground mr-auto">
              {toPersianNumber(group.items.length)} کالا
            </span>
          </div>

          {/* Items */}
          <div className="p-4 space-y-3">
            {group.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  style={{ border: '1px solid hsl(0 0% 0% / 0.04)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{toPersianNumber(item.quantity)} عدد</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-foreground font-medium">{formatPersianPrice(item.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping Info */}
          <div
            className="px-4 py-3 space-y-2"
            style={{ background: 'hsl(0 0% 0% / 0.015)', borderTop: '1px solid hsl(0 0% 0% / 0.04)' }}
          >
            <div className="flex items-center gap-2 text-xs">
              <Truck className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">نحوه ارسال:</span>
              <span className="text-foreground">{group.shippingMethod}</span>
            </div>
            {group.trackingNumber && (
              <div className="flex items-center gap-2 text-xs">
                <Package className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">کد رهگیری:</span>
                <span className="text-foreground font-medium" dir="ltr">{group.trackingNumber}</span>
              </div>
            )}
          </div>

          {/* Vendor Financial */}
          <div
            className="px-4 py-3 space-y-1.5"
            style={{ background: 'hsl(0 0% 0% / 0.02)', borderTop: '1px solid hsl(0 0% 0% / 0.04)' }}
          >
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">جمع کالاها</span>
              <span className="text-foreground">{formatPersianPrice(group.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Truck className="w-3 h-3" />
                هزینه ارسال
              </span>
              <span className={group.deliveryFee === 0 ? 'text-emerald-600 font-medium' : 'text-foreground'}>
                {group.deliveryFee === 0 ? 'رایگان' : formatPersianPrice(group.deliveryFee)}
              </span>
            </div>
            {group.discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  تخفیف
                </span>
                <span className="text-red-500 font-medium">-{formatPersianPrice(group.discount)}</span>
              </div>
            )}
            <div
              className="flex justify-between text-xs font-medium pt-1.5"
              style={{ borderTop: '1px solid hsl(0 0% 0% / 0.04)' }}
            >
              <span className="text-foreground">جمع فروشگاه</span>
              <span className="text-foreground">{formatPersianPrice(group.total)}</span>
            </div>
          </div>
        </div>
      ))}

      {/* Delivery Address Snapshot */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.06)' }}
      >
        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          آدرس تحویل
        </h4>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">{order.deliveryAddress.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{order.deliveryAddress.fullAddress}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span>{order.deliveryAddress.recipientName}</span>
            <span>{order.deliveryAddress.phone}</span>
          </div>
        </div>
      </div>

      {/* Grand Total Financial Breakdown */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.06)' }}
      >
        <h4 className="text-xs font-semibold text-muted-foreground">صورتحساب نهایی</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">جمع کل کالاها</span>
            <span className="text-foreground">{formatPersianPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">هزینه ارسال</span>
            <span className={order.totalShipping === 0 ? 'text-emerald-600 font-medium' : 'text-foreground'}>
              {order.totalShipping === 0 ? 'رایگان' : formatPersianPrice(order.totalShipping)}
            </span>
          </div>
          {order.totalDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">تخفیف</span>
              <span className="text-red-500 font-medium">-{formatPersianPrice(order.totalDiscount)}</span>
            </div>
          )}
          <div
            className="flex justify-between text-base font-semibold pt-2"
            style={{ borderTop: '1px solid hsl(0 0% 0% / 0.06)' }}
          >
            <span className="text-foreground">مبلغ پرداخت‌شده</span>
            <span className="text-foreground">{formatPersianPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AccountPanel = ({
  onBack,
  addresses,
  onAddAddress,
  onDeleteAddress,
  onUpdateAddress,
  activeAddressIds = [],
  initialTab = 'profile',
  onStartNewChat,
}: AccountPanelProps) => {
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState(userProfile);
  const [pendingProfileData, setPendingProfileData] = useState(userProfile);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [deleteWarningId, setDeleteWarningId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({ title: '', fullAddress: '', recipientName: '', phone: '' });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const tabs: { id: AccountTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'پروفایل', icon: <User className="w-4 h-4" /> },
    { id: 'addresses', label: 'آدرس‌ها', icon: <MapPin className="w-4 h-4" /> },
    { id: 'orders', label: 'سفارش‌ها', icon: <Package className="w-4 h-4" /> },
    { id: 'saved', label: 'علاقه‌مندی‌ها', icon: <Heart className="w-4 h-4" /> },
  ];

  const handleSaveProfile = () => {
    setProfileData(pendingProfileData);
    setEditingProfile(false);
  };

  const handleAddAddress = () => {
    if (!newAddress.title || !newAddress.fullAddress) return;
    onAddAddress({
      title: newAddress.title,
      fullAddress: newAddress.fullAddress,
      recipientName: newAddress.recipientName || profileData.name,
      phone: newAddress.phone || profileData.phone,
    });
    setNewAddress({ title: '', fullAddress: '', recipientName: '', phone: '' });
    setShowAddAddress(false);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (activeAddressIds.includes(addressId)) {
      setDeleteWarningId(addressId);
      return;
    }
    onDeleteAddress(addressId);
  };

  const confirmDeleteAddress = (addressId: string) => {
    onDeleteAddress(addressId);
    setDeleteWarningId(null);
  };

  const selectedOrder = selectedOrderId ? mockOrders.find(o => o.id === selectedOrderId) : null;

  return (
    <div className="flex-1 flex flex-col h-screen bg-background" dir="rtl">
      {/* Header */}
      <div
        className="sticky top-0 z-20 p-4 flex items-center gap-3"
        style={{ background: 'hsl(0 0% 100%)', borderBottom: '1px solid hsl(0 0% 0% / 0.06)' }}
      >
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">حساب کاربری</h2>
      </div>

      {/* Tab Bar */}
      <div className="px-6 pt-4">
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'hsl(0 0% 0% / 0.03)', border: '1px solid hsl(0 0% 0% / 0.06)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedOrderId(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id ? 'text-primary bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[600px] mx-auto space-y-6">

          {/* ===== PROFILE ===== */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div
                className="rounded-2xl p-6 space-y-5"
                style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.06)' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{profileData.name}</h3>
                    <p className="text-sm text-muted-foreground">عضو فلوکارت</p>
                  </div>
                  {!editingProfile && (
                    <button
                      onClick={() => { setPendingProfileData(profileData); setEditingProfile(true); }}
                      className="mr-auto p-2 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {editingProfile ? (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">نام کامل</label>
                      <Input value={pendingProfileData.name} onChange={(e) => setPendingProfileData(p => ({ ...p, name: e.target.value }))} className="text-sm" dir="rtl" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">شماره تلفن</label>
                      <Input value={pendingProfileData.phone} onChange={(e) => setPendingProfileData(p => ({ ...p, phone: e.target.value }))} className="text-sm" dir="rtl" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">ایمیل</label>
                      <Input value={pendingProfileData.email} onChange={(e) => setPendingProfileData(p => ({ ...p, email: e.target.value }))} className="text-sm" dir="ltr" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveProfile} size="sm" className="flex-1">ذخیره تغییرات</Button>
                      <Button onClick={() => setEditingProfile(false)} variant="outline" size="sm" className="flex-1">انصراف</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{profileData.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground" dir="ltr">{profileData.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== ADDRESSES ===== */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">آدرس‌های ذخیره‌شده</h3>
                <button onClick={() => setShowAddAddress(true)} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  افزودن آدرس
                </button>
              </div>
              {showAddAddress && (
                <div className="rounded-2xl p-5 space-y-4" style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  <h4 className="text-sm font-medium text-foreground">آدرس جدید</h4>
                  <div className="space-y-3">
                    <Input placeholder="عنوان (مثلاً خانه)" value={newAddress.title} onChange={(e) => setNewAddress(p => ({ ...p, title: e.target.value }))} className="text-sm" dir="rtl" />
                    <Input placeholder="آدرس کامل" value={newAddress.fullAddress} onChange={(e) => setNewAddress(p => ({ ...p, fullAddress: e.target.value }))} className="text-sm" dir="rtl" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="نام گیرنده" value={newAddress.recipientName} onChange={(e) => setNewAddress(p => ({ ...p, recipientName: e.target.value }))} className="text-sm" dir="rtl" />
                      <Input placeholder="شماره تماس" value={newAddress.phone} onChange={(e) => setNewAddress(p => ({ ...p, phone: e.target.value }))} className="text-sm" dir="rtl" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddAddress} size="sm" className="flex-1">ذخیره</Button>
                    <Button onClick={() => setShowAddAddress(false)} variant="outline" size="sm" className="flex-1">انصراف</Button>
                  </div>
                </div>
              )}
              {addresses.map((addr) => (
                <div key={addr.id} className="rounded-2xl p-4 space-y-2" style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.06)' }}>
                  {deleteWarningId === addr.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">این آدرس در یک سبد فعال استفاده شده است</span>
                      </div>
                      <p className="text-xs text-muted-foreground">آیا مطمئنید؟</p>
                      <div className="flex gap-2">
                        <Button onClick={() => confirmDeleteAddress(addr.id)} variant="destructive" size="sm" className="flex-1">حذف</Button>
                        <Button onClick={() => setDeleteWarningId(null)} variant="outline" size="sm" className="flex-1">انصراف</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">{addr.title}</span>
                          {addr.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">پیش‌فرض</span>}
                        </div>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{addr.fullAddress}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{addr.recipientName}</span>
                        <span>{addr.phone}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {addresses.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">هنوز آدرسی ذخیره نکردی</p>
                </div>
              )}
            </div>
          )}

          {/* ===== ORDERS ===== */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {selectedOrder ? (
                <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrderId(null)} />
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-foreground">سفارش‌های من</h3>
                  {mockOrders.length > 0 ? (
                    mockOrders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className="w-full text-right rounded-2xl p-4 space-y-3 transition-all duration-200 hover:border-primary/20"
                        style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.06)' }}
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{order.id}</span>
                            <span className="text-[10px] text-muted-foreground">
                              · {toPersianNumber(order.items.reduce((s, i) => s + i.quantity, 0))} کالا
                            </span>
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${getStatusStyle(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>

                        {/* Product Thumbnails */}
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 space-x-reverse">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <img
                                key={item.id + idx}
                                src={item.image}
                                alt={item.name}
                                className="w-9 h-9 rounded-lg object-cover border-2 border-background"
                              />
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-9 h-9 rounded-lg bg-muted/50 border-2 border-background flex items-center justify-center">
                                <span className="text-[10px] text-muted-foreground">+{toPersianNumber(order.items.length - 3)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {order.items.map(i => i.name).join('، ')}
                            </p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid hsl(0 0% 0% / 0.04)' }}>
                          <span className="text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }).format(order.date)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{formatPersianPrice(order.total)}</span>
                            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <div
                        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'hsl(0 0% 0% / 0.03)', border: '1px solid hsl(0 0% 0% / 0.06)' }}
                      >
                        <Package className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">هنوز سفارشی ثبت نشده</p>
                      <p className="text-xs text-muted-foreground mb-4">با شروع یک گفتگو، خرید رو آغاز کن</p>
                      {onStartNewChat && (
                        <Button onClick={onStartNewChat} size="sm" className="gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          شروع خرید
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== SAVED ITEMS ===== */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">علاقه‌مندی‌ها</h3>
              <div className="text-center py-12">
                <Heart className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">محصولی ذخیره نشده</p>
                <p className="text-xs text-muted-foreground mt-1">محصولات مورد علاقه‌ات رو از چت ذخیره کن</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
