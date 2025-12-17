import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MarkdownIt from 'markdown-it';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Calendar, Image as ImageIcon, Video, X } from 'lucide-react';
import { useAdmin, getAdminToken } from './AdminContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  images: string[];
  videos: string[];
  tags: string[];
}

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { isAdmin } = useAdmin();
  const md = useMemo(() => new MarkdownIt({ html: true, linkify: true, breaks: true }), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/posts`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        // Convert MongoDB _id to id for frontend compatibility
        const formattedPosts = data.map((post: any) => ({
          ...post,
          id: post._id,
        }));
        setPosts(formattedPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return posts
      .filter((post) => {
        const matchesQuery =
          !query ||
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query);

        const matchesTags =
          selectedTags.length === 0 || selectedTags.every((tag) => post.tags.includes(tag));

        return matchesQuery && matchesTags;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [posts, searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 blog-section">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">Project Updates</h1>
            <p className="text-muted-foreground">
              Follow my journey as I build and share progress on my projects
            </p>
          </div>
          {isAdmin && (
            <Link to="/blog/new">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                New Post
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">Loading posts...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-destructive mb-4">Error loading posts: {error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No posts yet. Check back later for updates!
              </p>
              {isAdmin && (
                <Link to="/blog/new">
                  <Button>Create Your First Post</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-4 lg:grid-cols-[1.2fr,3fr] items-start">
              <div className="space-y-3">
                <Input
                  placeholder="Search by title or content"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="flex flex-wrap gap-2 items-center">
                  {allTags.length > 0 &&
                    allTags.map((tag) => {
                      const isActive = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted text-foreground hover:border-primary'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}

                  {(searchQuery || selectedTags.length > 0) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4" /> Clear
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {filteredPosts.length === 0 && (
                  <Card className="text-center">
                    <CardContent className="py-10">
                      <p className="text-muted-foreground">No posts match these filters.</p>
                    </CardContent>
                  </Card>
                )}

                {filteredPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.id}`}>
                    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(post.date)}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {post.images.length > 0 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                                {post.images.length}
                              </div>
                            )}
                            {post.videos.length > 0 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Video className="h-4 w-4" />
                                {post.videos.length}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="text-muted-foreground line-clamp-3 mb-4 prose prose-sm dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: md.render(post.content) }}
                        />

                        {/* Preview images */}
                        {post.images.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                            {post.images.slice(0, 4).map((image, index) => (
                              <div
                                key={index}
                                className="aspect-square rounded-md overflow-hidden bg-muted"
                              >
                                <img
                                  src={image}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {post.images.length > 4 && (
                              <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  +{post.images.length - 4} more
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
