import { useParams, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ShiftStoreProvider } from "@/features/shift/context/ShiftStoreContext";
import { ShiftCartProvider } from "@/features/shift/context/ShiftCartContext";
import ShiftMobileApp from "@/features/shift/ShiftMobileApp";

const ALLOWED = new Set(["raw", "petplayground"]);

const ShiftMobile = () => {
  const { instanceSlug } = useParams();
  const slug = instanceSlug || "raw";
  if (!ALLOWED.has(slug)) return <Navigate to="/shift/mobile" replace />;

  return (
    <AuthProvider>
      <ShiftStoreProvider slug={slug}>
        <ShiftCartProvider>
          <div dir="rtl" lang="fa" className={`shift-root shift-theme-${slug} min-h-screen bg-[hsl(var(--shift-bg))] text-[hsl(var(--shift-fg))]`}>
            <ShiftMobileApp />
          </div>
        </ShiftCartProvider>
      </ShiftStoreProvider>
    </AuthProvider>
  );
};

export default ShiftMobile;
