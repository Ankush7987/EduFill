import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://edufills.com').replace(/\/$/, '');
const DEFAULT_IMAGE = `${SITE_URL}/seo-banner.jpg`;

function makeAbsoluteUrl(value, fallback = SITE_URL) {
  if (!value) return fallback;
  if (String(value).startsWith('http')) return value;
  return `${SITE_URL}${String(value).startsWith('/') ? value : `/${value}`}`;
}

function truncateText(text = '', max = 155) {
  if (!text) return '';
  return text.length > max ? `${text.substring(0, max - 3)}...` : text;
}

function cleanKeywords(keywords) {
  if (Array.isArray(keywords)) return keywords.filter(Boolean).join(', ');
  return keywords || '';
}

function normalizeSchema(schema) {
  if (!schema) return [];
  return Array.isArray(schema) ? schema : [schema];
}

export default function SEO({
  title = 'EduFill | Exam Form Filling & Education Services',
  description = "EduFill helps students with exam form filling, latest exam updates, education tools and expert support.",
  keywords = 'EduFill, exam form filling, latest jobs, exam updates, government jobs, education services',
  url = '/',
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',

  // old prop support
  schemaMarkup = null,
  noindex = false,

  // new prop support
  schema = null,
  robots,
  author = 'EduFill Solutions',
  publishedTime,
  modifiedTime,
  section,
  tags = [],
}) {
  const fullUrl = makeAbsoluteUrl(url);
  const canonicalUrl = makeAbsoluteUrl(canonical || url);
  const finalImage = makeAbsoluteUrl(image, DEFAULT_IMAGE);
  const safeDescription = truncateText(description, 155);
  const safeKeywords = cleanKeywords(keywords);

  const finalRobots = noindex
    ? 'noindex, nofollow'
    : robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'EduFill',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: DEFAULT_IMAGE,
    description:
      "India's smart platform for online exam form filling, latest exam updates, education tools and expert support.",
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9752519051',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
    sameAs: [
      'https://www.instagram.com/edufills',
      'https://www.facebook.com/edufills',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'EduFill',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'Article' : 'WebPage',
    headline: title,
    description: safeDescription,
    url: fullUrl,
    image: finalImage,
    author: {
      '@type': 'Organization',
      name: 'EduFill',
    },
    publisher: {
      '@type': 'Organization',
      name: 'EduFill',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    ...(publishedTime ? { datePublished: publishedTime } : {}),
    ...(modifiedTime ? { dateModified: modifiedTime } : {}),
    ...(section ? { articleSection: section } : {}),
    ...(tags?.length ? { keywords: tags.join(', ') } : {}),
  };

  const customSchemas = [
    ...normalizeSchema(schemaMarkup),
    ...normalizeSchema(schema),
  ];

  const finalSchemas = [
    organizationSchema,
    websiteSchema,
    webpageSchema,
    ...customSchemas,
  ];

  return (
    <Helmet>
      {/* Basic SEO */}
      <html lang="en-IN" />
      <title>{title}</title>
      <meta name="description" content={safeDescription} />
      {safeKeywords ? <meta name="keywords" content={safeKeywords} /> : null}
      <meta name="author" content={author} />
      <meta name="publisher" content="EduFill" />
      <meta name="robots" content={finalRobots} />
      <meta name="googlebot" content={finalRobots} />
      <meta name="bingbot" content={finalRobots} />
      <meta name="theme-color" content="#10b981" />

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:secure_url" content={finalImage} />
      <meta property="og:site_name" content="EduFill" />
      <meta property="og:locale" content="en_IN" />

      {/* Article SEO */}
      {publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}
      {section ? <meta property="article:section" content={section} /> : null}
      {tags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* JSON-LD Structured Data */}
      {finalSchemas.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}