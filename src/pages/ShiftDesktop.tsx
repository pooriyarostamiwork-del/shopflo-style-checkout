import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomepageSettingsProvider } from "@/contexts/HomepageSettingsContext";
import { ShiftShell } from "@/features/shift/ShiftShell";

const ShiftDesktop = () => (
  <LanguageProvider defaultLanguage="fa">
    <AuthProvider>
      <HomepageSettingsProvider>
        <ShiftShell />
      </HomepageSettingsProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default ShiftDesktop;
