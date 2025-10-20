import { Badge } from './ui/badge';
import React, { useState, lazy, Suspense } from 'react';
const ReadmeModal = lazy(() => import('./ReadmeModal'));
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import MarkdownIt from 'markdown-it';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ExternalLink, Github, Star, GitFork, Calendar, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { useGitHub } from './hooks/useGitHub';
import { Skeleton } from './ui/skeleton';
import { Link } from 'react-router-dom';
import { useInViewport } from './hooks/useInViewport';

export function Projects() {
  const { ref: sectionRef, isInView } = useInViewport<HTMLDivElement>({ rootMargin: '300px 0px' });
  const { repos, featuredRepos, loading, error } = useGitHub(
    {
      username: 'JayNightmare',
    },
    { enabled: isInView }
  );

  // Modal state for README popup
  const [open, setOpen] = useState(false);
  const [activeRepo, setActiveRepo] = useState<any>(null);

  const handleShowReadme = (repo: any) => {
    setActiveRepo(repo);
    setOpen(true);
  };

  const md = new MarkdownIt();

  // Get project image (same logic as Projects component)
  const getProjectImage = (repo: any) => {
    // Try to use the social preview image from GitHub
    const socialPreview =
      repo.avatar_url || `https://opengraph.githubassets.com/1/${repo.full_name}`;

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

  if (error) {
    return (
      <section id="projects" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl mb-4">Projects</h2>
            <p className="text-muted-foreground">
              Unable to load projects at the moment. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" ref={sectionRef} className="py-20 bg-muted/30 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
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
                Featured Work
              </Badge>
            </motion.div>
            <h2 className="text-3xl md:text-4xl mb-6">Projects That Make a Difference</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A selection of projects that showcase my skills and passion for creating meaningful
              digital experiences.
            </p>
          </motion.div>

          <div className="grid gap-8">
            {/* Featured Projects */}
            {loading ? (
              <div className="grid md:grid-cols-2 gap-8">
                {[1, 2].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 mb-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-18" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {featuredRepos.map((repo, index) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                      <motion.div
                        className="aspect-video relative overflow-hidden cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => handleShowReadme(repo)}
                        title="View README"
                      >
                        <ImageWithFallback
                          src={getProjectImage(repo).social}
                          alt={repo.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={false}
                        />
                      </motion.div>

                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                            {repo.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </CardTitle>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          >
                            <Badge
                              variant="secondary"
                              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
                            >
                              Organisations
                            </Badge>
                          </motion.div>
                        </div>
                        <CardDescription className="text-sm leading-relaxed">
                          {repo.description}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(repo.updated_at)}
                          </div>
                          {repo.language && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              {repo.language}
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {repo.topics.slice(0, 5).map((topic: string, topicIndex: number) => (
                            <motion.div
                              key={topicIndex}
                              whileHover={{ scale: 1.05 }}
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
                        </div>

                        <div className="flex gap-2">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1"
                          >
                            <Button
                              size="sm"
                              className="w-full group/button"
                              asChild
                              disabled={!repo.homepage}
                            >
                              <a
                                href={repo.homepage || repo.html_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <motion.div
                                  className="mr-2"
                                  animate={{ rotate: [0, 5, -5, 0] }}
                                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                                >
                                  {repo.homepage ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <ExternalLink className="h-4 w-4" />
                                  )}
                                </motion.div>
                                {repo.homepage ? 'Live Demo' : 'Preview'}
                              </a>
                            </Button>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full" asChild>
                              <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                <Github className="h-4 w-4 mr-2" />
                                Code
                              </a>
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Other Projects */}
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <CardHeader className="p-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex gap-1 mb-3">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-7 flex-1" />
                        <Skeleton className="h-7 flex-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {repos
                  .filter((repo) => !featuredRepos.includes(repo))
                  .slice(0, 8)
                  .map((repo, index) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -8, rotateY: 5 }}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/90 border-0 shadow-md">
                        <motion.div
                          className="aspect-video relative overflow-hidden cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => handleShowReadme(repo)}
                          title="View README"
                        >
                          <ImageWithFallback
                            src={getProjectImage(repo).social}
                            alt={repo.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </motion.div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Badge
                            variant="secondary"
                            className="bg-black/40 text-white text-xs border-white/20"
                          >
                            <Star className="h-2 w-2 mr-1" />
                            {repo.stargazers_count}
                          </Badge>
                        </div>

                        <CardHeader className="p-4">
                          <CardTitle className="text-base group-hover:text-primary transition-colors duration-300">
                            {repo.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                            {repo.description}
                          </CardDescription>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(repo.updated_at)}
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-0">
                          <div className="flex flex-wrap gap-1 mb-3">
                            {repo.topics.slice(0, 2).map((topic: string, topicIndex: number) => (
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
                            {repo.topics.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{repo.topics.length - 2}
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className=""
                            >
                              {repo.homepage ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 p-1"
                                  asChild
                                  disabled={!repo.homepage}
                                >
                                  <a
                                    href={repo.homepage || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Preview ${repo.name}`}
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span className="sr-only">Preview {repo.name}</span>
                                  </a>
                                </Button>
                              ) : null}
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className=""
                            >
                              <Button size="sm" variant="outline" className="flex-1 p-1" asChild>
                                <a
                                  href={repo.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`View ${repo.name} on GitHub`}
                                >
                                  <Github className="h-3 w-3" />
                                  <span className="sr-only">View {repo.name} on GitHub</span>
                                </a>
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                {/* Readme Modal for Other Projects (lazy) */}
                <Suspense fallback={null}>
                  <ReadmeModal repo={activeRepo} isOpen={open} onClose={() => setOpen(false)} />
                </Suspense>
              </div>
            )}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="text-muted-foreground mb-4">Want to see more of my work?</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" asChild>
                <Link to="/all-projects">
                  <Github className="h-4 w-4 mr-2" />
                  View All Projects
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
