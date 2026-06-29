import { useParams } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomepageSettingsProvider } from "@/contexts/HomepageSettingsContext";
import { ShiftShell } from "@/features/shift/ShiftShell";
import { ShiftStoreProvider } from "@/features/shift/context/ShiftStoreContext";

const ShiftDesktop = () => {
  const { slug } = useParams<{ slug?: string }>();
  return (
    <LanguageProvider defaultLanguage="fa">
      <AuthProvider>
        <HomepageSettingsProvider>
          <ShiftStoreProvider slug={slug}>
            <ShiftShell />
          </ShiftStoreProvider>
        </HomepageSettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default ShiftDesktop;
