import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ExternalLink, BookOpen, GraduationCap, Youtube } from "lucide-react";
import { useState } from "react";

interface Topic {
  id: string;
  name: string;
  time_allocated: number;
  is_completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  topics?: Topic[];
}

interface SubjectDetailsProps {
  subject: Subject;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
}

const generateGoogleNotesLinks = (query: string): LinkItem[] => {
  const baseUrl = "https://www.google.com/search?q=";
  return [
    { title: "Study Notes PDF", url: `${baseUrl}${encodeURIComponent(`${query} study notes PDF`)}` },
    { title: "Lecture Notes", url: `${baseUrl}${encodeURIComponent(`${query} lecture notes`)}` },
    { title: "Summary & Cheat Sheet", url: `${baseUrl}${encodeURIComponent(`${query} summary cheat sheet`)}` },
    { title: "Complete Guide", url: `${baseUrl}${encodeURIComponent(`${query} complete guide notes`)}` },
    { title: "Important Questions", url: `${baseUrl}${encodeURIComponent(`${query} important questions answers`)}` },
  ].map((item, index) => ({ ...item, id: `${index}` }));
};

const generateYouTubeLinks = (query: string): LinkItem[] => {
  const baseUrl = "https://www.youtube.com/results?search_query=";
  return [
    { title: "Complete Tutorial", url: `${baseUrl}${encodeURIComponent(`${query} complete tutorial`)}` },
    { title: "Lecture Series", url: `${baseUrl}${encodeURIComponent(`${query} lectures`)}` },
    { title: "Crash Course", url: `${baseUrl}${encodeURIComponent(`${query} crash course`)}` },
  ].map((item, index) => ({ ...item, id: `youtube-${index}` }));
};


export const SubjectDetails = ({ subject }: SubjectDetailsProps) => {
  const [activeTab, setActiveTab] = useState("syllabus");

  const syllabusNotesLinks = generateGoogleNotesLinks(subject.name);
  const syllabusYouTubeLinks = generateYouTubeLinks(subject.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{subject.name}</h3>
          <p className="text-muted-foreground">Complete study resources</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {subject.topics?.length || 0} Topics
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="syllabus" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Complete Syllabus
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Individual Topics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="space-y-4 mt-4">
          {/* Google Notes Links for Complete Subject */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Study Notes & Resources
              </CardTitle>
              <CardDescription>Find comprehensive notes for {subject.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {syllabusNotesLinks.map((link) => (
                <Button
                  key={link.id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {link.title}
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* YouTube Links for Complete Subject */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                Video Tutorials
              </CardTitle>
              <CardDescription>Watch video lectures for {subject.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {syllabusYouTubeLinks.map((link) => (
                <Button
                  key={link.id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  <span className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    {link.title}
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4 mt-4">
          {subject.topics && subject.topics.length > 0 ? (
            subject.topics.map((topic) => {
              const topicNotesLinks = generateGoogleNotesLinks(topic.name);
              const topicYouTubeLinks = generateYouTubeLinks(topic.name);

              return (
                <Card key={topic.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{topic.name}</CardTitle>
                      {topic.is_completed && (
                        <Badge variant="default">Completed</Badge>
                      )}
                    </div>
                    <CardDescription>{topic.time_allocated} minutes allocated</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Google Notes Links */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        Notes Resources
                      </h4>
                      <div className="space-y-1">
                        {topicNotesLinks.slice(0, 3).map((link) => (
                          <Button
                            key={link.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between text-sm"
                            onClick={() => window.open(link.url, '_blank')}
                          >
                            <span className="truncate">{link.title}</span>
                            <ExternalLink className="h-3 w-3 ml-2 flex-shrink-0" />
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* YouTube Links */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        Video Tutorials
                      </h4>
                      <div className="space-y-1">
                        {topicYouTubeLinks.map((link) => (
                          <Button
                            key={link.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between text-sm"
                            onClick={() => window.open(link.url, '_blank')}
                          >
                            <span className="truncate">{link.title}</span>
                            <ExternalLink className="h-3 w-3 ml-2 flex-shrink-0" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No topics added yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
