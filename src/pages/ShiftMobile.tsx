import { useParams } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomepageSettingsProvider } from "@/contexts/HomepageSettingsContext";
import { MobileShiftShell } from "@/features/shift/mobile/MobileShiftShell";
import { ShiftStoreProvider } from "@/features/shift/context/ShiftStoreContext";

const ShiftMobile = () => {
  const { slug } = useParams<{ slug?: string }>();
  return (
    <LanguageProvider defaultLanguage="fa">
      <AuthProvider>
        <HomepageSettingsProvider>
          <ShiftStoreProvider slug={slug}>
            <MobileShiftShell />
          </ShiftStoreProvider>
        </HomepageSettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default ShiftMobile;
