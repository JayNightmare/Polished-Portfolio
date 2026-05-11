export interface GitHubOrganization {
  id: number;
  login: string;
  avatar_url: string;
  description?: string | null;
  blog?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function getGitHubAuthHeaders(): Record<string, string> {
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

export async function fetchUserOrganizations(username: string): Promise<GitHubOrganization[]> {
  const response = await fetch(`https://api.github.com/users/${username}/orgs`, {
    headers: getGitHubAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch organizations');
  }

  return response.json();
}