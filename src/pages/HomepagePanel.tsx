import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, Image, Info, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProductImage {
  id: number;
  name: string;
  imageUrl: string;
}

interface BannerConfig {
  imageUrl: string;
  showText: boolean;
  title: string;
  subtitle: string;
  ctaText: string;
}

const HomepagePanel = () => {
  // Product images state
  const [productImages, setProductImages] = useState<ProductImage[]>([
    { id: 1, name: 'محصول ۱', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
    { id: 2, name: 'محصول ۲', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
    { id: 3, name: 'محصول ۳', imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { id: 4, name: 'محصول ۴', imageUrl: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400' },
    { id: 5, name: 'محصول ۵', imageUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400' },
    { id: 6, name: 'محصول ۶', imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400' },
    { id: 7, name: 'محصول ۷', imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400' },
    { id: 8, name: 'محصول ۸', imageUrl: 'https://images.unsplash.com/photo-1434056886845-dbd39c1cc727?w=400' },
  ]);

  // Banner config state
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>({
    imageUrl: '',
    showText: true,
    title: 'تخفیف ویژه',
    subtitle: 'تا ۳۰٪',
    ctaText: 'مشاهده همه',
  });

  const updateProductImage = (id: number, newUrl: string) => {
    setProductImages(prev => 
      prev.map(p => p.id === id ? { ...p, imageUrl: newUrl } : p)
    );
  };

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log('Product Images:', productImages);
    console.log('Banner Config:', bannerConfig);
    toast({
      title: 'ذخیره شد',
      description: 'تغییرات با موفقیت ذخیره شدند',
    });
  };

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
              آدرس URL تصاویر محصولات را وارد کنید
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {productImages.map((product) => (
                <div key={product.id} className="space-y-3 p-4 bg-background rounded-lg border">
                  <Label className="text-sm font-medium">{product.name}</Label>
                  
                  {/* Image Preview */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=خطا';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Image className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  {/* URL Input */}
                  <Input
                    placeholder="آدرس URL تصویر..."
                    value={product.imageUrl}
                    onChange={(e) => updateProductImage(product.id, e.target.value)}
                    className="text-xs"
                    dir="ltr"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Promotional Banner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              بنر تبلیغاتی
            </CardTitle>
            <CardDescription>
              تنظیمات بنر تبلیغاتی کنار کاروسل محصولات
            </CardDescription>
            {/* Size Guide */}
            <div className="flex items-center gap-2 mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">راهنمای سایز:</strong> اندازه پیشنهادی بنر: <strong className="text-primary">140 × 380 پیکسل</strong> (عمودی)
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Banner Preview */}
              <div className="space-y-3">
                <Label>پیش‌نمایش بنر</Label>
                <div 
                  className="w-[140px] h-[380px] rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-4 relative"
                  style={{
                    background: bannerConfig.imageUrl 
                      ? `url(${bannerConfig.imageUrl}) center/cover`
                      : 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.15))',
                    border: '1px solid hsl(0 0% 0% / 0.08)',
                  }}
                >
                  {/* Overlay for text readability */}
                  {bannerConfig.imageUrl && bannerConfig.showText && (
                    <div className="absolute inset-0 bg-black/30" />
                  )}
                  
                  {/* Text Content */}
                  {bannerConfig.showText && (
                    <div className="relative z-10 space-y-2">
                      <span 
                        className="text-sm font-medium"
                        style={{ color: bannerConfig.imageUrl ? 'white' : 'hsl(var(--primary))' }}
                      >
                        {bannerConfig.title}
                      </span>
                      <div 
                        className="text-2xl font-bold"
                        style={{ color: bannerConfig.imageUrl ? 'white' : 'hsl(var(--primary))' }}
                      >
                        {bannerConfig.subtitle}
                      </div>
                      <span 
                        className="text-xs underline"
                        style={{ color: bannerConfig.imageUrl ? 'white' : 'hsl(var(--muted-foreground))' }}
                      >
                        {bannerConfig.ctaText}
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
                    value={bannerConfig.imageUrl}
                    onChange={(e) => setBannerConfig(prev => ({ ...prev, imageUrl: e.target.value }))}
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
                    checked={bannerConfig.showText}
                    onCheckedChange={(checked) => setBannerConfig(prev => ({ ...prev, showText: checked }))}
                  />
                </div>

                {/* Text Fields */}
                {bannerConfig.showText && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="space-y-2">
                      <Label>عنوان</Label>
                      <Input
                        placeholder="تخفیف ویژه"
                        value={bannerConfig.title}
                        onChange={(e) => setBannerConfig(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>زیرعنوان</Label>
                      <Input
                        placeholder="تا ۳۰٪"
                        value={bannerConfig.subtitle}
                        onChange={(e) => setBannerConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>متن دکمه</Label>
                      <Input
                        placeholder="مشاهده همه"
                        value={bannerConfig.ctaText}
                        onChange={(e) => setBannerConfig(prev => ({ ...prev, ctaText: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Help */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>نکته:</strong> برای بهترین نتیجه از تصاویر با کیفیت بالا و پس‌زمینه سفید یا شفاف استفاده کنید.</p>
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
