import { useEffect, useState } from 'react';
import { PopUp, PopUpContent, PopUpHeader, PopUpTitle, PopUpDescription } from './ui/popup';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface ReadmeModalProps {
  repo: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReadmeModal({ repo, isOpen, onClose }: ReadmeModalProps) {
  const [readme, setReadme] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [contributors, setContributors] = useState<Contributor[]>([]);

  useEffect(() => {
    if (!repo || !isOpen) return;

    const fetchRepoData = async () => {
      setLoading(true);

      // Cache keys for different data types
      const readmeCacheKey = `github_readme_${repo.full_name}`;
      const languagesCacheKey = `github_languages_${repo.full_name}`;
      const contributorsCacheKey = `github_contributors_${repo.full_name}`;

      try {
        // Check for cached README
        const cachedReadme = sessionStorage.getItem(readmeCacheKey);
        if (cachedReadme) {
          setReadme(cachedReadme);
        } else {
          // Fetch README
          const readmeResponse = await fetch(
            `https://api.github.com/repos/${repo.full_name}/readme`,
            {
              headers: { Accept: 'application/vnd.github.v3.raw' },
            }
          );
          const readmeText = readmeResponse.ok ? await readmeResponse.text() : 'No README found.';
          setReadme(readmeText);
          sessionStorage.setItem(readmeCacheKey, readmeText);
        }

        // Check for cached languages
        const cachedLanguages = sessionStorage.getItem(languagesCacheKey);
        if (cachedLanguages) {
          setLanguages(JSON.parse(cachedLanguages));
        } else {
          // Fetch languages
          const languagesResponse = await fetch(
            `https://api.github.com/repos/${repo.full_name}/languages`
          );
          const languagesData = languagesResponse.ok ? await languagesResponse.json() : {};
          setLanguages(languagesData);
          sessionStorage.setItem(languagesCacheKey, JSON.stringify(languagesData));
        }

        // Check for cached contributors
        const cachedContributors = sessionStorage.getItem(contributorsCacheKey);
        if (cachedContributors) {
          setContributors(JSON.parse(cachedContributors));
        } else {
          // Fetch contributors
          const contributorsResponse = await fetch(
            `https://api.github.com/repos/${repo.full_name}/contributors`
          );
          const contributorsData = contributorsResponse.ok ? await contributorsResponse.json() : [];
          const validContributors = Array.isArray(contributorsData) ? contributorsData : [];
          setContributors(validContributors);
          sessionStorage.setItem(contributorsCacheKey, JSON.stringify(validContributors));
        }
      } catch (error) {
        console.error('Error fetching repository data:', error);
        setReadme('Error loading README.');
        setLanguages({});
        setContributors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRepoData();
  }, [repo, isOpen]);

  // MarkdownIt instance with highlight.js
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {}
      }
      return ''; // use external default escaping
    },
  });

  // Language % calculation
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const langPercents = Object.entries(languages).map(([lang, val]) => ({
    lang,
    percent: total ? ((val / total) * 100).toFixed(1) : '0',
  }));

  // Skills from topics
  const skills = repo?.topics || [];

  // Org info
  const org = repo?.owner?.type === 'Organization' ? repo.owner.login : null;

  return (
    <PopUp open={isOpen} onOpenChange={onClose}>
      <PopUpContent className=" h-[60vh] flex flex-row w-full">
        {/* Left: README */}
        <div className="overflow-auto pr-4 flex-1">
          <PopUpHeader>
            <PopUpTitle>{repo?.name}</PopUpTitle>
            <PopUpDescription>{repo?.description}</PopUpDescription>
          </PopUpHeader>
          <div
            className="mt-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: md.render(readme) }}
          />
        </div>
        {/* Right: Info */}
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <div className="mb-2 font-semibold">Languages</div>
            <div className="flex flex-wrap gap-2">
              {langPercents.length === 0 ? (
                <span className="text-muted-foreground">No data</span>
              ) : (
                langPercents.map(({ lang, percent }) => (
                  <Badge key={lang} variant="outline">
                    {lang}: {percent}%
                  </Badge>
                ))
              )}
            </div>
          </Card>
          <Card className="p-4">
            <div className="mb-2 font-semibold">Skills</div>
            <div className="flex flex-wrap gap-2">
              {skills.length === 0 ? (
                <span className="text-muted-foreground">No skills listed</span>
              ) : (
                skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))
              )}
            </div>
          </Card>
          <Card className="p-4">
            <div className="mb-2 font-semibold">Contributors</div>
            <div className="flex flex-wrap gap-2">
              {contributors.length === 0 ? (
                <span className="text-muted-foreground">No contributors</span>
              ) : (
                contributors.slice(0, 5).map((c) => (
                  <a
                    key={c.login}
                    href={c.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <img src={c.avatar_url} alt={c.login} className="w-6 h-6 rounded-full" />
                    <span>{c.login}</span>
                  </a>
                ))
              )}
            </div>
          </Card>
          {org && (
            <Card className="p-4">
              <div className="mb-2 font-semibold">Organization</div>
              <Badge variant="outline">{org}</Badge>
            </Card>
          )}
          <Card className="p-4">
            <div className="mb-2 font-semibold">Other Info</div>
            <div className="text-xs text-muted-foreground">
              <div>
                Created: {repo?.created_at ? new Date(repo.created_at).toLocaleDateString() : '-'}
              </div>
              <div>
                Updated: {repo?.updated_at ? new Date(repo.updated_at).toLocaleDateString() : '-'}
              </div>
              <div>Stars: {repo?.stargazers_count}</div>
              <div>Forks: {repo?.forks_count}</div>
              <div>Size: {repo?.size} KB</div>
            </div>
          </Card>
        </div>
      </PopUpContent>
    </PopUp>
  );
}
