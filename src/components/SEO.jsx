import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  keywords, 
  url, 
  image = "https://edufills.com/seo-banner.jpg", // Default image for WhatsApp/Facebook sharing
  type = "website",
  schemaMarkup = null, // Custom Schema for specific pages
  noindex = false // For secret/admin pages
}) {
  const siteUrl = "https://edufills.com";
  const fullUrl = url.startsWith('http') ? url : `${siteUrl}${url}`;

  // 🚀 FIXED: Auto-truncate description for Bing/Yahoo SEO (Max 155 chars)
  const safeDescription = description && description.length > 155 
    ? description.substring(0, 152) + '...' 
    : description;

  // 🌟 Default Organization Schema (Google Knowledge Graph ke liye) 🌟
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "EduFill",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "India's leading platform for online entrance exam form filling and AI-powered college prediction.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9752519051",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["English", "Hindi"]
    },
    "sameAs": [
      "https://www.instagram.com/edufills", // Apne actual links daal dena
      "https://www.facebook.com/edufills"
    ]
  };

  // Jo schema pass kiya hai wo use karo, nahi toh default wala
  const finalSchema = schemaMarkup ? schemaMarkup : defaultSchema;

  return (
    <Helmet>
      {/* 🟢 Standard SEO Tags */}
      <title>{title}</title>
      <meta name="description" content={safeDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="EduFill Solutions" />
      <meta name="publisher" content="EduFill" />
      
      {/* 🟢 Control Crawlers */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      {/* 🟢 Canonical URL (GSC Duplicate Error Fix) */}
      <link rel="canonical" href={fullUrl} />

      {/* 🔵 Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="EduFill" />

      {/* 🔵 Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={image} />

      {/* 🟡 JSON-LD Structured Data (For Google Rich Snippets) */}
      <script type="application/ld+json">
        {JSON.stringify(finalSchema)}
      </script>
    </Helmet>
  );
}