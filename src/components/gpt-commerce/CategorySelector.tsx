import { useState } from "react";
import { Smartphone, Heart, Shirt, Home, Sparkles, Gamepad2 } from "lucide-react";

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface CategorySelectorProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories: Category[] = [
  { id: 'all', label: 'همه', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'digital', label: 'دیجیتال', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'health', label: 'سلامت و زیبایی', icon: <Heart className="w-4 h-4" /> },
  { id: 'fashion', label: 'مد و پوشاک', icon: <Shirt className="w-4 h-4" /> },
  { id: 'home', label: 'خانه', icon: <Home className="w-4 h-4" /> },
  { id: 'gaming', label: 'گیمینگ', icon: <Gamepad2 className="w-4 h-4" /> },
];

export const CategorySelector = ({ activeCategory, onCategoryChange }: CategorySelectorProps) => {
  return (
    <div className="flex items-center gap-2 p-2" dir="rtl">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
            backdrop-blur-xl transition-all duration-300 ease-out
            ${activeCategory === category.id
              ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)]'
              : 'bg-white/50 text-foreground/80 border border-white/30 hover:bg-white/70 hover:border-primary/20'
            }
          `}
          style={{
            boxShadow: activeCategory === category.id 
              ? '0 4px 20px hsl(var(--primary) / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
              : '0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 hsl(0 0% 100% / 0.5)'
          }}
        >
          <span className={`transition-all duration-300 ${activeCategory === category.id ? 'scale-110' : ''}`}>
            {category.icon}
          </span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
};
