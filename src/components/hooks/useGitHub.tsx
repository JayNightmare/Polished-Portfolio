/// <reference types="vite/client" />

import { useState, useEffect } from 'react';
import { fetchUserOrganizations, getGitHubAuthHeaders, type GitHubOrganization } from './githubApi';

interface GitHubOwner {
  type: string;
  login: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner?: GitHubOwner;
  avatar_url?: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  archived: boolean;
  disabled: boolean;
  private: boolean;
  fork: boolean;
}

interface UseGitHubProps {
  username: string;
}

interface UseGitHubOptions {
  enabled?: boolean;
  includeRepos?: boolean;
  includeOrganizations?: boolean;
}

interface UseGitHubReturn {
  repos: GitHubRepo[];
  featuredRepos: GitHubRepo[];
  loading: boolean;
  error: string | null;
}

export function useGitHub(
  { username }: UseGitHubProps,
  options?: UseGitHubOptions
): UseGitHubReturn {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [featuredReposState, setFeaturedReposState] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled ?? true;
  const includeRepos = options?.includeRepos ?? true;
  const includeOrganizations = options?.includeOrganizations ?? true;

  const mapOrganizationToRepo = (org: GitHubOrganization): GitHubRepo => ({
    id: org.id,
    name: org.login,
    full_name: org.login,
    owner: {
      type: 'Organization',
      login: org.login,
    },
    description: org.description || `Organization: ${org.login}`,
    avatar_url: org.avatar_url,
    html_url: `https://github.com/${org.login}`,
    homepage: org.blog || null,
    stargazers_count: 0,
    forks_count: 0,
    language: null,
    topics: [],
    created_at: org.created_at || new Date().toISOString(),
    updated_at: org.updated_at || new Date().toISOString(),
    pushed_at: org.updated_at || new Date().toISOString(),
    size: 0,
    archived: false,
    disabled: false,
    private: false,
    fork: false,
  });

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError(null);

        const cacheKey = `github_repos_${username}`;
        const featuredCacheKey = `github_featured_${username}`;

        if (includeRepos) {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            setRepos(JSON.parse(cached));
          } else {
            const response = await fetch(
              `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
              { headers: getGitHubAuthHeaders() }
            );
            if (!response.ok) throw new Error('Failed to fetch repositories');
            const data = (await response.json()) as GitHubRepo[];

            const reposWithTopics = await Promise.all(
              data.map(async (repo: GitHubRepo) => {
                let topics: string[] = [];
                try {
                  const topicsRes = await fetch(
                    `https://api.github.com/repos/${username}/${repo.name}/topics`,
                    {
                      headers: {
                        ...getGitHubAuthHeaders(),
                        Accept: 'application/vnd.github.mercy-preview+json',
                      },
                    }
                  );
                  if (topicsRes.ok) {
                    const topicsData = await topicsRes.json();
                    topics = topicsData.names || [];
                  }
                } catch {}
                return { ...repo, topics };
              })
            );

            reposWithTopics.sort(
              (a, b) => b.stargazers_count + b.forks_count - (a.stargazers_count + a.forks_count)
            );
            setRepos(reposWithTopics);
            sessionStorage.setItem(cacheKey, JSON.stringify(reposWithTopics));
          }
        } else {
          setRepos([]);
        }

        if (includeOrganizations) {
          const cachedFeatured = sessionStorage.getItem(featuredCacheKey);
          if (cachedFeatured) {
            setFeaturedReposState(JSON.parse(cachedFeatured));
          } else {
            const orgs = await fetchUserOrganizations(username);
            const orgAsRepos: GitHubRepo[] = orgs.map(mapOrganizationToRepo);

            setFeaturedReposState(orgAsRepos);
            sessionStorage.setItem(featuredCacheKey, JSON.stringify(orgAsRepos));
          }
        } else {
          setFeaturedReposState([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      } finally {
        setLoading(false);
      }
    };

    if (enabled) {
      fetchRepos();
    } else {
      setLoading(false);
    }
  }, [username, enabled, includeRepos, includeOrganizations]);

  return {
    repos,
    featuredRepos: featuredReposState,
    loading,
    error,
  };
}
