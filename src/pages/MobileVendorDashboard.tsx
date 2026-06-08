import { LanguageProvider } from "@/i18n/LanguageContext";
import { VendorDashboardProvider } from "@/features/vendor-dashboard/context/VendorDashboardContext";
import { MobileVendorShell } from "@/features/vendor-dashboard/mobile/MobileVendorShell";

const MobileVendorDashboard = () => (
  <div dir="rtl" lang="fa">
    <LanguageProvider defaultLanguage="fa">
      <VendorDashboardProvider>
        <MobileVendorShell />
      </VendorDashboardProvider>
    </LanguageProvider>
  </div>
);

export default MobileVendorDashboard;
