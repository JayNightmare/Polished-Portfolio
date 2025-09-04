/// <reference types="vite/client" />

import { useState, useEffect } from 'react';

// Helper to get auth headers for GitHub API
function getAuthHeaders(): Record<string, string> {
  const token = import.meta.env.VITE_GITHUB_TOKEN;

  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }
  return {
    Accept: 'application/vnd.github.v3+json',
  };
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
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
  featuredRepos?: string[];
}

interface UseGitHubReturn {
  repos: GitHubRepo[];
  featuredRepos: GitHubRepo[];
  loading: boolean;
  error: string | null;
}

export function useGitHub({ username, featuredRepos = [] }: UseGitHubProps): UseGitHubReturn {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simple in-memory cache (per session)
        const cacheKey = `github_repos_${username}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setRepos(JSON.parse(cached));
          setLoading(false);
          return;
        }
        const response = await fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
          { headers: getAuthHeaders() }
        );
        if (!response.ok) throw new Error('Failed to fetch repositories');
        const data = await response.json();
        // Normalize topics (GitHub API v3 does not include topics by default)
        const reposWithTopics = await Promise.all(
          data.map(async (repo: any) => {
            let topics: string[] = [];
            try {
              const topicsRes = await fetch(
                `https://api.github.com/repos/${username}/${repo.name}/topics`,
                {
                  headers: {
                    ...getAuthHeaders(),
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
        // Sort by stargazers_count + forks_count descending
        reposWithTopics.sort(
          (a, b) => b.stargazers_count + b.forks_count - (a.stargazers_count + a.forks_count)
        );
        setRepos(reposWithTopics);
        // Cache result
        sessionStorage.setItem(cacheKey, JSON.stringify(reposWithTopics));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, [username]);

  // Featured: at least 1 fork AND at least 2 stars, sorted by stars+forks, limit 2
  let repo;
  const featured = repo
    ? repos
        .filter((repo) => repo.forks_count >= 1 && repo.stargazers_count >= 2)
        .sort((a, b) => b.stargazers_count + b.forks_count - (a.stargazers_count + a.forks_count))
        .slice(0, 2)
    : [
        {
          id: 1,
          name: 'DisTrack',
          full_name: 'JayNightmare/DisTrack-VSCode-Extension',
          description: 'Track coding time across VS Code and Discord with leaderboards & streaks',
          html_url: 'https://github.com/JayNightmare/DisTrack-VSCode-Extension',
          homepage: null,
          stargazers_count: 1,
          forks_count: 0,
          language: 'TypeScript',
          topics: ['discord', 'bot', 'vscode', 'extension', 'leaderboards', 'streaks'],
          created_at: '2022-01-01T00:00:00Z',
          updated_at: '2022-01-01T00:00:00Z',
          pushed_at: '2022-01-01T00:00:00Z',
          size: 1234,
          archived: false,
          disabled: false,
          private: false,
          fork: false,
        },
        {
          id: 2,
          name: 'Augmented Control Center',
          full_name: 'JayNightmare/Augmented-Control-Center',
          description: 'A web-based control center for managing augmented reality devices',
          html_url: 'https://github.com/JayNightmare/Augmented-Control-Center',
          homepage: null,
          stargazers_count: 1,
          forks_count: 0,
          language: 'JavaScript',
          topics: ['augmented-reality', 'dashboard-application', 'ar', 'electron-app'],
          created_at: '2022-01-01T00:00:00Z',
          updated_at: '2022-01-01T00:00:00Z',
          pushed_at: '2022-01-01T00:00:00Z',
          size: 5678,
          archived: false,
          disabled: false,
          private: false,
          fork: false,
        },
      ];

  return {
    repos,
    featuredRepos: featured,
    loading,
    error,
  };
}
