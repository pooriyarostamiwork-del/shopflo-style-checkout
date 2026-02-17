import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Search, User, Menu, X, ChevronLeft, ChevronRight, Star, Truck, Shield, RotateCcw, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutModalLocalized } from "@/components/CheckoutModalLocalized";
import { SuccessScreenLocalized } from "@/components/SuccessScreenLocalized";
import { CheckoutMode } from "@/types/checkout";
import { checkoutModes, upsellProducts, couponTiers } from "@/data/checkoutModes";
import { CartProduct } from "@/components/CartItemLocalized";
import { toPersianNumber } from "@/i18n";

// ─── Product Data ───────────────────────────────────────────
interface StoreProduct {
  id: number;
  name: string;
  nameFa: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  ratingCount: number;
  badge?: string;
  badgeColor?: string;
}

const storeCategories = [
  { id: "electronics", name: "لوازم الکترونیکی", icon: "💻" },
  { id: "fashion", name: "مد و پوشاک", icon: "👗" },
  { id: "beauty", name: "آرایشی بهداشتی", icon: "💄" },
  { id: "home", name: "خانه و آشپزخانه", icon: "🏠" },
  { id: "sports", name: "ورزش و سلامت", icon: "🏋️" },
  { id: "books", name: "کتاب و لوازم‌التحریر", icon: "📚" },
  { id: "kids", name: "کودک و نوزاد", icon: "🧸" },
  { id: "grocery", name: "سوپرمارکت", icon: "🛒" },
];

const heroSlides = [
  {
    title: "جشنواره تابستانه",
    subtitle: "تا ۵۰٪ تخفیف روی هزاران کالا",
    cta: "مشاهده تخفیف‌ها",
    bg: "linear-gradient(135deg, hsl(239 36% 61%), hsl(239 36% 45%))",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop",
  },
  {
    title: "محصولات دیجیتال",
    subtitle: "جدیدترین گوشی‌ها و لپ‌تاپ‌ها با گارانتی اصل",
    cta: "خرید کنید",
    bg: "linear-gradient(135deg, hsl(200 80% 40%), hsl(200 80% 25%))",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=400&fit=crop",
  },
  {
    title: "ارسال رایگان",
    subtitle: "برای سفارش‌های بالای ۵۰۰ هزار تومان",
    cta: "شروع خرید",
    bg: "linear-gradient(135deg, hsl(142 70% 35%), hsl(142 70% 25%))",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
  },
];

const allProducts: StoreProduct[] = [
  // Electronics
  { id: 1, name: "Premium Wireless Headphones", nameFa: "هدفون بی‌سیم سونی WH-1000XM5", price: 12500000, originalPrice: 14000000, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", category: "electronics", rating: 4.8, ratingCount: 342, badge: "پرفروش", badgeColor: "hsl(var(--primary))" },
  { id: 2, name: "Smart Fitness Watch", nameFa: "ساعت هوشمند اپل واچ سری ۹", price: 18900000, originalPrice: 21000000, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop", category: "electronics", rating: 4.9, ratingCount: 518, badge: "جدید" },
  { id: 3, name: "Laptop", nameFa: "لپ‌تاپ مک‌بوک ایر M3", price: 62000000, originalPrice: 68000000, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop", category: "electronics", rating: 4.9, ratingCount: 876 },
  { id: 4, name: "AirPods", nameFa: "ایرپاد پرو ۲ اپل", price: 9800000, image: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=400&h=400&fit=crop", category: "electronics", rating: 4.7, ratingCount: 234 },
  { id: 5, name: "iPad", nameFa: "آیپد پرو ۱۲.۹ اینچ", price: 45000000, originalPrice: 49000000, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop", category: "electronics", rating: 4.8, ratingCount: 167 },
  { id: 6, name: "Camera", nameFa: "دوربین سونی آلفا A7 IV", price: 89000000, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop", category: "electronics", rating: 4.9, ratingCount: 93, badge: "ویژه" },

  // Fashion
  { id: 7, name: "Leather Bag", nameFa: "کیف چرم طبیعی زنانه", price: 3200000, originalPrice: 4500000, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop", category: "fashion", rating: 4.5, ratingCount: 189, badge: "۲۹٪ تخفیف", badgeColor: "hsl(0 84% 60%)" },
  { id: 8, name: "Sneakers", nameFa: "کفش ورزشی نایک ایرمکس", price: 5800000, originalPrice: 6500000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", category: "fashion", rating: 4.6, ratingCount: 421 },
  { id: 9, name: "Sunglasses", nameFa: "عینک آفتابی ری‌بن ویفرر", price: 4200000, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop", category: "fashion", rating: 4.4, ratingCount: 156 },
  { id: 10, name: "Watch", nameFa: "ساعت مچی کاسیو کلاسیک", price: 2800000, originalPrice: 3200000, image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop", category: "fashion", rating: 4.7, ratingCount: 298 },

  // Beauty
  { id: 11, name: "Skincare Set", nameFa: "ست مراقبت پوست لاروش پوزای", price: 3500000, originalPrice: 4200000, image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop", category: "beauty", rating: 4.8, ratingCount: 523, badge: "محبوب‌ترین" },
  { id: 12, name: "Perfume", nameFa: "ادکلن مردانه دیور ساواج", price: 8500000, image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop", category: "beauty", rating: 4.6, ratingCount: 187 },
  { id: 13, name: "Makeup Kit", nameFa: "پالت آرایشی مک ۱۸ رنگ", price: 2900000, originalPrice: 3800000, image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop", category: "beauty", rating: 4.5, ratingCount: 342 },
  { id: 14, name: "Hair Dryer", nameFa: "سشوار حرفه‌ای دایسون", price: 19500000, image: "https://images.unsplash.com/photo-1522338242992-e1a54571e451?w=400&h=400&fit=crop", category: "beauty", rating: 4.9, ratingCount: 89, badge: "لوکس" },

  // Home
  { id: 15, name: "Coffee Machine", nameFa: "اسپرسوساز دلونگی", price: 18500000, originalPrice: 21000000, image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=400&fit=crop", category: "home", rating: 4.8, ratingCount: 234 },
  { id: 16, name: "Plant", nameFa: "گلدان سانسوریا بزرگ", price: 850000, image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop", category: "home", rating: 4.3, ratingCount: 78 },
  { id: 17, name: "Lamp", nameFa: "آباژور مدرن چوبی", price: 1650000, originalPrice: 2100000, image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab3fe?w=400&h=400&fit=crop", category: "home", rating: 4.4, ratingCount: 123 },
  { id: 18, name: "Candle Set", nameFa: "ست شمع معطر ۳ تایی", price: 480000, image: "https://images.unsplash.com/photo-1602607712066-a676b67afc4e?w=400&h=400&fit=crop", category: "home", rating: 4.6, ratingCount: 445 },

  // Sports
  { id: 19, name: "Yoga Mat", nameFa: "مت یوگا حرفه‌ای", price: 1200000, image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=400&h=400&fit=crop", category: "sports", rating: 4.6, ratingCount: 167 },
  { id: 20, name: "Dumbbell Set", nameFa: "دمبل قابل تنظیم ست", price: 4500000, originalPrice: 5200000, image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop", category: "sports", rating: 4.7, ratingCount: 198, badge: "تخفیف ویژه", badgeColor: "hsl(0 84% 60%)" },
  { id: 21, name: "Water Bottle", nameFa: "بطری آب ورزشی استیل", price: 450000, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop", category: "sports", rating: 4.3, ratingCount: 89 },
  { id: 22, name: "Resistance Bands", nameFa: "کش مقاومتی ست ۵ تایی", price: 650000, image: "https://images.unsplash.com/photo-1598632640487-6ea4a4e8b963?w=400&h=400&fit=crop", category: "sports", rating: 4.5, ratingCount: 312 },
];

const specialOfferProducts = allProducts.filter(p => p.originalPrice);
const popularProducts = allProducts.filter(p => p.ratingCount > 200).slice(0, 6);
const newProducts = allProducts.slice(0, 8);

const formatToman = (price: number) => {
  return toPersianNumber(price.toLocaleString()) + " تومان";
};

// ─── Header Component ───────────────────────────────────────
const StoreHeader = ({ cartCount, onCartClick }: { cartCount: number; onCartClick: () => void }) => {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border" dir="rtl">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span>ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان</span>
          <span>پشتیبانی ۲۴ ساعته: {toPersianNumber("021-91009100")}</span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Right side: Cart + User */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <button onClick={onCartClick} className="relative p-2 rounded-full hover:bg-muted transition-colors">
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center">
                  {toPersianNumber(cartCount)}
                </span>
              )}
            </button>

            {/* User */}
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <User className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-xl items-center gap-2 bg-muted px-4 py-2.5 rounded-xl border border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="جستجو در فلوکارت..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full text-right"
              dir="rtl"
            />
          </div>

          {/* Left side: Logo */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">فلوکارت</h1>
              <p className="text-[10px] text-muted-foreground">فروشگاه اینترنتی</p>
            </div>
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">ف</span>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 pb-3 border-t border-border/50 pt-2">
          {storeCategories.map(cat => (
            <a key={cat.id} href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap flex items-center gap-1.5">
              <span className="text-base">{cat.icon}</span>
              {cat.name}
            </a>
          ))}
        </nav>

        {/* Mobile */}
        {mobileMenu && (
          <div className="md:hidden pb-4 animate-fade-in space-y-3">
            <div className="flex items-center gap-2 bg-muted px-4 py-2.5 rounded-xl border border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="جستجو..." className="bg-transparent text-sm outline-none flex-1 text-right" dir="rtl" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {storeCategories.map(cat => (
                <a key={cat.id} href="#" className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted text-sm text-muted-foreground">
                  <span>{cat.icon}</span> {cat.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// ─── Hero Slider ────────────────────────────────────────────
const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % heroSlides.length), 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const go = (dir: number) => {
    setCurrent(c => (c + dir + heroSlides.length) % heroSlides.length);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % heroSlides.length), 5000);
  };

  const slide = heroSlides[current];

  return (
    <div className="relative w-full h-[280px] md:h-[400px] rounded-2xl overflow-hidden" dir="rtl">
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ background: slide.bg }}
      />
      <img
        src={slide.image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay transition-all duration-700"
      />
      <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-16 max-w-2xl">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">{slide.title}</h2>
        <p className="text-base md:text-lg text-white/80 mb-6">{slide.subtitle}</p>
        <button className="self-start px-6 py-2.5 bg-white text-foreground rounded-xl font-medium text-sm hover:bg-white/90 transition-colors">
          {slide.cta}
        </button>
      </div>

      {/* Arrows */}
      <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {heroSlides.map((_, i) => (
          <button key={i} onClick={() => { setCurrent(i); clearInterval(timerRef.current); }} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-white w-7' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
};

// ─── Product Card ───────────────────────────────────────────
const ProductCardStore = ({ product }: { product: StoreProduct }) => {
  const discountPercent = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/30 flex flex-col" dir="rtl">
      {/* Image */}
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
        <img src={product.image} alt={product.nameFa} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {product.badge && (
          <span
            className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-xs font-bold text-white"
            style={{ background: product.badgeColor || 'hsl(var(--primary))' }}
          >
            {product.badge}
          </span>
        )}
        {discountPercent > 0 && !product.badge && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-xs font-bold text-white bg-destructive">
            {toPersianNumber(discountPercent)}٪
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors">
            <Heart className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors">
            <Eye className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed mb-2 min-h-[2.5rem]">
          {product.nameFa}
        </h4>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-muted-foreground">{toPersianNumber(product.rating)}</span>
          <span className="text-xs text-muted-foreground">({toPersianNumber(product.ratingCount)})</span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through block mb-0.5">
              {formatToman(product.originalPrice)}
            </span>
          )}
          <span className="text-sm font-bold text-foreground">
            {formatToman(product.price)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Product Carousel ───────────────────────────────────────
const ProductCarousel = ({ title, products }: { title: string; products: StoreProduct[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <a href="#" className="text-sm text-primary hover:underline mr-2">مشاهده همه</a>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none' }}>
        {products.map(product => (
          <div key={product.id} className="min-w-[200px] max-w-[200px]">
            <ProductCardStore product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

// ─── Features Banner ────────────────────────────────────────
const FeaturesBanner = () => {
  const features = [
    { icon: <Truck className="w-5 h-5" />, title: "ارسال سریع", desc: "ارسال به سراسر ایران" },
    { icon: <Shield className="w-5 h-5" />, title: "ضمانت اصالت", desc: "تمامی کالاها اورجینال" },
    { icon: <RotateCcw className="w-5 h-5" />, title: "۷ روز ضمانت بازگشت", desc: "بدون قید و شرط" },
    { icon: <ShoppingCart className="w-5 h-5" />, title: "پرداخت امن", desc: "درگاه معتبر بانکی" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" dir="rtl">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {f.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Category Grid ──────────────────────────────────────────
const CategoryGrid = () => (
  <section className="space-y-4" dir="rtl">
    <h3 className="text-xl font-bold text-foreground">دسته‌بندی‌ها</h3>
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      {storeCategories.map(cat => (
        <a key={cat.id} href="#" className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all">
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-xs text-muted-foreground text-center">{cat.name}</span>
        </a>
      ))}
    </div>
  </section>
);

// ─── Promo Banners ──────────────────────────────────────────
const PromoBanners = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
    <div className="relative h-[160px] rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(280 60% 50%), hsl(280 60% 35%))' }}>
      <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=300&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
      <div className="relative z-10 flex flex-col justify-center h-full px-6">
        <p className="text-white/70 text-sm mb-1">پیشنهاد ویژه</p>
        <h4 className="text-xl font-bold text-white mb-1">تا ۴۰٪ تخفیف لوازم آرایشی</h4>
        <p className="text-white/60 text-xs">فقط تا پایان هفته</p>
      </div>
    </div>
    <div className="relative h-[160px] rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(200 70% 45%), hsl(200 70% 30%))' }}>
      <img src="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=300&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
      <div className="relative z-10 flex flex-col justify-center h-full px-6">
        <p className="text-white/70 text-sm mb-1">جشنواره دیجیتال</p>
        <h4 className="text-xl font-bold text-white mb-1">گوشی و تبلت با اقساط</h4>
        <p className="text-white/60 text-xs">بدون پیش‌پرداخت</p>
      </div>
    </div>
  </div>
);

// ─── Product Grid Section ───────────────────────────────────
const ProductGrid = ({ title, products }: { title: string; products: StoreProduct[] }) => (
  <section className="space-y-4" dir="rtl">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <a href="#" className="text-sm text-primary hover:underline">مشاهده همه</a>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map(product => (
        <ProductCardStore key={product.id} product={product} />
      ))}
    </div>
  </section>
);

// ─── Footer ─────────────────────────────────────────────────
const StoreFooter = () => (
  <footer className="border-t border-border bg-card mt-16" dir="rtl">
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* About */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">ف</span>
            </div>
            <h3 className="font-bold text-foreground">فلوکارت</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            فروشگاه اینترنتی فلوکارت با ارائه هزاران محصول اصل و باکیفیت، تجربه خریدی آسان و مطمئن را برای شما فراهم می‌کند.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">دسترسی سریع</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-primary transition-colors">درباره ما</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">تماس با ما</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">سوالات متداول</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">شرایط و قوانین</a></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">خدمات مشتریان</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-primary transition-colors">پیگیری سفارش</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">رویه بازگشت کالا</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">نحوه ارسال</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">حریم خصوصی</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-foreground mb-4">تماس با ما</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>تلفن: {toPersianNumber("021-91009100")}</li>
            <li>ایمیل: info@flowcart.ir</li>
            <li>تهران، خیابان ولیعصر</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {toPersianNumber(1403)} فلوکارت. تمامی حقوق محفوظ است.
        </p>
        <div className="flex items-center gap-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Enamad_logo.svg/120px-Enamad_logo.svg.png" alt="اینماد" className="h-10 opacity-50" />
        </div>
      </div>
    </div>
  </footer>
);

// ─── Main Page Component ────────────────────────────────────
const IndexFarsi = () => {
  const [selectedMode] = useState<CheckoutMode>("cross-market-retargeting");
  const [cartItems] = useState<CartProduct[]>([
    {
      id: 1,
      name: "Premium Wireless Headphones",
      nameFa: "هدفون بی‌سیم سونی WH-1000XM5",
      price: 12500000,
      originalPrice: 14000000,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
      quantity: 1,
      inStock: true,
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      nameFa: "ساعت هوشمند اپل واچ سری ۹",
      price: 18900000,
      originalPrice: 21000000,
      image: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=200&h=200&fit=crop",
      quantity: 1,
      inStock: true,
    },
    {
      id: 3,
      name: "Leather Laptop Bag",
      nameFa: "کیف چرم طبیعی زنانه",
      price: 3200000,
      originalPrice: 4500000,
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop",
      quantity: 1,
      inStock: true,
    },
  ]);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = cartItems.reduce(
    (sum, item) => sum + ((item.originalPrice || item.price) - item.price) * item.quantity,
    0
  );
  const total = subtotal - discount;

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
  };

  const orderId = `SF${Math.floor(Math.random() * 100000)}`;
  const currentModeConfig = checkoutModes.find(m => m.id === selectedMode);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <StoreHeader cartCount={cartItems.length} onCartClick={() => setIsCheckoutOpen(true)} />

      <main className="container mx-auto px-4 py-6 space-y-10">
        {/* Hero */}
        <HeroSlider />

        {/* Features */}
        <FeaturesBanner />

        {/* Categories */}
        <CategoryGrid />

        {/* Special Offers Carousel */}
        <ProductCarousel title="🔥 تخفیف‌های ویژه" products={specialOfferProducts} />

        {/* Promo Banners */}
        <PromoBanners />

        {/* Popular Products Grid */}
        <ProductGrid title="محبوب‌ترین محصولات" products={popularProducts} />

        {/* New Products Carousel */}
        <ProductCarousel title="🆕 جدیدترین‌ها" products={newProducts} />

        {/* All Products Grid */}
        <ProductGrid title="همه محصولات" products={allProducts} />
      </main>

      <StoreFooter />

      {/* Checkout Modal */}
      <CheckoutModalLocalized
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={total}
        onSuccess={handleCheckoutSuccess}
        mode={selectedMode}
        modeConfig={currentModeConfig}
        cartItems={cartItems}
        upsellProducts={upsellProducts}
        couponTiers={couponTiers}
      />

      {/* Success Screen */}
      <SuccessScreenLocalized
        isOpen={isSuccessOpen}
        onClose={handleSuccessClose}
        orderId={orderId}
      />
    </div>
  );
};

export default IndexFarsi;
