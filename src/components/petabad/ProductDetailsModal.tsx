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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
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

        {/* PDP Component - reused from PDP page */}
        <PDPProductComponent
          product={product}
          isInCart={isInCart}
          onAddToCart={onAddToCart}
          showContextLabel={false}
        />
      </div>
    </div>
  );
};
