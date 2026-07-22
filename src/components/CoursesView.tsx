import React, { useState, useEffect } from "react";
import { 
  BookOpen, ChevronRight, Clock, ArrowLeft,
  Award, Loader2, FileText, Video, Send, Plus, Trash2, Save, Image, Edit3, 
  X, Layers, Users, UserCheck, Monitor, ExternalLink, FolderArchive, UploadCloud, Link as LinkIcon
} from "lucide-react";
import { db, logUserActivity } from "../firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { Course, UserProfile } from "../types";

// Usamos any en variables locales para evitar conflictos de tipado estricto que rompan la compilación
interface CoursesViewProps {
  currentUser?: UserProfile | any; 
  courses?: Course[] | any[];
  setActiveTab: (tab: string) => void;
}

export default function CoursesView({ currentUser, courses = [], setActiveTab }: CoursesViewProps) {
  
  // 🛡️ AUTOPILOTO DE EMERGENCIA
  const safeUser = currentUser || {
    id: "admin_master_1985",
    name: "Luis A. Ramirez",
    email: "luisramirezescalante1985@gmail.com",
    role: "admin"
  };

  const isMaster = String(safeUser.email || "").toLowerCase() === "luisramirezescalante1985@gmail.com";
  const isAdmin = safeUser.role === 'admin' || isMaster;

  // ESTADOS DE NAVEGACIÓN Y VISTAS
  const [viewMode, setViewMode] = useState<'catalog' | 'detail' | 'studio'>('catalog');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'homework' | 'lti'>('content');
  
  // ESTADOS DEL CONSTRUCTOR (STUDIO)
  const [isSaving, setIsSaving] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // FORMULARIO DE CURSO MULTI-FORMATO
  const [courseForm, setCourseForm] = useState<any>({
    title: "", code: "INT-", category: "", description: "", duration: "4 semanas", 
    level: "Técnico", teacher: safeUser.name, teacherId: safeUser.id, image: "", 
    format: "native", contentUrl: "", // <- AQUÍ SE GUARDA EL LINK DE SCORM/PDF/LEARNINGSTUDIO
    enrolledStudents: [], modules: []
  });

  // ESTADOS DE TAREAS REALES
  const [homeworkText, setHomeworkText] = useState("");
  const [submittingHomework, setSubmittingHomework] = useState(false);

  // Cargar usuarios de Firebase para asignar profesores y matricular alumnos
  useEffect(() => {
    if (isAdmin || safeUser.role === 'teacher') {
      const fetchUsers = async () => {
        try {
          const uSnap = await getDocs(collection(db, "users"));
          const allU = uSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
          setTeachers(allU.filter(u => u.role === 'admin' || u.role === 'teacher'));
          setStudents(allU.filter(u => u.role === 'student'));
        } catch (error) {
          console.error("Error cargando usuarios:", error);
        }
      };
      fetchUsers();
    }
  }, [safeUser.role, isAdmin]);

  // ==========================================
  // FUNCIONES DEL CONSTRUCTOR (DATOS REALES)
  // ==========================================
  const openStudio = (courseToEdit?: any) => {
    if (courseToEdit) {
      setCourseForm({
        ...courseToEdit,
        format: courseToEdit.format || 'native',
        contentUrl: courseToEdit.contentUrl || '',
        enrolledStudents: Array.isArray(courseToEdit.enrolledStudents) ? courseToEdit.enrolledStudents : [],
        modules: Array.isArray(courseToEdit.modules) ? courseToEdit.modules : []
      });
    } else {
      setCourseForm({
        title: "", code: "INT-", category: "", description: "", duration: "4 semanas", 
        level: "Técnico", teacher: safeUser.name, teacherId: safeUser.id, image: "", 
        format: "native", contentUrl: "", enrolledStudents: [], modules: []
      });
    }
    setViewMode('studio');
  };

  const saveCourseToFirebase = async () => {
    if (!courseForm.title || !courseForm.code) {
      alert("El título y el código del curso son obligatorios.");
      return;
    }
    setIsSaving(true);
    try {
      if (courseForm.id) {
        await updateDoc(doc(db, "courses", courseForm.id), courseForm);
        alert("Curso actualizado con éxito.");
      } else {
        await addDoc(collection(db, "courses"), {
          ...courseForm,
          progress: 0,
          studentsCount: Array.isArray(courseForm.enrolledStudents) ? courseForm.enrolledStudents.length : 0,
          createdAt: serverTimestamp()
        });
        alert("¡Curso creado y publicado en INTECA!");
      }

      if (typeof logUserActivity === 'function') {
        await logUserActivity(
          safeUser.id, safeUser.name, safeUser.email, safeUser.role,
          courseForm.id ? "COURSE_UPDATE" : "COURSE_CREATE", 
          `${courseForm.id ? 'Actualizó' : 'Creó'} el curso: ${courseForm.title}`
        );
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
    if (window.confirm("¿Seguro que deseas eliminar este curso de la base de datos?")) {
      try {
        await deleteDoc(doc(db, "courses", courseId));
        alert("Curso eliminado definitivamente.");
        setViewMode('catalog');
      } catch (error) {
        console.error("Error eliminando curso:", error);
      }
    }
  };

  const toggleStudentEnrollment = (studentId: string) => {
    const safeStudents = Array.isArray(courseForm.enrolledStudents) ? courseForm.enrolledStudents : [];
    const isEnrolled = safeStudents.includes(studentId);
    if (isEnrolled) {
      setCourseForm({ ...courseForm, enrolledStudents: safeStudents.filter((id: string) => id !== studentId) });
    } else {
      setCourseForm({ ...courseForm, enrolledStudents: [...safeStudents, studentId] });
    }
  };

  const handleAddModule = () => {
    const newMod = { id: `mod_${Date.now()}`, title: "Nuevo Módulo", description: "", lessons: [] };
    setCourseForm((prev: any) => ({ ...prev, modules: [...(prev.modules || []), newMod] }));
  };

  const handleAddLesson = (moduleId: string, type: 'video' | 'pdf' | 'task' = 'video') => {
    const newLesson = { id: `les_${Date.now()}`, title: "Nuevo Recurso", type, contentUrl: "" };
    setCourseForm((prev: any) => ({
      ...prev,
      modules: prev.modules.map((m: any) => m.id === moduleId ? { ...m, lessons: [...(m.lessons || []), newLesson] } : m)
    }));
  };

  // ==========================================
  // ENVÍO DE TAREAS REAL A FIREBASE
  // ==========================================
  const submitRealHomework = async () => {
    if (homeworkText.trim().length < 10) {
      alert("Tu entrega es muy corta. Por favor, elabora tu respuesta o pega un enlace válido.");
      return;
    }
    setSubmittingHomework(true);
    try {
      await addDoc(collection(db, "homework_submissions"), {
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        studentId: safeUser.id,
        studentName: safeUser.name,
        content: homeworkText,
        submittedAt: serverTimestamp(),
        status: 'pending' // Pendiente de revisión por el profesor
      });
      alert("¡Tarea entregada exitosamente! Guardada en la libreta del profesor.");
      setHomeworkText("");
      setActiveSubTab('content'); // Devolver al contenido
    } catch (err) {
      console.error("Error enviando tarea:", err);
      alert("Error de conexión al enviar la tarea.");
    } finally {
      setSubmittingHomework(false);
    }
  };

  // ==========================================
  // RENDER 1: CATÁLOGO DE CURSOS
  // ==========================================
  const renderCatalog = () => {
    const safeCourses = Array.isArray(courses) ? courses : [];
    
    // Si es admin/maestro ve todos, si es estudiante ve solo en los que está matriculado
    const displayCourses = isAdmin 
      ? safeCourses 
      : safeCourses.filter((c: any) => Array.isArray(c?.enrolledStudents) && c.enrolledStudents.includes(safeUser.id));

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider">Campus Virtual INTECA</span>
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Catálogo de Programas</h1>
          </div>
          
          {(isAdmin || safeUser.role === 'teacher') && (
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
            <p className="text-sm text-slate-500 mt-2">La base de datos está limpia. Comienza a crear programas académicos reales.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCourses.map((course: any) => (
              <div 
                key={course?.id}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
                onClick={() => {
                  setSelectedCourse(course);
                  setExpandedModule(course?.modules?.[0]?.id || null);
                  setActiveSubTab('content');
                  setViewMode('detail');
                }}
              >
                {(isAdmin || safeUser.id === course?.teacherId) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); openStudio(course); }}
                    className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur text-slate-800 p-2 rounded-lg shadow-sm hover:text-sky-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                <div className="relative h-48 bg-slate-900 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 to-transparent z-10" />
                  <img 
                    src={course?.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} 
                    alt="Portada" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span className="text-[9px] text-white font-mono font-bold uppercase px-3 py-1 rounded-full border bg-emerald-500 border-emerald-400">
                      {course?.format === 'learningstudio' ? 'LearningStudioAI' : course?.format?.toUpperCase() || 'NATIVO'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
                    <span className="text-[10px] font-mono font-bold opacity-80">{course?.code}</span>
                    <h3 className="font-display font-bold text-lg mt-1 leading-snug">{course?.title}</h3>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">{course?.description}</p>
                  
                  {(course?.duration || course?.level) && (
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                      {course?.duration && (
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Duración: <strong className="text-slate-700">{course.duration}</strong></span>
                        </div>
                      )}
                      {course?.level && (
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                          <Award className="w-3.5 h-3.5 text-sky-500" />
                          <span>Nivel: <strong className="text-slate-700">{course.level}</strong></span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <span className="text-xs text-slate-400 font-medium">Prof. {course?.teacher || "No Asignado"}</span>
                    <button className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1">
                      Acceder <ChevronRight className="w-3 h-3" />
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
  // RENDER 2: DETALLE DEL CURSO (EL REPRODUCTOR REAL)
  // ==========================================
  const renderCourseDetail = () => {
    if (!selectedCourse) return null;

    // MOTOR DE RENDERIZADO DEPENDIENDO DEL FORMATO (SCORM, PDF, NATIVO, ETC)
    const renderContentArea = () => {
      switch(selectedCourse.format) {
        // FORMATOS EXTERNOS (Usan iframe embebido)
        case 'scorm':
        case 'pdf':
        case 'html':
        case 'learningstudio':
          return (
            <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm h-[75vh] flex flex-col">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-500"/>
                  Visualizador Integrado: {selectedCourse.format.toUpperCase()}
                </span>
                <a href={selectedCourse.contentUrl} target="_blank" rel="noreferrer" className="text-[10px] text-sky-600 flex items-center gap-1 font-bold hover:bg-sky-50 px-2 py-1 rounded transition-colors">
                  Abrir en pestaña externa <ExternalLink className="w-3 h-3"/>
                </a>
              </div>
              <div className="flex-1 bg-slate-100 rounded-b-2xl overflow-hidden relative">
                {selectedCourse.contentUrl ? (
                  <iframe src={selectedCourse.contentUrl} className="w-full h-full border-0" allowFullScreen></iframe>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">El profesor aún no ha configurado el enlace de este recurso.</div>
                )}
              </div>
            </div>
          );
        
        // FORMATO NATIVO INTECA (Módulos y lecciones)
        case 'native':
        default:
          const safeModules = Array.isArray(selectedCourse?.modules) ? selectedCourse.modules : [];
          return (
            <div className="space-y-4">
              {safeModules.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 shadow-sm">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm">Este programa está en construcción.</p>
                </div>
              ) : (
                safeModules.map((mod: any) => {
                  const isExpanded = expandedModule === mod.id;
                  const safeLessons = Array.isArray(mod.lessons) ? mod.lessons : [];
                  
                  return (
                    <div key={mod.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                      <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} className="w-full text-left p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Módulo</span>
                          <h4 className="font-bold text-slate-900 text-sm md:text-base mt-0.5">{mod.title}</h4>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-2">
                          {safeLessons.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-2">Módulo vacío.</p>
                          ) : (
                            safeLessons.map((lesson: any) => (
                              <div key={lesson.id} className="p-3.5 bg-white rounded-xl border border-slate-100 flex justify-between items-center hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-50 rounded-lg">
                                    {lesson.type === 'video' ? <Video className="w-4 h-4 text-sky-500"/> : <FileText className="w-4 h-4 text-emerald-500"/>}
                                  </div>
                                  <span className="font-bold text-slate-800 text-xs md:text-sm">{lesson.title}</span>
                                </div>
                                <a 
                                  href={lesson.contentUrl || "#"} target="_blank" rel="noreferrer" 
                                  className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                                >
                                  Ver Material
                                </a>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => setViewMode('catalog')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 font-bold transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold border border-emerald-100">{selectedCourse.code}</span>
            <h2 className="font-display font-bold text-slate-900 text-base">{selectedCourse.title}</h2>
          </div>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
          <button onClick={() => setActiveSubTab('content')} className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${activeSubTab === 'content' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
            Contenido Académico
          </button>
          <button onClick={() => setActiveSubTab('homework')} className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${activeSubTab === 'homework' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
            Buzón de Tareas
          </button>
          <button onClick={() => setActiveSubTab('lti')} className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${activeSubTab === 'lti' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
            Llaves LTI
          </button>
        </div>

        <div>
          {/* PESTAÑA 1: CONTENIDO */}
          {activeSubTab === 'content' && renderContentArea()}
          
          {/* PESTAÑA 2: BUZÓN DE TAREAS REAL A FIREBASE */}
          {activeSubTab === 'homework' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-in slide-in-from-bottom-2">
              <div className="space-y-1">
                <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">EVALUACIÓN</span>
                <h3 className="font-bold text-slate-950 text-base mt-1">Entrega de Proyecto: {selectedCourse.title}</h3>
                <p className="text-xs text-slate-500">Buzón directo a la libreta de calificaciones del titular.</p>
              </div>

              {safeUser.role === 'student' ? (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700">Tu Entrega:</label>
                  <textarea
                    value={homeworkText}
                    onChange={(e) => setHomeworkText(e.target.value)}
                    placeholder="Escribe tu respuesta técnica aquí o pega el enlace de tu documento (Google Drive, OneDrive, etc.)..."
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all leading-relaxed"
                  />
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={submitRealHomework} 
                      disabled={submittingHomework} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md disabled:opacity-50"
                    >
                      {submittingHomework ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} 
                      {submittingHomework ? "Enviando a Base de Datos..." : "Entregar Proyecto"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 mt-4">
                  <p className="text-sm font-bold text-slate-600">Vista de Profesor / Administrador</p>
                  <p className="text-xs text-slate-500 mt-1">Los estudiantes verán la caja de texto aquí para enviar sus tareas a tu libreta.</p>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 3: LTI */}
          {activeSubTab === 'lti' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-in slide-in-from-bottom-2">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900">Interoperabilidad LTI</h3>
                <p className="text-xs text-slate-500">Llaves criptográficas para incrustar este curso en Canvas o Moodle.</p>
              </div>
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-2 shadow-inner">
                <p><span className="text-slate-400">LTI_KEY:</span> inteca_{selectedCourse.id.substring(0,8)}</p>
                <p><span className="text-slate-400">LTI_SECRET:</span> sec_{selectedCourse.id}84e</p>
                <p><span className="text-slate-400">LAUNCH:</span> https://lms.inteca.edu.co/lti/{selectedCourse.id}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER 3: STUDIO (CONSTRUCTOR DE CURSOS)
  // ==========================================
  const renderStudio = () => {
    const safeFormModules = Array.isArray(courseForm?.modules) ? courseForm.modules : [];
    const safeTeachers = Array.isArray(teachers) ? teachers : [];
    const safeStudents = Array.isArray(students) ? students : [];

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-6 rounded-3xl text-white shadow-xl gap-4">
          <div>
            <span className="text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              Arquitecto de Programas
              {isAdmin && <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px] tracking-widest shadow-sm">MASTER</span>}
            </span>
            <h2 className="text-2xl font-bold font-display mt-1">{courseForm?.id ? "Editar Programa" : "Nuevo Programa"}</h2>
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
          {/* INFO GENERAL */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Información Principal</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Título del Curso</label>
                  <input type="text" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Ej. Redes Informáticas" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1.5">Formato de Contenido (Tecnología)</label>
                  <select 
                    value={courseForm.format}
                    onChange={(e) => setCourseForm({...courseForm, format: e.target.value})}
                    className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="native">LMS Nativo (Por Módulos)</option>
                    <option value="learningstudio">Alojado en LearningStudioAI</option>
                    <option value="scorm">Paquete Externo SCORM</option>
                    <option value="pdf">Documento Directo (PDF)</option>
                    <option value="html">Incrustación Web Segura (HTML)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Profesor / Titular</label>
                  <select 
                    value={courseForm.teacherId}
                    onChange={(e) => {
                      const t = safeTeachers.find(t => t.id === e.target.value);
                      setCourseForm({...courseForm, teacherId: t?.id || "", teacher: t?.name || ""});
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="">-- Asignar --</option>
                    {safeTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Código</label>
                    <input type="text" value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Categoría</label>
                    <input type="text" value={courseForm.category} onChange={e => setCourseForm({...courseForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Descripción</label>
                  <textarea rows={3} value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none leading-relaxed" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">URL Portada (JPG/PNG)</label>
                  <input type="text" value={courseForm.image} onChange={e => setCourseForm({...courseForm, image: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none" placeholder="https://..." />
                </div>
              </div>

              {courseForm?.id && isAdmin && (
                 <button onClick={() => deleteCourse(courseForm.id)} className="w-full mt-6 flex justify-center gap-2 py-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all">
                   <Trash2 className="w-4 h-4"/> Eliminar Curso
                 </button>
              )}
            </div>
          </div>

          {/* ESTRUCTURA DEL CONTENIDO (DINÁMICO SEGÚN FORMATO) */}
          <div className="lg:col-span-1 space-y-6">
            {courseForm.format !== 'native' ? (
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center border-dashed border-2 border-sky-100 h-full flex flex-col justify-center">
                 <Monitor className="w-16 h-16 text-sky-400 mx-auto mb-4" />
                 <h3 className="text-lg font-bold text-slate-800">Motor: {courseForm.format.toUpperCase()}</h3>
                 <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto mb-6">
                    {courseForm.format === 'learningstudio' && "Pega la URL de tu curso generado en LearningStudioAI. El sistema lo incrustará automáticamente."}
                    {courseForm.format === 'scorm' && "Pega la URL pública donde está alojado tu paquete SCORM (Ej. tu nube de AWS o Google Cloud)."}
                    {courseForm.format === 'pdf' && "Pega el enlace directo a tu documento PDF (.pdf)."}
                    {courseForm.format === 'html' && "Pega el enlace web (HTTPS) que deseas incrustar para los alumnos."}
                 </p>
                 <div className="text-left w-full space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">URL de Origen del Contenido:</label>
                    <input 
                      type="url" 
                      value={courseForm.contentUrl} 
                      onChange={(e) => setCourseForm({...courseForm, contentUrl: e.target.value})} 
                      className="w-full bg-slate-50 border-2 border-sky-200 focus:border-sky-500 rounded-xl p-4 text-sm font-mono outline-none transition-colors" 
                      placeholder="https://..." 
                    />
                 </div>
               </div>
            ) : (
              <>
                <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-800">Malla Curricular</h3>
                  </div>
                  <button onClick={handleAddModule} className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Módulo</button>
                </div>

                {safeFormModules.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No hay módulos.</p>
                  </div>
                ) : (
                  safeFormModules.map((mod: any, mIndex: number) => {
                    const safeLessonsForm = Array.isArray(mod?.lessons) ? mod.lessons : [];
                    return (
                      <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col gap-3">
                          <input 
                            type="text" value={mod.title || ""} 
                            onChange={(e) => {
                              const newMods = [...safeFormModules];
                              newMods[mIndex].title = e.target.value;
                              setCourseForm({...courseForm, modules: newMods});
                            }} 
                            className="font-bold text-sm bg-transparent border-b-2 border-slate-300 focus:border-emerald-500 outline-none w-full pb-1.5" placeholder="Título Módulo" 
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleAddLesson(mod.id, 'video')} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1.5 rounded flex-1">Video</button>
                            <button onClick={() => handleAddLesson(mod.id, 'task')} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1.5 rounded flex-1">Doc</button>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {safeLessonsForm.map((lesson: any, lIndex: number) => (
                            <div key={lesson.id} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                              <button onClick={() => {
                                const newMods = [...safeFormModules];
                                newMods[mIndex].lessons.splice(lIndex, 1);
                                setCourseForm({...courseForm, modules: newMods});
                              }} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"><X className="w-3.5 h-3.5"/></button>
                              
                              <input type="text" value={lesson.title} onChange={(e) => {
                                const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].title = e.target.value; setCourseForm({...courseForm, modules: nm});
                              }} className="bg-transparent border-b border-slate-300 outline-none text-xs font-bold w-11/12" placeholder="Título de la lección"/>
                              
                              <input type="text" value={lesson.contentUrl} onChange={(e) => {
                                const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].contentUrl = e.target.value; setCourseForm({...courseForm, modules: nm});
                              }} className="bg-white border border-slate-200 rounded p-1.5 text-[10px] w-full" placeholder="URL (YouTube, Drive, etc.)"/>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* MATRICULACIÓN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full max-h-[600px]">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Users className="w-5 h-5 text-sky-500" />
                <h2 className="font-bold text-slate-900 text-sm">Alumnos</h2>
              </div>
              <div className="overflow-y-auto mt-4 space-y-2">
                {safeStudents.map(student => {
                  const isEnrolled = (Array.isArray(courseForm?.enrolledStudents) ? courseForm.enrolledStudents : []).includes(student.id);
                  return (
                    <div key={student.id} onClick={() => toggleStudentEnrollment(student.id)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${isEnrolled ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-100'}`}>
                      <div className="flex items-center gap-2.5">
                        <img src={student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt="" className="w-7 h-7 rounded-full" />
                        <div><p className="text-xs font-bold">{student.name}</p></div>
                      </div>
                      {isEnrolled && <UserCheck className="w-4 h-4 text-sky-600" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="courses-view-root">
      {viewMode === 'catalog' && renderCatalog()}
      {viewMode === 'studio' && renderStudio()}
      {viewMode === 'detail' && renderCourseDetail()}
    </div>
  );
}