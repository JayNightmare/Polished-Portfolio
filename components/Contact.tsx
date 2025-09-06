import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Check, Mail, MapPin, FileText, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSent(false);
    try {
      const webhookUrl = import.meta.env.VITE_DISCORD_HOOK;
      const embed = {
        embeds: [
          {
            author: { name: 'Contact Form via Portfolio' },
            title: formData.subject || 'New Contact Message',
            description: formData.message,
            color: 5814783,
            fields: [
              { name: 'Name', value: formData.name, inline: true },
              { name: 'Email', value: formData.email, inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(embed),
      });
      if (res.ok) {
        setSent(true);
        toast.success('Message sent!');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    }
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: 'Email',
      value: 'jn3.enquiries@gmail.com',
      description: 'Send me an email anytime',
      action: 'mailto:jn3.enquiries@gmail.com',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'CV',
      value: 'Download CV',
      description: 'Download my CV',
      action: '/cv',
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: 'Location',
      value: 'London, UK',
      description: 'Available for remote, hybrid & onsite work',
      action: 'https://maps.app.goo.gl/iFrGChNw9TwdcYzb7',
    },
  ];

  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Get In Touch
            </Badge>
            <h2 className="text-3xl md:text-4xl mb-6">Let's Work Together</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a project in mind? I'd love to hear about it. Send me a message and let's create
              something amazing together.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send Message</CardTitle>
                <CardDescription>
                  Fill out the form below and I'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What's this about?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell me about your project..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                  {sent && (
                    <motion.div
                      className="text-center mt-16"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Badge className="text-[#0a0a0a] bg-[#5bff84ff] text-center mt-2">
                        <Check className="h-4 w-4 mr-2 inline-block text-green-600" />
                        Your message has been sent!
                      </Badge>
                      <div>
                        {/* Small message saying "Thank you for reaching out!" and a link to the homepage */}
                        <p className="text-sm text-muted-foreground mt-[10px]">
                          Thank you for reaching out! I'll get back to you as soon as possible.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl mb-4">Contact Information</h3>
                <p className="text-muted-foreground mb-8">
                  I'm always open to discussing new opportunities, interesting projects, or just
                  having a chat about technology.
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <Card key={index} className="transition-colors hover:bg-accent/50">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">{info.icon}</div>
                        <div className="flex-1">
                          <h4 className="mb-1">{info.title}</h4>
                          <p className="text-primary mb-1">
                            {info.action.startsWith('#') ? (
                              info.value
                            ) : (
                              <a
                                href={info.action}
                                className="hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {info.value}
                              </a>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{info.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="pt-6">
                <h4 className="mb-4">Availability</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Response Time:</span>
                    <Badge variant="secondary">Within 24 hours</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      Available for projects
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Time Zone:</span>
                    <span className="text-muted-foreground">London, UK (GMT+1)</span>
                  </div>
                  {/* Current time */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Time:</span>
                    <Badge variant="secondary">
                      {new Date().toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
