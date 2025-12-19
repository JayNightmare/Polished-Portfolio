import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MarkdownIt from 'markdown-it';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Calendar, Trash2, Pencil } from 'lucide-react';
import { BlogPost as BlogPostType } from './Blog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { useAdmin, getAdminToken } from './AdminContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const md = new MarkdownIt({ html: true, linkify: true, breaks: true, typographer: true });
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/posts/${id}`);
        if (!response.ok) throw new Error('Post not found');
        const data = await response.json();
        setPost({
          ...data,
          id: data._id,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Mark post as read once loaded
  useEffect(() => {
    if (!post?.id) return;
    try {
      const key = 'readPosts';
      const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (!existing.includes(post.id)) {
        localStorage.setItem(key, JSON.stringify([...existing, post.id]));
      }
    } catch (_) {
      // ignore localStorage issues
    }
  }, [post?.id]);

  const handleDelete = async () => {
    if (!isAdmin) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      const response = await fetch(`${API_BASE}/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getAdminToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }

      navigate('/blog');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 blog-section">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 blog-section">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Link to="/blog">
            <Button className="cursor-pointer">Back to Blog</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 blog-section">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/blog">
            <Button variant="ghost" className="gap-2 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Back to All Posts
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-4xl font-bold flex-1">{post.title}</h1>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Link to={`/blog/edit/${post.id}`}>
                      <Button variant="secondary" size="icon" className="h-10 w-10 cursor-pointer">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-10 w-10 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>
                            {deleteLoading ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.date)}</span>
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
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

            {/* Content */}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: md.render(post.content) }}
            />

            {/* Images */}
            {post.images.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Images</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.images.map((image, index) => (
                    <div key={index} className="rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Image ${index + 1}`}
                        className="w-full h-auto object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(image, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {post.videos.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Videos</h2>
                <div className="grid grid-cols-1 gap-4">
                  {post.videos.map((video, index) => (
                    <div key={index} className="rounded-lg overflow-hidden cursor-pointer">
                      <video src={video} controls className="w-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {deleteError && (
          <Card className="mt-6">
            <CardContent className="py-4">
              <p className="text-destructive">{deleteError}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
