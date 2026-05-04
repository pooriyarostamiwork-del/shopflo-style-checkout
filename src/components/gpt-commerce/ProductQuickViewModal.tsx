import { useState } from "react";
import { X, ShoppingCart, Star, Truck, Shield, MessageCircle, ChevronLeft, ChevronRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, formatPersianPrice, toPersianNumber } from "@/data/gptCommerceData";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import { ProductImage } from "./ProductImage";

interface ProductQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onAskAbout: (productName: string) => void;
  isInCart: boolean;
}

export const ProductQuickViewModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAskAbout,
  isInCart,
}: ProductQuickViewModalProps) => {
  const { getProductImage } = useHomepageSettings();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !product) return null;

  const discountPercent = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  // Generate multiple images for the slider (using the same image with variations for demo)
  const productImage = getProductImage(product.id, product.image);
  const images = [productImage]; // Single image, but slider is ready for multiple

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ background: 'hsl(0 0% 0% / 0.4)', backdropFilter: 'blur(4px)' }}
      />

      {/* Center animation keyframes */}
      <style>{`
        @keyframes modal-center-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Modal */}
      <div 
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(0 0% 100%)',
          border: '1px solid hsl(0 0% 0% / 0.08)',
          animation: 'modal-center-in 0.2s ease-out forwards',
          transformOrigin: 'center center',
        }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            background: 'hsl(0 0% 100%)',
            border: '1px solid hsl(0 0% 0% / 0.08)',
          }}
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Product Image Section - Fixed width */}
          <div className="relative w-full md:w-[320px] flex-shrink-0">
            {/* Discount Badge - Above image */}
            {discountPercent > 0 && (
              <div 
                className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                {toPersianNumber(discountPercent)}٪ تخفیف
              </div>
            )}
            
            {/* Image Container - Square aspect ratio */}
            <div 
              className="w-full aspect-square flex items-center justify-center"
              style={{ background: 'hsl(0 0% 98%)' }}
            >
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Slider Controls - only show if multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'hsl(0 0% 100% / 0.9)',
                    border: '1px solid hsl(0 0% 0% / 0.08)',
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'hsl(0 0% 100% / 0.9)',
                    border: '1px solid hsl(0 0% 0% / 0.08)',
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className="w-2 h-2 rounded-full transition-all duration-200"
                      style={{
                        background: index === currentImageIndex 
                          ? 'hsl(var(--primary))' 
                          : 'hsl(0 0% 0% / 0.2)',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 p-6 space-y-5">
            {/* Title */}
            <h2 className="text-xl font-bold text-foreground leading-relaxed">
              {product.name}
            </h2>

            {/* Rating & Merchant */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-foreground">
                  {toPersianNumber(product.rating)}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span>{product.merchant.name}</span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground">
                  {formatPersianPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatPersianPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {product.fastDelivery && (
                <div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: 'hsl(142 70% 45% / 0.1)',
                    color: 'hsl(142 70% 35%)',
                  }}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>ارسال سریع</span>
                </div>
              )}
              {product.returnGuarantee && (
                <div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: 'hsl(217 91% 60% / 0.1)',
                    color: 'hsl(217 91% 50%)',
                  }}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>گارانتی بازگشت</span>
                </div>
              )}
              {product.inStock && (
                <div 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  <span>موجود در انبار</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              این محصول با کیفیت عالی و قیمت مناسب، یکی از بهترین انتخاب‌ها در دسته‌بندی خود است. 
              ارسال سریع و گارانتی اصالت کالا از مزایای خرید این محصول است.
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => onAddToCart(product)}
                disabled={isInCart}
                className="flex-1 h-12 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: isInCart 
                    ? 'hsl(142 70% 45%)' 
                    : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))',
                }}
              >
                <ShoppingCart className="w-4 h-4 ml-2" />
                {isInCart ? 'در سبد خرید' : 'افزودن به سبد'}
              </Button>
              
              <Button
                onClick={() => onAskAbout(product.name)}
                variant="outline"
                className="h-12 px-4 rounded-xl text-sm font-medium"
                style={{
                  background: 'hsl(0 0% 100%)',
                  border: '1px solid hsl(0 0% 0% / 0.08)',
                }}
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                بپرس از دستیار
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
