export type UserRole = 'student' | 'teacher' | 'admin' | 'observer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  academicId: string;
  joinedDate?: string;
  phone?: string;
  suspended?: boolean;
  
  // Student metrics
  progress?: number;
  attendanceRate?: number;
  averageGrade?: number;
  riskScore?: number; // <-- AÑADIDO PARA LA CONSOLA ANALÍTICA
  aiProfile?: {
    performance: string;
    behavior: string;
    learningStyle: string;
    strengths: string[];
    weaknesses: string[];
    dropoutRisk: string;
    dropoutReason?: string;
    studyPlan: string[];
  };
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
  progress?: number;
  studentsCount?: number;
  schedule?: string;
  category: string;
  duration?: string;
  level?: string;
  modules: Module[];
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
  timeLimit: number; // en minutos
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
    plagiarismScore: number; // porcentaje
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
  timestamp: string | Date | any; // Flexibilidad para integrarse con las marcas de tiempo de Firebase
}

export interface CloudFile {
  id: string;
  name: string;
  size: string;
  type: string; // Flexibilidad para Firebase
  source: string; // Flexibilidad para Firebase
  modifiedAt: string;
  version: number;
  url?: string; // <-- AÑADIDO PARA LA BIBLIOTECA CLOUD
  createdAt?: any; // <-- AÑADIDO PARA ORDENAMIENTO EN FIREBASE
}