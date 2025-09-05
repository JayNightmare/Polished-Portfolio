import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { AnimatedBackground } from './components/AnimatedBackground';
import AllProjects from './components/AllProjects';
import './styles/globals.css';
import './styles/github-heatmap.css';

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
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </Router>
  );
}
