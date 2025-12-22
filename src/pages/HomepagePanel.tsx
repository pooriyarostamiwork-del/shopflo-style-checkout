import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Image, Info, ExternalLink, Flame, Heart, TrendingUp, LayoutTemplate, MessageSquare, Edit3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useHomepageSettings, BannerConfigs, HorizontalBannerConfigs } from '@/contexts/HomepageSettingsContext';

// Product definitions with IDs and names (matching ProductCarousels.tsx)
const allProducts = {
  hotDeals: [
    { id: 'hd1', name: 'هدفون سونی WH-1000XM5' },
    { id: 'hd2', name: 'ایرپاد پرو ۲' },
    { id: 'hd3', name: 'ساعت هوشمند شیائومی' },
    { id: 'hd4', name: 'پاوربانک انکر ۲۰۰۰۰' },
    { id: 'hd5', name: 'اسپیکر بلوتوث JBL' },
    { id: 'hd6', name: 'شارژر وایرلس سامسونگ' },
    { id: 'hd7', name: 'کیس ایرپاد پرو' },
  ],
  youMayLike: [
    { id: 'yl1', name: 'کیبورد مکانیکی لاجیتک' },
    { id: 'yl2', name: 'ماوس گیمینگ ریزر' },
    { id: 'yl3', name: 'هدفون بیتس Solo Pro' },
    { id: 'yl4', name: 'ساعت اپل واچ سری ۹' },
    { id: 'yl5', name: 'وب‌کم لاجیتک C920' },
    { id: 'yl6', name: 'هاب USB-C انکر' },
    { id: 'yl7', name: 'پد ماوس گیمینگ' },
  ],
  mostPopular: [
    { id: 'mp1', name: 'گوشی سامسونگ S24' },
    { id: 'mp2', name: 'لپ‌تاپ مک‌بوک ایر' },
    { id: 'mp3', name: 'آیفون ۱۵ پرو مکس' },
    { id: 'mp4', name: 'ایرپاد مکس' },
    { id: 'mp5', name: 'تبلت آیپد پرو' },
    { id: 'mp6', name: 'گوشی پیکسل ۸ پرو' },
    { id: 'mp7', name: 'لپ‌تاپ ایسوس ROG' },
  ],
};

// Chat mode products (from gptCommerceData.ts)
const chatProducts = [
  { id: 'p1', name: 'هدفون بی‌سیم سونی WH-1000XM5' },
  { id: 'p2', name: 'ایرپاد پرو ۲ اپل' },
  { id: 'p3', name: 'هدفون گیمینگ ریزر' },
  { id: 'p4', name: 'هدفون JBL Tune 760NC' },
];

const carouselInfo: { key: keyof BannerConfigs; label: string; defaultName: string; icon: React.ReactNode }[] = [
  { key: 'hotDeals', label: 'پیشنهادات ویژه', defaultName: 'تخفیف‌های ویژه', icon: <Flame className="w-4 h-4" /> },
  { key: 'youMayLike', label: 'شاید بپسندید', defaultName: 'شاید دوست داشته باشی', icon: <Heart className="w-4 h-4" /> },
  { key: 'mostPopular', label: 'محبوب‌ترین‌ها', defaultName: 'محبوب‌ترین‌ها', icon: <TrendingUp className="w-4 h-4" /> },
];

const horizontalBannerInfo: { key: keyof HorizontalBannerConfigs; label: string }[] = [
  { key: 'afterHotDeals', label: 'بعد از پیشنهادات ویژه' },
  { key: 'afterYouMayLike', label: 'بعد از شاید بپسندید' },
];

const HomepagePanel = () => {
  const { 
    settings, 
    updateProductImage, 
    updateChatProductImage,
    updateProductName,
    updateCarouselName,
    updateBanner, 
    updateHorizontalBanner, 
    getHorizontalBanner, 
    getBanner,
    getProductName,
    getCarouselName
  } = useHomepageSettings();
  const [activeCarousel, setActiveCarousel] = useState<keyof BannerConfigs>('hotDeals');
  const [activeBannerTab, setActiveBannerTab] = useState<keyof BannerConfigs>('hotDeals');
  const [activeHorizontalBanner, setActiveHorizontalBanner] = useState<keyof HorizontalBannerConfigs>('afterHotDeals');
  const [activeSection, setActiveSection] = useState<'images' | 'chatImages' | 'names' | 'banners' | 'horizontalBanners'>('images');

  const handleSave = () => {
    toast({
      title: 'ذخیره شد',
      description: 'تغییرات با موفقیت ذخیره شدند و در صفحه اصلی اعمال می‌شوند',
    });
  };

  const currentBanner = getBanner(activeBannerTab);
  const currentHorizontalBanner = getHorizontalBanner(activeHorizontalBanner);

  return (
    <div className="min-h-screen bg-muted/30 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">پنل مدیریت صفحه اصلی</h1>
            <p className="text-muted-foreground text-sm mt-1">مدیریت تصاویر محصولات و بنرهای تبلیغاتی</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a href="/gptcommerce" target="_blank" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                مشاهده صفحه
              </a>
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              ذخیره تغییرات
            </Button>
          </div>
        </div>

        {/* Product Images Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              تصاویر محصولات
            </CardTitle>
            <CardDescription>
              آدرس URL تصاویر محصولات را وارد کنید - تغییرات فوری اعمال می‌شوند
            </CardDescription>
            {/* Size Guide */}
            <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">راهنمای سایز:</strong> اندازه پیشنهادی تصویر محصول: <strong className="text-primary">400 × 400 پیکسل</strong> (مربعی، حداقل 300px)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Carousel Tabs */}
            <Tabs value={activeCarousel} onValueChange={(v) => setActiveCarousel(v as keyof BannerConfigs)}>
              <TabsList className="mb-4">
                {carouselInfo.map(({ key, label, icon }) => (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    {icon}
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {carouselInfo.map(({ key }) => (
                <TabsContent key={key} value={key}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {allProducts[key].map((product) => (
                      <div key={product.id} className="space-y-3 p-4 bg-background rounded-lg border">
                        <Label className="text-sm font-medium block truncate" title={product.name}>
                          {product.name}
                        </Label>
                        <span className="text-xs text-muted-foreground">ID: {product.id}</span>
                        
                        {/* Image Preview */}
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                          {settings.productImages[product.id] ? (
                            <img 
                              src={settings.productImages[product.id]} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=خطا';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground flex-col gap-2">
                              <Image className="w-8 h-8" />
                              <span className="text-xs">تصویر پیش‌فرض</span>
                            </div>
                          )}
                        </div>
                        
                        {/* URL Input */}
                        <Input
                          placeholder="آدرس URL تصویر..."
                          value={settings.productImages[product.id] || ''}
                          onChange={(e) => updateProductImage(product.id, e.target.value)}
                          className="text-xs"
                          dir="ltr"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Chat Mode Product Images Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              تصاویر محصولات حالت چت
            </CardTitle>
            <CardDescription>
              تصاویر محصولاتی که در حالت چت (بعد از شروع گفتگو) نمایش داده می‌شوند
            </CardDescription>
            <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">راهنمای سایز:</strong> اندازه پیشنهادی: <strong className="text-primary">300 × 300 پیکسل</strong> (مربعی)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {chatProducts.map((product) => (
                <div key={product.id} className="space-y-3 p-4 bg-background rounded-lg border">
                  <Label className="text-sm font-medium block truncate" title={product.name}>
                    {product.name}
                  </Label>
                  <span className="text-xs text-muted-foreground">ID: {product.id}</span>
                  
                  {/* Image Preview */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                    {settings.chatProductImages?.[product.id] ? (
                      <img 
                        src={settings.chatProductImages[product.id]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=خطا';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground flex-col gap-2">
                        <MessageSquare className="w-8 h-8" />
                        <span className="text-xs">تصویر پیش‌فرض</span>
                      </div>
                    )}
                  </div>
                  
                  {/* URL Input */}
                  <Input
                    placeholder="آدرس URL تصویر..."
                    value={settings.chatProductImages?.[product.id] || ''}
                    onChange={(e) => updateChatProductImage(product.id, e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Carousel & Product Names Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              نام کاروسل‌ها و محصولات
            </CardTitle>
            <CardDescription>
              تغییر نام کاروسل‌ها و محصولات نمایش داده شده در صفحه اصلی
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeCarousel} onValueChange={(v) => setActiveCarousel(v as keyof BannerConfigs)}>
              <TabsList className="mb-4">
                {carouselInfo.map(({ key, label, icon }) => (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    {icon}
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {carouselInfo.map(({ key, defaultName }) => (
                <TabsContent key={key} value={key}>
                  {/* Carousel Name */}
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                    <Label className="text-sm font-medium mb-2 block">نام کاروسل</Label>
                    <Input
                      placeholder={defaultName}
                      value={getCarouselName(key, '')}
                      onChange={(e) => updateCarouselName(key, e.target.value)}
                      className="max-w-md"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      اگر خالی باشد، از نام پیش‌فرض "{defaultName}" استفاده می‌شود
                    </p>
                  </div>

                  {/* Product Names */}
                  <Label className="text-sm font-medium mb-3 block">نام محصولات</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allProducts[key].map((product) => (
                      <div key={product.id} className="space-y-2 p-3 bg-background rounded-lg border">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">پیش‌فرض:</Label>
                          <span className="text-xs text-muted-foreground">{product.id}</span>
                        </div>
                        <p className="text-sm text-foreground truncate" title={product.name}>
                          {product.name}
                        </p>
                        <Input
                          placeholder="نام جدید محصول..."
                          value={getProductName(product.id, '')}
                          onChange={(e) => updateProductName(product.id, e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              بنرهای تبلیغاتی
            </CardTitle>
            <CardDescription>
              تنظیمات بنر تبلیغاتی هر کاروسل - هر کاروسل بنر مخصوص خود را دارد
            </CardDescription>
            {/* Size Guide */}
            <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">راهنمای سایز:</strong> اندازه پیشنهادی بنر: <strong className="text-primary">140 × 380 پیکسل</strong> (عمودی)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Banner Selection Tabs */}
            <Tabs value={activeBannerTab} onValueChange={(v) => setActiveBannerTab(v as keyof BannerConfigs)}>
              <TabsList className="mb-6">
                {carouselInfo.map(({ key, label, icon }) => (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    {icon}
                    بنر {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {carouselInfo.map(({ key, label }) => {
                const banner = getBanner(key);
                return (
                  <TabsContent key={key} value={key}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Banner Preview */}
                      <div className="space-y-3">
                        <Label>پیش‌نمایش بنر {label}</Label>
                        <div 
                          className="w-[140px] h-[380px] rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-4 relative"
                          style={{
                            background: banner.imageUrl 
                              ? `url(${banner.imageUrl}) center/cover`
                              : 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.15))',
                            border: '1px solid hsl(0 0% 0% / 0.08)',
                          }}
                        >
                          {/* Overlay for text readability */}
                          {banner.imageUrl && banner.showText && (
                            <div className="absolute inset-0 bg-black/30" />
                          )}
                          
                          {/* Text Content */}
                          {banner.showText && (
                            <div className="relative z-10 space-y-2">
                              <span 
                                className="text-sm font-medium"
                                style={{ color: banner.imageUrl ? 'white' : 'hsl(var(--primary))' }}
                              >
                                {banner.title}
                              </span>
                              <div 
                                className="text-2xl font-bold"
                                style={{ color: banner.imageUrl ? 'white' : 'hsl(var(--primary))' }}
                              >
                                {banner.subtitle}
                              </div>
                              <span 
                                className="text-xs underline"
                                style={{ color: banner.imageUrl ? 'white' : 'hsl(var(--muted-foreground))' }}
                              >
                                {banner.ctaText}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Banner Settings */}
                      <div className="space-y-4">
                        {/* Image URL */}
                        <div className="space-y-2">
                          <Label>آدرس URL تصویر بنر (اختیاری)</Label>
                          <Input
                            placeholder="https://example.com/banner.jpg"
                            value={banner.imageUrl}
                            onChange={(e) => updateBanner(key, { imageUrl: e.target.value })}
                            dir="ltr"
                          />
                          <p className="text-xs text-muted-foreground">
                            اگر خالی باشد، از گرادیان پیش‌فرض استفاده می‌شود
                          </p>
                        </div>

                        {/* Show Text Toggle */}
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <Label>نمایش متن روی بنر</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              اگر غیرفعال شود، فقط تصویر نمایش داده می‌شود
                            </p>
                          </div>
                          <Switch
                            checked={banner.showText}
                            onCheckedChange={(checked) => updateBanner(key, { showText: checked })}
                          />
                        </div>

                        {/* Text Fields */}
                        {banner.showText && (
                          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                            <div className="space-y-2">
                              <Label>عنوان</Label>
                              <Input
                                placeholder="تخفیف ویژه"
                                value={banner.title}
                                onChange={(e) => updateBanner(key, { title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>زیرعنوان</Label>
                              <Input
                                placeholder="تا ۳۰٪"
                                value={banner.subtitle}
                                onChange={(e) => updateBanner(key, { subtitle: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>متن دکمه</Label>
                              <Input
                                placeholder="مشاهده همه"
                                value={banner.ctaText}
                                onChange={(e) => updateBanner(key, { ctaText: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Horizontal Promotional Banners Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5" />
              بنرهای تبلیغاتی افقی (بین کاروسل‌ها)
            </CardTitle>
            <CardDescription>
              بنرهای افقی که بین کاروسل‌های محصولات نمایش داده می‌شوند
            </CardDescription>
            {/* Size Guide */}
            <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">راهنمای سایز:</strong> اندازه پیشنهادی بنر افقی: <strong className="text-primary">960 × 145 پیکسل</strong> (افقی، تمام عرض)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeHorizontalBanner} onValueChange={(v) => setActiveHorizontalBanner(v as keyof HorizontalBannerConfigs)}>
              <TabsList className="mb-6">
                {horizontalBannerInfo.map(({ key, label }) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {horizontalBannerInfo.map(({ key, label }) => {
                const hBanner = getHorizontalBanner(key);
                return (
                  <TabsContent key={key} value={key}>
                    <div className="space-y-6">
                      {/* Banner Preview */}
                      <div className="space-y-3">
                        <Label>پیش‌نمایش بنر {label}</Label>
                        <div 
                          className="w-full h-[145px] rounded-xl overflow-hidden"
                          style={{
                            background: hBanner.imageUrl 
                              ? `url(${hBanner.imageUrl}) center/cover`
                              : 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.15))',
                            border: '1px solid hsl(0 0% 0% / 0.08)',
                          }}
                        >
                          {!hBanner.imageUrl && (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                              بنر تبلیغاتی (آدرس تصویر را وارد کنید)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Enable Toggle */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <Label>نمایش بنر</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            اگر غیرفعال شود، این بنر نمایش داده نمی‌شود
                          </p>
                        </div>
                        <Switch
                          checked={hBanner.enabled}
                          onCheckedChange={(checked) => updateHorizontalBanner(key, { enabled: checked })}
                        />
                      </div>

                      {/* Image URL */}
                      <div className="space-y-2">
                        <Label>آدرس URL تصویر بنر</Label>
                        <Input
                          placeholder="https://example.com/banner.jpg"
                          value={hBanner.imageUrl}
                          onChange={(e) => updateHorizontalBanner(key, { imageUrl: e.target.value })}
                          dir="ltr"
                        />
                        <p className="text-xs text-muted-foreground">
                          اگر خالی باشد، از گرادیان پیش‌فرض استفاده می‌شود
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Help */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>نکته:</strong> تغییرات به صورت خودکار در localStorage ذخیره می‌شوند و بلافاصله در صفحه اصلی اعمال می‌شوند.</p>
                <p>تصاویر می‌توانند از سرویس‌هایی مانند Unsplash، Cloudinary یا سرور شخصی شما باشند.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomepagePanel;
