import type { GitHubRepo } from '../hooks/useGitHub';

const FALLBACK_IMAGES: Record<string, string> = {
  react:
    'https://images.unsplash.com/photo-1665470909939-959569b20021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3ZWIlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzU2NzM1MDg5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  ecommerce:
    'https://images.unsplash.com/photo-1643906226799-59eab234e41d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY29tbWVyY2UlMjBtb2JpbGUlMjBhcHB8ZW58MXx8fHwxNzU2NjU3NjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  vue: 'https://images.unsplash.com/photo-1651055693398-0d66969cf759?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YXNrJTIwbWFuYWdlbWVudCUyMGFwcHxlbnwxfHx8fDE3NTY3NDI5ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  javascript:
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
  typescript:
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
  python:
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
};

export function getProjectImage(repo: GitHubRepo) {
  const socialPreview = repo.avatar_url || `https://opengraph.githubassets.com/1/${repo.full_name}`;

  for (const [key, image] of Object.entries(FALLBACK_IMAGES)) {
    if (
      repo.name.toLowerCase().includes(key) ||
      repo.topics?.some((topic: string) => topic.includes(key)) ||
      repo.language?.toLowerCase() === key
    ) {
      return { social: socialPreview, fallback: image };
    }
  }

  return { social: socialPreview, fallback: FALLBACK_IMAGES.react };
}