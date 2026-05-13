import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './src/components/Header';
import { Hero } from './src/components/Hero';
import { About } from './src/components/About';
import { GitHubOrgStrip } from './src/components/GitHubOrgStrip';
import { Skills } from './src/components/Skills';
import { Projects } from './src/components/Projects';
import { Contact } from './src/components/Contact';
import { Footer } from './src/components/Footer';
// import { Badge } from './src/components/ui/badge';
import { Suspense, lazy, useEffect, useState } from 'react';
const AllProjects = lazy(() => import('./src/components/AllProjects'));
const AnimatedBackground = lazy(() =>
    import('./src/components/AnimatedBackground').then((m) => ({ default: m.AnimatedBackground }))
);
import { Blog } from './src/components/Blog';
import { CreateBlogPost } from './src/components/CreateBlogPost';
import { BlogPost } from './src/components/BlogPost';
import { AdminProvider, ProtectedRoute } from './src/components/AdminContext';
import { AdminLogin } from './src/components/AdminLogin';
import { SEOHead } from './src/components/SEOHead';
import './src/styles/globals.css';
import './src/styles/inline.css';
import './src/styles/github-heatmap.css';

export default function App() {
    const [showBackground, setShowBackground] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setShowBackground(true), 1200);
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <Router>
            <AdminProvider>
                <div className="min-h-screen bg-background relative">
                    {showBackground ? (
                        <Suspense fallback={null}>
                            <AnimatedBackground />
                        </Suspense>
                    ) : null}
                    <div className="relative z-10 flex flex-col min-h-screen">
                        <Header />
                        <main className="flex-grow">
                            <Routes>
                                <Route
                                    path="/"
                                    element={
                                        <>
                                            <SEOHead
                                                title="Jay Bell | Full-Stack Developer Portfolio | React, TypeScript, Node.js"
                                                description="Explore Jay Bell's full-stack developer portfolio featuring React, TypeScript, Node.js, open-source projects, technical skills, and contact details."
                                                path="/"
                                            />
                                            <Hero />
                                            <GitHubOrgStrip />
                                            <About />
                                            <Skills />
                                            <Projects />
                                            <Contact />
                                        </>
                                    }
                                />
                                <Route
                                    path="/all-projects"
                                    element={
                                        <>
                                            <SEOHead
                                                title="All Development Projects | Jay Bell Portfolio"
                                                description="Browse all featured web development projects from Jay Bell, including React, TypeScript, Node.js, and open-source repositories."
                                                path="/all-projects"
                                            />
                                            <Suspense
                                                fallback={
                                                    <div className="text-center mt-20">
                                                        Loading...
                                                    </div>
                                                }
                                            >
                                                <AllProjects />
                                            </Suspense>
                                        </>
                                    }
                                />
                                <Route
                                    path="/blog"
                                    element={
                                        <>
                                            <SEOHead
                                                title="Technical Blog & Project Updates | Jay Bell"
                                                description="Read technical blog posts and project updates from Jay Bell covering web development, engineering experiments, and open-source work."
                                                path="/blog"
                                            />
                                            <Blog />
                                        </>
                                    }
                                />
                                <Route
                                    path="/blog/new"
                                    element={
                                        <>
                                            <SEOHead
                                                title="Create Blog Post | Jay Bell Admin"
                                                description="Admin page for creating blog posts."
                                                path="/blog/new"
                                                noindex
                                            />
                                            <ProtectedRoute>
                                                <CreateBlogPost />
                                            </ProtectedRoute>
                                        </>
                                    }
                                />
                                <Route
                                    path="/blog/edit/:id"
                                    element={
                                        <>
                                            <SEOHead
                                                title="Edit Blog Post | Jay Bell Admin"
                                                description="Admin page for editing blog posts."
                                                path="/blog"
                                                noindex
                                            />
                                            <ProtectedRoute>
                                                <CreateBlogPost />
                                            </ProtectedRoute>
                                        </>
                                    }
                                />
                                <Route
                                    path="/blog/:id"
                                    element={
                                        <>
                                            <SEOHead
                                                title="Blog Post | Jay Bell Technical Blog"
                                                description="Read this technical blog post from Jay Bell's developer portfolio."
                                                path="/blog"
                                            />
                                            <BlogPost />
                                        </>
                                    }
                                />
                                <Route
                                    path="/admin/login"
                                    element={
                                        <>
                                            <SEOHead
                                                title="Admin Login | Jay Bell Portfolio"
                                                description="Admin login for portfolio management."
                                                path="/admin/login"
                                                noindex
                                            />
                                            <AdminLogin />
                                        </>
                                    }
                                />
                                <Route
                                    path="*"
                                    element={
                                        <>
                                            <SEOHead
                                                title="Page Not Found | Jay Bell Portfolio"
                                                description="The page you requested could not be found."
                                                path="/"
                                                noindex
                                            />
                                            <h1 className="text-center mt-20 text-2xl">
                                                404 - Page Not Found
                                            </h1>
                                        </>
                                    }
                                />
                                <Route
                                    path="/Jordan_Bell_CV.pdf"
                                    element={
                                        <>
                                            <SEOHead
                                                title="CV | Jay Bell"
                                                description="View and download Jay Bell's developer CV."
                                                path="/Jordan_Bell_CV.pdf"
                                                noindex
                                            />
                                            <div>
                                                <a
                                                    href="/Jordan_Bell_CV.pdf"
                                                    download
                                                    className="absolute top-[70px] right-4 text-white px-4 py-2 rounded-[5px] bg-background hover:bg-accent/80 transition mb-4 z-10 shadow-md"
                                                >
                                                    Download CV
                                                </a>
                                                <iframe
                                                    src="/Jordan_Bell_CV.pdf"
                                                    title="CV"
                                                    className="w-full h-screen"
                                                />
                                            </div>
                                        </>
                                    }
                                />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </div>
            </AdminProvider>
        </Router>
    );
}
