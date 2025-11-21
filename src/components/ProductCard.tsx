import { Star, Zap, Shield, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Product, Merchant } from "@/data/agenticData";

interface ProductCardProps {
  product: Product;
  merchant: Merchant;
  onBuy: () => void;
}

export const ProductCard = ({ product, merchant, onBuy }: ProductCardProps) => {
  const isD2C = merchant.type === "d2c";
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (isD2C) {
    return (
      <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-soft hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        {/* Brand Story Strip */}
        {merchant.story && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2 border-b border-border/50">
            <p className="text-xs font-medium text-primary flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              {merchant.story}
            </p>
          </div>
        )}

        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {merchant.promotion_bid >= 4 && (
            <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
              Promoted Partner
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="absolute top-3 right-3 bg-green-500 text-white">
              {discount}% OFF
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          {/* Merchant Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{merchant.logo}</span>
              <span className="text-sm font-semibold text-foreground">
                {merchant.name}
              </span>
            </div>
            {merchant.eNAMAD_verified && (
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-foreground line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-foreground">
                {product.rating}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews_count.toLocaleString()} reviews)
            </span>
          </div>

          {/* Benefits */}
          {merchant.benefits && merchant.benefits.length > 0 && (
            <div className="space-y-1">
              {merchant.benefits.slice(0, 2).map((benefit, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  {benefit}
                </p>
              ))}
            </div>
          )}

          {/* Price & CTA */}
          <div className="flex items-end justify-between pt-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Delivery in {product.delivery_days}-{product.delivery_days + 2} days
              </p>
            </div>
            <Button onClick={onBuy} className="px-6">
              Buy Now
            </Button>
          </div>

          {/* SLA Score */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Service Score</span>
              <span className="font-semibold text-primary">
                {merchant.SLA_score}/5.0
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Marketplace Seller Card
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex gap-3 p-3">
        {/* Product Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted/30">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {discount > 0 && (
            <Badge className="absolute top-1 right-1 text-xs bg-green-500 text-white px-1 py-0">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Merchant */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{merchant.logo}</span>
            <span className="text-xs font-medium text-muted-foreground truncate">
              {merchant.name}
            </span>
            {merchant.eNAMAD_verified && (
              <Shield className="w-3 h-3 text-green-500 flex-shrink-0" />
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-medium text-sm text-foreground line-clamp-2">
            {product.name}
          </h3>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-foreground">
              {product.rating}
            </span>
            <span className="text-xs text-muted-foreground">
              ({product.reviews_count})
            </span>
          </div>

          {/* Price & Delivery */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {merchant.delivery_time}
            </span>
          </div>

          {/* Badges & CTA */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1">
              {merchant.promotion_bid >= 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  Fast Ship
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                SLA {merchant.SLA_score}
              </span>
            </div>
            <Button onClick={onBuy} size="sm" className="h-7 px-3 text-xs">
              Buy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
