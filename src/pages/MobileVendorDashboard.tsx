import { LanguageProvider } from "@/i18n/LanguageContext";
import { VendorDashboardProvider } from "@/features/vendor-dashboard/context/VendorDashboardContext";
import { MobileVendorShell } from "@/features/vendor-dashboard/mobile/MobileVendorShell";

const MobileVendorDashboard = () => (
  <LanguageProvider defaultLanguage="fa">
    <VendorDashboardProvider>
      <MobileVendorShell />
    </VendorDashboardProvider>
  </LanguageProvider>
);

export default MobileVendorDashboard;
