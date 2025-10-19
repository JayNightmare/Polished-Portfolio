import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Github, Linkedin, Mail, Heart, ScrollText } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: <Github className="h-4 w-4" />,
      url: 'https://github.com/JayNightmare',
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="h-4 w-4" />,
      url: 'https://linkedin.com/in/jordan-s-bell',
    },
    {
      name: 'Email',
      icon: <Mail className="h-4 w-4" />,
      url: 'mailto:jn3.enquiries@gmail.com',
    },
    {
      name: 'Resumé',
      icon: <ScrollText className="h-4 w-4" />,
      url: '/Jordan_Bell_CV.pdf',
    },
  ];

  const quickLinks = [
    { name: 'About', href: '#about' },
    { name: 'Skills', href: '#skills' },
    { name: 'Projects', href: '#projects' },
    { name: 'Contact', href: '#contact' },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <span className="text-lg">&lt;Portfolio /&gt;</span>
                <Badge variant="secondary" className="ml-2">
                  Full Stack Developer
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Passionate about creating exceptional digital experiences through clean code,
                innovative solutions, and user-centered design.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-background hover:bg-accent transition-colors"
                    aria-label={link.name}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4">Quick Links</h4>
              <nav className="space-y-2">
                {quickLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSection(link.href)}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="mb-4">Get In Touch</h4>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Available for freelance work and collaboration
                </p>
                <a
                  href="mailto:jn3.enquiries@gmail.com"
                  className="text-sm text-primary hover:underline"
                >
                  jn3.enquiries@gmail.com
                </a>
                <p className="text-sm text-muted-foreground">London, UK</p>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center mb-4 sm:mb-0">
              <span>© {currentYear} Portfolio. Made with</span>
              <Heart className="h-4 w-4 mx-1 text-red-500" />
              <span>and lots of coffee.</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Built with React & Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
