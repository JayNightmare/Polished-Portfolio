import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
// import { Progress } from './ui/progress';
import { motion } from 'motion/react';
import React, { useState, lazy, Suspense } from 'react';
import { Zap, Code, Database, Wrench, Users, TrendingUp, Calendar, Award } from 'lucide-react';
import { useInViewport } from './hooks/useInViewport';
const GitHubHeatmap = lazy(() =>
  import('./GitHubHeatmap').then((m) => ({ default: m.GitHubHeatmap }))
);

export function Skills() {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const { ref: heatmapRef, isInView: heatmapVisible } = useInViewport<HTMLDivElement>({
    rootMargin: '200px 0px',
  });

  const skillCategories = [
    {
      title: 'Frontend',
      icon: <Code className="h-5 w-5" />,
      color: 'from-blue-500 to-purple-600',
      skills: [
        { name: 'React', level: 45, rank: 'Beginner', year: '2' },
        { name: 'TypeScript', level: 90, rank: 'Learning', year: '1' },
        { name: 'JavaScript', level: 96, rank: 'Intermediate', year: '3' },
        { name: 'Tailwind CSS', level: 64, rank: 'Proficient', year: '1' },
        { name: 'HTML5', level: 80, rank: 'Proficient', year: '4' },
        { name: 'CSS3', level: 85, rank: 'Proficient', year: '4' },
        { name: 'Vue.js', level: 35, rank: 'Learning', year: '0' },
        { name: 'Next.js', level: 28, rank: 'Learning', year: '0' },
        { name: 'Sass', level: 25, rank: 'Learning', year: '1' },
        { name: 'Vite', level: 12, rank: 'Learning', year: '0' },
      ],
    },
    {
      title: 'Backend',
      icon: <Database className="h-5 w-5" />,
      color: 'from-green-500 to-teal-600',
      skills: [
        { name: 'Node.js', level: 92, rank: 'Intermediate', year: '3' },
        { name: 'Express', level: 90, rank: 'Proficient', year: '1' },
        { name: 'Python', level: 85, rank: 'Learning', year: '1' },
        { name: 'Django', level: 78, rank: 'Learning', year: '0' },
        { name: 'PostgreSQL', level: 88, rank: 'Learning', year: '0' },
        { name: 'MongoDB', level: 85, rank: 'Intermediate', year: '3' },
        { name: 'REST APIs', level: 44, rank: 'Intermediate', year: '1' },
        { name: 'GraphQL', level: 22, rank: 'Learning', year: '1' },
        { name: 'Supabase', level: 38, rank: 'Learning', year: '0' },
      ],
    },
    {
      title: 'Tools & DevOps',
      icon: <Wrench className="h-5 w-5" />,
      color: 'from-orange-500 to-red-600',
      skills: [
        { name: 'Git', level: 95, rank: 'Intermediate', year: '5' },
        { name: 'Docker', level: 82, rank: 'Learning', year: '1' },
        { name: 'AWS', level: 78, rank: 'Learning', year: '1' },
        { name: 'Vercel', level: 90, rank: 'Learning', year: '1' },
        { name: 'GitHub Actions', level: 85, rank: 'Proficient', year: '2' },
        { name: 'Jest', level: 88, rank: 'Learning', year: '1' },
        { name: 'ESLint', level: 92, rank: 'Proficient', year: '1' },
        { name: 'Prettier', level: 90, rank: 'Intermediate', year: '2' },
        { name: 'Figma', level: 86, rank: 'Advanced', year: '4' },
        { name: 'VSCode', level: 96, rank: 'advanced', year: '4' },
      ],
    },
    {
      title: 'Soft Skills',
      icon: <Users className="h-5 w-5" />,
      color: 'from-pink-500 to-rose-600',
      skills: [
        { name: 'Problem Solving', level: 75, rank: 'Out-Of-The-Box Thinking', year: '0' },
        { name: 'Team Collaboration', level: 92, rank: 'Leadership Training', year: '2' },
        { name: 'Project Management', level: 88, rank: 'Task Management', year: '2' },
        { name: 'Agile/Scrum', level: 90, rank: 'Intermediate', year: '2' },
        { name: 'Code Review', level: 94, rank: 'Proficient', year: '2' },
        { name: 'Mentoring', level: 85, rank: 'Proficient', year: '1' },
        { name: 'Communication', level: 90, rank: 'Team Player', year: '0' },
      ],
    },
  ];

  return (
    <section id="skills" className="py-20 relative overflow-hidden">
      {/* Background animation */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          background: [
            'radial-gradient(circle at 20% 80%, #e63bf6ff 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, #4b10b9ff 0%, transparent 50%)',
            'radial-gradient(circle at 40% 40%, #0bf594ff 0%, transparent 50%)',
            'radial-gradient(circle at 20% 80%, #f63bd7ff 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              viewport={{ once: true }}
            >
              <Badge variant="outline" className="mb-4">
                <Zap className="h-3 w-3 mr-1" />
                Technical Skills
              </Badge>
            </motion.div>
            <h2 className="text-3xl md:text-4xl mb-6">Technologies I Work With</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive toolkit for building modern web applications, from frontend interfaces
              to scalable backend systems.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skillCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Card className="h-full group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                      <motion.div
                        className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        {category.icon}
                      </motion.div>
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...category.skills]
                        .sort(
                          (a, b) =>
                            (parseInt(b.year || '0', 10) || 0) - (parseInt(a.year || '0', 10) || 0)
                        )
                        .map((skill, skillIndex) => (
                          <HoverCard key={skillIndex} openDelay={200}>
                            <HoverCardTrigger asChild>
                              <motion.div
                                className="group/skill cursor-pointer"
                                onMouseEnter={() => setHoveredSkill(skill.name)}
                                onMouseLeave={() => setHoveredSkill(null)}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4 }}
                                viewport={{ once: true }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm group-hover/skill:text-primary transition-colors duration-200">
                                    {skill.name}
                                  </span>
                                  <motion.span
                                    className="text-xs text-muted-foreground"
                                    initial={{ opacity: 0 }}
                                    animate={{
                                      opacity: hoveredSkill === skill.name ? 1 : 0,
                                    }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {skill.level}%
                                  </motion.span>
                                </div>
                                <div className="relative">
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full bg-gradient-to-r ${category.color} rounded-full`}
                                      initial={{ width: 0 }}
                                      whileInView={{ width: `${skill.level}%` }}
                                      transition={{
                                        duration: 1,
                                        delay: skillIndex * 0.1,
                                        ease: 'easeOut',
                                      }}
                                      viewport={{ once: true }}
                                    />
                                  </div>
                                  <motion.div
                                    className={`absolute top-0 left-0 h-1.5 bg-gradient-to-r ${category.color} rounded-full opacity-0 group-hover/skill:opacity-60`}
                                    style={{ width: `${skill.level}%` }}
                                    animate={{
                                      opacity: hoveredSkill === skill.name ? [0.6, 1, 0.6] : 0,
                                    }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  />
                                </div>
                              </motion.div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64" side="top" align="start">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                  <div
                                    className={`p-1.5 rounded-md bg-gradient-to-r ${category.color} text-white`}
                                  >
                                    {category.icon}
                                  </div>
                                  {skill.name}
                                </h4>
                                <div className="space-y-1.5 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Award className="h-4 w-4" />
                                    <span>
                                      Proficiency: <strong>{skill.rank}</strong>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      Experience:{' '}
                                      <strong>
                                        {skill.year === '0' ? 'Less than 1' : skill.year} year
                                        {skill.year !== '1' ? 's' : ''}
                                      </strong>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        ))}
                    </div>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Years Experience:{' '}
                  {category.skills.reduce((acc, skill) => Math.max(acc, parseInt(skill.year)), 0)}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mb-16 mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-0 shadow-lg backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <motion.div
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="p-3 rounded-full bg-gradient-to-r from-primary to-primary/70">
                    <TrendingUp className="h-6 w-6 text-primary-foreground" />
                  </div>
                </motion.div>
                <h3 className="text-xl mb-4">Always Learning</h3>
                <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  The tech industry moves fast, and I'm committed to continuous learning. Currently
                  exploring: <strong>AI/ML integration</strong>, <strong>WebAssembly</strong>, and{' '}
                  <strong>serverless architectures</strong>. I believe in staying curious and
                  adapting to new challenges.
                </p>

                <motion.div
                  className="flex flex-wrap justify-center gap-2 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  {['AI/ML', 'WebAssembly', 'Serverless', 'Web3', 'Rust'].map((tech, index) => (
                    <motion.div
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      viewport={{ once: true }}
                    >
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        {tech}
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* GitHub Heatmap Section */}
          <div ref={heatmapRef} className="mt-16 mb-8 min-h-48">
            {heatmapVisible && (
              <Suspense fallback={null}>
                {/* Replace 'JayNightmare' with your GitHub username if needed */}
                <GitHubHeatmap username="JayNightmare" />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
