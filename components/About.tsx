import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Code, Users, Zap, Award } from 'lucide-react';

export function About() {
  const highlights = [
    {
      icon: <Code className="h-6 w-6" />,
      title: "Clean Code",
      description: "Writing maintainable, scalable, and well-documented code"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Player",
      description: "Collaborating effectively in agile environments"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Fast Learner",
      description: "Quickly adapting to new technologies and frameworks"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Quality Focus",
      description: "Delivering high-quality solutions that exceed expectations"
    }
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">About Me</Badge>
            <h2 className="text-3xl md:text-4xl mb-6">
              Turning Ideas Into Reality
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              With over 5 years of experience in web development, I specialize in creating 
              modern, responsive applications using cutting-edge technologies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg mb-6">
                I'm a passionate full-stack developer who loves building products that solve 
                real-world problems. My journey started with a curiosity about how websites work, 
                and it has evolved into a career focused on creating exceptional user experiences.
              </p>
              
              <p className="text-lg mb-6">
                I enjoy working with teams to transform complex requirements into elegant solutions. 
                Whether it's architecting scalable backend systems or crafting intuitive user interfaces, 
                I bring both technical expertise and creative problem-solving to every project.
              </p>

              <p className="text-lg">
                When I'm not coding, you can find me contributing to open source projects, 
                learning new technologies, or sharing knowledge with the developer community.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {highlights.map((highlight, index) => (
                <Card key={index} className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg mr-3">
                        {highlight.icon}
                      </div>
                    </div>
                    <h3 className="mb-2">{highlight.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {highlight.description}
                    </p>
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