# Polished Portfolio w/ GitHub API

A modern, responsive portfolio website built with React, TypeScript, and Tailwind CSS. This project showcases a clean design approach with smooth animations and interactive elements.

## 🚀 Features

- **Modern Tech Stack**: Built with React 18, TypeScript, and Vite for optimal performance
- **Responsive Design**: Fully responsive layout that works seamlessly across all devices
- **Interactive Animations**: Smooth animations using Motion (Framer Motion) for enhanced user experience
- **Component Library**: Built with Radix UI components for accessibility and consistency
- **Dark/Light Theme**: Theme switching capability with next-themes
- **GitHub Integration**: Dynamic project fetching from GitHub repositories
- **Contact Form**: Interactive contact form with validation
- **SEO Optimized**: Includes sitemap generation and meta tags
- **CI/CD Pipeline**: Automated deployment to GitHub Pages
- **Cached Results**: Caches the responses from the API to reduce calls made

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Motion** - Smooth animations and interactions

### UI Components
- **Radix UI** - Accessible, unstyled UI components
- **Lucide React** - Beautiful, customizable icons
- **React Hook Form** - Performant forms with easy validation

### Routing & State
- **React Router DOM** - Client-side routing
- **Custom Hooks** - GitHub API integration

### Development Tools
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/JayNightmare/Polished-Portfolio.git
cd Polished-Portfolio
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment file**

```bash
cp .env.example .env.local
```

Add your environment variables:
```env
VITE_GITHUB_TOKEN=your_github_token_here
VITE_DISCORD_HOOK=your_discord_webhook_url
```

4. **Start the development server**
   
```bash
npm run dev
  ```

5. **Replace GitHub Username**

Go to the search tab in VSCode and replace "jaynightmare" (not cap sensitive) with your GitHub username.

1. **Open your browser**
   
Navigate to `http://localhost:5173` to view the application.

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Type-check then build for production
- `npm run preview` - Preview production build locally
- `npm run typecheck` - Run TypeScript type checking only
- `npm run lint` - Run ESLint on source files
- `npm run format` - Format code with Prettier

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GITHUB_TOKEN` | GitHub personal access token for API calls | Yes |
| `VITE_DISCORD_HOOK` | Discord webhook URL for contact form | Yes |

### Tailwind CSS

The project uses Tailwind CSS v4 with custom configuration. Styles are defined in:
- `styles/globals.css` - Global styles and CSS variables
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.cjs` - PostCSS configuration

## 📱 Components Overview

### Core Components:
- **Header** - Navigation and theme toggle
- **Hero** - Landing section with interactive background
- **About** - Personal information and introduction
- **Skills** - Technical skills showcase
- **Projects** - Featured project gallery
- **Contact** - Contact form and social links
- **Footer** - Site footer with additional links

### Additional Components:
- **All Projects** - All the projects in your GitHub (or manually added projects)
- **GitHub Heatmap** - Heatmap of your contributions on GitHub
- **Animated Background** - Simple Animation playing in the background
- **Typing Text** - Types out text entered in the parameter

### UI Components:
The project includes a comprehensive set of reusable UI components built on Radix UI:
- Buttons, Cards, Dialogs, Forms
- Accordion, Tabs, Tooltips
- Navigation, Breadcrumbs, Pagination
- And many more...

## 🚀 Deployment

### Automatic Deployment:

The project includes automated deployment to GitHub Pages:

1. **Push to main branch** triggers the deployment workflow
2. **Environment variables** are configured in GitHub Secrets
3. **Build process** runs tests, builds the app, and generates sitemap
4. **Deployment** happens automatically to GitHub Pages

### Manual Deployment:

```bash
# Build the project
npm run build

# The built files will be in the `dist` directory
# Deploy the contents of `dist` to your hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Important Notes

### Environment Setup
Make sure to configure your environment variables properly for GitHub integration and contact form functionality to work correctly.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS framework
- [Motion](https://motion.dev/) for smooth animations
- [Lucide](https://lucide.dev/) for beautiful icons
- [Vite](https://vitejs.dev/) for fast development experience

---

**Built with ❤️ using React, TypeScript, and modern web technologies.**
