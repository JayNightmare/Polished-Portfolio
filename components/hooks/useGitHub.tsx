/// <reference types="vite/client" />

import { Avatar } from '@radix-ui/react-avatar';
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
  const [featuredReposState, setFeaturedReposState] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simple in-memory cache (per session)
        const cacheKey = `github_repos_${username}`;
        const orgsCacheKey = `github_orgs_${username}`;
        const featuredCacheKey = `github_featured_${username}`;

        // Check for cached user repos
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setRepos(JSON.parse(cached));
        } else {
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
        }

        // Check for cached featured repos (organizations)
        const cachedFeatured = sessionStorage.getItem(featuredCacheKey);
        if (cachedFeatured) {
          setFeaturedReposState(JSON.parse(cachedFeatured));
        } else {
          // Fetch user's organizations
          const orgsResponse = await fetch(`https://api.github.com/users/${username}/orgs`, {
            headers: getAuthHeaders(),
          });

          if (orgsResponse.ok) {
            const orgs = await orgsResponse.json();

            // Convert organizations to repo-like format for display
            const orgAsRepos: GitHubRepo[] = orgs.map((org: any) => ({
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
              stargazers_count: 0, // Organizations don't have stars
              forks_count: 0, // Organizations don't have forks
              language: null,
              topics: [], // Organizations don't have topics in the same way
              created_at: org.created_at || new Date().toISOString(),
              updated_at: org.updated_at || new Date().toISOString(),
              pushed_at: org.updated_at || new Date().toISOString(),
              size: 0,
              archived: false,
              disabled: false,
              private: false,
              fork: false,
            }));

            setFeaturedReposState(orgAsRepos);
            sessionStorage.setItem(featuredCacheKey, JSON.stringify(orgAsRepos));
          } else {
            // Fallback to empty array if org fetch fails
            setFeaturedReposState([]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [username]);

  return {
    repos,
    featuredRepos: featuredReposState,
    loading,
    error,
  };
}
