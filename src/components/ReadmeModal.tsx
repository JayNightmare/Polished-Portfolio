import { useEffect, useMemo, useState } from 'react';
import { PopUp, PopUpContent, PopUpHeader, PopUpTitle, PopUpDescription } from './ui/popup';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { CalendarClock, ExternalLink, History, Sparkles, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GitHubRepo } from './hooks/useGitHub';

interface Contributor {
    login: string;
    avatar_url: string;
    html_url: string;
}

type ModalRepo = GitHubRepo & {
    owner?: {
        type?: string;
        login?: string;
    };
};

interface ReadmeModalProps {
    repo: ModalRepo | null;
    isOpen: boolean;
    onClose: () => void;
}

type ModalTab = 'board' | 'activity' | 'wishlist';

const TAB_ITEMS: Array<{ id: ModalTab; label: string }> = [
    { id: 'board', label: 'Board' },
    { id: 'activity', label: 'Activity' },
    { id: 'wishlist', label: 'Wishlist' },
];

function getCachedJson<T>(key: string): T | null {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;

    try {
        return JSON.parse(cached) as T;
    } catch {
        return null;
    }
}

function setCachedJson<T>(key: string, value: T) {
    sessionStorage.setItem(key, JSON.stringify(value));
}

function StatTile({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="text-xs text-white/60">{label}</div>
            <div className="mt-1 text-lg font-semibold text-white">{value}</div>
        </div>
    );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
    return (
        <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-white/90">
            <span className="text-fuchsia-300">{icon}</span>
            <span>{title}</span>
        </div>
    );
}

export default function ReadmeModal({ repo, isOpen, onClose }: ReadmeModalProps) {
    const [loading, setLoading] = useState(false);
    const [languages, setLanguages] = useState<Record<string, number>>({});
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [activeTab, setActiveTab] = useState<ModalTab>('board');

    useEffect(() => {
        setActiveTab('board');
    }, [repo?.full_name, isOpen]);

    useEffect(() => {
        if (!repo || !isOpen) return;

        const fetchRepoData = async () => {
            setLoading(true);

            const languagesCacheKey = `github_languages_${repo.full_name}`;
            const contributorsCacheKey = `github_contributors_${repo.full_name}`;

            try {
                const cachedLanguages = getCachedJson<Record<string, number>>(languagesCacheKey);
                if (cachedLanguages) {
                    setLanguages(cachedLanguages);
                } else {
                    const languagesResponse = await fetch(
                        `https://api.github.com/repos/${repo.full_name}/languages`
                    );
                    const languagesData = languagesResponse.ok
                        ? await languagesResponse.json()
                        : {};
                    setLanguages(languagesData);
                    setCachedJson(languagesCacheKey, languagesData);
                }

                const cachedContributors = getCachedJson<Contributor[]>(contributorsCacheKey);
                if (cachedContributors) {
                    setContributors(cachedContributors);
                } else {
                    const contributorsResponse = await fetch(
                        `https://api.github.com/repos/${repo.full_name}/contributors`
                    );
                    const contributorsData = contributorsResponse.ok
                        ? await contributorsResponse.json()
                        : [];
                    const validContributors = Array.isArray(contributorsData)
                        ? contributorsData
                        : [];
                    setContributors(validContributors);
                    setCachedJson(contributorsCacheKey, validContributors);
                }
            } catch (error) {
                console.error('Error fetching repository data:', error);
                setLanguages({});
                setContributors([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRepoData();
    }, [repo, isOpen]);

    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    const langPercents = useMemo(
        () =>
            Object.entries(languages)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([lang, val]) => ({
                    lang,
                    percent: total ? Number(((val / total) * 100).toFixed(1)) : 0,
                })),
        [languages, total]
    );

    const skills = repo?.topics || [];
    const org = repo?.owner?.type === 'Organization' ? repo.owner.login : null;
    const updatedDate = repo?.updated_at ? new Date(repo.updated_at).toLocaleDateString() : '-';
    const createdDate = repo?.created_at ? new Date(repo.created_at).toLocaleDateString() : '-';

    const wishlistItems = useMemo(() => {
        const items: string[] = [];

        if ((skills?.length || 0) < 3) {
            items.push('Add 3-5 focused topics to improve discoverability and SEO on GitHub.');
        }

        if (!repo?.homepage) {
            items.push(
                'Set a homepage URL so visitors can access a live demo from the repository card.'
            );
        }

        if ((contributors?.length || 0) < 2) {
            items.push(
                'Invite one collaborator and add CONTRIBUTING guidelines for external contributions.'
            );
        }

        if ((Object.keys(languages).length || 0) > 3) {
            items.push(
                'Split larger concerns into modules to keep language boundaries and ownership clearer.'
            );
        }

        if (items.length === 0) {
            items.push(
                'Project quality signals look strong. Keep shipping and update docs with each release.'
            );
        }

        return items.slice(0, 4);
    }, [contributors?.length, languages, repo?.homepage, skills]);

    return (
        <PopUp open={isOpen} onOpenChange={onClose}>
            <PopUpContent className="w-full max-w-5xl overflow-hidden border border-white/10 bg-[#130a24] p-0 text-white shadow-2xl">
                <PopUpHeader className="sr-only">
                    <PopUpTitle>{repo?.name || 'Project board'}</PopUpTitle>
                    <PopUpDescription>
                        {repo?.description || 'Project metadata overview'}
                    </PopUpDescription>
                </PopUpHeader>

                <section className="relative overflow-hidden p-6 md:p-8">
                    <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
                    <div className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />

                    <div className="relative space-y-6">
                        <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-3 font-sometype-mono text-base md:text-lg">
                            {TAB_ITEMS.map((tab) => {
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`rounded-lg px-3 py-1.5 transition ${
                                            isActive
                                                ? 'bg-white/10 text-white shadow-sm'
                                                : 'text-white/60 hover:bg-white/5 hover:text-white/85'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm md:p-6">
                            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
                                        {repo?.name}
                                    </h2>
                                    <p className="mt-1 max-w-2xl text-sm text-white/75 md:text-base">
                                        {repo?.description ||
                                            'No description available for this project yet.'}
                                    </p>
                                </div>

                                {repo?.html_url && (
                                    <a
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
                                    >
                                        Open repo
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </div>

                            <div
                                className="mb-5 flex flex-wrap gap-2"
                                role="status"
                                aria-live="polite"
                            >
                                {skills.length > 0 ? (
                                    skills.slice(0, 8).map((skill: string) => (
                                        <Badge
                                            key={skill}
                                            className="border-white/20 bg-white/10 text-white"
                                            variant="outline"
                                        >
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge
                                        className="border-white/20 bg-white/10 text-white/70"
                                        variant="outline"
                                    >
                                        No tags
                                    </Badge>
                                )}
                                {org && (
                                    <Badge
                                        className="border-white/20 bg-white/10 text-white"
                                        variant="outline"
                                    >
                                        Org: {org}
                                    </Badge>
                                )}
                            </div>

                            {activeTab === 'board' && (
                                <>
                                    <div className="mb-6">
                                        <SectionTitle
                                            icon={<Sparkles className="h-4 w-4" />}
                                            title="Stack composition"
                                        />
                                        {loading ? (
                                            <div className="space-y-2">
                                                {[1, 2, 3].map((index) => (
                                                    <Skeleton
                                                        key={index}
                                                        className="h-8 w-full bg-white/15"
                                                    />
                                                ))}
                                            </div>
                                        ) : langPercents.length === 0 ? (
                                            <p className="text-sm text-white/60">
                                                No language data found.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {langPercents.map(({ lang, percent }) => (
                                                    <div
                                                        key={lang}
                                                        className="rounded-xl border border-white/10 bg-black/20 p-2"
                                                    >
                                                        <div className="mb-1 flex items-center justify-between text-xs text-white/80">
                                                            <span>{lang}</span>
                                                            <span>{percent}%</span>
                                                        </div>
                                                        <progress
                                                            className="h-2 w-full overflow-hidden rounded-full border-none [&::-moz-progress-bar]:bg-gradient-to-r [&::-moz-progress-bar]:from-fuchsia-400 [&::-moz-progress-bar]:to-indigo-400 [&::-webkit-progress-bar]:bg-white/15 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-fuchsia-400 [&::-webkit-progress-value]:to-indigo-400"
                                                            value={percent}
                                                            max={100}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <SectionTitle
                                            icon={<Users className="h-4 w-4" />}
                                            title="Contributors"
                                        />
                                        {loading ? (
                                            <div className="flex flex-wrap gap-2">
                                                {[1, 2, 3].map((index) => (
                                                    <Skeleton
                                                        key={index}
                                                        className="h-9 w-28 rounded-full bg-white/15"
                                                    />
                                                ))}
                                            </div>
                                        ) : contributors.length === 0 ? (
                                            <p className="text-sm text-white/60">
                                                No contributors listed.
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {contributors.slice(0, 6).map((contributor) => (
                                                    <a
                                                        key={contributor.login}
                                                        href={contributor.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
                                                    >
                                                        <img
                                                            src={contributor.avatar_url}
                                                            alt={contributor.login}
                                                            className="h-5 w-5 rounded-full"
                                                        />
                                                        {contributor.login}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                        <StatTile
                                            label="Stars"
                                            value={repo?.stargazers_count ?? 0}
                                        />
                                        <StatTile label="Forks" value={repo?.forks_count ?? 0} />
                                        <StatTile label="Size" value={`${repo?.size ?? 0} KB`} />
                                        <StatTile label="Updated" value={updatedDate} />
                                        <StatTile label="Created" value={createdDate} />
                                    </div>
                                </>
                            )}

                            {activeTab === 'activity' && (
                                <div className="space-y-4">
                                    <SectionTitle
                                        icon={<History className="h-4 w-4" />}
                                        title="Recent project activity"
                                    />
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                                            <div className="text-xs uppercase tracking-wide text-white/55">
                                                Latest update
                                            </div>
                                            <div className="mt-2 text-lg font-semibold">
                                                {updatedDate}
                                            </div>
                                            <p className="mt-1 text-sm text-white/70">
                                                Most recent recorded repository change.
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                                            <div className="text-xs uppercase tracking-wide text-white/55">
                                                First created
                                            </div>
                                            <div className="mt-2 text-lg font-semibold">
                                                {createdDate}
                                            </div>
                                            <p className="mt-1 text-sm text-white/70">
                                                Initial project creation date.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                                        <SectionTitle
                                            icon={<Users className="h-4 w-4" />}
                                            title="People active on this repo"
                                        />
                                        {loading ? (
                                            <div className="flex flex-wrap gap-2">
                                                {[1, 2, 3].map((index) => (
                                                    <Skeleton
                                                        key={index}
                                                        className="h-9 w-28 rounded-full bg-white/15"
                                                    />
                                                ))}
                                            </div>
                                        ) : contributors.length === 0 ? (
                                            <p className="text-sm text-white/60">
                                                No contributors available yet.
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {contributors.slice(0, 10).map((contributor) => (
                                                    <a
                                                        key={contributor.login}
                                                        href={contributor.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20"
                                                    >
                                                        <img
                                                            src={contributor.avatar_url}
                                                            alt={contributor.login}
                                                            className="h-5 w-5 rounded-full"
                                                        />
                                                        {contributor.login}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'wishlist' && (
                                <div className="space-y-4">
                                    <SectionTitle
                                        icon={<CalendarClock className="h-4 w-4" />}
                                        title="Suggested next moves"
                                    />
                                    <div className="space-y-2">
                                        {wishlistItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="rounded-xl border border-white/10 bg-black/25 p-3"
                                            >
                                                <p className="text-sm text-white/90">{item}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                                        <div className="text-xs uppercase tracking-wide text-white/55">
                                            Quick summary
                                        </div>
                                        <p className="mt-2 text-sm text-white/80">
                                            Keep this list short and actionable. Completing these
                                            improvements strengthens repo quality signals and
                                            long-term maintainability.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </PopUpContent>
        </PopUp>
    );
}
