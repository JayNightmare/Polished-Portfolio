import { useGitHub } from './hooks/useGitHub';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import {
  Github,
  Star,
  GitFork,
  Calendar,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';

export default function AllProjects() {
  const { repos, loading, error } = useGitHub({ username: 'JayNightmare' });

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('stars');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Filter and sort repos
  const filteredRepos = useMemo(() => {
    let filtered = repos.filter((repo) => {
      const matchesSearch =
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        repo.topics?.some((topic) => topic.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLanguage = languageFilter === 'all' || repo.language === languageFilter;

      return matchesSearch && matchesLanguage;
    });

    // Sort repos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return b.stargazers_count - a.stargazers_count;
        case 'forks':
          return b.forks_count - a.forks_count;
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return b.stargazers_count + b.forks_count - (a.stargazers_count + a.forks_count);
      }
    });

    return filtered;
  }, [repos, searchTerm, sortBy, languageFilter]);

  // Sort repos by language, then by stars+forks
  const sorted = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    filteredRepos.forEach((repo) => {
      const lang = repo.language || 'Other';
      if (!grouped[lang]) grouped[lang] = [];
      grouped[lang].push(repo);
    });
    return grouped;
  }, [filteredRepos]);

  // Get available languages for filter
  const availableLanguages = useMemo(() => {
    const languages = [
      ...new Set(
        repos.map((repo) => repo.language).filter((lang): lang is string => Boolean(lang))
      ),
    ];
    return languages.sort();
  }, [repos]);

  // Get project image (same logic as Projects component)
  const getProjectImage = (repo: any) => {
    // Try to use the social preview image from GitHub
    const socialPreview = `https://opengraph.githubassets.com/1/${repo.full_name}`;

    const fallbackImages: { [key: string]: string } = {
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

    // Try to match repo name or topics to get appropriate fallback image
    for (const [key, image] of Object.entries(fallbackImages)) {
      if (
        repo.name.toLowerCase().includes(key) ||
        repo.topics?.some((topic: string) => topic.includes(key)) ||
        repo.language?.toLowerCase() === key
      ) {
        return { social: socialPreview, fallback: image };
      }
    }

    return { social: socialPreview, fallback: fallbackImages.react };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const toggleSection = (language: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [language]: !prev[language],
    }));
  };

  if (loading)
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Button variant="outline" asChild className="mb-4 cursor-pointer">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <h2 className="text-3xl text-center mb-8">All Projects</h2>
          </div>
          <div className="text-center">Loading projects...</div>
        </div>
      </section>
    );

  if (error)
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Button variant="outline" asChild className="mb-4 cursor-pointer">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <h2 className="text-3xl text-center mb-8">All Projects</h2>
          </div>
          <div className="text-center text-red-500">{error}</div>
        </div>
      </section>
    );

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-4 cursor-pointer">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4">
                Projects
              </Badge>
            </motion.div>
          </motion.div>

          <h2 className="text-3xl text-center mb-8">All Projects</h2>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 ml-2" />
              <Input
                placeholder="Search projects by name, description, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-[30px]"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stars">Most Stars</SelectItem>
                <SelectItem value="forks">Most Forks</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="text-center text-muted-foreground mb-8">
            {filteredRepos.length} project{filteredRepos.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Projects by Language */}
        {Object.entries(sorted).map(([lang, languageRepos]) => (
          <Collapsible
            key={lang}
            open={!collapsedSections[lang]}
            onOpenChange={() => toggleSection(lang)}
            className="mb-8"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full mb-4 p-3 rounded-lg hover:bg-accent transition-colors">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {lang}
                <Badge variant="secondary" className="ml-2">
                  {languageRepos.length}
                </Badge>
              </h3>
              {collapsedSections[lang] ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {languageRepos.map((repo, index) => {
                  const images = getProjectImage(repo);
                  return (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -8, rotateY: 2 }}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/90 border-0 shadow-md h-full flex flex-col">
                        {/* Background Image */}
                        <a
                          className="aspect-video relative overflow-hidden"
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on GitHub"
                        >
                          <ImageWithFallback
                            src={images.social}
                            alt={repo.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Badge
                              variant="secondary"
                              className="bg-black/40 text-white text-xs border-white/20"
                            >
                              <Star className="h-2 w-2 mr-1" />
                              {repo.stargazers_count}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="bg-black/40 text-white text-xs border-white/20"
                            >
                              <GitFork className="h-2 w-2 mr-1" />
                              {repo.forks_count}
                            </Badge>
                          </div>
                        </a>

                        <CardHeader className="flex-grow">
                          {/* 1. Repo Title */}
                          <CardTitle className="text-base group-hover:text-primary transition-colors duration-300 line-clamp-2">
                            {repo.name
                              .replace(/-/g, ' ')
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </CardTitle>

                          {/* 2. Description */}
                          <CardDescription className="text-xs line-clamp-3 leading-relaxed flex-grow">
                            {repo.description || 'No description available'}
                          </CardDescription>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(repo.updated_at)}
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0 mt-auto">
                          {/* 3. Skills/Topics */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {repo.topics.slice(0, 3).map((topic: string, topicIndex: number) => (
                              <motion.div
                                key={topicIndex}
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                              >
                                <Badge
                                  variant="outline"
                                  className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                                >
                                  {topic}
                                </Badge>
                              </motion.div>
                            ))}
                            {repo.topics.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{repo.topics.length - 3}
                              </Badge>
                            )}
                          </div>

                          {/* 5. View on GitHub */}
                          <div className="flex gap-2">
                            {repo.homepage && (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex-1"
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-xs cursor-pointer"
                                  asChild
                                >
                                  <a href={repo.homepage} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Preview
                                  </a>
                                </Button>
                              </motion.div>
                            )}

                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs cursor-pointer"
                                asChild
                              >
                                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                  <Github className="h-3 w-3 mr-1" />
                                  Code
                                </a>
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        {filteredRepos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
}
