import React, { useState } from 'react';

const ERROR_IMG_SRC =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

interface ImageSource {
    srcSet: string;
    type?: string;
    media?: string;
    sizes?: string;
}

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    sources?: ImageSource[];
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
    const [didError, setDidError] = useState(false);

    const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
        setDidError(true);
        props.onError?.(event);
    };

    const {
        src,
        alt,
        style,
        className,
        loading = 'lazy',
        decoding = 'async',
        sources,
        // fetchpriority,
        ...rest
    } = props;

    return didError ? (
        <div
            className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
            style={style}
        >
            <div className="flex items-center justify-center w-full h-full">
                <img
                    src={ERROR_IMG_SRC}
                    alt="Error loading image"
                    loading={loading}
                    decoding={decoding}
                    // fetchpriority={fetchpriority}
                    {...rest}
                    data-original-url={src}
                />
            </div>
        </div>
    ) : (
        <picture>
            {sources?.map((source, index) => (
                <source
                    key={`${source.srcSet}-${index}`}
                    srcSet={source.srcSet}
                    type={source.type}
                    media={source.media}
                    sizes={source.sizes}
                />
            ))}
            <img
                src={src}
                alt={alt}
                className={className}
                style={style}
                loading={loading}
                decoding={decoding}
                // fetchpriority={fetchpriority}
                {...rest}
                onError={handleError}
            />
        </picture>
    );
}
