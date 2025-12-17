import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './src/components/Header';
import { Hero } from './src/components/Hero';
import { About } from './src/components/About';
import { Skills } from './src/components/Skills';
import { Projects } from './src/components/Projects';
import { Contact } from './src/components/Contact';
import { Footer } from './src/components/Footer';
import { AnimatedBackground } from './src/components/AnimatedBackground';
// import { Badge } from './src/components/ui/badge';
import { Suspense, lazy } from 'react';
const AllProjects = lazy(() => import('./src/components/AllProjects'));
import { Blog } from './src/components/Blog';
import { CreateBlogPost } from './src/components/CreateBlogPost';
import { BlogPost } from './src/components/BlogPost';
import { AdminProvider, ProtectedRoute } from './src/components/AdminContext';
import { AdminLogin } from './src/components/AdminLogin';
import './src/styles/globals.css';
import './src/styles/github-heatmap.css';

export default function App() {
  return (
    <Router>
      <AdminProvider>
        <div className="min-h-screen bg-background relative">
          <AnimatedBackground />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <Hero />
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
                    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
                      <AllProjects />
                    </Suspense>
                  }
                />
                <Route path="/blog" element={<Blog />} />
                <Route
                  path="/blog/new"
                  element={
                    <ProtectedRoute>
                      <CreateBlogPost />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/blog/edit/:id"
                  element={
                    <ProtectedRoute>
                      <CreateBlogPost />
                    </ProtectedRoute>
                  }
                />
                <Route path="/blog/:id" element={<BlogPost />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="*"
                  element={<h1 className="text-center mt-20 text-2xl">404 - Page Not Found</h1>}
                />
                <Route
                  path="/Jordan_Bell_CV.pdf"
                  element={
                    <div>
                      <a
                        href="/Jordan_Bell_CV.pdf"
                        download
                        className="absolute top-[70px] right-4 text-white px-4 py-2 rounded-[5px] bg-background hover:bg-accent/80 transition mb-4 z-10 shadow-md"
                      >
                        Download CV
                      </a>
                      <iframe src="/Jordan_Bell_CV.pdf" title="CV" className="w-full h-screen" />
                    </div>
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
