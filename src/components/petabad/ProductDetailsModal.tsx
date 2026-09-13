import { X } from "lucide-react";
import { Product } from "@/data/petabadData";
import { PDPProductComponent } from "./PDPProductComponent";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
}

export const ProductDetailsModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isInCart,
}: ProductDetailsModalProps) => {
  if (!isOpen || !product) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ background: 'hsl(0 0% 0% / 0.4)', backdropFilter: 'blur(4px)' }}
      />

      {/* Animation keyframes */}
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
        className="floating-product-modal relative h-full w-full max-w-3xl overflow-y-auto rounded-none sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
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
          className="fixed left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 sm:absolute"
          style={{
            background: 'hsl(0 0% 100%)',
            border: '1px solid hsl(0 0% 0% / 0.08)',
          }}
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <style>{`
          @media (max-width: 767px) {
            .floating-product-modal .p-4 { padding: 0.875rem !important; }
            .floating-product-modal > div.p-4 > div.flex.gap-6 {
              flex-direction: column !important;
              gap: 1rem !important;
            }
            .floating-product-modal .w-56 {
              width: 100% !important;
              max-width: 280px !important;
              margin-inline: auto !important;
            }
            .floating-product-modal .w-28 {
              width: auto !important;
              min-width: 5.5rem !important;
              flex-shrink: 0 !important;
            }
          }
        `}</style>
        <PDPProductComponent
          product={product}
          isInCart={isInCart}
          onAddToCart={onAddToCart}
          showContextLabel={false}
          enableSwipeGallery={true}
        />
      </div>
    </div>
  );
};
