import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight, Book, MessageCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const helpCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    articles: [
      { id: 1, title: 'Welcome to AUTOPILOT', description: 'Learn the basics of using the platform', views: 1234 },
      { id: 2, title: 'Setting up your profile', description: 'Complete your profile information', views: 892 },
      { id: 3, title: 'Navigation overview', description: 'Find your way around the interface', views: 756 },
    ]
  },
  {
    id: 'maintenance',
    title: 'Maintenance Requests',
    icon: MessageCircle,
    articles: [
      { id: 4, title: 'How to raise a request', description: 'Step-by-step guide to reporting issues', views: 2156 },
      { id: 5, title: 'Request status tracking', description: 'Understanding request lifecycle', views: 1334 },
      { id: 6, title: 'Priority levels explained', description: 'When to use urgent vs normal priority', views: 987 },
    ]
  },
  {
    id: 'services',
    title: 'Services & Booking',
    icon: Video,
    articles: [
      { id: 7, title: 'Room booking guide', description: 'Reserve meeting rooms and spaces', views: 1567 },
      { id: 8, title: 'Cafeteria ordering', description: 'How to pre-order meals and snacks', views: 1123 },
      { id: 9, title: 'Security and visitors', description: 'Managing visitor access and parking', views: 845 },
    ]
  },
];

export function HelpSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  const HelpButton = () => (
    <Button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
      size="lg"
    >
      <HelpCircle className="h-6 w-6" />
    </Button>
  );

  const ArticleView = ({ articleId }: { articleId: number }) => {
    const article = helpCategories
      .flatMap(cat => cat.articles)
      .find(art => art.id === articleId);

    if (!article) return null;

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedArticle(null)}
          className="mb-4"
        >
          ← Back to Help Center
        </Button>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{article.title}</h2>
            <p className="text-muted-foreground">{article.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{article.views} views</Badge>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Article Content</h3>
              <p className="text-muted-foreground">
                This is a placeholder for the full article content. In a real implementation, 
                this would contain the complete help documentation with step-by-step instructions, 
                screenshots, and interactive elements.
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Was this helpful?</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">👍 Yes</Button>
              <Button variant="outline" size="sm">👎 No</Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <HelpButton />
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help Center
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {selectedArticle ? (
              <ScrollArea className="h-[60vh] px-6 pb-6">
                <ArticleView articleId={selectedArticle} />
              </ScrollArea>
            ) : (
              <Tabs defaultValue="help" className="h-full">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="help">Help Articles</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="help" className="mt-4 px-6">
                  <ScrollArea className="h-[50vh]">
                    <div className="space-y-6">
                      {helpCategories.map((category) => (
                        <Card key={category.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <category.icon className="h-5 w-5" />
                              {category.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {category.articles.map((article) => (
                                <div
                                  key={article.id}
                                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                  onClick={() => setSelectedArticle(article.id)}
                                >
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{article.title}</h4>
                                    <p className="text-xs text-muted-foreground">{article.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {article.views}
                                    </Badge>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}