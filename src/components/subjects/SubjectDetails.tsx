import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, FileText, ExternalLink, BookOpen, GraduationCap } from "lucide-react";
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

const generateYouTubeLinks = (query: string): LinkItem[] => {
  const baseUrl = "https://www.youtube.com/results?search_query=";
  return [
    { title: "Tutorial & Explanation", url: `${baseUrl}${encodeURIComponent(`${query} tutorial explanation`)}` },
    { title: "Examples & Solutions", url: `${baseUrl}${encodeURIComponent(`${query} examples solved`)}` },
    { title: "Practice Problems", url: `${baseUrl}${encodeURIComponent(`${query} practice problems`)}` },
    { title: "Crash Course", url: `${baseUrl}${encodeURIComponent(`${query} crash course`)}` },
    { title: "Step by Step Guide", url: `${baseUrl}${encodeURIComponent(`${query} step by step guide`)}` },
  ].map((item, index) => ({ ...item, id: `${index}` }));
};

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

const generateTopicNotes = (topicTitle: string): string => {
  return `📚 Study Notes for ${topicTitle}

🎯 Learning Objectives:
• Master key concepts of ${topicTitle}
• Apply knowledge to practical scenarios
• Develop problem-solving strategies
• Connect concepts across different contexts

📖 Key Concepts:
• Fundamental principles and theories
• Relationships between different concepts
• Multiple approaches to problem-solving
• Integration with related topics
• Common variations and important points

💡 Study Tips:
• Create detailed concept maps
• Practice with diverse problem types
• Explain concepts to others (teaching method)
• Use active recall and spaced repetition
• Analyze mistakes to improve understanding
• Form study groups for discussion

⏰ Recommended Study Approach:
1. Prerequisites review (20 mins)
2. Core concept deep dive (60 mins)
3. Examples analysis (50 mins)
4. Problem-solving practice (80 mins)
5. Concept connections mapping (25 mins)
6. Self-assessment quiz (30 mins)

🔄 Review Schedule:
• Daily: Concept review with examples (15 mins)
• Weekly: Mixed practice problems (45 mins)
• Bi-weekly: Teaching/explaining to others (30 mins)
• Before exam: Intensive review (2 hours)

🎯 Success Metrics:
• Can solve problems accurately
• Explains concepts with examples
• Makes connections between topics
• Applies knowledge to new situations`;
};

export const SubjectDetails = ({ subject }: SubjectDetailsProps) => {
  const [activeTab, setActiveTab] = useState("syllabus");

  const syllabusYoutubeLinks = generateYouTubeLinks(subject.name);
  const syllabusNotesLinks = generateGoogleNotesLinks(subject.name);

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
          {/* YouTube Links for Complete Subject */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                YouTube Learning Resources
              </CardTitle>
              <CardDescription>Video tutorials for {subject.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {syllabusYoutubeLinks.map((link) => (
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

          {/* AI Generated Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                AI Generated Study Guide
              </CardTitle>
              <CardDescription>Structured notes for {subject.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                {generateTopicNotes(subject.name)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4 mt-4">
          {subject.topics && subject.topics.length > 0 ? (
            subject.topics.map((topic) => {
              const topicYoutubeLinks = generateYouTubeLinks(topic.name);
              const topicNotesLinks = generateGoogleNotesLinks(topic.name);

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
                    {/* YouTube Links */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        YouTube Resources
                      </h4>
                      <div className="space-y-1">
                        {topicYoutubeLinks.slice(0, 3).map((link) => (
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

                    {/* AI Generated Notes */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        Study Notes
                      </h4>
                      <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded-lg max-h-48 overflow-y-auto">
                        {generateTopicNotes(topic.name)}
                      </pre>
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
