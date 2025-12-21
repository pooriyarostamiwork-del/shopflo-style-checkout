import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Product image overrides by product ID
export interface ProductImageOverride {
  [productId: string]: string;
}

// Banner configuration
export interface BannerConfig {
  imageUrl: string;
  showText: boolean;
  title: string;
  subtitle: string;
  ctaText: string;
}

// All banners by carousel key
export interface BannerConfigs {
  hotDeals: BannerConfig;
  youMayLike: BannerConfig;
  mostPopular: BannerConfig;
}

export interface HomepageSettings {
  productImages: ProductImageOverride;
  banners: BannerConfigs;
}

interface HomepageSettingsContextType {
  settings: HomepageSettings;
  updateProductImage: (productId: string, imageUrl: string) => void;
  updateBanner: (carouselKey: keyof BannerConfigs, config: Partial<BannerConfig>) => void;
  getProductImage: (productId: string, defaultImage: string) => string;
  getBanner: (carouselKey: keyof BannerConfigs) => BannerConfig;
}

const defaultBannerConfig: BannerConfig = {
  imageUrl: '',
  showText: true,
  title: 'تخفیف ویژه',
  subtitle: 'تا ۳۰٪',
  ctaText: 'مشاهده همه',
};

const defaultSettings: HomepageSettings = {
  productImages: {},
  banners: {
    hotDeals: { ...defaultBannerConfig, title: '🔥 پیشنهاد ویژه', subtitle: 'تا ۴۰٪' },
    youMayLike: { ...defaultBannerConfig, title: '💎 انتخاب ما', subtitle: 'محصولات برتر' },
    mostPopular: { ...defaultBannerConfig, title: '⭐ پرفروش‌ها', subtitle: 'بهترین‌ها' },
  },
};

const STORAGE_KEY = 'homepage-settings';

const HomepageSettingsContext = createContext<HomepageSettingsContextType | undefined>(undefined);

export const HomepageSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<HomepageSettings>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateProductImage = (productId: string, imageUrl: string) => {
    setSettings(prev => ({
      ...prev,
      productImages: {
        ...prev.productImages,
        [productId]: imageUrl,
      },
    }));
  };

  const updateBanner = (carouselKey: keyof BannerConfigs, config: Partial<BannerConfig>) => {
    setSettings(prev => ({
      ...prev,
      banners: {
        ...prev.banners,
        [carouselKey]: {
          ...prev.banners[carouselKey],
          ...config,
        },
      },
    }));
  };

  const getProductImage = (productId: string, defaultImage: string): string => {
    return settings.productImages[productId] || defaultImage;
  };

  const getBanner = (carouselKey: keyof BannerConfigs): BannerConfig => {
    return settings.banners[carouselKey] || defaultBannerConfig;
  };

  return (
    <HomepageSettingsContext.Provider value={{
      settings,
      updateProductImage,
      updateBanner,
      getProductImage,
      getBanner,
    }}>
      {children}
    </HomepageSettingsContext.Provider>
  );
};

export const useHomepageSettings = (): HomepageSettingsContextType => {
  const context = useContext(HomepageSettingsContext);
  if (!context) {
    throw new Error('useHomepageSettings must be used within a HomepageSettingsProvider');
  }
  return context;
};
