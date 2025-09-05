import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Zap, Code, Database, Wrench, Users, TrendingUp, Calendar } from 'lucide-react';

export function Skills() {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [contributionStats, setContributionStats] = useState({
    total: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  // Helper function to get auth headers for GitHub API
  const getAuthHeaders = (): Record<string, string> => {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  // Fetch GitHub contribution data
  useEffect(() => {
    const fetchContributions = async () => {
      const username = 'JayNightmare'; // Replace with your username or make it configurable
      const cacheKey = `github_contributions_${username}`;

      // Check cache first
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setContributions(data.contributions);
        setContributionStats(data.stats);
        return;
      }

      try {
        // Use GitHub's GraphQL API for contribution data
        const query = `
          query($username: String!) {
            user(login: $username) {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                      color
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            query,
            variables: { username },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const calendar = data.data?.user?.contributionsCollection?.contributionCalendar;

          if (calendar) {
            // Keep the week structure for column-major display
            const weeks = calendar.weeks;
            const total = calendar.totalContributions;

            // Flatten for streak calculation only
            const contributionDays = weeks.flatMap((week: any) => week.contributionDays);

            // Calculate streaks
            const { currentStreak, longestStreak } = calculateStreaks(contributionDays);

            const stats = { total, currentStreak, longestStreak };

            // Store weeks data for column-major rendering
            setContributions(weeks);
            setContributionStats(stats);

            // Cache the results
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ contributions: weeks, stats })
            );
          }
        } else {
          // Force mock data generation for demo
          generateMockContributions();
        }
      } catch (error) {
        console.error('Failed to fetch GitHub contributions:', error);
        // Generate mock data for demo purposes
        generateMockContributions();
      }
    };

    fetchContributions();
  }, []);

  // Calculate contribution streaks
  const calculateStreaks = (days: any[]) => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Sort days by date (newest first)
    const sortedDays = [...days].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate current streak from today backwards
    const today = new Date();
    for (const day of sortedDays) {
      const dayDate = new Date(day.date);
      const daysDiff = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === currentStreak && day.contributionCount > 0) {
        currentStreak++;
      } else if (daysDiff === currentStreak) {
        currentStreak++;
        break;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (const day of days) {
      if (day.contributionCount > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak: currentStreak - 1, longestStreak };
  };

  // Generate mock data if API fails
  const generateMockContributions = () => {
    const weeks: any[] = [];
    const today = new Date();
    
    // Generate 53 weeks (GitHub standard)
    for (let weekIndex = 0; weekIndex < 53; weekIndex++) {
      const week: any = {
        contributionDays: []
      };
      
      // Generate 7 days for each week
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayOffset = (52 - weekIndex) * 7 + (6 - dayIndex);
        const date = new Date(today);
        date.setDate(today.getDate() - dayOffset);

        const contributionCount = Math.random() > 0.7 ? Math.floor(Math.random() * 8) : 0;

        week.contributionDays.push({
          date: date.toISOString().split('T')[0],
          contributionCount,
          color:
            contributionCount === 0
              ? '#ebedf0'
              : contributionCount <= 2
                ? '#65216eff'
                : contributionCount <= 4
                  ? '#9730a1ff'
                  : contributionCount <= 6
                    ? '#b540c4ff'
                    : '#d99be9ff',
        });
      }
      
      weeks.push(week);
    }

    // Calculate total contributions for stats
    const allDays: any[] = weeks.flatMap((week: any) => week.contributionDays);
    const total = allDays.reduce((sum: number, day: any) => sum + day.contributionCount, 0);

    setContributions(weeks);
    setContributionStats({
      total,
      currentStreak: 7,
      longestStreak: 23,
    });
  };

  const skillCategories = [
    {
      title: 'Frontend',
      icon: <Code className="h-5 w-5" />,
      color: 'from-blue-500 to-purple-600',
      skills: [
        { name: 'React', level: 95 },
        { name: 'TypeScript', level: 90 },
        { name: 'Next.js', level: 88 },
        { name: 'Vue.js', level: 75 },
        { name: 'HTML5', level: 98 },
        { name: 'CSS3', level: 92 },
        { name: 'Tailwind CSS', level: 94 },
        { name: 'JavaScript', level: 96 },
        { name: 'Sass', level: 85 },
        { name: 'Webpack', level: 80 },
        { name: 'Vite', level: 82 },
      ],
    },
    {
      title: 'Backend',
      icon: <Database className="h-5 w-5" />,
      color: 'from-green-500 to-teal-600',
      skills: [
        { name: 'Node.js', level: 92 },
        { name: 'Express', level: 90 },
        { name: 'Python', level: 85 },
        { name: 'Django', level: 78 },
        { name: 'PostgreSQL', level: 88 },
        { name: 'MongoDB', level: 85 },
        { name: 'Redis', level: 75 },
        { name: 'REST APIs', level: 94 },
        { name: 'GraphQL', level: 82 },
        { name: 'Prisma', level: 86 },
        { name: 'Supabase', level: 88 },
      ],
    },
    {
      title: 'Tools & DevOps',
      icon: <Wrench className="h-5 w-5" />,
      color: 'from-orange-500 to-red-600',
      skills: [
        { name: 'Git', level: 95 },
        { name: 'Docker', level: 82 },
        { name: 'AWS', level: 78 },
        { name: 'Vercel', level: 90 },
        { name: 'GitHub Actions', level: 85 },
        { name: 'Jest', level: 88 },
        { name: 'Cypress', level: 80 },
        { name: 'ESLint', level: 92 },
        { name: 'Prettier', level: 90 },
        { name: 'Figma', level: 86 },
        { name: 'VS Code', level: 96 },
      ],
    },
    {
      title: 'Soft Skills',
      icon: <Users className="h-5 w-5" />,
      color: 'from-pink-500 to-rose-600',
      skills: [
        { name: 'Problem Solving', level: 95 },
        { name: 'Team Collaboration', level: 92 },
        { name: 'Project Management', level: 88 },
        { name: 'Agile/Scrum', level: 90 },
        { name: 'Code Review', level: 94 },
        { name: 'Mentoring', level: 85 },
        { name: 'Communication', level: 90 },
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
            'radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, #10b981 0%, transparent 50%)',
            'radial-gradient(circle at 40% 40%, #f59e0b 0%, transparent 50%)',
            'radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%)',
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
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
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
                transition={{ duration: 0.6, delay: index * 0.1 }}
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
                      {category.skills.slice(0, 6).map((skill, skillIndex) => (
                        <motion.div
                          key={skillIndex}
                          className="group/skill"
                          onMouseEnter={() => setHoveredSkill(skill.name)}
                          onMouseLeave={() => setHoveredSkill(null)}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: skillIndex * 0.05 }}
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
                      ))}

                      {category.skills.length > 6 && (
                        <motion.div
                          className="flex flex-wrap gap-1 pt-2"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.6 }}
                          viewport={{ once: true }}
                        >
                          {category.skills.slice(6).map((skill, skillIndex) => (
                            <motion.div
                              key={skillIndex}
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                            >
                              <Badge
                                variant="outline"
                                className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                              >
                                {skill.name}
                              </Badge>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-16"
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
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
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

          <motion.div>
            {/* GitHub Heatmap */}
            <motion.div
              className="mt-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-0 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <motion.div
                      className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 text-white"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <Calendar className="h-5 w-5" />
                    </motion.div>
                    GitHub Activity
                  </CardTitle>
                  <CardDescription className="">
                    Visual representation of my coding activity over the past year, showcasing my
                    commit frequency and consistency.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex flex-wrap gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {contributionStats.total}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Contributions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {contributionStats.currentStreak}
                        </div>
                        <div className="text-sm text-muted-foreground">Current Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {contributionStats.longestStreak}
                        </div>
                        <div className="text-sm text-muted-foreground">Longest Streak</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Less</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-muted"></div>
                        <div className="w-3 h-3 rounded-sm bg-[#65216eff]"></div>
                        <div className="w-3 h-3 rounded-sm bg-[#9730a1ff]"></div>
                        <div className="w-3 h-3 rounded-sm bg-[#b540c4ff]"></div>
                        <div className="w-3 h-3 rounded-sm bg-[#d99be9ff]"></div>
                      </div>
                      <span>More</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                      <div className="flex flex-col gap-1 text-xs">
                        {/* Month labels */}
                        <div className="flex justify-between text-muted-foreground mb-2">
                          {[
                            'Jan',
                            'Feb',
                            'Mar',
                            'Apr',
                            'May',
                            'Jun',
                            'Jul',
                            'Aug',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Dec',
                          ].map((month, index) => (
                            <span key={month} className="text-xs">
                              {month}
                            </span>
                          ))}
                        </div>

                        {/* Heatmap grid - Column-major layout */}
                        <div className="flex gap-1">
                          {/* Day labels (Sun-Sat) */}
                          <div className="flex flex-col gap-1 text-right text-xs text-muted-foreground mr-2">
                            <div className="h-3"></div> {/* Spacer for alignment */}
                            <div className="h-3 flex items-center text-xs">Sun</div>
                            <div className="h-3"></div>
                            <div className="h-3 flex items-center text-xs">Tue</div>
                            <div className="h-3"></div>
                            <div className="h-3 flex items-center text-xs">Thu</div>
                            <div className="h-3"></div>
                          </div>
                          
                          {/* Week columns */}
                          {Array.isArray(contributions) && contributions.map((week: any, weekIndex: number) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                              {week.contributionDays.map((day: any, dayIndex: number) => {
                                const contributionLevel =
                                  day.contributionCount === 0
                                    ? 0
                                    : day.contributionCount <= 2
                                      ? 1
                                      : day.contributionCount <= 4
                                        ? 2
                                        : day.contributionCount <= 6
                                          ? 3
                                          : 4;

                                const colors = [
                                  'bg-muted',
                                  'bg-[#65216eff]',
                                  'bg-[#9730a1ff]',
                                  'bg-[#b540c4ff]',
                                  'bg-[#d99be9ff]',
                                ];

                                return (
                                  <motion.div
                                    key={`${day.date}-${weekIndex}-${dayIndex}`}
                                    className={`w-3 h-3 rounded-sm ${colors[contributionLevel]} cursor-pointer`}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.2, delay: (weekIndex * 7 + dayIndex) * 0.002 }}
                                    whileHover={{ scale: 1.2 }}
                                    title={`${day.contributionCount} contributions on ${day.date}`}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Contributions over the last year • Data from GitHub
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
