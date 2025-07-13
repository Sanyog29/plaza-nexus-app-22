import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

const DEFAULT_SEO = {
  title: 'Smart Building Management System',
  description: 'Comprehensive facility management platform for modern buildings with maintenance tracking, visitor management, and analytics.',
  keywords: ['facility management', 'building management', 'maintenance', 'smart building'],
  image: '/og-image.jpg',
  type: 'website' as const
};

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  noindex = false
}) => {
  const seo = {
    title: title ? `${title} | ${DEFAULT_SEO.title}` : DEFAULT_SEO.title,
    description: description || DEFAULT_SEO.description,
    keywords: [...DEFAULT_SEO.keywords, ...keywords],
    image: image || DEFAULT_SEO.image,
    url: url || window.location.href,
    type
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords.join(', ')} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:type" content={seo.type} />
      <meta property="og:site_name" content={DEFAULT_SEO.title} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#3B82F6" />
      <link rel="canonical" href={seo.url} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": DEFAULT_SEO.title,
          "description": seo.description,
          "url": seo.url,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        })}
      </script>
    </Helmet>
  );
};