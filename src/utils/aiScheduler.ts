// AI Scheduling Engine - Core Algorithm

interface Topic {
  id: string;
  title: string;
  estimatedHours: number;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  progress: number;
  subjectId: string;
  subjectName: string;
  youtubeLinks?: string[];
  notes?: string;
}

interface Subject {
  id: string;
  name: string;
  examDate: string;
  topics: Topic[];
  dailyHours: number;
  progress: number;
}

interface DailyTask {
  id: string;
  date: string;
  topicId: string;
  topicTitle: string;
  subjectName: string;
  estimatedHours: number;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  actualHours?: number;
  youtubeLinks?: string[];
  notes?: string;
}

interface SchedulePlan {
  dailyTasks: DailyTask[];
  totalHours: number;
  daysUntilExams: number;
  averageHoursPerDay: number;
  recommendations: string[];
}

export class AIScheduler {
  private difficultyWeights = {
    easy: 1,
    medium: 1.5,
    hard: 2
  };

  generateSchedule(subjects: Subject[]): SchedulePlan {
    const allTopics = this.extractTopicsFromSubjects(subjects);
    const incompleteTasks = allTopics.filter(topic => !topic.completed);
    
    if (incompleteTasks.length === 0) {
      return {
        dailyTasks: [],
        totalHours: 0,
        daysUntilExams: 0,
        averageHoursPerDay: 0,
        recommendations: ["All topics completed! Great job!"]
      };
    }

    // Sort by priority (exam date, difficulty, remaining hours)
    const prioritizedTasks = this.prioritizeTasks(incompleteTasks);
    
    // Calculate available study time
    const studyPlan = this.calculateStudyPlan(subjects);
    
    // Generate daily schedule using greedy algorithm
    const dailyTasks = this.generateDailyTasks(prioritizedTasks, studyPlan);
    
    // Generate AI recommendations
    const recommendations = this.generateRecommendations(subjects, studyPlan);

    return {
      dailyTasks,
      totalHours: incompleteTasks.reduce((sum, task) => sum + task.estimatedHours, 0),
      daysUntilExams: studyPlan.daysUntilExams,
      averageHoursPerDay: studyPlan.averageHoursPerDay,
      recommendations
    };
  }

  private extractTopicsFromSubjects(subjects: Subject[]): Topic[] {
    const topics: Topic[] = [];
    
    subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        topics.push({
          ...topic,
          subjectId: subject.id,
          subjectName: subject.name,
          estimatedHours: topic.estimatedHours * (100 - topic.progress) / 100
        });
      });
    });
    
    return topics;
  }

  private prioritizeTasks(topics: Topic[]): Topic[] {
    return topics.sort((a, b) => {
      // Higher difficulty gets higher priority
      const difficultyScore = this.difficultyWeights[b.difficulty] - this.difficultyWeights[a.difficulty];
      
      // More remaining hours gets higher priority
      const hoursScore = b.estimatedHours - a.estimatedHours;
      
      // Combine scores
      return difficultyScore * 2 + hoursScore;
    });
  }

  private calculateStudyPlan(subjects: Subject[]) {
    const now = new Date();
    const examDates = subjects.map(s => new Date(s.examDate));
    const earliestExam = new Date(Math.min(...examDates.map(d => d.getTime())));
    
    const daysUntilExams = Math.max(1, Math.ceil((earliestExam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDailyHours = subjects.reduce((sum, s) => sum + s.dailyHours, 0);
    
    return {
      daysUntilExams,
      totalDailyHours,
      averageHoursPerDay: totalDailyHours / subjects.length
    };
  }

  private generateDailyTasks(topics: Topic[], studyPlan: any): DailyTask[] {
    const dailyTasks: DailyTask[] = [];
    const now = new Date();
    
    let currentDay = 0;
    let remainingTopics = [...topics];
    
    while (remainingTopics.length > 0 && currentDay < studyPlan.daysUntilExams) {
      const currentDate = new Date(now);
      currentDate.setDate(currentDate.getDate() + currentDay);
      
      let dailyHoursRemaining = studyPlan.totalDailyHours;
      const dayTasks: DailyTask[] = [];
      
      // Greedy algorithm: fit as many tasks as possible in daily hours
      for (let i = 0; i < remainingTopics.length && dailyHoursRemaining > 0; i++) {
        const topic = remainingTopics[i];
        const hoursToAllocate = Math.min(topic.estimatedHours, dailyHoursRemaining);
        
        if (hoursToAllocate >= 0.5) { // Minimum 30 minutes per session
          const task: DailyTask = {
            id: `${topic.id}-${currentDate.toISOString().split('T')[0]}`,
            date: currentDate.toISOString().split('T')[0],
            topicId: topic.id,
            topicTitle: topic.title,
            subjectName: topic.subjectName,
            estimatedHours: hoursToAllocate,
            difficulty: topic.difficulty,
            completed: false,
            youtubeLinks: topic.youtubeLinks,
            notes: topic.notes
          };
          
          dayTasks.push(task);
          dailyHoursRemaining -= hoursToAllocate;
          
          // Update remaining hours for topic
          topic.estimatedHours -= hoursToAllocate;
          
          // Remove topic if completed
          if (topic.estimatedHours <= 0) {
            remainingTopics.splice(i, 1);
            i--; // Adjust index after removal
          }
        }
      }
      
      dailyTasks.push(...dayTasks);
      currentDay++;
    }
    
    return dailyTasks;
  }

  private generateRecommendations(subjects: Subject[], studyPlan: any): string[] {
    const recommendations: string[] = [];
    
    // Time management recommendations
    if (studyPlan.averageHoursPerDay > 8) {
      recommendations.push("Consider reducing daily study hours to avoid burnout. Quality over quantity!");
    } else if (studyPlan.averageHoursPerDay < 2) {
      recommendations.push("Consider increasing daily study time to ensure adequate preparation.");
    }
    
    // Difficulty balance
    const hardTopics = subjects.flatMap(s => s.topics).filter(t => t.difficulty === "hard" && !t.completed);
    if (hardTopics.length > 0) {
      recommendations.push("Start with difficult topics when your mind is fresh, typically in the morning.");
    }
    
    // Exam proximity
    if (studyPlan.daysUntilExams < 14) {
      recommendations.push("Focus on revision and practice problems rather than learning new concepts.");
    } else if (studyPlan.daysUntilExams > 60) {
      recommendations.push("You have plenty of time! Focus on building strong foundations in each topic.");
    }
    
    // Progress-based recommendations
    const behindSchedule = subjects.filter(s => s.progress < 30);
    if (behindSchedule.length > 0) {
      recommendations.push(`Prioritize ${behindSchedule[0].name} - you're behind schedule on this subject.`);
    }
    
    // Study techniques
    recommendations.push("Use the Pomodoro Technique: 25 minutes focused study, 5 minutes break.");
    recommendations.push("Review yesterday's topics for 10 minutes before starting new material.");
    
    return recommendations;
  }

  // Adaptive rescheduling when tasks are missed
  rescheduleAfterMissedTasks(currentPlan: SchedulePlan, missedTasks: DailyTask[]): SchedulePlan {
    const today = new Date().toISOString().split('T')[0];
    
    // Remove missed tasks from current plan
    const activeTasks = currentPlan.dailyTasks.filter(task => 
      !missedTasks.some(missed => missed.id === task.id)
    );
    
    // Redistribute missed hours to future days
    const futureTasks = activeTasks.filter(task => task.date > today);
    const totalMissedHours = missedTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    
    if (futureTasks.length > 0) {
      const additionalHoursPerDay = totalMissedHours / futureTasks.length;
      
      futureTasks.forEach(task => {
        task.estimatedHours += additionalHoursPerDay;
      });
    }
    
    const updatedRecommendations = [
      "Don't worry about missed tasks - I've redistributed them to future days.",
      "Stay consistent with your schedule to avoid falling behind.",
      ...currentPlan.recommendations.slice(2) // Keep original recommendations
    ];
    
    return {
      ...currentPlan,
      dailyTasks: activeTasks,
      recommendations: updatedRecommendations
    };
  }

  // Spaced repetition implementation
  calculateReviewSchedule(completedTopics: Topic[]): DailyTask[] {
    const reviewTasks: DailyTask[] = [];
    const today = new Date();
    
    completedTopics.forEach(topic => {
      // Spaced repetition intervals: 1, 3, 7, 14, 30 days
      const intervals = [1, 3, 7, 14, 30];
      
      intervals.forEach((interval, index) => {
        const reviewDate = new Date(today);
        reviewDate.setDate(reviewDate.getDate() + interval);
        
        const reviewTask: DailyTask = {
          id: `review-${topic.id}-${interval}`,
          date: reviewDate.toISOString().split('T')[0],
          topicId: topic.id,
          topicTitle: `Review: ${topic.title}`,
          subjectName: topic.subjectName,
          estimatedHours: Math.max(0.25, topic.estimatedHours * 0.1), // 10% of original time
          difficulty: topic.difficulty,
          completed: false,
          youtubeLinks: topic.youtubeLinks,
          notes: topic.notes
        };
        
        reviewTasks.push(reviewTask);
      });
    });
    
    return reviewTasks;
  }
}