import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";

const BREAKPOINT = 768;
const query = `(max-width: ${BREAKPOINT - 1}px)`;

const getIsMobile = () =>
  typeof window !== "undefined" && window.matchMedia(query).matches;

/** Synchronous viewport detection (no desktop→mobile flash on first paint). */
export function useViewportIsMobile() {
  const [isMobile, setIsMobile] = useState(getIsMobile);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

/** Renders the mobile or desktop experience on the same canonical URL. */
export const ResponsiveRoute = ({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) => {
  const isMobile = useViewportIsMobile();
  return <>{isMobile ? mobile : desktop}</>;
};

/** Legacy /m/ URLs → canonical URL, preserving query string, hash and :slug. */
export const LegacyRedirect = ({ to }: { to: string }) => {
  const { search, hash } = useLocation();
  const { slug } = useParams<{ slug?: string }>();
  const path = slug ? `${to}/${slug}` : to;
  return <Navigate to={`${path}${search}${hash}`} replace />;
};
