import { useEffect, useMemo, useState } from 'react';
import {
    BarChart2,
    Code,
    ExternalLink,
    GitFork,
    Github,
    LayoutDashboard,
    Scale,
    Star,
    Users,
    X,
} from 'lucide-react';
import type { GitHubRepo } from './hooks/useGitHub';

interface ModalProps {
    repo: GitHubRepo | null;
    isOpen: boolean;
    onClose: () => void;
}

interface LanguageSlice {
    name: string;
    bytes: number;
    percentage: number;
}

type ModalView = 'overview' | 'activity' | 'contributors';

type DetailStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface GitHubContributor {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
    type: string;
}

interface GitHubActivity {
    id: string;
    type: string;
    actor?: {
        login: string;
    };
    created_at: string;
    payload?: {
        action?: string;
        ref?: string;
        ref_type?: string;
        commits?: Array<{ message: string; sha: string }>;
        pull_request?: { title: string; html_url: string };
        issue?: { title: string; html_url: string };
    };
    repo: {
        name: string;
        url: string;
    };
}

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    CSS: '#563d7c',
    HTML: '#e34c26',
    Java: '#b07219',
    Ruby: '#701516',
    'C++': '#f34b7d',
    C: '#555555',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
    Shell: '#89e051',
    Vue: '#41b883',
    Svelte: '#ff3e00',
};

function getLangColor(name: string): string {
    return LANGUAGE_COLORS[name] ?? '#6366f1';
}

function formatRepoSize(sizeInKb: number) {
    if (sizeInKb >= 1024) {
        return `${(sizeInKb / 1024).toFixed(1)} MB`;
    }
    return `${sizeInKb.toLocaleString()} KB`;
}

function formatCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

function formatActivityDate(dateString: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(dateString));
}

function getActivitySummary(event: GitHubActivity) {
    switch (event.type) {
        case 'PushEvent': {
            const count = event.payload?.commits?.length ?? 0;
            return `Pushed ${count || 'new'} ${count === 1 ? 'commit' : 'commits'}`;
        }
        case 'CreateEvent':
            return `Created ${event.payload?.ref_type ?? 'resource'}`;
        case 'WatchEvent':
            return 'Starred repository';
        case 'ForkEvent':
            return 'Forked repository';
        case 'PullRequestEvent':
            return `${event.payload?.action ?? 'Updated'} pull request`;
        case 'IssuesEvent':
            return `${event.payload?.action ?? 'Updated'} issue`;
        default:
            return event.type
                .replace(/Event$/, '')
                .replace(/([A-Z])/g, ' $1')
                .trim();
    }
}

function getActivityDetail(event: GitHubActivity) {
    const commitMessage = event.payload?.commits?.[0]?.message;
    if (commitMessage) return commitMessage;
    if (event.payload?.pull_request?.title) return event.payload.pull_request.title;
    if (event.payload?.issue?.title) return event.payload.issue.title;
    if (event.payload?.ref) return event.payload.ref;
    return event.actor?.login ?? 'GitHub activity';
}

function getActivityUrl(event: GitHubActivity): string | null {
    if (event.payload?.pull_request?.html_url) return event.payload.pull_request.html_url;
    if (event.payload?.issue?.html_url) return event.payload.issue.html_url;
    if (event.type === 'PushEvent' && event.payload?.commits?.[0]?.sha) {
        return `https://github.com/${event.repo.name}/commit/${event.payload.commits[0].sha}`;
    }
    if (event.payload?.ref) {
        return `https://github.com/${event.repo.name}/tree/${event.payload.ref}`;
    }
    return `https://github.com/${event.repo.name}`;
}

function getLicenseName(license: { spdx_id: string } | null): string {
    if (!license) return 'No license';
    if (license.spdx_id === 'NOASSERTION') return 'Other/Unknown';
    return license.spdx_id;
}

export function Modal({ repo, isOpen, onClose }: ModalProps) {
    const [languages, setLanguages] = useState<LanguageSlice[]>([]);
    const [activeView, setActiveView] = useState<ModalView>('overview');
    const [contributors, setContributors] = useState<GitHubContributor[]>([]);
    const [activity, setActivity] = useState<GitHubActivity[]>([]);
    const [detailStatus, setDetailStatus] = useState<DetailStatus>('idle');

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onEscape);

        return () => {
            document.body.style.overflow = overflow;
            window.removeEventListener('keydown', onEscape);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || !repo) {
            setLanguages([]);
            return;
        }

        const controller = new AbortController();

        const fetchLanguages = async () => {
            try {
                const response = await fetch(
                    `https://api.github.com/repos/${repo.full_name}/languages`,
                    {
                        signal: controller.signal,
                        headers: {
                            Accept: 'application/vnd.github+json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Unable to fetch language data');
                }

                const data = (await response.json()) as Record<string, number>;
                const entries = Object.entries(data);
                const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

                if (!entries.length || totalBytes === 0) {
                    if (repo.language) {
                        setLanguages([{ name: repo.language, bytes: 1, percentage: 100 }]);
                    } else {
                        setLanguages([]);
                    }

                    return;
                }

                const next = entries
                    .map(([name, bytes]) => ({
                        name,
                        bytes,
                        percentage: Number(((bytes / totalBytes) * 100).toFixed(1)),
                    }))
                    .sort((a, b) => b.bytes - a.bytes)
                    .slice(0, 5);

                setLanguages(next);
            } catch {
                if (repo.language) {
                    setLanguages([{ name: repo.language, bytes: 1, percentage: 100 }]);
                } else {
                    setLanguages([]);
                }
            }
        };

        fetchLanguages();

        return () => controller.abort();
    }, [isOpen, repo]);

    useEffect(() => {
        if (isOpen) {
            setActiveView('overview');
        }
    }, [isOpen, repo?.id]);

    useEffect(() => {
        if (!isOpen || !repo) {
            setContributors([]);
            setActivity([]);
            setDetailStatus('idle');
            return;
        }

        const controller = new AbortController();

        const fetchRepoDetails = async () => {
            setDetailStatus('loading');

            const requestOptions = {
                signal: controller.signal,
                headers: { Accept: 'application/vnd.github+json' },
            };

            const [contributorsResult, activityResult] = await Promise.allSettled([
                fetch(
                    `https://api.github.com/repos/${repo.full_name}/contributors?per_page=8`,
                    requestOptions
                ),
                fetch(
                    `https://api.github.com/repos/${repo.full_name}/events?per_page=8`,
                    requestOptions
                ),
            ]);

            if (controller.signal.aborted) return;

            let nextContributors: GitHubContributor[] = [];
            let nextActivity: GitHubActivity[] = [];

            if (contributorsResult.status === 'fulfilled' && contributorsResult.value.ok) {
                nextContributors = (await contributorsResult.value.json()) as GitHubContributor[];
            }

            if (activityResult.status === 'fulfilled' && activityResult.value.ok) {
                nextActivity = (await activityResult.value.json()) as GitHubActivity[];
            }

            if (controller.signal.aborted) return;

            setContributors(nextContributors);
            setActivity(nextActivity);
            setDetailStatus(nextContributors.length || nextActivity.length ? 'loaded' : 'error');
        };

        fetchRepoDetails().catch(() => {
            if (!controller.signal.aborted) {
                setContributors([]);
                setActivity([]);
                setDetailStatus('error');
            }
        });

        return () => controller.abort();
    }, [isOpen, repo]);

    const displayTitle = useMemo(() => (repo ? repo.name.toUpperCase() : ''), [repo]);

    if (!isOpen || !repo) return null;

    const navItems = [
        { icon: LayoutDashboard, label: 'OVERVIEW', view: 'overview' as const },
        { icon: BarChart2, label: 'ACTIVITY', view: 'activity' as const },
        { icon: Users, label: 'CONTRIBUTORS', view: 'contributors' as const },
    ];

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative z-10 flex w-full max-w-3xl min-h-[95vh] overflow-hidden rounded-lg"
                style={{
                    background: 'linear-gradient(135deg, #12152a 0%, #0d1021 100%)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
                    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                    maxHeight: '90vh',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Left sidebar ── */}
                <div
                    className="flex shrink-0 flex-col justify-between mr-[1em] px-4 py-6"
                    style={{
                        background: 'rgba(0,0,0,0.35)',
                        borderRight: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <div>
                        {/* Nav */}
                        <nav className="flex flex-col gap-1">
                            {navItems.map(({ icon: Icon, label, view }) => {
                                const active = activeView === view;

                                return (
                                    <button
                                        type="button"
                                        key={label}
                                        onClick={() => setActiveView(view)}
                                        aria-current={active ? 'page' : undefined}
                                        className="cursor-pointer flex dark:hover:bg-sky-700 justify-center gap-3 rounded-lg px-3 py-4 text-xs font-semibold"
                                        style={{
                                            color: active
                                                ? 'rgba(255,255,255,0.95)'
                                                : 'rgba(255,255,255,0.38)',
                                            background: active
                                                ? 'rgba(255,255,255,0.07)'
                                                : 'transparent',
                                            letterSpacing: '0.1em',
                                        }}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {/* {label} */}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* View on GitHub button */}
                    <div className="">
                        <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            type="button"
                            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl p-4 text-xs font-semibold text-white/70 transition-colors hover:text-white"
                            style={{
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: 'rgba(255,255,255,0.04)',
                                letterSpacing: '0.08em',
                            }}
                        >
                            <Github className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                {/* ── Right content ── */}
                <div className="flex min-w-0 flex-1 flex-col overflow-y-auto py-[2em]">
                    {/* Close button */}
                    <div className="flex justify-end absolute top-4 right-4">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="pr-[1em] pb-8">
                        {/* Big uppercase title */}
                        <h2
                            id="modal-title"
                            className="font-black leading-[0.88] tracking-tight text-white"
                            style={{
                                fontSize: 'clamp(2em, 7vw, 3em)',
                                wordBreak: 'break-word',
                            }}
                        >
                            {displayTitle}
                        </h2>

                        {/* PUBLIC / PRIVATE badge */}
                        <div className="mt-4">
                            <span
                                className="inline-block px-3 py-1 text-[11px] font-semibold text-white"
                                style={{
                                    border: '1px solid rgba(255,255,255,0.5)',
                                    letterSpacing: '0.12em',
                                }}
                            >
                                {repo.private ? 'PRIVATE' : 'PUBLIC'}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="mt-4 text-sm leading-relaxed text-white/65">
                            {repo.description ||
                                'A focused software project. No fluff, just structure.'}
                        </p>

                        {/* Topic tags */}
                        {repo.topics.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {repo.topics.slice(0, 6).map((t) => (
                                    <span
                                        key={t}
                                        className="text-[11px] rounded-sm font-medium text-muted-foreground"
                                        style={{
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            padding: '2px 8px',
                                            letterSpacing: '0.04em',
                                        }}
                                    >
                                        #{t.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        )}

                        {activeView === 'overview' && (
                            <OverviewPanel repo={repo} languages={languages} />
                        )}

                        {activeView === 'activity' && (
                            <ActivityPanel activity={activity} status={detailStatus} />
                        )}

                        {activeView === 'contributors' && (
                            <ContributorsPanel contributors={contributors} status={detailStatus} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function OverviewPanel({ repo, languages }: { repo: GitHubRepo; languages: LanguageSlice[] }) {
    return (
        <>
            <div className="mt-[2em] grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile
                    icon={<Star className="h-5 w-5" />}
                    label="STARS"
                    value={formatCount(repo.stargazers_count)}
                />
                <StatTile
                    icon={<GitFork className="h-5 w-5" />}
                    label="FORKS"
                    value={formatCount(repo.forks_count)}
                />
                <StatTile
                    icon={<Code className="h-5 w-5" />}
                    label="SIZE"
                    value={formatRepoSize(repo.size)}
                />
                <StatTile
                    icon={<Scale className="h-5 w-5" />}
                    label="LICENSE"
                    value={getLicenseName(repo.license)}
                />
            </div>

            <div
                className="mt-6 rounded-xl p-4"
                style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(0,0,0,0.25)',
                }}
            >
                <p
                    className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-white/50"
                    style={{ letterSpacing: '0.18em' }}
                >
                    <span style={{ fontSize: '0.9em' }}>&lt;/&gt;</span>
                    LANGUAGES
                </p>

                {languages.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex h-2 w-full overflow-hidden rounded-full">
                            {languages.map((language) => (
                                <div
                                    key={language.name}
                                    style={{
                                        width: `${language.percentage}%`,
                                        background: getLangColor(language.name),
                                    }}
                                />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                            {languages.map((language) => (
                                <div key={language.name} className="flex items-center gap-1.5">
                                    <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ background: getLangColor(language.name) }}
                                    />
                                    <span className="text-[11px] rounded-sm text-white/60">
                                        {language.name}{' '}
                                        <span className="text-white/35">
                                            {language.percentage}%
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-white/35">No language data</p>
                )}
            </div>

            <div className="mt-6 flex gap-3">
                {repo.homepage && (
                    <a
                        href={repo.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                        style={{
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.06)',
                            letterSpacing: '0.06em',
                        }}
                    >
                        <ExternalLink className="h-4 w-4" />
                        Live Site
                    </a>
                )}
            </div>
        </>
    );
}

function ActivityPanel({ activity, status }: { activity: GitHubActivity[]; status: DetailStatus }) {
    if (status === 'loading') {
        return <EmptyPanel title="loading" description="Fetching recent repository events" />;
    }

    if (!activity.length) {
        return (
            <EmptyPanel
                title="no recent activity"
                description="GitHub did not return public events for this repository"
            />
        );
    }

    return (
        <div className="mt-[2em] space-y-3">
            {activity.map((event) => (
                <div
                    key={event.id}
                    className="rounded-xl p-4"
                    style={{
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.25)',
                    }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p
                                className="text-[11px] font-semibold text-white/45"
                                style={{ letterSpacing: '0.14em' }}
                            >
                                {formatActivityDate(event.created_at)}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
                                {getActivitySummary(event)}
                            </p>
                            <p className="mt-1 truncate text-xs text-white/50">
                                {getActivityDetail(event)}
                            </p>
                        </div>
                        <div>
                            <span className="rounded-sm border border-white/15 px-2 py-1 text-[10px] font-semibold text-white/45">
                                {event.type.replace(/Event$/, '').toUpperCase()}
                            </span>
                            {getActivityUrl(event) && (
                                <a
                                    href={getActivityUrl(event) ?? '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-xs font-semibold text-white/45"
                                >
                                    View
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ContributorsPanel({
    contributors,
    status,
}: {
    contributors: GitHubContributor[];
    status: DetailStatus;
}) {
    if (status === 'loading') {
        return (
            <EmptyPanel
                title="LOADING CONTRIBUTORS"
                description="Fetching repository contributors."
            />
        );
    }

    if (!contributors.length) {
        return (
            <EmptyPanel
                title="NO CONTRIBUTORS"
                description="GitHub did not return contributor data for this repository."
            />
        );
    }

    return (
        <div className="mt-[2em] grid gap-3 sm:grid-cols-2">
            {contributors.map((contributor) => (
                <a
                    key={contributor.id}
                    href={contributor.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/10"
                    style={{
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.25)',
                    }}
                >
                    <img
                        src={contributor.avatar_url}
                        alt=""
                        className="h-11 w-11 rounded-lg object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                            {contributor.login}
                        </p>
                        <p className="text-xs text-white/45">
                            {formatCount(contributor.contributions)} contributions
                        </p>
                    </div>
                    <Github className="h-4 w-4 text-white/35" />
                </a>
            ))}
        </div>
    );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
    return (
        <div
            className="mt-[2em] rounded-xl p-5"
            style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.25)',
            }}
        >
            <p
                className="text-[11px] font-semibold text-white/50"
                style={{ letterSpacing: '0.18em' }}
            >
                {title}
            </p>
            <p className="mt-2 text-sm text-white/45">{description}</p>
        </div>
    );
}

function StatTile({
    icon,
    label,
    value,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div
            className="flex flex-col gap-1 rounded-xl p-4"
            style={{
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(0,0,0,0.3)',
            }}
        >
            <div
                className="flex items-center gap-1.5 text-[10px] font-semibold text-white/40"
                style={{ letterSpacing: '0.14em' }}
            >
                {icon}
                {label}
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    );
}
