import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomepageSettingsProvider } from "@/contexts/HomepageSettingsContext";
import { GPTCommerceShell } from "@/features/gpt-commerce/GPTCommerceShell";

const GPTCommerce = () => (
  <LanguageProvider defaultLanguage="fa">
    <AuthProvider>
      <HomepageSettingsProvider>
        <GPTCommerceShell />
      </HomepageSettingsProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default GPTCommerce;
