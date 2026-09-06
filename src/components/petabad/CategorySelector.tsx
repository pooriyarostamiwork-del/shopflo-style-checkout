import { useState } from "react";
import { Dog, Cat, Bird, Bone, Sparkles, Bath, ChevronDown } from "lucide-react";
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
  { id: 'cat', label: 'گربه', icon: <Cat className="w-4 h-4" /> },
  { id: 'dog', label: 'سگ', icon: <Dog className="w-4 h-4" /> },
  { id: 'bird', label: 'پرندگان', icon: <Bird className="w-4 h-4" /> },
  { id: 'snack', label: 'اسنک و تشویقی', icon: <Bone className="w-4 h-4" /> },
  { id: 'care', label: 'بهداشت و نگهداری', icon: <Bath className="w-4 h-4" /> },
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
        className="w-52 backdrop-blur-xl z-50 p-2"
        style={{
          background: 'hsl(0 0% 100% / 0.98)',
          border: '1px solid hsl(0 0% 0% / 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}
      >
        {categories.map((category, index) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg min-h-[44px] ${
              activeCategory === category.id 
                ? 'bg-primary/10 text-primary' 
                : 'text-foreground hover:bg-muted/50'
            } ${index > 0 ? 'mt-1' : ''}`}
          >
            <span className={`flex-shrink-0 ${activeCategory === category.id ? 'text-primary' : 'text-muted-foreground'}`}>
              {category.icon}
            </span>
            <span className="text-sm">{category.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
