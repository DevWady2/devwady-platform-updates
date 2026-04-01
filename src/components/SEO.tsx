import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export default function SEO({ title, description, ogImage, noIndex }: SEOProps) {
  const siteName = "DevWady";
  const fullTitle = title ? `${title} — ${siteName}` : `${siteName} — Technology & Software Company`;
  const desc = description || "We design, develop, and scale end-to-end digital ecosystems across Egypt & KSA.";
  const image = ogImage || "/favicon.ico";

  const canonical = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : "";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {canonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
