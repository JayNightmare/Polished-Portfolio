import { useMemo } from 'react';
import {
    additionalTrustedByCompanies,
    type TrustedByCompany,
    type TrustedByItem,
} from '../data/trustedByCompanies';

interface GitHubOrgStripProps {
    additionalTrustedBy?: TrustedByCompany[];
}

export function GitHubOrgStrip({
    additionalTrustedBy = additionalTrustedByCompanies,
}: GitHubOrgStripProps) {
    const trustedByItems = useMemo<TrustedByItem[]>(() => {
        const merged = new Map<string, TrustedByItem>();

        additionalTrustedBy.forEach((company, index) => {
            const safeName = company.name?.trim();
            const safeImg = company.img?.trim();
            if (!safeName || !safeImg) return;

            merged.set(safeName.toLowerCase(), {
                id: `custom-${index}-${safeName}`,
                name: safeName,
                img: safeImg,
                font: company.font,
            });
        });

        return Array.from(merged.values());
    }, [additionalTrustedBy]);

    if (trustedByItems.length === 0) {
        return null;
    }

    return (
        <section id="trusted-by" className="py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-4">
                    <h1 className="text-2xl md:text-3xl tracking-[0.08em]">Trusted By</h1>
                </div>

                <div className="org-strip-mask pointer-events-none select-none" aria-hidden="true">
                    <div className="org-strip-track">
                        {[1, 2].map((group) => (
                            <div key={group} className="org-strip-group">
                                {trustedByItems.map((org) => (
                                    <div
                                        key={`${org.id}-${group}`}
                                        className="flex min-w-[220px] items-center justify-center gap-3 px-4 py-3 border-r border-l"
                                    >
                                        <img
                                            src={org.img}
                                            alt={`${org.name} logo`}
                                            className="h-9 rounded-[10%] grayscale opacity-80"
                                            loading="lazy"
                                            draggable={false}
                                        />
                                        <span
                                            className="truncate text-sm md:text-base tracking-[0.08em] uppercase text-muted-foreground"
                                            style={{
                                                fontFamily: org.font
                                                    ? `'${org.font}', system-ui`
                                                    : `'Sometype Mono', monospace`,
                                            }}
                                        >
                                            <strong>{org.name}</strong>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
