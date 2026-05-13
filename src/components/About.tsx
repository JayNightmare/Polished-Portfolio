import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Code, Users, Zap, Award } from 'lucide-react';

export function About() {
    const highlights = [
        {
            icon: <Code className="h-6 w-6" />,
            title: 'Open Source Enthusiast',
            description:
                'Contributing to and maintaining open source projects in a variety of languages and backgrounds. Every project is an opportunity to learn and grow, and I take pride in sharing my work with the community',
        },
        {
            icon: <Users className="h-6 w-6" />,
            title: 'Team Player',
            description:
                'Collaborating effectively in agile environments with clear communication and code reviews. I believe that teamwork is essential for delivering high-quality software and achieving project goals.',
        },
        {
            icon: <Zap className="h-6 w-6" />,
            title: 'Fast Learner',
            description:
                'Quickly adapting to new technologies and frameworks through reverse engineering, hands on practice, and reading documentation',
        },
        {
            icon: <Award className="h-6 w-6" />,
            title: 'Quality Focus',
            description:
                'Delivering high-quality software that meets user needs. Writing maintainable, scalable, and well-documented code',
        },
    ];

    return (
        <section id="about" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16" data-aos="fade-up" id="about-header">
                        <Badge variant="outline" className="mb-4">
                            About Me
                        </Badge>
                        <h2 className="text-3xl md:text-4xl mb-6">
                            Full-Stack Developer Building Real-World Products
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Constantly trying to evolve my knowledge in programming by exposing
                            myself to different technologies.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-lg mb-6">
                                While studying at Kingston University, I was exposed to a wide range
                                of programming languages and technologies, including Java, C++,
                                Python, and JavaScript. I found myself particularly drawn to web
                                development and software engineering, which led me to pursue down
                                the research and development field.
                            </p>
                            <p className="text-lg mb-6">
                                After graduating from my Bachelor's degree at Kingston University, I
                                went on to do a Masters in Artificial Intelligence. I had the
                                opportunity to work on several projects, some being personal
                                projects which I initiated myself, and others that were a part of
                                research papers. This included things like building an AI to scan
                                policy documents for compliance, and building a web application to
                                manage and visualize data. These experiences helped me develop my
                                skills in software development and gave me a taste of what it was
                                like to work on real projects with real-world applications.
                            </p>
                            <p className="text-lg mb-6">
                                During this time, I've had many projects being offered to me because
                                of my experience in leading a team and managing complex projects. As
                                a result, I've been able to work on a satellite software competition
                                project for the European Space Agency called LunaNet, and an AI
                                project for the UK government regarding an artificial intelligence
                                module in a satellite for 5G/6G networking. These projects have
                                given me the opportunity to work on a different range of
                                technologies and have helped me develop my skills in efficient and
                                optimized software development while adhering to strict requirements
                                and principles.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {highlights.map((highlight, index) => (
                                <Card key={index} className="p-6 ">
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
