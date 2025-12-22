import { useState } from "react";
import { Smartphone, Heart, Shirt, Home, Sparkles, Gamepad2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const activeItem = categories.find(c => c.id === activeCategory) || categories[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium backdrop-blur-xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'hsl(0 0% 100%)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            border: '1px solid hsl(0 0% 0% / 0.12)'
          }}
          dir="rtl"
        >
          <span className="text-primary">{activeItem.icon}</span>
          <span className="text-foreground">{activeItem.label}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-48 backdrop-blur-xl z-50"
        style={{
          background: 'hsl(0 0% 100% / 0.95)',
          border: '1px solid hsl(0 0% 100% / 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}
      >
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all duration-200 ${
              activeCategory === category.id 
                ? 'bg-primary/10 text-primary' 
                : 'text-foreground hover:bg-muted/50'
            }`}
          >
            <span className={activeCategory === category.id ? 'text-primary' : 'text-muted-foreground'}>
              {category.icon}
            </span>
            <span>{category.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
