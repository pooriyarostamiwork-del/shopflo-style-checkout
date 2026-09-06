import { useEffect } from "react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomepageSettingsProvider } from "@/contexts/HomepageSettingsContext";
import { MobilePetAbadShell } from "@/features/petabad/mobile/MobilePetAbadShell";

const MobilePetAbad = () => {
  useEffect(() => {
    document.title = "پت آباد | دستیار خرید لوازم حیوان خانگی";
  }, []);
  return (
    <LanguageProvider defaultLanguage="fa">
      <AuthProvider>
        <HomepageSettingsProvider>
          <MobilePetAbadShell />
        </HomepageSettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default MobilePetAbad;
