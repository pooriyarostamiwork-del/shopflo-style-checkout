import { useLanguage } from "@/i18n";

export const FooterUniversal = () => {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="bg-muted/30 border-t border-border mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 ${isRTL ? 'text-right' : ''}`}>
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t.footer.about}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">{t.footer.careers}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">{t.footer.blog}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t.footer.support}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">{t.footer.help}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">{t.footer.contact}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">{t.footer.shippingInfo}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t.footer.privacyPolicy}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">{t.footer.returns}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t.footer.followUs}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className={`mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
          <p>{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};
