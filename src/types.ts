export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  academicId: string;
  joinedDate: string;
  // Student metrics
  progress?: number;
  attendanceRate?: number;
  averageGrade?: number;
  aiProfile?: {
    performance: string;
    behavior: string;
    learningStyle: string;
    strengths: string[];
    weaknesses: string[];
    dropoutRisk: 'Bajo' | 'Medio' | 'Alto';
    dropoutReason?: string;
    studyPlan: string[];
  };
  // Parent association
  studentId?: string; // If role is parent, points to their child
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'pdf' | 'quiz' | 'document' | 'link';
  contentUrl: string;
  completed?: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  image: string;
  teacher: string;
  progress: number;
  modules: Module[];
  studentsCount: number;
  schedule: string;
  category: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  courseId: string;
  timeLimit: number; // in minutes
  questions: QuizQuestion[];
}

export interface HomeworkSubmission {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  studentName: string;
  studentId: string;
  status: 'pending' | 'submitted' | 'graded';
  submittedText?: string;
  submittedFile?: string;
  submittedAt?: string;
  grade?: number;
  maxGrade: number;
  feedback?: {
    score: number;
    critique: string;
    plagiarismScore: number; // percentage
    plagiarismReport: string;
    strengths: string[];
    improvements: string[];
  };
}

export interface LiveClass {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  teacher: string;
  startTime: string;
  duration: string; // e.g. "1 hora"
  isLive: boolean;
  meetingId: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
}

export interface CloudFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'xls' | 'ppt' | 'image' | 'video';
  source: 'Drive' | 'OneDrive' | 'Dropbox' | 'INTECA Cloud';
  modifiedAt: string;
  version: number;
}
