import { useEffect } from "react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomepageSettingsProvider } from "@/contexts/HomepageSettingsContext";
import { PetAbadShell } from "@/features/petabad/PetAbadShell";

const PetAbad = () => {
  useEffect(() => {
    document.title = "پت آباد | دستیار خرید لوازم حیوان خانگی";
  }, []);
  return (
    <LanguageProvider defaultLanguage="fa">
      <AuthProvider>
        <HomepageSettingsProvider>
          <PetAbadShell />
        </HomepageSettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default PetAbad;
