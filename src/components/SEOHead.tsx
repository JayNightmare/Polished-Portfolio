import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Jay Bell Portfolio';
const SITE_URL = 'https://portfolio.nexusgit.info';
const DEFAULT_IMAGE = `${SITE_URL}/companies/NexusScriptureLogo.jpg`;

interface SEOHeadProps {
    title: string;
    description: string;
    path?: string;
    image?: string;
    noindex?: boolean;
}

export function SEOHead({
    title,
    description,
    path = '/',
    image = DEFAULT_IMAGE,
    noindex = false,
}: SEOHeadProps) {
    const canonical = `${SITE_URL}${path}`;
    const robots = noindex
        ? 'noindex,nofollow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
        : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1';

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="robots" content={robots} />
            <link rel="canonical" href={canonical} />

            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonical} />
            <meta property="og:image" content={image} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
