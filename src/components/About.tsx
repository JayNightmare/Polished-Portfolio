import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Code, Users, Zap, Award } from 'lucide-react';

export function About() {
  const highlights = [
    {
      icon: <Code className="h-6 w-6" />,
      title: 'Clean Code',
      description: 'Writing maintainable, scalable, and well-documented code',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Team Player',
      description: 'Collaborating effectively in agile environments',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Fast Learner',
      description: 'Quickly adapting to new technologies and frameworks',
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'Quality Focus',
      description: 'Delivering high-quality solutions that exceed expectations',
    },
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              About Me
            </Badge>
            <h2 className="text-3xl md:text-4xl mb-6">Turning Ideas Into Reality</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Constantly trying to evolve my knowledge in programming by exposing myself to
              different technologies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg mb-6">
                At University, I was taught several different languages ranging from Java to Machine
                Learning Python.
              </p>
              <p className="text-lg mb-6">
                While studying, I would constantly be wanting more work to do, so I tasked myself
                coding projects. The projects started small, such as a simple weather app and
                quickly turned into more complex projects, making sure to keep in mind best
                practices and a modular codebase with easily addressable comments for better
                maintainability.
              </p>
              <p className="text-lg">
                Currently, I'm working on several big projects, such as:
                <ul>
                  <li>- DisTrack: Track your coding time</li>
                  <li>- PhunParty: Kahoot meets JackBox Games, a party game for all</li>
                  <li>- AP: Control with your mind</li>
                </ul>
                Mainly working in a JavaScript/TypeScript and Python tech stack with frameworks
                (React, Next.JS, Discord.JS, Vue, Django, and FastAPI).
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {highlights.map((highlight, index) => (
                <Card key={index} className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg mr-3">{highlight.icon}</div>
                    </div>
                    <h3 className="mb-2">{highlight.title}</h3>
                    <p className="text-sm text-muted-foreground">{highlight.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
