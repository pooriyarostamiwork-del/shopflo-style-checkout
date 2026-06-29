import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomepageSettingsProvider } from "@/contexts/HomepageSettingsContext";
import { MobileShiftShell } from "@/features/shift/mobile/MobileShiftShell";

const ShiftMobile = () => (
  <LanguageProvider defaultLanguage="fa">
    <AuthProvider>
      <HomepageSettingsProvider>
        <MobileShiftShell />
      </HomepageSettingsProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default ShiftMobile;
