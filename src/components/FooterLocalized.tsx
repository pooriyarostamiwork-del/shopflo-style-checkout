import { Instagram, Twitter, Linkedin } from "lucide-react";
import { useLanguage } from "@/i18n";

export const FooterLocalized = () => {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${isRTL ? 'md:grid-flow-dense' : ''}`}>
          {/* Column 1: ShopFlow */}
          <div className={isRTL ? 'md:col-start-3' : ''}>
            <h3 className={`font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}>
              {t.header.brandName}
            </h3>
            <ul className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.about}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.careers}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.contact}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.blog}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Support */}
          <div className={isRTL ? 'md:col-start-2' : ''}>
            <h3 className={`font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}>
              {t.footer.support}
            </h3>
            <ul className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.help}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.returns}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.shippingInfo}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.privacyPolicy}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Follow Us */}
          <div className={isRTL ? 'md:col-start-1' : ''}>
            <h3 className={`font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}>
              {t.footer.followUs}
            </h3>
            <div className={`flex gap-4 ${isRTL ? 'justify-end' : ''}`}>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            {t.footer.copyright}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t.footer.demoNote}
          </p>
        </div>
      </div>
    </footer>
  );
};
