import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Badge } from './components/ui/badge';
import AllProjects from './components/AllProjects';
import './styles/globals.css';
import './styles/github-heatmap.css';
import CV from './src/assets/Jordan_Bell_CV.pdf';

const cv = CV;

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background relative">
        <AnimatedBackground />
        <div className="relative z-10">
          <Header />
          <main>
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
              <Route path="/all-projects" element={<AllProjects />} />
              <Route
                path="*"
                element={<h1 className="text-center mt-20 text-2xl">404 - Page Not Found</h1>}
              />
              <Route
                path="/cv"
                element={
                  // Open the PDF in a new tab
                  <div>
                    <a
                      href={cv}
                      download
                      className="absolute top-[70px] right-4 text-white px-4 py-2 rounded-[5px] bg-background hover:bg-accent/80 transition mb-4 z-10 shadow-md"
                    >
                      Download CV
                    </a>
                    <iframe src={cv} title="CV" className="w-full h-screen" />
                    // download button
                  </div>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </Router>
  );
}
