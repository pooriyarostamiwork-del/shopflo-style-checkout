import { CheckoutMode } from "@/types/checkout";
import { checkoutModes } from "@/data/checkoutModes";

interface ModeSelectorProps {
  selectedMode: CheckoutMode;
  onSelectMode: (mode: CheckoutMode) => void;
}

export const ModeSelector = ({ selectedMode, onSelectMode }: ModeSelectorProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          🚀 Experience Different Checkout Modes
        </h2>
        <p className="text-muted-foreground text-sm">
          See how intelligent checkout transforms the buying experience. Same UI, different intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checkoutModes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`
                text-left p-4 rounded-xl border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {mode.name}
                </h3>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                {mode.description}
              </p>

              <div className="inline-flex items-center gap-1 bg-background px-2 py-1 rounded-md text-xs font-medium text-primary">
                {mode.tagline}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
        <p className="text-sm text-foreground">
          <span className="font-semibold">Currently experiencing:</span>{" "}
          {checkoutModes.find(m => m.id === selectedMode)?.name || "Standard Checkout"}
        </p>
      </div>
    </div>
  );
};
