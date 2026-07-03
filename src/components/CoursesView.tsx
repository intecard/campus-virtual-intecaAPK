import { useState } from "react";
import { 
  BookOpen, 
  ChevronRight, 
  FolderDown, 
  Play, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowLeft,
  Sparkles,
  Award,
  Loader2,
  FileText,
  Video,
  Send,
  Trash2
} from "lucide-react";
import { Course, UserProfile, Module, Lesson, QuizQuestion } from "../types";

interface CoursesViewProps {
  currentUser: UserProfile;
  courses: Course[];
  setActiveTab: (tab: string) => void;
  onGradeHomework?: (courseId: string, taskTitle: string, submissionText: string) => Promise<any>;
}

export default function CoursesView({ 
  currentUser, 
  courses, 
  setActiveTab,
  onGradeHomework 
}: CoursesViewProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'syllabus' | 'quizzes' | 'homework' | 'lti'>('syllabus');
  
  // Quiz specific states
  const [activeQuizTopic, setActiveQuizTopic] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [timerCount, setTimerCount] = useState(120); // 2 minute countdown
  const [timerInterval, setTimerInterval] = useState<any>(null);

  // Homework submitting state
  const [submittingHomework, setSubmittingHomework] = useState(false);
  const [homeworkText, setHomeworkText] = useState("");
  const [homeworkGradedResult, setHomeworkGradedResult] = useState<any>(null);

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
        // Start countdown timer
        setTimerCount(120);
        const interval = setInterval(() => {
          setTimerCount((prev) => {
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
        setQuizError("No se pudieron generar preguntas válidas de IA. Por favor intenta de nuevo.");
      }
    } catch (err) {
      setQuizError("Ocurrió un error al contactar al generador de IA.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectAnswer = (optIndex: number) => {
    if (selectedAnswer !== null) return; // Answered already
    setSelectedAnswer(optIndex);
    if (optIndex === quizQuestions[currentQuizIndex].correctAnswer) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
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

  // Submit homework to Gemini
  const submitHomework = async (taskTitle: string) => {
    if (!homeworkText.trim() || homeworkText.trim().length < 15) {
      alert("Por favor, redacta una respuesta académica detallada (mínimo 15 caracteres).");
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

  // Render course list
  const renderCourseList = () => (
    <div id="course-list-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div 
          key={course.id}
          className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-brand-green/30 transition-all duration-300 flex flex-col justify-between group"
        >
          <div className="relative h-48 bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 to-transparent z-10" />
            <img 
              src={course.image} 
              alt={course.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute top-4 left-4 z-10">
              <span className="text-[10px] bg-brand-green text-white font-mono font-bold uppercase px-3 py-1 rounded-full border border-brand-green/40">
                {course.category}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
              <span className="text-[10px] font-mono font-bold tracking-wider opacity-80">{course.code}</span>
              <h3 className="font-display font-bold text-lg mt-1 leading-snug">{course.title}</h3>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <p className="text-slate-600 text-xs leading-relaxed">{course.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progreso</span>
                <span className="font-bold text-slate-800">{course.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-green h-full" style={{ width: `${course.progress}%` }}></div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
              <span className="text-xs text-slate-400 font-medium">Titular: Prof. {course.teacher}</span>
              <button
                onClick={() => {
                  setSelectedCourse(course);
                  setExpandedModule(course.modules[0]?.id || null);
                  setActiveSubTab('syllabus');
                }}
                className="bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-1"
              >
                <span>Acceder</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render Syllabus module hierarchy (Moodle/Canvas style)
  const renderSyllabus = (course: Course) => (
    <div id="syllabus-modules" className="space-y-4">
      {course.modules.map((mod) => {
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
                <span className="text-xs text-slate-400 font-medium">{mod.lessons.length} unidades</span>
                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 p-4 bg-slate-50/30 space-y-2">
                {mod.lessons.map((lesson) => {
                  const getIcon = () => {
                    switch (lesson.type) {
                      case 'video': return Video;
                      case 'pdf': return FileText;
                      case 'quiz': return HelpCircle;
                      default: return BookOpen;
                    }
                  };
                  const Icon = getIcon();
                  return (
                    <div 
                      key={lesson.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-brand-green/30 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs md:text-sm group-hover:text-brand-blue transition-colors">{lesson.title}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">{lesson.description} • Duración: {lesson.duration}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {lesson.type === 'quiz' ? (
                          <button
                            onClick={() => startQuizFlow(lesson.title)}
                            className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-brand-green/10"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Dar Quiz IA</span>
                          </button>
                        ) : (
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); alert(`Descargando recurso del Caribe: ${lesson.title}`); }}
                            className="text-slate-600 hover:text-brand-blue bg-slate-100 hover:bg-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <FolderDown className="w-3.5 h-3.5" />
                            <span>Descargar</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render Quizzes list
  const renderQuizzes = (course: Course) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <Sparkles className="w-5 h-5 text-brand-green" />
        <div>
          <h3 className="font-bold text-slate-900">Exámenes Adaptativos e Inteligentes</h3>
          <p className="text-xs text-slate-500">Genera tests interactivos en tiempo real con IA basados en tu avance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded font-bold font-mono">IA ADAPTATIVA</span>
            <h4 className="font-bold text-slate-900 text-sm mt-2">Diagnóstico: Soporte Clínico de Emergencia</h4>
            <p className="text-xs text-slate-500 mt-1">Evalúa conceptos críticos de telemetría y triaje clínico en zonas rurales.</p>
          </div>
          <button 
            onClick={() => startQuizFlow("Telemetría Clínica y Soporte Remoto")}
            className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 rounded-xl transition-colors mt-4 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-green" />
            <span>Generar Examen por IA</span>
          </button>
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded font-bold font-mono">CIBERSEGURIDAD</span>
            <h4 className="font-bold text-slate-900 text-sm mt-2">Prueba rápida: Mitigación de Ransomware</h4>
            <p className="text-xs text-slate-500 mt-1">Preguntas de opción múltiple sobre aislamiento de red en redes críticas.</p>
          </div>
          <button 
            onClick={() => startQuizFlow("Mitigación de Ransomware e Incidentes de Red")}
            className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2 rounded-xl transition-colors mt-4 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-green" />
            <span>Generar Examen por IA</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Render Homework submission
  const renderHomework = (course: Course) => {
    // Custom simulated task topics for courses
    const tasks: Record<string, { title: string, prompt: string }> = {
      'telemedicina': {
        title: 'Estudio de Caso: Red de Telemetría Rural de Emergencia',
        prompt: 'Elabore un protocolo de triaje remoto para transmisión de signos vitales sobre canales vulnerables. Explique qué cifrado implementaría y cómo mitigará pérdidas de paquetes en el Caribe rústico.'
      },
      'ciberseguridad': {
        title: 'Análisis de Red: Aislamiento y Mitigación de Ransomware',
        prompt: 'Presente un análisis de ataque ransomware en un servidor técnico clínico. Explique el rol de una red segmentada (VLAN) y la aplicación del enfoque Zero Trust para el aislamiento de nodos de red.'
      },
      'redes': {
        title: 'Diseño e Infraestructura: Redes Multiplexadas de Fibra Óptica',
        prompt: 'Detalle un esquema de direccionamiento IP y enrutamiento dinámico OSPF para interconectar 4 sedes de INTECA en la costa del Caribe. Proponga medidas de seguridad contra denegación de servicios (DDoS).'
      }
    };

    const taskKey = course.id.includes('telemedicina') ? 'telemedicina' : course.id.includes('ciberseguridad') ? 'ciberseguridad' : 'redes';
    const currentTask = tasks[taskKey] || tasks['telemedicina'];

    return (
      <div id="homework-portal" className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">BUZÓN ACADÉMICO</span>
            <h3 className="font-bold text-slate-950 font-display text-base mt-1">{currentTask.title}</h3>
            <p className="text-xs text-slate-500">Vence hoy a las 23:59 • Evaluación Asistida por INTECA Intellect 24/7</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-2 text-xs">
            <p className="font-bold">Instrucciones del Profesor Titular:</p>
            <p className="leading-relaxed">{currentTask.prompt}</p>
          </div>

          {currentUser.role === 'student' && !homeworkGradedResult && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Respuesta en Texto / Ensayo Académico:</label>
                <textarea
                  value={homeworkText}
                  onChange={(e) => setHomeworkText(e.target.value)}
                  placeholder="Redacta tu propuesta técnica detallada aquí para evaluación automática de IA..."
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs focus:ring-1 focus:ring-brand-green focus:outline-none focus:bg-white transition-all leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400">La IA auditará el plagio y redacción académica de forma inmediata.</span>
                <button
                  onClick={() => submitHomework(currentTask.title)}
                  disabled={submittingHomework}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold py-2 px-5 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submittingHomework ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Evaluando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Tarea</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {homeworkGradedResult && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-brand-blue-light/50 space-y-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-6 opacity-5">
                <Award className="w-48 h-48" />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-green/20 border border-brand-green/40 rounded-xl text-brand-green">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg">Evaluación Oficial de INTECA Intellect</h4>
                    <p className="text-xs text-slate-400">Analizador Inteligente de Criterios y Plagio</p>
                  </div>
                </div>
                
                <div className="text-center bg-brand-green/20 border border-brand-green/40 px-6 py-3 rounded-2xl min-w-[120px]">
                  <span className="text-[10px] text-slate-300 block uppercase font-bold">Calificación</span>
                  <span className="text-3xl font-display font-bold text-brand-green">{homeworkGradedResult.feedback.score} <span className="text-sm text-slate-400">/ 100</span></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Plagiarism & Critique */}
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-brand-green">Análisis de Originalidad:</span>
                      <span className="font-mono text-rose-400 font-semibold">{homeworkGradedResult.feedback.plagiarismScore}% Coincidencia</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{homeworkGradedResult.feedback.plagiarismReport}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-brand-green block">Análisis Docente:</span>
                    <p className="text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{homeworkGradedResult.feedback.critique}</p>
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="font-bold text-emerald-400 block">✓ Fortalezas de tu Entrega:</span>
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
                    <span className="font-bold text-amber-400 block">⚡ Oportunidades de Mejora:</span>
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
                <span>Evaluador: INTECA Intellect LLM Engine • 2026</span>
                <button
                  onClick={() => {
                    setHomeworkText("");
                    setHomeworkGradedResult(null);
                  }}
                  className="text-brand-green hover:underline font-bold"
                >
                  Volver a entregar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render LTI / SCORM Integration
  const renderLTI = (course: Course) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-900">Interoperabilidad LTI y SCORM 1.2 / 2004</h3>
        <p className="text-xs text-slate-500">INTECA soporta federación de cursos con plataformas secundarias de forma automatizada.</p>
      </div>
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-3 leading-relaxed">
        <p>Este curso dispone de claves de interoperabilidad LTI activas para incrustar lecciones en Canvas, Blackboard o Moodle Externo:</p>
        <div className="bg-slate-950 text-slate-400 p-3 rounded-lg font-mono text-[10px] space-y-1">
          <p><span className="text-brand-green">LTI_CONSUMER_KEY:</span> inteca_caribe_2026_prod_v3</p>
          <p><span className="text-brand-green">LTI_SHARED_SECRET:</span> sec_48f9382bd8e9381a17f6300a84e</p>
          <p><span className="text-brand-green">LAUNCH_URL:</span> {`https://ais-dev-inteca.run.app/api/lti/launch/${course.id}`}</p>
        </div>
        <p className="text-[10px] text-slate-400">Cumple con la norma IMS Global Learning Consortium. Para soporte SCORM, contacte al Coordinador de Redes.</p>
      </div>
    </div>
  );

  return (
    <div id="courses-view-root" className="space-y-6">
      {/* If an AI Quiz is taking place, overlay this screen */}
      {activeQuizTopic && (
        <div id="active-quiz-flow" className="bg-slate-950 text-white p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-xl relative min-h-[500px] flex flex-col justify-between">
          <div className="absolute right-6 top-6 flex items-center gap-4 bg-brand-dark px-4 py-2 rounded-xl border border-white/5">
            <Clock className="w-4 h-4 text-brand-green animate-pulse" />
            <span className="text-xs font-mono font-bold">Tiempo restante: {timerCount}s</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-green font-bold uppercase tracking-widest">Evaluación Dinámica por IA</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-slate-300">Tema: {activeQuizTopic}</span>
            </div>
            
            {loadingQuiz && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-green" />
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
              <div className="space-y-6 mt-6">
                <div>
                  <span className="text-xs text-slate-400 font-mono">Pregunta {currentQuizIndex + 1} de {quizQuestions.length}</span>
                  <h3 className="font-display font-bold text-lg md:text-xl text-white mt-1 leading-relaxed">
                    {quizQuestions[currentQuizIndex].question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quizQuestions[currentQuizIndex].options.map((opt, oIdx) => {
                    const isSelected = selectedAnswer === oIdx;
                    const isCorrectOption = oIdx === quizQuestions[currentQuizIndex].correctAnswer;
                    
                    let bgStyle = "bg-white/5 border-white/10 hover:bg-white/10";
                    if (selectedAnswer !== null) {
                      if (isCorrectOption) {
                        bgStyle = "bg-brand-green/20 border-brand-green text-brand-green";
                      } else if (isSelected) {
                        bgStyle = "bg-rose-500/20 border-rose-500 text-rose-400";
                      } else {
                        bgStyle = "bg-white/5 border-white/5 opacity-50";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleSelectAnswer(oIdx)}
                        className={`w-full text-left p-4 rounded-xl border text-xs md:text-sm font-medium transition-all ${bgStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer !== null && (
                  <div className="p-4 bg-brand-blue/30 border border-brand-blue-light/50 rounded-2xl text-xs space-y-1.5 leading-relaxed">
                    <span className="font-bold text-brand-green block">✓ Explicación del Tutor:</span>
                    <p className="text-slate-300">{quizQuestions[currentQuizIndex].explanation}</p>
                  </div>
                )}
              </div>
            )}

            {!loadingQuiz && quizFinished && (
              <div className="py-12 text-center space-y-6">
                <div className="w-16 h-16 bg-brand-green/20 border border-brand-green/40 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8 text-brand-green" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-display text-white">¡Evaluación Finalizada!</h3>
                  <p className="text-xs text-slate-400">Tu desempeño ha sido enviado a la libreta académica del curso de INTECA.</p>
                </div>
                
                <div className="bg-white/5 border border-white/5 rounded-2xl max-w-sm mx-auto p-5">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Aciertos Registrados</p>
                  <p className="text-4xl font-display font-bold text-brand-green mt-1">
                    {quizScore} <span className="text-lg text-slate-400">/ {quizQuestions.length}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">Nivel estimado: {quizScore === quizQuestions.length ? "Excelente - 100%" : quizScore >= 2 ? "Aprobado - 67%" : "Necesita refuerzo - 33%"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button 
              onClick={closeQuiz} 
              className="text-xs text-slate-400 hover:text-white font-medium"
            >
              Cerrar examen
            </button>

            {selectedAnswer !== null && !quizFinished && (
              <button
                onClick={handleNextQuestion}
                className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-2 px-5 rounded-xl transition-all"
              >
                Siguiente Pregunta
              </button>
            )}

            {quizFinished && (
              <button
                onClick={closeQuiz}
                className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-bold py-2 px-5 rounded-xl transition-all"
              >
                Volver al Curso
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main curriculum screen */}
      {!activeQuizTopic && (
        <>
          {selectedCourse === null ? (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-wider">Instituto Técnico del Caribe</span>
                <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Catálogo de Cursos (LMS)</h1>
              </div>
              {renderCourseList()}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header with back button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setHomeworkGradedResult(null);
                    setHomeworkText("");
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-blue font-semibold transition-colors w-fit"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a mis materias</span>
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded font-mono font-bold">{selectedCourse.code}</span>
                  <h2 className="font-display font-bold text-slate-900 text-base md:text-lg">{selectedCourse.title}</h2>
                </div>
              </div>

              {/* Course Sub Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveSubTab('syllabus')}
                  className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] ${activeSubTab === 'syllabus' ? 'border-brand-green text-brand-green' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  Syllabus del Curso
                </button>
                <button
                  onClick={() => setActiveSubTab('quizzes')}
                  className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] ${activeSubTab === 'quizzes' ? 'border-brand-green text-brand-green' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  Exámenes IA
                </button>
                <button
                  onClick={() => setActiveSubTab('homework')}
                  className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] ${activeSubTab === 'homework' ? 'border-brand-green text-brand-green' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  Entregas de Tarea
                </button>
                <button
                  onClick={() => setActiveSubTab('lti')}
                  className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] ${activeSubTab === 'lti' ? 'border-brand-green text-brand-green' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  Integración LTI
                </button>
              </div>

              {/* Subtab content */}
              <div id="subtab-content-container">
                {activeSubTab === 'syllabus' && renderSyllabus(selectedCourse)}
                {activeSubTab === 'quizzes' && renderQuizzes(selectedCourse)}
                {activeSubTab === 'homework' && renderHomework(selectedCourse)}
                {activeSubTab === 'lti' && renderLTI(selectedCourse)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
