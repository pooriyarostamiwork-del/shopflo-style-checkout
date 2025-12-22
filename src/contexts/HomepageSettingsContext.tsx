import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Product image overrides by product ID
export interface ProductImageOverride {
  [productId: string]: string;
}

// Product name overrides by product ID
export interface ProductNameOverride {
  [productId: string]: string;
}

// Carousel name overrides
export interface CarouselNameOverride {
  [carouselKey: string]: string;
}

// Banner configuration (vertical side banners)
export interface BannerConfig {
  imageUrl: string;
  showText: boolean;
  title: string;
  subtitle: string;
  ctaText: string;
}

// Horizontal promotional banner between carousels
export interface HorizontalBannerConfig {
  imageUrl: string;
  enabled: boolean;
}

// All banners by carousel key
export interface BannerConfigs {
  hotDeals: BannerConfig;
  youMayLike: BannerConfig;
  mostPopular: BannerConfig;
}

// Horizontal banners by position
export interface HorizontalBannerConfigs {
  afterHotDeals: HorizontalBannerConfig;
  afterYouMayLike: HorizontalBannerConfig;
}

// Logo settings for each location
export interface LogoConfig {
  imageUrl: string;
  subtitle: string;
}

export interface LogoConfigs {
  chatMode: LogoConfig;
  firstPage: LogoConfig;
  footer: LogoConfig;
}

export interface HomepageSettings {
  productImages: ProductImageOverride;
  chatProductImages: ProductImageOverride;
  productNames: ProductNameOverride;
  carouselNames: CarouselNameOverride;
  banners: BannerConfigs;
  horizontalBanners: HorizontalBannerConfigs;
  logos: LogoConfigs;
}

interface HomepageSettingsContextType {
  settings: HomepageSettings;
  updateProductImage: (productId: string, imageUrl: string) => void;
  updateChatProductImage: (productId: string, imageUrl: string) => void;
  updateProductName: (productId: string, name: string) => void;
  updateCarouselName: (carouselKey: string, name: string) => void;
  updateBanner: (carouselKey: keyof BannerConfigs, config: Partial<BannerConfig>) => void;
  updateHorizontalBanner: (position: keyof HorizontalBannerConfigs, config: Partial<HorizontalBannerConfig>) => void;
  updateLogoSettings: (location: keyof LogoConfigs, config: Partial<LogoConfig>) => void;
  getProductImage: (productId: string, defaultImage: string) => string;
  getChatProductImage: (productId: string, defaultImage: string) => string;
  getProductName: (productId: string, defaultName: string) => string;
  getCarouselName: (carouselKey: string, defaultName: string) => string;
  getBanner: (carouselKey: keyof BannerConfigs) => BannerConfig;
  getHorizontalBanner: (position: keyof HorizontalBannerConfigs) => HorizontalBannerConfig;
  getLogoSettings: (location: keyof LogoConfigs) => LogoConfig;
}

const defaultBannerConfig: BannerConfig = {
  imageUrl: '',
  showText: true,
  title: 'تخفیف ویژه',
  subtitle: 'تا ۳۰٪',
  ctaText: 'مشاهده همه',
};

const defaultHorizontalBannerConfig: HorizontalBannerConfig = {
  imageUrl: '',
  enabled: true,
};

const defaultLogoConfig: LogoConfig = {
  imageUrl: '',
  subtitle: '',
};

const defaultSettings: HomepageSettings = {
  productImages: {},
  chatProductImages: {},
  productNames: {},
  carouselNames: {},
  banners: {
    hotDeals: { ...defaultBannerConfig, title: '🔥 پیشنهاد ویژه', subtitle: 'تا ۴۰٪' },
    youMayLike: { ...defaultBannerConfig, title: '💎 انتخاب ما', subtitle: 'محصولات برتر' },
    mostPopular: { ...defaultBannerConfig, title: '⭐ پرفروش‌ها', subtitle: 'بهترین‌ها' },
  },
  horizontalBanners: {
    afterHotDeals: { ...defaultHorizontalBannerConfig },
    afterYouMayLike: { ...defaultHorizontalBannerConfig },
  },
  logos: {
    chatMode: { ...defaultLogoConfig, subtitle: 'دستیار خرید هوشمند' },
    firstPage: { ...defaultLogoConfig, subtitle: 'دستیار خرید هوشمند شما' },
    footer: { ...defaultLogoConfig, subtitle: 'خرید هوشمند با کمک هوش مصنوعی' },
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

  const updateChatProductImage = (productId: string, imageUrl: string) => {
    setSettings(prev => ({
      ...prev,
      chatProductImages: {
        ...prev.chatProductImages,
        [productId]: imageUrl,
      },
    }));
  };

  const updateProductName = (productId: string, name: string) => {
    setSettings(prev => ({
      ...prev,
      productNames: {
        ...prev.productNames,
        [productId]: name,
      },
    }));
  };

  const updateCarouselName = (carouselKey: string, name: string) => {
    setSettings(prev => ({
      ...prev,
      carouselNames: {
        ...prev.carouselNames,
        [carouselKey]: name,
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

  const updateHorizontalBanner = (position: keyof HorizontalBannerConfigs, config: Partial<HorizontalBannerConfig>) => {
    setSettings(prev => ({
      ...prev,
      horizontalBanners: {
        ...prev.horizontalBanners,
        [position]: {
          ...prev.horizontalBanners[position],
          ...config,
        },
      },
    }));
  };

  const updateLogoSettings = (location: keyof LogoConfigs, config: Partial<LogoConfig>) => {
    setSettings(prev => ({
      ...prev,
      logos: {
        ...prev.logos,
        [location]: {
          ...(prev.logos?.[location] || defaultLogoConfig),
          ...config,
        },
      },
    }));
  };

  const getProductImage = (productId: string, defaultImage: string): string => {
    return settings.productImages[productId] || defaultImage;
  };

  const getChatProductImage = (productId: string, defaultImage: string): string => {
    return settings.chatProductImages?.[productId] || defaultImage;
  };

  const getProductName = (productId: string, defaultName: string): string => {
    return settings.productNames?.[productId] || defaultName;
  };

  const getCarouselName = (carouselKey: string, defaultName: string): string => {
    return settings.carouselNames?.[carouselKey] || defaultName;
  };

  const getBanner = (carouselKey: keyof BannerConfigs): BannerConfig => {
    return settings.banners[carouselKey] || defaultBannerConfig;
  };

  const getHorizontalBanner = (position: keyof HorizontalBannerConfigs): HorizontalBannerConfig => {
    return settings.horizontalBanners?.[position] || defaultHorizontalBannerConfig;
  };

  const getLogoSettings = (location: keyof LogoConfigs): LogoConfig => {
    return settings.logos?.[location] || defaultLogoConfig;
  };

  return (
    <HomepageSettingsContext.Provider value={{
      settings,
      updateProductImage,
      updateChatProductImage,
      updateProductName,
      updateCarouselName,
      updateBanner,
      updateHorizontalBanner,
      updateLogoSettings,
      getProductImage,
      getChatProductImage,
      getProductName,
      getCarouselName,
      getBanner,
      getHorizontalBanner,
      getLogoSettings,
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
