import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Github,
  Linkedin,
  Mail,
  Download,
  ArrowDown,
  Sparkles,
  FileText,
  MessageSquareText,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import Logo from '../assets/icon.svg';

const logo = Logo;

export function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [unreadNewCount, setUnreadNewCount] = useState(0);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch recent blog posts and compute unread counts
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/posts`);
        if (!res.ok) return;
        const data = await res.json();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recent = (Array.isArray(data) ? data : []).filter((p: any) => {
          const d = new Date(p.date);
          return !isNaN(d.getTime()) && d >= weekAgo;
        });

        setNewPostsCount(recent.length);

        const stored = localStorage.getItem('readPosts');
        const readIds: string[] = stored ? JSON.parse(stored) : [];
        const readSet = new Set(readIds);
        const unread = recent.filter((p: any) => {
          const id = p._id || p.id;
          return id && !readSet.has(id);
        }).length;
        setUnreadNewCount(unread);
      } catch (_) {
        // silently ignore for hero badge
      }
    };

    fetchRecentPosts();
  }, [API_BASE]);

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToProjects = () => {
    const element = document.getElementById('projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAbout = () => {
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 relative overflow-hidden"
    >
      {/* Interactive background elements */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(176, 119, 198, 0.4), transparent 50%)`,
        }}
      />

      {/* Floating elements */}
      <motion.div
        className="absolute top-20 left-20 w-4 h-4 bg-primary/20 rounded-full"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute bottom-32 right-32 w-6 h-6 border border-primary/30 rotate-45"
        animate={{
          rotate: [45, 225, 45],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute top-1/4 right-20 w-2 h-2 bg-primary/40 rounded-full"
        animate={{
          x: [0, 10, 0],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      <div className="container mx-auto px-4 py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div>
            <img src={logo} alt="Logo" className="w-[24px] h-[24px] mx-auto mb-4" />
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-6"
          >
            <Badge variant="secondary" className="relative overflow-hidden group">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 1,
                  ease: 'easeInOut',
                }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Available for new opportunities
              </span>
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-1xl lg:text-1xl mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.span
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="inline-block"
            >
              Jordan
            </motion.span>{' '}
            <motion.span
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="inline-block"
            >
              Bell
            </motion.span>
          </motion.h1>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.span
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="inline-block"
            >
              Full Stack
            </motion.span>{' '}
            <motion.span
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="inline-block"
            >
              Developer
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            MSc in Artificial Intelligence | Open Source Developer
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={scrollToProjects}
                size="lg"
                className="w-full sm:w-auto group relative overflow-hidden cursor-pointer"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10">View My Work</span>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={scrollToContact}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto group cursor-pointer"
              >
                <span>Get In Touch</span>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex justify-center space-x-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            {[
              {
                href: 'https://github.com/JayNightmare',
                icon: Github,
                label: 'GitHub',
                new: false,
              },
              {
                href: 'https://linkedin.com/in/jordan-s-bell/',
                icon: Linkedin,
                label: 'LinkedIn',
                new: false,
              },
              { href: '/?/blog', icon: MessageSquareText, label: 'Blog', new: true },
              { href: 'mailto:jn3.enquiries@gmail.com', icon: Mail, label: 'Email', new: false },
              { href: '/Jordan_Bell_CV.pdf', icon: FileText, label: 'Resume', new: false },
            ].map((social, index) => (
              <motion.a
                key={social.label}
                href={social.href}
                target={social.href.startsWith('mailto') ? undefined : '_blank'}
                rel={social.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                className="relative p-3 rounded-full bg-muted transition-all duration-300 group rounded-full border border-muted-foreground/30 cursor-pointer hover:border-primary transition-colors"
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1, delay: 0.1 }}
              >
                {social.new && unreadNewCount > 0 && (
                  <Badge className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 z-20 border-destructive border-2 bg-background/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-pink/20 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: 1,
                        ease: 'easeInOut',
                      }}
                    />
                    <span className="relative z-10">NEW</span>
                  </Badge>
                )}

                <social.icon className="h-5 w-5 relative z-10 group-hover:text-primary transition-colors duration-300" />
              </motion.a>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="p-2 rounded-full border border-muted-foreground/30 cursor-pointer hover:border-primary transition-colors duration-300"
              onClick={scrollToAbout}
            >
              <ArrowDown className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors duration-300" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
