import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomepageSettingsProvider } from "@/contexts/HomepageSettingsContext";
import { MobileGPTCommerceShell } from "@/features/gpt-commerce/mobile/MobileGPTCommerceShell";

const MobileGPTCommerce = () => (
  <LanguageProvider defaultLanguage="fa">
    <AuthProvider>
      <HomepageSettingsProvider>
        <MobileGPTCommerceShell />
      </HomepageSettingsProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default MobileGPTCommerce;
