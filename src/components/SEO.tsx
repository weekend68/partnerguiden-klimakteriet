import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
}

const DEFAULT_TITLE = "Partnerguiden: Klimakteriet – Stötta din partner genom förändringen";
const DEFAULT_DESCRIPTION = "En gratis kurs skapad för dig som partner. Lär dig de biologiska sanningarna, undvik de vanligaste kommunikationsfällorna och stärk er relation.";
const DEFAULT_IMAGE = "https://partnerguiden.se/images/article-hormon-kartan.jpg";
const SITE_URL = "https://partnerguiden.se";

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  noIndex = false,
}: SEOProps) => {
  const location = useLocation();
  const fullTitle = title ? `${title} | Partnerguiden: Klimakteriet` : DEFAULT_TITLE;
  
  // For canonical URL: use provided url, or derive from current path (without query strings)
  // This ensures each page has a self-referencing canonical
  const canonicalPath = url ?? location.pathname;
  const fullUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL;
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="sv_SE" />
      <meta property="og:site_name" content="Partnerguiden: Klimakteriet" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article specific */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
};
