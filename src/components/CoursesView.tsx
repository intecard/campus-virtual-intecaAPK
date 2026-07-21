import React, { useState, useEffect } from "react";
import { 
  BookOpen, ChevronRight, FolderDown, HelpCircle, Clock, AlertTriangle, ArrowLeft,
  Sparkles, Award, Loader2, FileText, Video, Send, Plus, Trash2, Save, Image, Edit3, 
  Link as LinkIcon, X, Box, UploadCloud, FolderArchive, Layers, CheckSquare, Users, UserCheck
} from "lucide-react";
import { Course, UserProfile, QuizQuestion } from "../types";
import { db } from "../firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";

interface CoursesViewProps {
  currentUser: UserProfile;
  courses: Course[];
  setActiveTab: (tab: string) => void;
  onGradeHomework?: (courseId: string, taskTitle: string, submissionText: string) => Promise<any>;
}

export default function CoursesView({ currentUser, courses, setActiveTab, onGradeHomework }: CoursesViewProps) {
  
  // ==========================================
  // ESTADOS DE NAVEGACIÓN Y VISTAS
  // ==========================================
  const [viewMode, setViewMode] = useState<'catalog' | 'detail' | 'studio'>('catalog');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'syllabus' | 'quizzes' | 'homework' | 'lti'>('syllabus');
  
  // ==========================================
  // ESTADOS DEL CONSTRUCTOR DE CURSOS (STUDIO)
  // ==========================================
  const [isSaving, setIsSaving] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [courseForm, setCourseForm] = useState<Partial<Course> & any>({
    title: "", code: "INT-", category: "", description: "", duration: "4 semanas", 
    level: "Técnico", teacher: currentUser.name, teacherId: "", image: "", format: "native",
    enrolledStudents: [], modules: []
  });

  const isMaster = currentUser.email?.toLowerCase() === "luisramirezescalante1985@gmail.com";
  const isAdmin = currentUser.role === 'admin' || isMaster;

  // Cargar lista de usuarios para matriculación y asignación docente
  useEffect(() => {
    if (isAdmin || currentUser.role === 'teacher') {
      const fetchUsers = async () => {
        try {
          const uSnap = await getDocs(collection(db, "users"));
          const allU = uSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
          setTeachers(allU.filter(u => u.role === 'admin' || u.role === 'teacher'));
          setStudents(allU.filter(u => u.role === 'student'));
        } catch (error) {
          console.error("Error al cargar usuarios para el Studio:", error);
        }
      };
      fetchUsers();
    }
  }, [currentUser, isAdmin]);

  // ==========================================
  // ESTADOS DE EXÁMENES IA Y TAREAS
  // ==========================================
  const [activeQuizTopic, setActiveQuizTopic] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [timerCount, setTimerCount] = useState(120); 
  const [timerInterval, setTimerInterval] = useState<any>(null);

  const [submittingHomework, setSubmittingHomework] = useState(false);
  const [homeworkText, setHomeworkText] = useState("");
  const [homeworkGradedResult, setHomeworkGradedResult] = useState<any>(null);

  // ==========================================
  // FUNCIONES DEL CONSTRUCTOR (STUDIO)
  // ==========================================
  const openStudio = (courseToEdit?: Course & any) => {
    if (courseToEdit) {
      setCourseForm({
        ...courseToEdit,
        format: courseToEdit.format || 'native',
        teacherId: courseToEdit.teacherId || '',
        enrolledStudents: courseToEdit.enrolledStudents || [],
        modules: courseToEdit.modules || []
      });
    } else {
      setCourseForm({
        title: "", code: "INT-", category: "", description: "", duration: "4 semanas", 
        level: "Técnico", teacher: currentUser.name, teacherId: "", image: "", format: "native",
        enrolledStudents: [], modules: []
      });
    }
    setViewMode('studio');
  };

  const handleAddModule = () => {
    const newModule = {
      id: `mod_${Date.now()}`,
      title: "Nuevo Módulo",
      description: "Descripción breve",
      hasFinalExam: false,
      lessons: []
    };
    setCourseForm((prev: any) => ({ ...prev, modules: [...(prev.modules || []), newModule] }));
  };

  const handleAddLesson = (moduleId: string, type: 'video' | 'pdf' | 'quiz' | 'task' = 'video') => {
    const newLesson = {
      id: `les_${Date.now()}`,
      title: "Nuevo Recurso",
      description: "",
      type: type,
      duration: "10 min",
      contentUrl: "" 
    };
    
    setCourseForm((prev: any) => ({
      ...prev,
      modules: prev.modules?.map((m: any) => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m)
    }));
  };

  const toggleStudentEnrollment = (studentId: string) => {
    const isEnrolled = courseForm.enrolledStudents.includes(studentId);
    if (isEnrolled) {
      setCourseForm({ ...courseForm, enrolledStudents: courseForm.enrolledStudents.filter((id: string) => id !== studentId) });
    } else {
      setCourseForm({ ...courseForm, enrolledStudents: [...courseForm.enrolledStudents, studentId] });
    }
  };

  const saveCourseToFirebase = async () => {
    if (!courseForm.title || !courseForm.code) {
      alert("El título y el código del curso son obligatorios.");
      return;
    }
    setIsSaving(true);
    try {
      if (courseForm.id) {
        const courseRef = doc(db, "courses", courseForm.id);
        await updateDoc(courseRef, courseForm);
        alert("Curso actualizado con éxito.");
      } else {
        await addDoc(collection(db, "courses"), {
          ...courseForm,
          progress: 0,
          studentsCount: courseForm.enrolledStudents.length
        });
        alert("¡Curso creado y publicado en la plataforma INTECA!");
      }
      setViewMode('catalog');
    } catch (error) {
      console.error("Error guardando curso:", error);
      alert("Hubo un error al conectar con Firebase.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este curso de toda la base de datos?")) {
      try {
        await deleteDoc(doc(db, "courses", courseId));
        alert("Curso eliminado definitivamente.");
        setViewMode('catalog');
      } catch (error) {
        console.error("Error eliminando curso:", error);
      }
    }
  };

  // ==========================================
  // FUNCIONES DE EXÁMENES Y TAREAS
  // ==========================================
  const startQuizFlow = async (topic: string) => {
    setLoadingQuiz(true);
    setQuizError(null);
    setQuizFinished(false);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setActiveQuizTopic(topic);
    
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty: "Intermedio" })
      });
      const data = await res.json();
      if (data.quizzes && data.quizzes.length > 0) {
        setQuizQuestions(data.quizzes);
        setTimerCount(120);
        const interval = setInterval(() => {
          setTimerCount((prev: number) => {
            if (prev <= 1) {
              clearInterval(interval);
              setQuizFinished(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimerInterval(interval);
      } else {
        setQuizError("La Inteligencia Artificial no pudo procesar este tema. Intenta con un tema más descriptivo.");
      }
    } catch (err) {
      setQuizError("Ocurrió un error al contactar al motor de IA de INTECA. Verifica tu conexión a internet.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectAnswer = (optIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optIndex);
    if (optIndex === quizQuestions[currentQuizIndex].correctAnswer) {
      setQuizScore((prev: number) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex((prev: number) => prev + 1);
    } else {
      if (timerInterval) clearInterval(timerInterval);
      setQuizFinished(true);
    }
  };

  const closeQuiz = () => {
    if (timerInterval) clearInterval(timerInterval);
    setActiveQuizTopic(null);
    setQuizQuestions([]);
    setHomeworkGradedResult(null);
  };

  const submitHomework = async (taskTitle: string) => {
    if (!homeworkText.trim() || homeworkText.trim().length < 15) {
      alert("Tu entrega es muy corta. Por favor, elabora una respuesta técnica adecuada.");
      return;
    }
    setSubmittingHomework(true);
    setHomeworkGradedResult(null);
    try {
      if (onGradeHomework && selectedCourse) {
        const res = await onGradeHomework(selectedCourse.id, taskTitle, homeworkText);
        setHomeworkGradedResult(res);
      }
    } catch (err) {
      console.error("Homework evaluation error:", err);
    } finally {
      setSubmittingHomework(false);
    }
  };

  // ==========================================
  // RENDER 1: CATÁLOGO PRINCIPAL
  // ==========================================
  const renderCatalog = () => {
    // Filtrar cursos si el usuario es estudiante
    const displayCourses = isAdmin ? courses : courses.filter((c: any) => c.enrolledStudents?.includes(currentUser.id));

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">Instituto Técnico del Caribe</span>
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Catálogo de Cursos (LMS)</h1>
          </div>
          
          {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
            <button 
              onClick={() => openStudio()}
              className="bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Crear Nuevo Curso</span>
            </button>
          )}
        </div>

        {displayCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No hay cursos disponibles</h3>
            <p className="text-sm text-slate-500 mt-2">
              {isAdmin ? "Utiliza el botón 'Crear Nuevo Curso' para subir tu primer programa." : "Contacta a la administración para que te matriculen en tus clases."}
            </p>
          </div>
        ) : (
          <div id="course-list-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCourses.map((course: any) => (
              <div 
                key={course.id}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between group relative cursor-pointer"
                onClick={() => {
                  setSelectedCourse(course);
                  setExpandedModule(course.modules && course.modules.length > 0 ? course.modules[0].id : null);
                  setActiveSubTab('syllabus');
                  setViewMode('detail');
                }}
              >
                {(currentUser.role === 'admin' || currentUser.name === course.teacher) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openStudio(course); }}
                    className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur text-slate-800 p-2 rounded-lg shadow-sm hover:text-sky-600 hover:bg-white transition-all"
                    title="Editar Curso"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                <div className="relative h-48 bg-slate-900 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 to-transparent z-10" />
                  <img 
                    src={course.image || "https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?auto=format&fit=crop&q=80&w=800"} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`text-[9px] text-white font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                      course.format === 'scorm' ? 'bg-amber-500 border-amber-400' :
                      course.format === 'lti' ? 'bg-purple-500 border-purple-400' :
                      'bg-emerald-500 border-emerald-400'
                    }`}>
                      {course.format === 'scorm' ? 'SCORM' : course.format === 'lti' ? 'LTI 1.3' : (course.category || 'Nativo')}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
                    <span className="text-[10px] font-mono font-bold tracking-wider opacity-80">{course.code}</span>
                    <h3 className="font-display font-bold text-lg mt-1 leading-snug">{course.title}</h3>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">{course.description}</p>
                  
                  {(course.duration || course.level) && (
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                      {course.duration && (
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Duración: <strong className="text-slate-700">{course.duration}</strong></span>
                        </div>
                      )}
                      {course.level && (
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                          <Award className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span>Nivel: <strong className="text-slate-700">{course.level}</strong></span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Progreso</span>
                      <span className="font-bold text-slate-800">{course.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${course.progress || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <span className="text-xs text-slate-400 font-medium">Titular: Prof. {course.teacher}</span>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-1">
                      <span>Acceder</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // RENDER 2: DETALLE DEL CURSO
  // ==========================================
  const renderCourseDetail = () => {
    if (!selectedCourse) return null;
    const typedCourse = selectedCourse as any;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <button
            onClick={() => {
              setViewMode('catalog');
              setHomeworkGradedResult(null);
              setHomeworkText("");
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 font-semibold transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold border border-emerald-100">{typedCourse.code}</span>
            <h2 className="font-display font-bold text-slate-900 text-base md:text-lg">{typedCourse.title}</h2>
          </div>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button onClick={() => setActiveSubTab('syllabus')} className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] ${activeSubTab === 'syllabus' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            Syllabus del Curso
          </button>
          <button onClick={() => setActiveSubTab('quizzes')} className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] ${activeSubTab === 'quizzes' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            Exámenes IA
          </button>
          <button onClick={() => setActiveSubTab('homework')} className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] ${activeSubTab === 'homework' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            Buzón de Tareas
          </button>
          <button onClick={() => setActiveSubTab('lti')} className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] ${activeSubTab === 'lti' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            Integración LTI
          </button>
        </div>

        <div id="subtab-content-container">
          
          {/* PESTAÑA: SYLLABUS REAL */}
          {activeSubTab === 'syllabus' && (
            <div className="space-y-4">
              {(!typedCourse.modules || typedCourse.modules.length === 0) ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                  <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm font-bold">Este programa está en construcción.</p>
                  <p className="text-xs text-slate-400 mt-1">El profesor {typedCourse.teacher} aún no ha publicado los módulos.</p>
                </div>
              ) : (
                typedCourse.modules.map((mod: any) => {
                  const isExpanded = expandedModule === mod.id;
                  return (
                    <div key={mod.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                      <button
                        onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                        className="w-full text-left p-5 flex justify-between items-center hover:bg-slate-50/50 transition-colors"
                      >
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Módulo</span>
                          <h4 className="font-bold text-slate-900 text-sm md:text-base">{mod.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">{mod.lessons.length} elementos</span>
                          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100 p-4 bg-slate-50/30 space-y-2">
                          {mod.lessons.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-3">No hay contenido publicado en este módulo aún.</p>
                          ) : (
                            mod.lessons.map((lesson: any) => {
                              const getIcon = () => {
                                switch (lesson.type) {
                                  case 'video': return Video;
                                  case 'pdf': return FileText;
                                  case 'task': return FileText;
                                  case 'quiz': return HelpCircle;
                                  default: return BookOpen;
                                }
                              };
                              const Icon = getIcon();
                              return (
                                <div 
                                  key={lesson.id}
                                  className="p-3.5 bg-white rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-emerald-500/30 transition-all group"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-colors">
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-slate-900 text-xs md:text-sm group-hover:text-emerald-600 transition-colors">{lesson.title}</h5>
                                      <p className="text-[11px] text-slate-500 mt-0.5">{lesson.description} • {lesson.duration}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end md:self-auto">
                                    {lesson.type === 'quiz' ? (
                                      <button
                                        onClick={() => startQuizFlow(lesson.title)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Dar Quiz IA</span>
                                      </button>
                                    ) : (
                                      <a 
                                        href={lesson.contentUrl || "#"} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                                      >
                                        {lesson.type === 'video' ? <><Video className="w-3.5 h-3.5"/> Ver Clase</> : <><FolderDown className="w-3.5 h-3.5" /> Documento</>}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                          
                          {/* Examen final del módulo si existe */}
                          {mod.hasFinalExam && (
                            <div className="mt-4 p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Award className="w-5 h-5"/></div>
                                <div>
                                  <p className="font-bold text-emerald-800 text-sm">Examen Final: {mod.title}</p>
                                  <p className="text-[10px] text-emerald-600">Requisito obligatorio para avanzar.</p>
                                </div>
                              </div>
                              <button onClick={() => startQuizFlow(`Evaluación del módulo ${mod.title}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                                Iniciar Evaluación
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* PESTAÑA: QUIZZES IA */}
          {activeSubTab === 'quizzes' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-slate-900">Motor de Exámenes Adaptativos INTECA</h3>
                  <p className="text-xs text-slate-500">Evaluaciones generadas dinámicamente con Inteligencia Artificial sobre los temas de <strong>{typedCourse.title}</strong>.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold font-mono">EVALUACIÓN TEÓRICA</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">Diagnóstico de Asimilación</h4>
                    <p className="text-xs text-slate-500 mt-1">Mide tu conocimiento general sobre todos los conceptos clave impartidos en este programa.</p>
                  </div>
                  <button 
                    onClick={() => startQuizFlow(`Conceptos principales y evaluación técnica de ${typedCourse.title}`)}
                    className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl transition-colors mt-4 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Examen: {typedCourse.title}</span>
                  </button>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded font-bold font-mono">SIMULADOR PRÁCTICO</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">Prueba de Casos Aplicados</h4>
                    <p className="text-xs text-slate-500 mt-1">Análisis de escenarios reales para profesionales en el área de {typedCourse.category || "Salud"}.</p>
                  </div>
                  <button 
                    onClick={() => startQuizFlow(`Resolución de problemas y casos prácticos en el área de ${typedCourse.category || "la materia abordada"}`)}
                    className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl transition-colors mt-4 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Simulador: {typedCourse.category || "Casos"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: BUZÓN DE TAREAS */}
          {activeSubTab === 'homework' && (
             <div id="homework-portal" className="space-y-6">
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
               <div className="space-y-1">
                 <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">BUZÓN ACADÉMICO</span>
                 <h3 className="font-bold text-slate-950 font-display text-base mt-1">Proyecto Final: {typedCourse.title}</h3>
                 <p className="text-xs text-slate-500">Evaluación Asistida por el Titular Prof. {typedCourse.teacher} y motor IA.</p>
               </div>
     
               <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-2 text-xs">
                 <p className="font-bold">Mandato Oficial:</p>
                 <p className="leading-relaxed">Basado en las competencias desarrolladas durante el programa académico de <strong>{typedCourse.title}</strong>, redacte un análisis exhaustivo explicando cómo aplicaría usted los conocimientos de nivel {typedCourse.level} en su entorno profesional diario.</p>
               </div>
     
               {currentUser.role === 'student' && !homeworkGradedResult && (
                 <div className="space-y-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-700 mb-2">Entregar Propuesta / Ensayo Académico:</label>
                     <textarea
                       value={homeworkText}
                       onChange={(e) => setHomeworkText(e.target.value)}
                       placeholder="Redacta o pega tu documento técnico aquí para evaluación automática..."
                       rows={8}
                       className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all leading-relaxed"
                     />
                   </div>
     
                   <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="text-[10px] text-slate-400">INTECA Intellect auditará originalidad y coherencia técnica de inmediato.</span>
                     <button
                       onClick={() => submitHomework(`Proyecto de ${typedCourse.title}`)}
                       disabled={submittingHomework}
                       className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                     >
                       {submittingHomework ? (
                         <><Loader2 className="w-4 h-4 animate-spin" /><span>Evaluando entrega...</span></>
                       ) : (
                         <><Send className="w-4 h-4" /><span>Entregar Proyecto</span></>
                       )}
                     </button>
                   </div>
                 </div>
               )}
     
               {homeworkGradedResult && (
                 <div className="bg-slate-900 text-white rounded-3xl p-6 border border-emerald-500/50 space-y-6 relative overflow-hidden">
                   <div className="absolute right-0 top-0 p-6 opacity-5">
                     <Award className="w-48 h-48" />
                   </div>
     
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
                     <div className="flex items-center gap-3">
                       <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                         <Sparkles className="w-6 h-6" />
                       </div>
                       <div>
                         <h4 className="font-display font-bold text-lg">Evaluación Oficial Académica</h4>
                         <p className="text-xs text-slate-400">Reporte certificado de corrección IA</p>
                       </div>
                     </div>
                     
                     <div className="text-center bg-emerald-500/20 border border-emerald-500/40 px-6 py-3 rounded-2xl min-w-[120px]">
                       <span className="text-[10px] text-slate-300 block uppercase font-bold">Calificación Final</span>
                       <span className="text-3xl font-display font-bold text-emerald-400">{homeworkGradedResult.feedback.score} <span className="text-sm text-slate-400">/ 100</span></span>
                     </div>
                   </div>
     
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                     <div className="space-y-4">
                       <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                         <div className="flex justify-between">
                           <span className="font-bold text-emerald-400">Auditoría de Originalidad:</span>
                           <span className="font-mono text-rose-400 font-semibold">{homeworkGradedResult.feedback.plagiarismScore}% Similitud Web</span>
                         </div>
                         <p className="text-slate-300 leading-relaxed">{homeworkGradedResult.feedback.plagiarismReport}</p>
                       </div>
     
                       <div className="space-y-2">
                         <span className="font-bold text-emerald-400 block">Reporte Analítico del Tutor:</span>
                         <p className="text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{homeworkGradedResult.feedback.critique}</p>
                       </div>
                     </div>
     
                     <div className="space-y-4">
                       <div className="space-y-2">
                         <span className="font-bold text-emerald-400 block">✓ Fortalezas Técnicas:</span>
                         <ul className="space-y-1.5 bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/10">
                           {homeworkGradedResult.feedback.strengths.map((s: string, idx: number) => (
                             <li key={idx} className="text-slate-300 flex items-start gap-2">
                               <span className="text-emerald-400 font-bold">•</span>
                               <span>{s}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
     
                       <div className="space-y-2">
                         <span className="font-bold text-amber-400 block">⚡ Factores a Mejorar:</span>
                         <ul className="space-y-1.5 bg-amber-950/20 p-4 rounded-xl border border-amber-500/10">
                           {homeworkGradedResult.feedback.improvements.map((i: string, idx: number) => (
                             <li key={idx} className="text-slate-300 flex items-start gap-2">
                               <span className="text-amber-400 font-bold">•</span>
                               <span>{i}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     </div>
                   </div>
     
                   <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400">
                     <span>Evaluación firmada criptográficamente por motor INTECA.</span>
                     <button
                       onClick={() => {
                         setHomeworkText("");
                         setHomeworkGradedResult(null);
                       }}
                       className="text-emerald-400 hover:underline font-bold"
                     >
                       Rehacer Proyecto
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
          )}

          {/* PESTAÑA: INTEGRACIÓN LTI */}
          {activeSubTab === 'lti' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900">Interoperabilidad LTI (Learning Tools Interoperability)</h3>
                <p className="text-xs text-slate-500">Este curso ({typedCourse.title}) está listo para federarse con plataformas secundarias.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-3 leading-relaxed">
                <p>Las siguientes llaves criptográficas son únicas y exclusivas de este programa académico. Cópielas para incrustar el contenido en Moodle, Canvas o Blackboard:</p>
                <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-2 shadow-inner">
                  <p><span className="text-slate-400">LTI_CONSUMER_KEY:</span> inteca_hub_{typedCourse.id.substring(0,8)}</p>
                  <p><span className="text-slate-400">LTI_SHARED_SECRET:</span> sec_{typedCourse.id}84e</p>
                  <p><span className="text-slate-400">LAUNCH_URL:</span> {`https://lms.inteca.edu.co/api/lti/launch/${typedCourse.id}`}</p>
                </div>
                <p className="text-[10px] text-slate-400 italic">El acceso mediante LTI reportará las calificaciones directamente a su plataforma original.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER 3: LMS AUTHORING TOOL (STUDIO)
  // ==========================================
  const renderStudio = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-6 rounded-3xl text-white shadow-xl gap-4">
        <div>
          <span className="text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            Modo Arquitecto de Cursos
            {isMaster && <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px] tracking-widest shadow-sm">MASTER ADMIN</span>}
          </span>
          <h2 className="text-2xl font-bold font-display mt-1">{courseForm.id ? "Editar Programa Académico" : "Construir Nuevo Programa"}</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setViewMode('catalog')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-700">
            Cancelar
          </button>
          <button 
            onClick={saveCourseToFirebase} 
            disabled={isSaving} 
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publicar Curso
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Info General y Formatos */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Información Principal</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Título del Curso</label>
                <input type="text" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-colors" placeholder="Ej. Atención al Usuario" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Formato de Contenido</label>
                <select 
                  value={courseForm.format}
                  onChange={(e) => setCourseForm({...courseForm, format: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-sky-500 outline-none cursor-pointer text-slate-700"
                >
                  <option value="native">LMS Nativo (Constructor INTECA)</option>
                  <option value="scorm">Paquete SCORM (1.2 / 2004)</option>
                  <option value="lti">Integración LTI (1.3)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Profesor / Titular</label>
                <select 
                  value={courseForm.teacherId || courseForm.teacher}
                  onChange={(e) => {
                    const selectedTeacher = teachers.find(t => t.id === e.target.value);
                    setCourseForm({
                      ...courseForm, 
                      teacherId: selectedTeacher?.id || "", 
                      teacher: selectedTeacher?.name || ""
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer text-slate-700"
                >
                  <option value="">-- Asignar Docente --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Código</label>
                  <input type="text" value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-colors" placeholder="ATE-104" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Categoría</label>
                  <input type="text" value={courseForm.category} onChange={e => setCourseForm({...courseForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-colors" placeholder="Servicio al Cliente" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Descripción Detallada</label>
                <textarea rows={3} value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-colors leading-relaxed" placeholder="¿Qué aprenderá el estudiante en este curso?" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5"><Image className="w-3.5 h-3.5"/> URL de Portada (Imagen)</label>
                <input type="text" value={courseForm.image} onChange={e => setCourseForm({...courseForm, image: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none transition-colors" placeholder="Pega el enlace web de la foto..." />
                {courseForm.image && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 h-24">
                    <img src={courseForm.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {courseForm.id && currentUser.role === 'admin' && (
               <button onClick={() => deleteCourse(courseForm.id as string)} className="w-full mt-6 flex items-center justify-center gap-2 py-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all">
                 <Trash2 className="w-4 h-4"/> Eliminar Curso Definitivamente
               </button>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA 1: Constructor de Módulos (O SCORM Upload) */}
        <div className="lg:col-span-1 space-y-6">
          {courseForm.format !== 'native' ? (
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center border-dashed border-2 border-sky-100 h-full flex flex-col justify-center">
               <FolderArchive className="w-16 h-16 text-sky-400 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-slate-800">Motor de Importación {courseForm.format.toUpperCase()}</h3>
               <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
                 Sube tu archivo .ZIP estructurado. El sistema desempaquetará automáticamente los módulos, recursos y evaluaciones hacia la nube de INTECA.
               </p>
               <button className="mt-6 bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 font-bold py-3 px-6 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 mx-auto w-full">
                 <UploadCloud className="w-4 h-4" />
                 Seleccionar Paquete ZIP
               </button>
             </div>
          ) : (
            <>
              <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800">Malla Curricular</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Estructura módulos y recursos.</p>
                </div>
                <button onClick={handleAddModule} className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors border border-emerald-100">
                  <Plus className="w-3.5 h-3.5" /> Módulo
                </button>
              </div>

              {(courseForm.modules || []).length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No hay módulos definidos.</p>
                </div>
              ) : (
                (courseForm.modules || []).map((mod: any, mIndex: number) => (
                  <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col gap-3">
                      <input 
                        type="text" 
                        value={mod.title} 
                        onChange={(e) => {
                          const newMods = [...(courseForm.modules || [])];
                          newMods[mIndex].title = e.target.value;
                          setCourseForm({...courseForm, modules: newMods});
                        }} 
                        className="font-bold text-sm bg-transparent border-b-2 border-slate-300 focus:border-emerald-500 outline-none w-full pb-1.5 transition-colors" 
                        placeholder="Título del Módulo..." 
                      />
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddLesson(mod.id, 'video')} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1.5 rounded-lg font-bold hover:text-sky-600 transition-colors flex items-center gap-1 flex-1 justify-center"><Video className="w-3 h-3"/> Video</button>
                        <button onClick={() => handleAddLesson(mod.id, 'task')} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1.5 rounded-lg font-bold hover:text-amber-600 transition-colors flex items-center gap-1 flex-1 justify-center"><FileText className="w-3 h-3"/> Tarea</button>
                        <button onClick={() => handleAddLesson(mod.id, 'quiz')} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1.5 rounded-lg font-bold hover:text-rose-600 transition-colors flex items-center gap-1 flex-1 justify-center"><CheckSquare className="w-3 h-3"/> Quiz IA</button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {mod.lessons.length === 0 ? (
                        <p className="text-[10px] text-center text-slate-400 italic">Módulo vacío</p>
                      ) : (
                        mod.lessons.map((lesson: any, lIndex: number) => (
                          <div key={lesson.id} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                            <button 
                              onClick={() => {
                                const newMods = [...(courseForm.modules || [])];
                                newMods[mIndex].lessons.splice(lIndex, 1);
                                setCourseForm({...courseForm, modules: newMods});
                              }}
                              className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex items-center gap-2 pr-6">
                              {lesson.type === 'video' ? <Video className="w-3.5 h-3.5 text-sky-500 shrink-0"/> : 
                               lesson.type === 'task' ? <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0"/> : 
                               <HelpCircle className="w-3.5 h-3.5 text-rose-500 shrink-0"/>}
                              <input 
                                type="text" 
                                value={lesson.title} 
                                onChange={(e) => {
                                  const newMods = [...(courseForm.modules || [])];
                                  newMods[mIndex].lessons[lIndex].title = e.target.value;
                                  setCourseForm({...courseForm, modules: newMods});
                                }} 
                                className="flex-1 bg-transparent border-b border-slate-300 focus:border-emerald-500 outline-none text-xs font-bold pb-1 transition-colors w-full" 
                                placeholder="Nombre de la lección..." 
                              />
                            </div>
                            
                            {lesson.type !== 'quiz' && (
                              <div className="flex items-center gap-2 mt-1">
                                <LinkIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                <input 
                                  type="text" 
                                  value={lesson.contentUrl || ""} 
                                  onChange={(e) => {
                                    const newMods = [...(courseForm.modules || [])];
                                    newMods[mIndex].lessons[lIndex].contentUrl = e.target.value;
                                    setCourseForm({...courseForm, modules: newMods});
                                  }} 
                                  className="flex-1 bg-transparent border-none outline-none text-[10px] text-slate-500 w-full" 
                                  placeholder="URL del enlace..." 
                                />
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      <label className="flex items-center justify-center gap-2 mt-4 cursor-pointer bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={mod.hasFinalExam}
                          onChange={() => {
                            const newMods = [...(courseForm.modules || [])];
                            newMods[mIndex].hasFinalExam = !mod.hasFinalExam;
                            setCourseForm({...courseForm, modules: newMods});
                          }}
                          className="rounded text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                        />
                        <Award className={`w-3.5 h-3.5 ${mod.hasFinalExam ? 'text-emerald-500' : 'text-emerald-300'}`} />
                        <span className="text-[10px] font-bold text-emerald-800 uppercase">Incluir Examen Final de Módulo</span>
                      </label>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* COLUMNA DERECHA 2: Matriculación Estudiantil */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full max-h-[600px]">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 shrink-0">
              <Users className="w-5 h-5 text-sky-500" />
              <h2 className="font-bold text-slate-900 text-sm">Matriculación Estudiantil</h2>
            </div>
            
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex justify-between py-3 shrink-0">
              <span>Directorio de Alumnos</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{(courseForm.enrolledStudents || []).length} Inscritos</span>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1">
              {students.map(student => {
                const isEnrolled = (courseForm.enrolledStudents || []).includes(student.id);
                return (
                  <div 
                    key={student.id} 
                    onClick={() => toggleStudentEnrollment(student.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isEnrolled ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={student.avatar} alt="" className="w-7 h-7 rounded-full bg-slate-200" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-none">{student.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{student.academicId || student.email}</p>
                      </div>
                    </div>
                    {isEnrolled && <UserCheck className="w-4 h-4 text-sky-600" />}
                  </div>
                );
              })}
              {students.length === 0 && (
                <p className="text-xs text-center text-slate-400 py-10">No hay estudiantes registrados en la base de datos.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // ==========================================
  // RENDER: FLUJO DE QUIZ IA (MODAL EMERGENTE)
  // ==========================================
  const renderActiveQuizFlow = () => {
    if (!activeQuizTopic) return null;
    return (
      <div className="bg-slate-950 text-white p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-xl relative min-h-[500px] flex flex-col justify-between mb-6 animate-in zoom-in-95 duration-300">
        <div className="absolute right-6 top-6 flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-xl border border-white/5">
          <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold">Tiempo restante: {timerCount}s</span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Evaluación Dinámica por IA</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-slate-300">Tema: {activeQuizTopic}</span>
          </div>
          
          {loadingQuiz && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-400">Generando cuestionario personalizado con Inteligencia Artificial...</p>
            </div>
          )}

          {quizError && (
            <div className="py-12 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-sm text-slate-300">{quizError}</p>
              <button onClick={closeQuiz} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Volver</button>
            </div>
          )}

          {!loadingQuiz && quizQuestions.length > 0 && !quizFinished && (
            <div className="space-y-8 mt-4">
              <div>
                <span className="text-xs text-slate-400 font-mono">Pregunta {currentQuizIndex + 1} de {quizQuestions.length}</span>
                <h3 className="font-display font-bold text-lg md:text-xl text-white mt-2 leading-relaxed">
                  {quizQuestions[currentQuizIndex].question}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quizQuestions[currentQuizIndex].options.map((opt, oIdx) => {
                  const isSelected = selectedAnswer === oIdx;
                  const isCorrectOption = oIdx === quizQuestions[currentQuizIndex].correctAnswer;
                  
                  let bgStyle = "bg-white/5 border-white/10 hover:bg-white/10";
                  if (selectedAnswer !== null) {
                    if (isCorrectOption) bgStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                    else if (isSelected) bgStyle = "bg-rose-500/20 border-rose-500 text-rose-400";
                    else bgStyle = "bg-white/5 border-white/5 opacity-50";
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={selectedAnswer !== null}
                      onClick={() => handleSelectAnswer(oIdx)}
                      className={`w-full text-left p-5 rounded-2xl border text-sm font-medium transition-all duration-300 ${bgStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="p-5 bg-sky-900/30 border border-sky-800 rounded-2xl text-xs space-y-2 leading-relaxed animate-in slide-in-from-bottom-2">
                  <span className="font-bold text-emerald-400 block flex items-center gap-1.5"><Sparkles className="w-4 h-4"/> Explicación del Tutor IA:</span>
                  <p className="text-slate-300">{quizQuestions[currentQuizIndex].explanation}</p>
                </div>
              )}
            </div>
          )}

          {!loadingQuiz && quizFinished && (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold font-display text-white">¡Evaluación Finalizada!</h3>
                <p className="text-xs text-slate-400">Tu desempeño ha sido enviado a la libreta académica del curso de INTECA.</p>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-3xl max-w-sm mx-auto p-6">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Aciertos Registrados</p>
                <p className="text-5xl font-display font-bold text-emerald-500 mt-2">
                  {quizScore} <span className="text-xl text-slate-400">/ {quizQuestions.length}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-3 bg-slate-900 py-1.5 rounded-lg border border-white/5">
                  Nivel estimado: {quizScore === quizQuestions.length ? "Excelente - 100%" : quizScore >= 2 ? "Aprobado - 67%" : "Necesita refuerzo - 33%"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-white/10">
          <button onClick={closeQuiz} className="text-xs text-slate-400 hover:text-white font-medium transition-colors">
            Cerrar examen
          </button>

          {selectedAnswer !== null && !quizFinished && (
            <button
              onClick={handleNextQuestion}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
            >
              Siguiente Pregunta
            </button>
          )}

          {quizFinished && (
            <button
              onClick={closeQuiz}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
            >
              Volver al Curso
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="courses-view-root">
      {activeQuizTopic && renderActiveQuizFlow()}
      {!activeQuizTopic && (
        <>
          {viewMode === 'catalog' && renderCatalog()}
          {viewMode === 'studio' && renderStudio()}
          {viewMode === 'detail' && renderCourseDetail()}
        </>
      )}
    </div>
  );
}