import React, { useState, useEffect } from "react";
import * as mammoth from "mammoth"; // 🧠 Motor Extractor de Word Nativo
import { 
  BookOpen, ChevronRight, Clock, ArrowLeft,
  Award, Loader2, FileText, Video, Send, Plus, Trash2, Save, Image, Edit3, 
  X, Layers, Users, UserCheck, Monitor, ExternalLink, FolderArchive, UploadCloud, Link as LinkIcon, Download,
  ClipboardCheck, BarChart, ShieldCheck, Search, Lock, Sparkles, CheckCircle2
} from "lucide-react";
import { db, logUserActivity } from "../firebase"; 
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, serverTimestamp, arrayUnion, query, onSnapshot } from "firebase/firestore";
import { Course, UserProfile } from "../types";

// 🚀 CONFIGURACIÓN DE TU NUEVO DISCO DURO (CLOUDINARY)
const CLOUDINARY_CLOUD_NAME = "dug7oqir"; 
const CLOUDINARY_UPLOAD_PRESET = "inteca_archivos";

interface CoursesViewProps {
  currentUser?: UserProfile | any; 
  courses?: Course[] | any[];
  setActiveTab: (tab: string) => void;
}

export default function CoursesView({ currentUser, courses = [], setActiveTab }: CoursesViewProps) {
  
  // 🛡️ AUTOPILOTO DE EMERGENCIA Y ROLES ESTRICTOS
  const safeUser = currentUser || {
    id: "admin_master_1985",
    name: "Luis A. Ramirez",
    email: "luisramirezescalante1985@gmail.com",
    role: "admin"
  };

  // ✅ CORRECCIÓN BLINDADA: Minúsculas y sin espacios para evitar errores con Firebase
  const currentRole = String(safeUser?.role || '').toLowerCase().trim();
  const isMaster = String(safeUser.email || "").toLowerCase() === "luisramirezescalante1985@gmail.com";
  const isAdmin = currentRole === 'admin' || isMaster;
  const isAuditor = currentRole === 'observer' || currentRole === 'auditor';

  // ESTADOS DE NAVEGACIÓN Y VISTAS
  const [viewMode, setViewMode] = useState<'catalog' | 'detail' | 'studio'>('catalog');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'homework' | 'lti' | 'audit'>('content');
  
  // ESTADOS DEL CONSTRUCTOR (STUDIO)
  const [isSaving, setIsSaving] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // NUEVOS ESTADOS DE BÚSQUEDA
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  // ESTADOS PARA SUBIDAS Y EVALUACIONES NATIVAS
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [uploadingTaskLessonId, setUploadingTaskLessonId] = useState<string | null>(null);
  const [uploadingExamModuleId, setUploadingExamModuleId] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // ✨ NUEVO: ESTADO PARA LA GENERACIÓN EXCLUSIVA DE EXÁMENES
  const [isGeneratingExamIndex, setIsGeneratingExamIndex] = useState<number | null>(null);
  
  // MEMORIA DE ESTUDIANTES PARA EXÁMENES Y TAREAS NATIVAS
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({}); 
  const [studentFiles, setStudentFiles] = useState<Record<string, File | null>>({}); 
  const [uploadingStudentFile, setUploadingStudentFile] = useState<string | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, Record<number, number>>>({}); 
  
  // FORMULARIO DE CURSO MULTI-FORMATO
  const [courseForm, setCourseForm] = useState<any>({
    title: "", code: "INT-", category: "", description: "", duration: "4 semanas", 
    level: "Técnico", teacher: "", teacherId: "", image: "", 
    format: "native", contentUrl: "", 
    enrolledStudents: [], modules: []
  });

  // ESTADOS DE TAREAS REALES Y AUDITORÍA
  const [homeworkText, setHomeworkText] = useState("");
  const [submittingHomework, setSubmittingHomework] = useState(false);

  // ✨ ESTADOS DE CONEXIÓN EN TIEMPO REAL CON FIREBASE ✨
  const [liveCourses, setLiveCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

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

  // ✨ ESCUCHADOR EN TIEMPO REAL DE CURSOS (BLINDADO CONTRA ERRORES DE ÍNDICE) ✨
  useEffect(() => {
    const q = collection(db, "courses");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCourses: any[] = [];
      snapshot.forEach(doc => fetchedCourses.push({ id: doc.id, ...doc.data() }));
      
      // Ordenamos localmente para evitar errores de Firestore por falta de índices
      fetchedCourses.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setLiveCourses(fetchedCourses);
      setLoadingCourses(false);
    }, (error) => {
      console.error("Error cargando cursos desde la nube:", error);
      setLoadingCourses(false);
    });

    return () => unsubscribe();
  }, []);

  // ==========================================
  // FUNCIONES DEL CONSTRUCTOR (DATOS REALES)
  // ==========================================
  const openStudio = (courseToEdit?: any) => {
    setStudentSearch("");
    setTeacherSearch("");
    if (courseToEdit) {
      setCourseForm({
        ...courseToEdit,
        format: courseToEdit.format || 'native',
        contentUrl: courseToEdit.contentUrl || '',
        enrolledStudents: Array.isArray(courseToEdit.enrolledStudents) ? courseToEdit.enrolledStudents : [],
        modules: Array.isArray(courseToEdit.modules) ? courseToEdit.modules : []
      });
    } else {
      // ✨ AUTO-ASIGNACIÓN DE PROFESOR SI EL USUARIO ES TEACHER ✨
      const defaultTeacherId = safeUser.role === 'teacher' ? safeUser.id : "";
      const defaultTeacherName = safeUser.role === 'teacher' ? safeUser.name : "";

      setCourseForm({
        title: "", code: "INT-", category: "", description: "", duration: "4 semanas", 
        level: "Técnico", teacher: defaultTeacherName, teacherId: defaultTeacherId, image: "", 
        format: "native", contentUrl: "", enrolledStudents: [], modules: []
      });
    }
    setViewMode('studio');
  };

  const saveCourseToFirebase = async () => {
    // 🚨 ALERTAS DE VALIDACIÓN MÁS ESPECÍFICAS
    if (!courseForm.title || courseForm.title.trim() === "") {
      alert("❌ Faltan datos: Por favor, escribe un Título para el curso antes de publicar.");
      return;
    }
    if (!courseForm.code || courseForm.code.trim() === "") {
      alert("❌ Faltan datos: Por favor, asigna un Código válido al curso.");
      return;
    }
    if (!courseForm.teacherId) {
      alert("❌ Faltan datos: Por favor, selecciona un Profesor / Titular de la lista desplegable.");
      return;
    }

    setIsSaving(true);
    try {
      const isMockCourse = courseForm.id && String(courseForm.id).length < 10;

      if (courseForm.id && !isMockCourse) {
        await updateDoc(doc(db, "courses", courseForm.id), courseForm);
      } else {
        const { id, ...dataToSave } = courseForm; // Quitamos cualquier ID falso
        await addDoc(collection(db, "courses"), {
          ...dataToSave,
          progress: 0,
          studentsCount: Array.isArray(courseForm.enrolledStudents) ? courseForm.enrolledStudents.length : 0,
          createdAt: serverTimestamp()
        });
      }

      // 🔥 ASIGNACIÓN MAESTRA: Sincronizar al profesor en el perfil de cada alumno matriculado 🔥
      if (isAdmin && courseForm.teacher && Array.isArray(courseForm.enrolledStudents) && courseForm.enrolledStudents.length > 0) {
        const updatePromises = courseForm.enrolledStudents.map((studentId: string) => 
          updateDoc(doc(db, "users", studentId), {
            assignedTeachers: arrayUnion(courseForm.teacher)
          }).catch(e => console.log("Aviso: No se pudo sincronizar profesor en alumno", e))
        );
        await Promise.all(updatePromises);
      }

      if (typeof logUserActivity === 'function') {
        await logUserActivity(
          safeUser.id, safeUser.name, safeUser.email, safeUser.role,
          courseForm.id ? "COURSE_UPDATE" : "COURSE_CREATE", 
          `${courseForm.id ? 'Actualizó' : 'Creó'} el curso: ${courseForm.title}`
        );
      }
      
      alert(courseForm.id ? "✅ Curso actualizado con éxito." : "✅ ¡Curso creado y guardado en Firestore correctamente!");
      setViewMode('catalog');
    } catch (error) {
      console.error("Error guardando curso:", error);
      alert("Hubo un error al conectar con Firebase Firestore.");
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
    // ✨ PERMISOS RESTRINGIDOS: Solo Administradores pueden matricular ✨
    if (!isAdmin) return; 
    
    const safeStudents = Array.isArray(courseForm.enrolledStudents) ? courseForm.enrolledStudents : [];
    const isEnrolled = safeStudents.includes(studentId);
    if (isEnrolled) {
      setCourseForm({ ...courseForm, enrolledStudents: safeStudents.filter((id: string) => id !== studentId) });
    } else {
      setCourseForm({ ...courseForm, enrolledStudents: [...safeStudents, studentId] });
    }
  };

  const handleAddModule = () => {
    const newMod = { id: `mod_${Date.now()}`, title: "Nuevo Módulo", description: "", examType: 'none', examUrl: "", examQuestions: [], lessons: [] };
    setCourseForm((prev: any) => ({ ...prev, modules: [...(prev.modules || []), newMod] }));
  };

  const handleAddLesson = (moduleId: string, type: 'video' | 'pdf' | 'task' = 'video') => {
    const newLesson = { id: `les_${Date.now()}`, title: "Nuevo Tema", type, contentUrl: "", videoUrl: "", textContent: "", taskType: 'none', taskDescription: "", taskUrl: "" };
    setCourseForm((prev: any) => ({
      ...prev,
      modules: prev.modules.map((m: any) => m.id === moduleId ? { ...m, lessons: [...(m.lessons || []), newLesson] } : m)
    }));
  };

  // ==========================================
  // IA: EXTRACCIÓN Y GENERACIÓN MÁGICA EXCLUSIVA PARA EXÁMENES NATIVOS
  // ==========================================
  const handleExamAIGeneration = async (e: React.ChangeEvent<HTMLInputElement>, mIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert("❌ Formato Inválido: Sube un archivo de Word (.docx) con tu examen.");
      e.target.value = '';
      return;
    }

    setIsGeneratingExamIndex(mIndex);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        if (!text || text.trim() === '') {
          alert("El documento parece estar vacío o protegido.");
          setIsGeneratingExamIndex(null);
          return;
        }

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
        const newQuestions: any[] = [];
        
        // Identificadores de preguntas (Ej. "1. ¿Qué es?") y opciones (Ej. "a) Respuesta")
        const preguntaRegex = /^\s*\d+[\.\-\)]\s*(.+)/;
        const opcionRegex = /^\s*[a-e][\.\-\)]\s*(.+)/i;

        lines.forEach(line => {
          const qMatch = preguntaRegex.exec(line);
          const oMatch = opcionRegex.exec(line);
          
          if (oMatch) {
            if (newQuestions.length > 0) {
              newQuestions[newQuestions.length - 1].options.push(oMatch[1]);
            }
          } else if (qMatch || line.endsWith('?')) {
            const qText = qMatch ? qMatch[1] : line;
            newQuestions.push({ question: qText, options: [], correct: 0 }); // Por defecto asume la A (0)
          }
        });

        if (newQuestions.length === 0) {
          alert("No se detectaron preguntas válidas. Asegúrate de enumerarlas (Ej. '1. Pregunta') y usar letras para opciones (Ej. 'a) Opción').");
        } else {
          setCourseForm((prev: any) => {
            const nm = [...prev.modules];
            if(!nm[mIndex].examQuestions) nm[mIndex].examQuestions = [];
            nm[mIndex].examQuestions = [...nm[mIndex].examQuestions, ...newQuestions];
            return { ...prev, modules: nm };
          });
          alert(`¡Magia pura! Se crearon ${newQuestions.length} preguntas interactivas automáticamente.`);
        }
      } catch (error) {
        console.error("Error extrayendo el examen Word:", error);
        alert("Ocurrió un error procesando el examen.");
      } finally {
        setIsGeneratingExamIndex(null);
        e.target.value = ''; 
      }
    };

    reader.onerror = () => {
      alert("El navegador bloqueó la lectura del archivo.");
      setIsGeneratingExamIndex(null);
      e.target.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  // ==========================================
  // IA: MOTOR ALGORÍTMICO NATIVO DE GENERACIÓN DE MALLA (V 3.0 ESTRICTO)
  // ==========================================
  const handleAIGeneration = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert("Formato Inválido: Sube un archivo de Microsoft Word (.docx) para que el motor nativo pueda leerlo.");
      e.target.value = '';
      return;
    }

    setIsGeneratingAI(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        if (!text || text.trim() === '') {
          alert("El documento parece estar vacío o es un archivo incompatible (Ej. imagen dentro de un Word).");
          setIsGeneratingAI(false);
          return;
        }

        // Dividimos por saltos de línea y limpiamos vacíos
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
        const newModules: any[] = [];
        let currentModule: any = null;
        let currentLesson: any = null;
        let inExamMode = false; // Bandera para saber si el parser está leyendo el examen final

        // ✨ REGEX SUPER ESTRICTAS ✨
        const moduloRegex = /^\s*(?:módulo|modulo|unidad|capítulo)\s+\d+/i;
        const temaRegex = /^\s*(?:tema|lección|leccion|clase)\s+\d+/i;
        const examenRegex = /^\s*(?:examen|evaluación|prueba final)/i;
        const preguntaRegex = /^\s*\d+[\.\-\)]\s*(.+)/;
        const opcionRegex = /^\s*[a-e][\.\-\)]\s*(.+)/i;

        lines.forEach(line => {
          const lowerLine = line.toLowerCase();

          // 1. Detectar Módulo Nuevo
          if (moduloRegex.test(lowerLine)) {
            inExamMode = false;
            currentModule = {
              id: `mod_${Date.now()}_${Math.random()}`,
              title: line.substring(0, 150), 
              description: "",
              examType: 'none',
              examUrl: "",
              examQuestions: [],
              lessons: []
            };
            newModules.push(currentModule);
            currentLesson = null;
          } 
          // 2. Detectar Examen Nativo
          else if (examenRegex.test(lowerLine) || lowerLine.includes('examen de tema')) {
            if (currentModule) {
              currentModule.examType = 'native'; 
              if(!currentModule.examQuestions) currentModule.examQuestions = [];
              inExamMode = true;
            }
          }
          // 3. Detectar Tema Nuevo
          else if (temaRegex.test(lowerLine)) {
            inExamMode = false;
            if (!currentModule) {
              currentModule = {
                id: `mod_default_${Date.now()}`,
                title: "Módulo Principal",
                description: "",
                examType: 'none',
                examUrl: "",
                examQuestions: [],
                lessons: []
              };
              newModules.push(currentModule);
            }
            currentLesson = {
              id: `les_${Date.now()}_${Math.random()}`,
              title: line.substring(0, 150),
              type: 'video', 
              contentUrl: "",
              videoUrl: "",
              textContent: "", 
              taskType: 'none', 
              taskDescription: "",
              taskUrl: ""
            };
            currentModule.lessons.push(currentLesson);
          } 
          // 4. Leer preguntas del examen (Si estamos en el bloque de examen)
          else if (inExamMode && currentModule) {
            const qMatch = preguntaRegex.exec(line);
            const oMatch = opcionRegex.exec(line);
            
            if (oMatch) {
              const lastQ = currentModule.examQuestions[currentModule.examQuestions.length - 1];
              if (lastQ) lastQ.options.push(oMatch[1]);
            } else if (qMatch || line.endsWith('?')) {
              const qText = qMatch ? qMatch[1] : line;
              currentModule.examQuestions.push({ question: qText, options: [], correct: 0 });
            }
          }
          // 5. Capturar el desarrollo teórico directo al TextContent
          else {
            if (currentLesson) {
              currentLesson.textContent += (currentLesson.textContent ? "\n\n" : "") + line;
            } else if (currentModule && currentModule.description.length < 300) {
              currentModule.description += (currentModule.description ? " " : "") + line;
            }
          }
        });

        if (newModules.length === 0) {
          newModules.push({
            id: `mod_fallback_${Date.now()}`,
            title: "Desarrollo Teórico Generado",
            description: "El sistema estructuró todo el contenido en este módulo principal.",
            examType: 'none',
            examUrl: "",
            examQuestions: [],
            lessons: [
              {
                id: `les_fallback_${Date.now()}`,
                title: "Contenido del Manual",
                type: 'video',
                contentUrl: "",
                videoUrl: "",
                textContent: text, 
                taskType: 'none',
                taskDescription: "",
                taskUrl: ""
              }
            ]
          });
        }

        setCourseForm((prev: any) => {
          const currentMods = prev.modules || [];
          const isEmptyCourse = currentMods.length === 0 || 
                               (currentMods.length === 1 && currentMods[0].lessons.length === 0);
          
          return {
            ...prev,
            modules: isEmptyCourse ? newModules : [...currentMods, ...newModules]
          };
        });

        if (newModules.length > 0) {
          setExpandedModule(newModules[0].id);
        }

        alert("¡Malla Curricular generada y desarrollo teórico inyectado correctamente!");
      } catch (error) {
        console.error("Error al extraer texto del Word:", error);
        alert("Ocurrió un error leyendo la estructura interna del documento Word.");
      } finally {
        setIsGeneratingAI(false);
        e.target.value = ''; 
      }
    };

    reader.onerror = () => {
      alert("El navegador bloqueó la lectura del archivo local.");
      setIsGeneratingAI(false);
      e.target.value = '';
    };

    reader.readAsArrayBuffer(file);
  };

  // ==========================================
  // CLOUDINARY: SUBIDAS (GENERAL Y VIDEO)
  // ==========================================
  const handleCloudinaryUpload = async (file: File, endpoint: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${endpoint}/upload`, {
      method: "POST", body: formData,
    });
    return await response.json();
  };

  const handleCoverUpload = async (file: File) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const data = await handleCloudinaryUpload(file, "image");
      if (data.secure_url) setCourseForm((prev: any) => ({ ...prev, image: data.secure_url }));
      else alert("Error de Cloudinary al subir imagen.");
    } catch (error: any) { alert(`Error al conectar con el servidor: ${error.message}`); } 
    finally { setUploadingCover(false); }
  };

  const handleLessonVideoUpload = async (moduleId: string, lessonId: string, file: File) => {
    if (!file) return;
    setUploadingLessonId(`vid_${lessonId}`);
    try {
      const data = await handleCloudinaryUpload(file, "video");
      if (data.secure_url) {
        setCourseForm((prev: any) => {
          const nm = [...prev.modules];
          const mIdx = nm.findIndex((m: any) => m.id === moduleId);
          if (mIdx > -1) {
            const lIdx = nm[mIdx].lessons.findIndex((l: any) => l.id === lessonId);
            if (lIdx > -1) nm[mIdx].lessons[lIdx].videoUrl = data.secure_url;
          }
          return { ...prev, modules: nm };
        });
      } else alert("Error de Cloudinary al subir video.");
    } catch (error: any) { alert(`Error crítico de conexión: ${error.message}`); } 
    finally { setUploadingLessonId(null); }
  };

  const handleLessonDocUpload = async (moduleId: string, lessonId: string, file: File) => {
    if (!file) return;
    setUploadingLessonId(`doc_${lessonId}`);
    try {
      const data = await handleCloudinaryUpload(file, "auto");
      if (data.secure_url) {
        setCourseForm((prev: any) => {
          const nm = [...prev.modules];
          const mIdx = nm.findIndex((m: any) => m.id === moduleId);
          if (mIdx > -1) {
            const lIdx = nm[mIdx].lessons.findIndex((l: any) => l.id === lessonId);
            if (lIdx > -1) nm[mIdx].lessons[lIdx].contentUrl = data.secure_url;
          }
          return { ...prev, modules: nm };
        });
      }
    } catch (error: any) { alert(`Error al subir el documento: ${error.message}`); } 
    finally { setUploadingLessonId(null); }
  };

  const handleLessonTaskUpload = async (moduleId: string, lessonId: string, file: File) => {
    if (!file) return;
    setUploadingTaskLessonId(lessonId);
    try {
      const data = await handleCloudinaryUpload(file, "auto"); 
      if (data.secure_url) {
        setCourseForm((prev: any) => {
          const nm = [...prev.modules];
          const mIdx = nm.findIndex((m: any) => m.id === moduleId);
          if (mIdx > -1) {
            const lIdx = nm[mIdx].lessons.findIndex((l: any) => l.id === lessonId);
            if (lIdx > -1) nm[mIdx].lessons[lIdx].taskUrl = data.secure_url;
          }
          return { ...prev, modules: nm };
        });
      }
    } catch (error: any) { alert(`Error al subir la tarea: ${error.message}`); } 
    finally { setUploadingTaskLessonId(null); }
  };

  // ==========================================
  // ENVÍO DE TAREAS Y EXAMENES A FIREBASE
  // ==========================================
  const submitAssessment = async (type: 'lesson_task' | 'module_exam', itemId: string, itemTitle: string, content: any, fileUrl?: string, score?: number) => {
    try {
      await addDoc(collection(db, "homework_submissions"), {
        courseId: selectedCourse.id, courseTitle: selectedCourse.title,
        assessmentId: itemId, assessmentTitle: itemTitle,
        studentId: safeUser.id, studentName: safeUser.name,
        type, content, fileUrl: fileUrl || "", score: score !== undefined ? score : null,
        submittedAt: serverTimestamp(), status: 'pending' 
      });
      alert(type === 'module_exam' ? `¡Examen completado! Tu calificación es ${score?.toFixed(0)}/100` : "¡Evaluación entregada exitosamente!");
    } catch (err) { alert("Error de conexión al enviar."); }
  };

  const handleStudentSubmitFileTask = async (lessonOrModId: string, title: string, type: 'lesson_task' | 'module_exam') => {
    const file = studentFiles[lessonOrModId];
    if(!file) return alert("Por favor, selecciona un archivo primero.");
    setUploadingStudentFile(lessonOrModId);
    try {
      const data = await handleCloudinaryUpload(file, "auto");
      if(data.secure_url) {
        await submitAssessment(type, lessonOrModId, title, "Archivo Adjunto", data.secure_url);
      }
    } finally { setUploadingStudentFile(null); }
  };

  const evaluateNativeExam = async (mod: any) => {
    const answers = examAnswers[mod.id] || {};
    const safeQuestions = Array.isArray(mod.examQuestions) ? mod.examQuestions : [];
    
    if(Object.keys(answers).length < safeQuestions.length) {
      return alert("Debes responder todas las preguntas antes de enviar tu examen.");
    }
    
    let correctCount = 0;
    safeQuestions.forEach((q: any, idx: number) => { if(answers[idx] === q.correct) correctCount++; });
    const score = (correctCount / safeQuestions.length) * 100;
    
    await submitAssessment('module_exam', mod.id, `Examen Módulo: ${mod.title}`, JSON.stringify(answers), undefined, score);
  };

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
        status: 'pending' 
      });
      alert("¡Tarea entregada exitosamente! Guardada en la libreta del profesor.");
      setHomeworkText("");
      setActiveSubTab('content'); 
    } catch (err) {
      console.error("Error enviando tarea:", err);
      alert("Error de conexión al enviar la tarea.");
    } finally {
      setSubmittingHomework(false);
    }
  };

  const handleDownloadImage = async (e: React.MouseEvent, imageUrl: string, courseTitle: string) => {
    e.stopPropagation(); 
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Portada_${courseTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error al descargar la imagen...", error);
      window.open(imageUrl, '_blank');
    }
  };

  // ==========================================
  // RENDER 1: CATÁLOGO DE CURSOS Y AUDITORÍA
  // ==========================================
  const renderCatalog = () => {
    const safeCourses = liveCourses; 
    
    const displayCourses = (isAdmin || isAuditor) 
      ? safeCourses 
      : safeCourses.filter((c: any) => {
          if (safeUser.role === 'teacher') return c.teacherId === safeUser.id;
          if (safeUser.role === 'student') return Array.isArray(c?.enrolledStudents) && c.enrolledStudents.includes(safeUser.id);
          return false;
        });

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isAuditor ? 'text-indigo-600' : 'text-emerald-600'}`}>
              {isAuditor ? 'Módulo de Fiscalización' : 'Campus Virtual INTECA'}
            </span>
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
              {isAuditor ? 'Auditoría de Programas' : 'Catálogo de Programas'}
            </h1>
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

        {loadingCourses ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
            <p className="text-sm font-bold">Cargando catálogo desde la nube...</p>
          </div>
        ) : displayCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            {isAuditor ? <ShieldCheck className="w-16 h-16 text-indigo-200 mx-auto mb-4" /> : <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />}
            <h3 className="text-lg font-bold text-slate-700">No hay programas disponibles</h3>
            <p className="text-sm text-slate-500 mt-2">Crea tu primer curso real para que aparezca aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCourses.map((course: any) => {
              try {
                return (
                  <div 
                    key={course?.id}
                    className={`bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer relative ${isAuditor ? 'border-indigo-100 hover:border-indigo-500/30' : 'border-slate-100 hover:border-emerald-500/30'}`}
                    onClick={() => {
                      setSelectedCourse(course);
                      setExpandedModule(course?.modules?.[0]?.id || null);
                      setActiveSubTab(isAuditor ? 'audit' : 'content');
                      setViewMode('detail');
                    }}
                  >
                    {(isAdmin || safeUser.id === course?.teacherId) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openStudio(course); }}
                        className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur text-slate-800 p-2 rounded-lg shadow-sm hover:text-sky-600 transition-colors"
                        title="Ir al Studio (Editar)"
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
                      
                      <div className="absolute top-4 left-4 z-20">
                        <button 
                          onClick={(e) => handleDownloadImage(e, course?.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800", course?.title || "curso")}
                          className={`bg-white/90 backdrop-blur text-slate-800 p-2 rounded-lg shadow-sm transition-colors ${isAuditor ? 'hover:text-indigo-600' : 'hover:text-emerald-600'}`}
                          title="Descargar Portada"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
                        <span className="text-[10px] font-mono font-bold opacity-80">{String(course?.code || "INT-???")}</span>
                        <h3 className="font-display font-bold text-lg mt-1 leading-snug">{String(course?.title || "Curso sin Título")}</h3>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">{String(course?.description || "Sin descripción.")}</p>
                      
                      {(course?.duration || course?.level) && (
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                          {course?.duration && (
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                              <Clock className={`w-3.5 h-3.5 ${isAuditor ? 'text-indigo-500' : 'text-emerald-500'}`} />
                              <span>Duración: <strong className="text-slate-700">{String(course.duration)}</strong></span>
                            </div>
                          )}
                          {course?.level && (
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                              <Award className="w-3.5 h-3.5 text-sky-500" />
                              <span>Nivel: <strong className="text-slate-700">{String(course.level)}</strong></span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                        <span className="text-xs text-slate-400 font-medium">Prof. {String(course?.teacher || "No Asignado")}</span>
                        <button className={`${isAuditor ? 'bg-indigo-600' : 'bg-emerald-600'} text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1 transition-colors shadow-sm`}>
                          {isAuditor ? "Evaluar" : "Acceder"} <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } catch (e) {
                return (
                  <div key={course?.id || Math.random()} className="bg-rose-50 border-2 border-dashed border-rose-300 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-rose-500 font-bold mb-2 flex items-center gap-2"><Layers className="w-5 h-5"/> Curso Dañado</span>
                    <p className="text-[10px] text-rose-400 mb-4 font-mono">ID: {course?.id || "Desconocido"}</p>
                    {isAdmin && (
                      <button onClick={() => deleteCourse(course?.id)} className="bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar Error
                      </button>
                    )}
                  </div>
                )
              }
            })}
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // RENDER 2: DETALLE DEL CURSO (REPRODUCTOR ESTUDIANTE)
  // ==========================================
  const renderCourseDetail = () => {
    if (!selectedCourse) return null;

    const renderContentArea = () => {
      switch(selectedCourse.format) {
        case 'scorm':
        case 'pdf':
        case 'html':
        case 'learningstudio':
          return (
            <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm h-[75vh] flex flex-col">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-500"/>
                  Visualizador Integrado: {String(selectedCourse.format).toUpperCase()}
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
                      <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} className={`w-full text-left p-5 flex justify-between items-center transition-colors ${isExpanded ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}>
                        <div>
                          <span className={`text-[10px] font-mono tracking-widest uppercase ${isExpanded ? 'text-emerald-400' : 'text-slate-400'}`}>Módulo</span>
                          <h4 className={`font-bold text-sm md:text-base mt-0.5 ${isExpanded ? 'text-white' : 'text-slate-900'}`}>{mod.title}</h4>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90 text-white' : 'text-slate-400'}`} />
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4">
                          {safeLessons.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-2">Módulo vacío.</p>
                          ) : (
                            safeLessons.map((lesson: any) => (
                              <div key={lesson.id} className="p-4 bg-white rounded-xl border border-slate-100 flex flex-col gap-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                      <BookOpen className="w-4 h-4 text-emerald-600"/>
                                    </div>
                                    <span className="font-bold text-slate-800 text-sm">{lesson.title}</span>
                                  </div>
                                </div>

                                {/* ✨ MAGIA: REPRODUCTOR DE VIDEO INTEGRADO PARA EL ESTUDIANTE ✨ */}
                                {lesson.videoUrl && (
                                  <div className="mt-3 w-full rounded-xl overflow-hidden border border-slate-200 bg-black shadow-sm">
                                    <video src={lesson.videoUrl} controls controlsList="nodownload" className="w-full max-h-[450px] object-contain outline-none" />
                                  </div>
                                )}

                                {/* VISTA PARA EL ESTUDIANTE DE LA TEORÍA INYECTADA DIRECTAMENTE */}
                                {lesson.textContent && (
                                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mt-2 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {lesson.textContent}
                                  </div>
                                )}

                                {/* PLATAFORMA INTEGRADA: TAREA DEL TEMA */}
                                {lesson.taskType && lesson.taskType !== 'none' && (
                                  <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-4 mt-2">
                                    <div className="flex items-center gap-2 mb-2"><ClipboardCheck className="w-4 h-4 text-indigo-600"/><h5 className="font-bold text-xs text-slate-800">Evaluación Práctica</h5></div>
                                    {lesson.taskDescription && <p className="text-[11px] text-slate-600 mb-4 font-medium leading-relaxed">{lesson.taskDescription}</p>}
                                    
                                    {safeUser.role === 'student' ? (
                                      <>
                                        {lesson.taskType === 'text' && (
                                          <div className="space-y-3">
                                            <textarea value={studentAnswers[lesson.id] || ""} onChange={e => setStudentAnswers({...studentAnswers, [lesson.id]: e.target.value})} className="w-full bg-white border border-slate-200 p-3 text-xs rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" rows={4} placeholder="Escribe tu respuesta directamente aquí..."/>
                                            <button onClick={() => submitAssessment('lesson_task', lesson.id, `Tarea: ${lesson.title}`, studentAnswers[lesson.id])} disabled={!studentAnswers[lesson.id]} className="bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center"><Send className="w-3.5 h-3.5"/> Entregar Respuesta</button>
                                          </div>
                                        )}
                                        {lesson.taskType === 'file' && (
                                          <div className="space-y-3 flex flex-col items-start bg-white p-4 rounded-xl border border-slate-200 w-full">
                                            {lesson.taskUrl && <a href={lesson.taskUrl} target="_blank" rel="noreferrer" className="text-[11px] bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"><Download className="w-3.5 h-3.5"/> Descargar Material Base</a>}
                                            <div className="w-full border-t border-slate-100 pt-3 mt-1">
                                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Sube tu trabajo resuelto:</label>
                                              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full">
                                                <input type="file" onChange={e => setStudentFiles({...studentFiles, [lesson.id]: e.target.files?.[0]})} className="text-xs w-full sm:w-auto" />
                                                <button onClick={() => handleStudentSubmitFileTask(lesson.id, `Tarea: ${lesson.title}`, 'lesson_task')} disabled={!studentFiles[lesson.id] || uploadingStudentFile === lesson.id} className="bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center whitespace-nowrap">
                                                  {uploadingStudentFile === lesson.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <UploadCloud className="w-3.5 h-3.5"/>} 
                                                  {uploadingStudentFile === lesson.id ? "Subiendo..." : "Enviar Archivo Final"}
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-[10px] text-slate-400 bg-white p-3 rounded-lg border border-slate-100 text-center">Vista reservada para estudiantes. Ellos verán aquí las opciones de entrega.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          )}

                          {/* PLATAFORMA INTEGRADA: EXAMEN DE MÓDULO */}
                          {mod.examType && mod.examType !== 'none' && (
                            <div className="mt-6 p-6 bg-rose-50/50 border-2 border-rose-100 rounded-2xl shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <Award className="w-6 h-6 text-rose-500" />
                                <h4 className="font-bold text-rose-900 text-lg">Evaluación Final del Módulo</h4>
                              </div>
                              
                              {safeUser.role === 'student' ? (
                                <>
                                  {/* SOPORTE PARA EXÁMENES ANTIGUOS CONFIGURADOS COMO ARCHIVO */}
                                  {mod.examType === 'file' && (
                                    <div className="bg-white p-5 rounded-xl border border-rose-100 flex flex-col gap-4">
                                      <p className="text-xs text-slate-600 font-medium">Descarga el examen, resuélvelo y sube tu evidencia fotográfica/PDF.</p>
                                      {mod.examUrl && <a href={mod.examUrl} target="_blank" rel="noreferrer" className="text-xs bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm w-fit"><Download className="w-4 h-4"/> Descargar Examen</a>}
                                      <div className="border-t border-slate-100 pt-4">
                                        <input type="file" onChange={e => setStudentFiles({...studentFiles, [mod.id]: e.target.files?.[0]})} className="text-xs block w-full mb-3" />
                                        <button onClick={() => handleStudentSubmitFileTask(mod.id, `Examen: ${mod.title}`, 'module_exam')} disabled={!studentFiles[mod.id] || uploadingStudentFile === mod.id} className="bg-emerald-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50">
                                          {uploadingStudentFile === mod.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>} Enviar Examen Resuelto
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {mod.examType === 'embed' && mod.examUrl && (
                                    <div className="bg-white rounded-xl border border-rose-100 overflow-hidden h-[600px]">
                                      <iframe src={mod.examUrl} className="w-full h-full border-0"></iframe>
                                    </div>
                                  )}

                                  {mod.examType === 'native' && (
                                    <div className="bg-white p-6 rounded-xl border border-rose-100 space-y-6">
                                      <p className="text-xs text-rose-600 font-bold mb-4 uppercase tracking-wider">Cuestionario Interactivo</p>
                                      {Array.isArray(mod.examQuestions) && mod.examQuestions.map((q: any, qIdx: number) => (
                                        <div key={qIdx} className="space-y-3">
                                          <p className="font-bold text-sm text-slate-800">{qIdx + 1}. {q.question}</p>
                                          <div className="space-y-2 pl-2">
                                            {Array.isArray(q.options) && q.options.map((opt: string, oIdx: number) => (
                                              <label key={oIdx} className="flex gap-3 items-center text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:border-emerald-300 transition-colors">
                                                <input type="radio" name={`exam_${mod.id}_${qIdx}`} className="w-4 h-4 accent-emerald-600" onChange={() => setExamAnswers({...examAnswers, [mod.id]: {...(examAnswers[mod.id] || {}), [qIdx]: oIdx}})} />
                                                <span className="font-medium">{opt}</span>
                                              </label>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                      <div className="pt-4 border-t border-slate-100">
                                        <button onClick={() => evaluateNativeExam(mod)} className="w-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                                          <CheckCircle2 className="w-5 h-5"/> Entregar Examen Definitivo
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-[10px] text-slate-400 bg-white p-3 rounded-lg border border-slate-100 text-center">Configurado como: {mod.examType.toUpperCase()}. Los estudiantes llenarán el examen aquí.</p>
                              )}
                            </div>
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
          <button onClick={() => setViewMode('catalog')} className={`flex items-center gap-1.5 text-xs text-slate-500 font-bold transition-colors w-fit ${isAuditor ? 'hover:text-indigo-600' : 'hover:text-emerald-600'}`}>
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${isAuditor ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{selectedCourse.code}</span>
            <h2 className="font-display font-bold text-slate-900 text-base">{selectedCourse.title}</h2>
          </div>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
          {isAuditor && (
            <button onClick={() => setActiveSubTab('audit')} className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeSubTab === 'audit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>
              <ShieldCheck className="w-4 h-4" /> Reporte de Auditoría
            </button>
          )}
          
          <button onClick={() => setActiveSubTab('content')} className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeSubTab === 'content' ? (isAuditor ? 'border-indigo-600 text-indigo-600' : 'border-emerald-600 text-emerald-600') : 'border-transparent text-slate-500'}`}>
            <BookOpen className="w-4 h-4" /> Contenido Académico
          </button>
          
          {!isAuditor && (
            <button onClick={() => setActiveSubTab('homework')} className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeSubTab === 'homework' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
              <FileText className="w-4 h-4" /> Buzón de Tareas Antiguo
            </button>
          )}
          
          {(isAdmin || safeUser.role === 'teacher') && (
            <button onClick={() => setActiveSubTab('lti')} className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeSubTab === 'lti' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>
              <LinkIcon className="w-4 h-4" /> Llaves LTI
            </button>
          )}
        </div>

        <div>
          {activeSubTab === 'content' && renderContentArea()}
          
          {activeSubTab === 'homework' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-in slide-in-from-bottom-2">
              <div className="space-y-1">
                <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">EVALUACIÓN</span>
                <h3 className="font-bold text-slate-950 text-base mt-1">Buzón de Tareas Generales</h3>
                <p className="text-xs text-slate-500">Nota: Ahora es mejor enviar las tareas directamente desde dentro de cada módulo.</p>
              </div>

              {safeUser.role === 'student' ? (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700">Tu Entrega:</label>
                  <textarea
                    value={homeworkText}
                    onChange={(e) => setHomeworkText(e.target.value)}
                    placeholder="Escribe tu respuesta técnica aquí o pega el enlace de tu documento..."
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
                      {submittingHomework ? "Enviando a Base de Datos..." : "Entregar Trabajo Viejo"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 mt-4">
                  <p className="text-sm font-bold text-slate-600">Vista de Profesor / Administrador</p>
                  <p className="text-xs text-slate-500 mt-1">Los estudiantes verán la caja de texto aquí.</p>
                </div>
              )}
            </div>
          )}

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

          {/* NUEVO: PESTAÑA EXCLUSIVA DE AUDITORÍA */}
          {activeSubTab === 'audit' && isAuditor && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-6 animate-in slide-in-from-bottom-2">
              <div className="border-b border-indigo-50 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-lg">Fiscalización Metodológica</h3>
                </div>
                <p className="text-xs text-slate-500">Evalúe la estructura didáctica, el impacto en los estudiantes y el cumplimiento de las normativas de este programa.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart className="w-4 h-4 text-sky-500"/> Métricas del Programa</h4>
                  <ul className="text-xs text-slate-600 space-y-3">
                    <li className="flex justify-between border-b border-slate-200 pb-2"><span>Profesor Titular:</span> <span className="font-bold">{selectedCourse.teacher}</span></li>
                    <li className="flex justify-between border-b border-slate-200 pb-2"><span>Alumnos Inscritos:</span> <span className="font-bold">{Array.isArray(selectedCourse.enrolledStudents) ? selectedCourse.enrolledStudents.length : 0}</span></li>
                    <li className="flex justify-between border-b border-slate-200 pb-2"><span>Nivel Declarado:</span> <span className="font-bold">{selectedCourse.level || 'No especificado'}</span></li>
                    <li className="flex justify-between border-b border-slate-200 pb-2"><span>Módulos Totales:</span> <span className="font-bold">{Array.isArray(selectedCourse.modules) ? selectedCourse.modules.length : 0}</span></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">Notas de Auditoría (Privadas):</label>
                  <textarea
                    placeholder="Escriba sus observaciones sobre la calidad del contenido, pertinencia del material y metodología aplicada..."
                    rows={6}
                    className="w-full bg-indigo-50/30 border border-indigo-200 rounded-xl p-4 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-colors">
                      <Save className="w-4 h-4"/> Guardar Reporte
                    </button>
                  </div>
                </div>
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
              Volver al Catálogo
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
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Información Principal</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Título del Curso</label>
                  <input type="text" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-emerald-500 outline-none ${!isAdmin ? 'cursor-not-allowed opacity-70' : ''}`} disabled={!isAdmin} placeholder="Ej. Redes Informáticas" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1.5">Formato de Contenido (Tecnología)</label>
                  <select 
                    value={courseForm.format}
                    onChange={(e) => setCourseForm({...courseForm, format: e.target.value})}
                    disabled={!isAdmin}
                    className={`w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none ${!isAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                  >
                    <option value="native">LMS Nativo (Por Módulos)</option>
                    <option value="learningstudio">Alojado en LearningStudioAI</option>
                    <option value="scorm">Paquete Externo SCORM</option>
                    <option value="pdf">Documento Directo (PDF)</option>
                    <option value="html">Incrustación Web Segura (HTML)</option>
                  </select>
                </div>

                {/* 🔒 BUSCADOR DE PROFESOR - BLOQUEADO PARA DOCENTES 🔒 */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Profesor / Titular</label>
                  {!isAdmin ? (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm cursor-not-allowed opacity-80">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">{courseForm.teacher || "Sin asignar"}</span>
                    </div>
                  ) : (
                    courseForm.teacher ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-800">{courseForm.teacher}</span>
                        </div>
                        <button onClick={() => setCourseForm({...courseForm, teacherId: "", teacher: ""})} className="text-emerald-600 hover:text-emerald-800 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-emerald-500 transition-all">
                          <Search className="w-4 h-4 text-slate-400 shrink-0" />
                          <input type="text" placeholder="Asignar facilitador..." value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} className="w-full bg-transparent p-3 text-xs outline-none" />
                        </div>
                        {teacherSearch.trim() !== "" && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                            {safeTeachers.filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase())).map(t => (
                              <div key={t.id} onClick={() => { setCourseForm({...courseForm, teacherId: t.id, teacher: t.name}); setTeacherSearch(""); }} className="p-3 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer border-b border-slate-50 transition-colors">
                                {t.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Código</label>
                    <input type="text" disabled={!isAdmin} value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono outline-none ${!isAdmin ? 'cursor-not-allowed opacity-70' : ''}`} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Categoría</label>
                    <input type="text" disabled={!isAdmin} value={courseForm.category} onChange={e => setCourseForm({...courseForm, category: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none ${!isAdmin ? 'cursor-not-allowed opacity-70' : ''}`} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Descripción</label>
                  <textarea rows={3} disabled={!isAdmin} value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none leading-relaxed ${!isAdmin ? 'cursor-not-allowed opacity-70' : ''}`} />
                </div>

                {/* BOTÓN SUBIDA CLOUDINARY PARA PORTADAS */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Portada del Curso</label>
                  <div className="flex items-center gap-4">
                    {courseForm.image ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 shrink-0 shadow-sm">
                        <img src={courseForm.image} alt="Portada" className="w-full h-full object-cover" />
                        {isAdmin && (
                          <button 
                            onClick={() => setCourseForm({...courseForm, image: ""})}
                            className="absolute top-1 right-1 bg-white/90 backdrop-blur rounded-full p-1 shadow hover:text-rose-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <Image className="w-6 h-6" />
                      </div>
                    )}
                    
                    {isAdmin && (
                      <div className="flex-1">
                        <label className={`w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-sm ${uploadingCover ? 'opacity-50 pointer-events-none' : ''}`}>
                          {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <UploadCloud className="w-4 h-4 text-emerald-500" />}
                          {uploadingCover ? `Subiendo a Nube...` : "Subir Imagen"}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleCoverUpload(e.target.files[0]);
                                e.target.value = ''; 
                              }
                            }} 
                          />
                        </label>
                        <p className="text-[9px] text-slate-400 mt-1.5 text-center leading-tight">Servicio Cloudinary.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {courseForm?.id && isAdmin && (
                 <button onClick={() => deleteCourse(courseForm.id)} className="w-full mt-6 flex justify-center gap-2 py-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all">
                   <Trash2 className="w-4 h-4"/> Eliminar Curso
                 </button>
              )}
            </div>

            {/* ✨ CAJA DE ALUMNOS (RESTRINGIDA SOLO A ADMIN) ✨ */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col max-h-[650px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-500" />
                  <h2 className="font-bold text-slate-900 text-sm">Alumnos del Curso</h2>
                </div>
                <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                  {Array.isArray(courseForm?.enrolledStudents) ? courseForm.enrolledStudents.length : 0} matriculados
                </span>
              </div>
              
              {!isAdmin ? (
                 <div className="mt-4 p-4 text-center bg-slate-50 border border-slate-100 rounded-xl">
                   <Lock className="w-5 h-5 text-slate-300 mx-auto mb-2"/>
                   <p className="text-xs text-slate-500 font-bold">Solo el administrador puede matricular o dar de baja a estudiantes.</p>
                 </div>
              ) : (
                <div className="mt-4 relative shrink-0">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all overflow-hidden">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar alumno para matricular..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full bg-transparent p-3 text-xs outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="overflow-y-auto mt-4 space-y-2 flex-1 scrollbar-none pr-1">
                {(() => {
                  const enrolledIds = Array.isArray(courseForm?.enrolledStudents) ? courseForm.enrolledStudents : [];
                  const searchLower = studentSearch.trim().toLowerCase();
                  
                  let filteredStudents = safeStudents;

                  if (searchLower === "") {
                    filteredStudents = safeStudents.filter(s => enrolledIds.includes(s.id));
                  } else if (isAdmin) {
                    filteredStudents = safeStudents.filter(s => 
                      s.name.toLowerCase().includes(searchLower) || 
                      (s.email && s.email.toLowerCase().includes(searchLower))
                    );
                  }

                  if (filteredStudents.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-xs text-slate-400">
                          {searchLower === "" 
                            ? (isAdmin ? "No hay alumnos matriculados. Usa el buscador para agregarlos." : "Aún no te han asignado alumnos.")
                            : "No se encontraron resultados para tu búsqueda."}
                        </p>
                      </div>
                    );
                  }

                  return filteredStudents.map(student => {
                    const isEnrolled = enrolledIds.includes(student.id);
                    return (
                      <div 
                        key={student.id} 
                        onClick={() => toggleStudentEnrollment(student.id)} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isAdmin ? 'cursor-pointer hover:border-sky-300 hover:bg-slate-50' : 'cursor-default'} ${isEnrolled ? 'bg-sky-50 border-sky-200 shadow-sm' : 'bg-white border-slate-100'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt="" className="w-7 h-7 rounded-full bg-white shadow-sm" />
                          <div><p className="text-xs font-bold text-slate-700">{student.name}</p></div>
                        </div>
                        {isEnrolled ? (
                          <UserCheck className="w-4 h-4 text-sky-600" />
                        ) : (
                          isAdmin && <Plus className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800">Malla Curricular Dinámica</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* ✨ MOTOR ALGORÍTMICO NATIVO: AUTO-GENERAR MALLA ✨ */}
                    <label 
                      className={`bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors cursor-pointer shadow-sm ${isGeneratingAI ? 'opacity-50 pointer-events-none' : ''}`}
                      title="Sube un manual en PDF o Word para auto-completar los módulos"
                    >
                      {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isGeneratingAI ? 'Leyendo Documento...' : 'Auto-Generar Malla (Word)'}
                      <input 
                        type="file" 
                        accept=".docx" 
                        className="hidden" 
                        onChange={handleAIGeneration} 
                        disabled={isGeneratingAI} 
                      />
                    </label>

                    <button onClick={handleAddModule} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-100 shadow-sm">
                      <Plus className="w-3.5 h-3.5" /> Agregar Módulo
                    </button>
                  </div>
                </div>

                {safeFormModules.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Construye el temario o sube un documento Word (.docx) para estructurarlo automáticamente.</p>
                  </div>
                ) : (
                  safeFormModules.map((mod: any, mIndex: number) => {
                    const safeLessonsForm = Array.isArray(mod?.lessons) ? mod.lessons : [];
                    return (
                      <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col gap-3 relative">
                          <button onClick={() => {
                            if(window.confirm("¿Eliminar este módulo completo?")) {
                              const newMods = [...safeFormModules]; newMods.splice(mIndex, 1); setCourseForm({...courseForm, modules: newMods});
                            }
                          }} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                          
                          <input 
                            type="text" value={mod.title || ""} 
                            onChange={(e) => {
                              const newMods = [...safeFormModules];
                              newMods[mIndex].title = e.target.value;
                              setCourseForm({...courseForm, modules: newMods});
                            }} 
                            className="font-bold text-sm bg-transparent border-b-2 border-slate-300 focus:border-emerald-500 outline-none w-11/12 pb-1.5" placeholder="Título Módulo" 
                          />
                          
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => handleAddLesson(mod.id, 'task')} className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg font-bold w-fit hover:bg-emerald-100 transition-colors flex items-center gap-1 shadow-sm">
                              <Plus className="w-3 h-3"/> Agregar Tema a este Módulo
                            </button>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          {safeLessonsForm.map((lesson: any, lIndex: number) => (
                            <div key={lesson.id} className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                              <button onClick={() => {
                                const newMods = [...safeFormModules];
                                newMods[mIndex].lessons.splice(lIndex, 1);
                                setCourseForm({...courseForm, modules: newMods});
                              }} className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 bg-white rounded p-1 shadow-sm transition-colors"><X className="w-3.5 h-3.5"/></button>
                              
                              <input type="text" value={lesson.title} onChange={(e) => {
                                const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].title = e.target.value; setCourseForm({...courseForm, modules: nm});
                              }} className="bg-transparent border-b border-slate-300 focus:border-emerald-500 outline-none text-xs font-bold w-11/12 pb-1" placeholder="Título del Tema"/>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                {/* ✨ RECURSOS ACADÉMICOS: SÓLO VIDEO CLASE ✨ */}
                                <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">Recursos Académicos</span>

                                  <div>
                                    <label className="block text-[9px] text-slate-500 mb-1">Video Clase</label>
                                    {lesson.videoUrl ? (
                                      <div className="flex flex-col gap-2 bg-sky-50 border border-sky-200 rounded-md p-2">
                                        <div className="w-full bg-black rounded overflow-hidden">
                                          <video src={lesson.videoUrl} controls className="w-full h-32 object-contain" />
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] text-sky-700 font-bold flex items-center gap-1.5">
                                            <Video className="w-3.5 h-3.5" /> Video Integrado
                                          </span>
                                          <button onClick={() => { const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].videoUrl = ""; setCourseForm({...courseForm, modules: nm}); }} className="text-sky-600 hover:text-rose-500 p-1 bg-white rounded shadow-sm">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex gap-1.5">
                                        <input type="text" value={lesson.videoUrl || ""} onChange={(e) => { const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].videoUrl = e.target.value; setCourseForm({...courseForm, modules: nm}); }} className="bg-slate-50 border border-slate-200 rounded-md p-2 text-[10px] w-full outline-none focus:border-sky-500" placeholder="Pega URL o sube archivo..."/>
                                        <label className={`bg-slate-900 hover:bg-black text-white px-2.5 rounded-md cursor-pointer flex items-center transition-colors ${uploadingLessonId === `vid_${lesson.id}` ? 'opacity-50 pointer-events-none' : ''}`}>
                                          {uploadingLessonId === `vid_${lesson.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                                          <input type="file" accept="video/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleLessonVideoUpload(mod.id, lesson.id, e.target.files[0]); }} />
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* ✨ CONSTRUCTOR DE EJERCICIO DEL TEMA ✨ */}
                                <div className="space-y-3 bg-indigo-50/30 p-3 rounded-lg border border-indigo-100 shadow-sm">
                                  <span className="text-[9px] font-bold text-indigo-500 uppercase">Ejercicio / Tarea del Tema</span>
                                  <select 
                                    value={lesson.taskType || 'none'} 
                                    onChange={(e) => { const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].taskType = e.target.value; setCourseForm({...courseForm, modules: nm}); }}
                                    className="bg-white border border-indigo-200 text-slate-600 rounded-md p-2 text-[10px] outline-none focus:border-indigo-500 w-full"
                                  >
                                    <option value="none">Sin Ejercicio</option>
                                    <option value="file">Subir Archivo (Manuscrito / Descargable)</option>
                                    <option value="text">Respuesta en Plataforma (Caja de Texto)</option>
                                  </select>

                                  {(lesson.taskType === 'file' || lesson.taskType === 'text') && (
                                    <input type="text" value={lesson.taskDescription || ""} onChange={(e) => { const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].taskDescription = e.target.value; setCourseForm({...courseForm, modules: nm}); }} className="bg-white border border-indigo-200 rounded-md p-2 text-[10px] w-full outline-none focus:border-indigo-500" placeholder="Instrucciones para el alumno..."/>
                                  )}

                                  {lesson.taskType === 'file' && (
                                    <div className="mt-2">
                                      {lesson.taskUrl ? (
                                        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-md p-2">
                                          <a href={lesson.taskUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-700 font-bold flex items-center gap-1.5 hover:underline">
                                            <FileText className="w-3.5 h-3.5 shrink-0" /> Archivo de Tarea Subido
                                          </a>
                                          <button onClick={() => { const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].taskUrl = ""; setCourseForm({...courseForm, modules: nm}); }} className="text-indigo-600 hover:text-rose-500 p-1 bg-white rounded shadow-sm">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex gap-1.5">
                                          <input type="text" value={lesson.taskUrl || ""} onChange={(e) => { const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].taskUrl = e.target.value; setCourseForm({...courseForm, modules: nm}); }} className="bg-white border border-indigo-200 rounded-md p-2 text-[10px] w-full outline-none focus:border-indigo-500" placeholder="Material base (URL o Sube archivo)..."/>
                                          <label className={`bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 rounded-md cursor-pointer flex items-center transition-colors shadow-sm ${uploadingTaskLessonId === lesson.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {uploadingTaskLessonId === lesson.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                                            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleLessonTaskUpload(mod.id, lesson.id, e.target.files[0]); }} />
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* ✨ CAJA DE DESARROLLO TEÓRICO ✨ */}
                              <div className="mt-3">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Desarrollo Teórico / Contenido del Tema</label>
                                <textarea 
                                  rows={8} 
                                  value={lesson.textContent || ""} 
                                  onChange={(e) => { const nm = [...safeFormModules]; nm[mIndex].lessons[lIndex].textContent = e.target.value; setCourseForm({...courseForm, modules: nm}); }} 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 outline-none focus:border-emerald-500 leading-relaxed" 
                                  placeholder="Escribe o pega aquí toda la teoría del tema, o deja que el motor de Word lo llene automáticamente..."
                                />
                              </div>
                            </div>
                          ))}

                          {/* ✨ NUEVO: CONFIGURACIÓN DE EXAMEN DEL MÓDULO ✨ */}
                          <div className="mt-6 bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm">
                            <label className="block text-[11px] font-bold text-rose-500 uppercase mb-2">Examen del Módulo (Final)</label>
                            
                            {/* ELIMINADA LA OPCIÓN 'file' DEL DROPDOWN */}
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                              <select 
                                value={mod.examType || 'none'} 
                                onChange={(e) => { const newMods = [...safeFormModules]; newMods[mIndex].examType = e.target.value; setCourseForm({...courseForm, modules: newMods}); }}
                                className="bg-slate-50 border border-slate-200 text-slate-600 rounded-lg p-2 text-xs outline-none focus:border-rose-500 w-full sm:w-auto font-bold"
                              >
                                <option value="none">Sin Examen Final</option>
                                <option value="embed">Formulario Externo (Google / Forms)</option>
                                <option value="native">Cuestionario en Plataforma (Autocalificable)</option>
                              </select>

                              {mod.examType === 'embed' && (
                                <div className="flex-1 w-full flex gap-1.5">
                                  <input type="text" value={mod.examUrl || ""} onChange={(e) => { const nm = [...safeFormModules]; nm[mIndex].examUrl = e.target.value; setCourseForm({...courseForm, modules: nm}); }} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs w-full outline-none focus:border-rose-500" placeholder="Ej. Link de Google Forms o Microsoft Forms..."/>
                                </div>
                              )}
                            </div>
                            
                            {/* ✨ MAGIA: IMPORTADOR DE PREGUNTAS DESDE WORD AL EXAMEN NATIVO ✨ */}
                            {mod.examType === 'native' && (
                               <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preguntas del Cuestionario</span>
                                     <div className="flex flex-wrap gap-2">
                                       <label className={`text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 shadow-sm cursor-pointer flex items-center gap-1.5 transition-colors ${isGeneratingExamIndex === mIndex ? 'opacity-50 pointer-events-none' : ''}`} title="Sube el Word con tu examen y el sistema extraerá las preguntas">
                                         {isGeneratingExamIndex === mIndex ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                         {isGeneratingExamIndex === mIndex ? 'Extrayendo...' : 'Importar de Word'}
                                         <input type="file" accept=".docx" className="hidden" onChange={(e) => handleExamAIGeneration(e, mIndex)} disabled={isGeneratingExamIndex === mIndex} />
                                       </label>
                                       <button onClick={() => {
                                          const nm = [...safeFormModules];
                                          if(!nm[mIndex].examQuestions) nm[mIndex].examQuestions = [];
                                          nm[mIndex].examQuestions.push({ question: "", options: ["", ""], correct: 0 });
                                          setCourseForm({...courseForm, modules: nm});
                                       }} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-100 shadow-sm">+ Añadir Manual</button>
                                     </div>
                                  </div>
                                  {(!mod.examQuestions || mod.examQuestions.length === 0) ? <p className="text-xs text-slate-400 italic">No hay preguntas agregadas. Usa "Importar de Word" o escríbelas manual.</p> : (
                                     mod.examQuestions.map((q: any, qIdx: number) => (
                                        <div key={qIdx} className="p-3 border border-slate-200 rounded-lg bg-white relative shadow-sm">
                                           <button onClick={() => { const nm=[...safeFormModules]; nm[mIndex].examQuestions.splice(qIdx, 1); setCourseForm({...courseForm, modules: nm}); }} className="absolute top-2 right-2 text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-3 h-3"/></button>
                                           <input type="text" placeholder={`Pregunta ${qIdx + 1}...`} value={q.question} onChange={e => { const nm=[...safeFormModules]; nm[mIndex].examQuestions[qIdx].question = e.target.value; setCourseForm({...courseForm, modules: nm}); }} className="w-11/12 text-xs font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-rose-500 outline-none mb-3 pb-1"/>
                                           <div className="space-y-2 pl-2">
                                              {q.options.map((opt: string, oIdx: number) => (
                                                 <div key={oIdx} className="flex items-center gap-2">
                                                    <input type="radio" className="accent-rose-500" checked={q.correct === oIdx} onChange={() => { const nm=[...safeFormModules]; nm[mIndex].examQuestions[qIdx].correct = oIdx; setCourseForm({...courseForm, modules: nm}); }} title="Marcar como respuesta correcta" />
                                                    <input type="text" value={opt} onChange={e => { const nm=[...safeFormModules]; nm[mIndex].examQuestions[qIdx].options[oIdx] = e.target.value; setCourseForm({...courseForm, modules: nm}); }} className="flex-1 text-xs p-1.5 border border-slate-200 rounded-md outline-none focus:border-rose-500 text-slate-600" placeholder={`Opción ${oIdx + 1}`}/>
                                                    {q.options.length > 2 && <button onClick={() => { const nm=[...safeFormModules]; nm[mIndex].examQuestions[qIdx].options.splice(oIdx, 1); if(q.correct>=oIdx && q.correct>0) nm[mIndex].examQuestions[qIdx].correct--; setCourseForm({...courseForm, modules: nm}); }}><Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-500"/></button>}
                                                 </div>
                                              ))}
                                              <button onClick={() => { const nm=[...safeFormModules]; nm[mIndex].examQuestions[qIdx].options.push(""); setCourseForm({...courseForm, modules: nm}); }} className="text-[10px] text-sky-600 font-bold hover:underline">+ Añadir otra opción</button>
                                           </div>
                                        </div>
                                     ))
                                  )}
                               </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
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