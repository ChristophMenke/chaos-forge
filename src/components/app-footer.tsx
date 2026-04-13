import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function AppFooter() {
  const t = await getTranslations("footer");

  return (
    <footer
      className="embed-hidden mt-auto border-t border-border/40 px-4 py-4 text-center text-xs text-muted-foreground"
      data-testid="app-footer"
    >
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link
          href="/impressum"
          className="hover:text-foreground"
          data-testid="footer-link-impressum"
        >
          {t("imprint")}
        </Link>
        <span aria-hidden>·</span>
        <Link
          href="/datenschutz"
          className="hover:text-foreground"
          data-testid="footer-link-datenschutz"
        >
          {t("privacy")}
        </Link>
      </nav>
    </footer>
  );
}
