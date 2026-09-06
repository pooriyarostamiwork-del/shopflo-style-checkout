import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomepageSettingsProvider } from "@/contexts/HomepageSettingsContext";
import { MobilePetAbadShell } from "@/features/petabad/mobile/MobilePetAbadShell";

const MobilePetAbad = () => (
  <LanguageProvider defaultLanguage="fa">
    <AuthProvider>
      <HomepageSettingsProvider>
        <MobilePetAbadShell />
      </HomepageSettingsProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default MobilePetAbad;
