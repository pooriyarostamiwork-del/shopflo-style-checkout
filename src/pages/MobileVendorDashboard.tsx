import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { MobileVendorShell } from "@/features/vendor-dashboard/mobile/MobileVendorShell";
import { MobileVendorHome } from "@/features/vendor-dashboard/mobile/MobileVendorHome";
import { MobileVendorFinance } from "@/features/vendor-dashboard/mobile/MobileVendorFinance";
import { MobileVendorSettings } from "@/features/vendor-dashboard/mobile/MobileVendorSettings";

const MobileVendorDashboard = () => (
  <LanguageProvider defaultLanguage="fa">
    <Routes>
      <Route element={<MobileVendorShell />}>
        <Route index element={<MobileVendorHome />} />
        <Route path="finance" element={<MobileVendorFinance />} />
        <Route path="settings" element={<MobileVendorSettings />} />
      </Route>
    </Routes>
  </LanguageProvider>
);

export default MobileVendorDashboard;
