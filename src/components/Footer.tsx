import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <div className="container">
        <div className="border-t border-border" />
        <div className="py-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-muted-foreground">
          <span>© {currentYear} Partnerguiden</span>
          <span className="hidden sm:inline">|</span>
          <Link to="/integritetspolicy" className="hover:text-foreground transition-colors">
            Integritetspolicy
          </Link>
          <span className="hidden sm:inline">|</span>
          <Link to="/om" className="hover:text-foreground transition-colors">
            Om Partnerguiden
          </Link>
        </div>
      </div>
    </footer>
  );
}
