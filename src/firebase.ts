import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  addDoc, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { Capacitor } from '@capacitor/core';
import { UserProfile, UserRole, Course, LiveClass, CloudFile, ChatMessage } from "./types";

// Firebase Applet Credentials from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0415952714",
  appId: "1:266892587219:web:4f9de6cb6569ff5fd6a426",
  apiKey: "AIzaSyBQYfH5BnpwPJY-ez683MFnYHjDmfR6xGM",
  authDomain: "gen-lang-client-0415952714.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-campusvirtualint-dbc5e5fa-0c2e-4740-85d5-91566cdb7d70",
  storageBucket: "gen-lang-client-0415952714.firebasestorage.app",
  messagingSenderId: "266892587219"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// <-- CAMBIADO: Base de datos inteligente (Nativo vs Web)
export const db = Capacitor.isNativePlatform()
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
  : getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// -------------------------------------------------------------
// Real User Operations in Firestore
// -------------------------------------------------------------

export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const userRef = doc(db, "users", uid);
  const profile: UserProfile = {
    id: uid,
    name: data.name || "Usuario Nuevo",
    email: data.email || "",
    role: data.role || "student",
    avatar: data.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(data.name || 'user')}`,
    academicId: data.academicId || `INTECA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    joinedDate: new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
    progress: data.progress ?? 0,
    attendanceRate: data.attendanceRate ?? 100,
    averageGrade: data.averageGrade ?? 0,
    aiProfile: data.aiProfile || {
      performance: "Sincronizando...",
      behavior: "Usuario registrado en la plataforma",
      learningStyle: "Por determinar",
      strengths: ["Registro Inicial"],
      weaknesses: [],
      dropoutRisk: "Bajo",
      studyPlan: ["Explorar la plataforma"]
    }
  };

  await setDoc(userRef, profile, { merge: true });
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
}

export async function updateUserProfileInDB(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data as any);
}

// -------------------------------------------------------------
// Activity Logging / Audit Trail in Firestore
// -------------------------------------------------------------

export interface AuditLog {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: any;
  ipAddress?: string;
}

export async function logUserActivity(
  userId: string, 
  userName: string, 
  userEmail: string, 
  userRole: string, 
  action: string, 
  details: string
): Promise<void> {
  try {
    const logsCollection = collection(db, "audit_logs");
    const log: AuditLog = {
      userId,
      userName,
      userEmail,
      userRole,
      action,
      details,
      timestamp: serverTimestamp()
    };
    await addDoc(logsCollection, log);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

// -------------------------------------------------------------
// Notifications in Firestore
// -------------------------------------------------------------

export interface AppNotification {
  id?: string;
  userId: string; // "all" for global broadcast, or specific user ID
  text: string;
  unread: boolean;
  timestamp: any;
}

export async function addNotificationToUser(userId: string, text: string): Promise<void> {
  try {
    const notificationsCollection = collection(db, "notifications");
    await addDoc(notificationsCollection, {
      userId,
      text,
      unread: true,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to add notification:", err);
  }
}

// -------------------------------------------------------------
// Firestore Database Seeding & Setup Helpers
// -------------------------------------------------------------

export async function seedInitialDatabaseIfEmpty(): Promise<void> {
  try {
    // 1. Check if courses exist
    const coursesCol = collection(db, "courses");
    const coursesSnap = await getDocs(coursesCol);
       // Check if the new pharmacology course exists with the duration property to know if we've already migrated to the latest version
    const hasNewCourses = !coursesSnap.empty && coursesSnap.docs.some(doc => doc.id === "c_farmacologia" && doc.data().duration !== undefined);
    
    if (coursesSnap.empty || !hasNewCourses) {
      console.log("Seeding/Resetting courses in Firestore to the new INTECA courses with duration and level...");
      
      // Delete old ones first to prevent duplicate/cluttered course list
      for (const docSnap of coursesSnap.docs) {
        await deleteDoc(doc(db, "courses", docSnap.id));
      }

      const defaultCourses: Course[] = [
        {
          id: "c_farmacologia",
          title: "Farmacología Aplicada para Visitadores Médicos",
          code: "FAR-101",
          description: "Especialízate en conocer los principios activos de los medicamentos y cuáles están en cobertura dentro del plan básico de salud.",
          image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600",
          teacher: "Carlos Mendoza",
          progress: 82,
          studentsCount: 45,
          schedule: "Lunes y Miércoles 08:00 AM",
          category: "Farmacología",
          duration: "4 meses",
          level: "Técnico Avanzado",
          modules: [
            {
              id: "m_farm_1",
              title: "Módulo 1: Principios Activos y Clasificación Farmacéutica",
              description: "Introducción a los conceptos de farmacocinética, clasificación de medicamentos y reconocimiento de principios activos.",
              lessons: [
                { id: "l_farm_1_1", title: "Video: Introducción a los Principios Activos", description: "Conceptos de absorción, distribución, metabolismo y eliminación de medicamentos.", duration: "15 min", type: "video", contentUrl: "#" },
                { id: "l_farm_1_2", title: "Manual PDF: Fármacos Esenciales de Control Especial", description: "Guía de medicamentos regulados por la autoridad de salud.", duration: "25 pág", type: "pdf", contentUrl: "#" }
              ]
            },
            {
              id: "m_farm_2",
              title: "Módulo 2: Cobertura del Plan Básico de Salud (POS)",
              description: "Análisis técnico de medicamentos incluidos en el plan básico de salud y exclusiones.",
              lessons: [
                { id: "l_farm_2_1", title: "Práctica: Búsqueda de Medicamentos en el Vademécum", description: "Taller práctico para identificar medicamentos por principio activo y su estado de cobertura.", duration: "20 min", type: "document", contentUrl: "#" },
                { id: "l_farm_2_2", title: "Evaluación IA: Clasificación Farmacológica y POS", description: "Examen interactivo con preguntas generadas por IA sobre el POS de medicamentos.", duration: "15 min", type: "quiz", contentUrl: "#" }
              ]
            }
          ]
        },
        {
          id: "c_precertificaciones",
          title: "Precertificaciones",
          code: "PRE-102",
          description: "Domina el proceso de precertificación de servicios médicos y procedimientos de alta complejidad bajo normatividad vigente.",
          image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600",
          teacher: "Martha Reyes",
          progress: 68,
          studentsCount: 38,
          schedule: "Martes y Jueves 10:00 AM",
          category: "Administración",
          duration: "4 meses",
          level: "Técnico Avanzado",
          modules: [
            {
              id: "m_pre_1",
              title: "Módulo 1: Fundamentos de la Precertificación Médica",
              description: "Normas de auditoría, lectura de órdenes médicas and requisitos de justificación clínica.",
              lessons: [
                { id: "l_pre_1_1", title: "Video: El Ciclo de Vida de una Precertificación", description: "Etapas clave de la solicitud desde el ingreso del paciente hasta el visto bueno de la aseguradora.", duration: "18 min", type: "video", contentUrl: "#" },
                { id: "l_pre_1_2", title: "Guía PDF: Requisitos Técnicos por Tipo de Especialidad", description: "Manual de documentación clínica e historia clínica soporte.", duration: "15 pág", type: "pdf", contentUrl: "#" }
              ]
            },
            {
              id: "m_pre_2",
              title: "Módulo 2: Negociación y Glosas Administrativas",
              description: "Gestión de objeciones comunes y corrección ágil de glosas médicas.",
              lessons: [
                { id: "l_pre_2_1", title: "Práctica: Redacción de Respuestas a Glosas de Aseguradoras", description: "Simulación de respuesta formal frente a glosas por falta de soporte clínico.", duration: "35 min", type: "document", contentUrl: "#" },
                { id: "l_pre_2_2", title: "Evaluación IA: Diagnóstico de Soportes Clínicos", description: "Examen interactivo de evaluación de justificaciones médicas.", duration: "12 min", type: "quiz", contentUrl: "#" }
              ]
            }
          ]
        },
        {
          id: "c_autorizaciones",
          title: "Autorizaciones Médicas",
          code: "AUT-103",
          description: "Aprende a gestionar y procesar autorizaciones médicas de manera eficiente y precisa, garantizando la calidad y oportunidad en el servicio.",
          image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=600",
          teacher: "Diana Guerrero",
          progress: 75,
          studentsCount: 52,
          schedule: "Martes y Jueves 06:00 PM",
          category: "Administración",
          duration: "10 meses",
          level: "Básico-Técnico Profesional",
          modules: [
            {
              id: "m_aut_1",
              title: "Módulo 1: Marco Regulatorio y Canales de Autorización",
              description: "Uso de portales transaccionales, MIPRES y normatividad nacional de autorizaciones obligatorias.",
              lessons: [
                { id: "l_aut_1_1", title: "Video: Manejo de Plataformas de Autorización en Línea", description: "Tour práctico por los sistemas transaccionales y portales web del sistema de salud.", duration: "22 min", type: "video", contentUrl: "#" },
                { id: "l_aut_1_2", title: "PDF: Normativa de Plazos Máximos de Respuesta", description: "Regulación legal sobre tiempos de respuesta para autorizaciones ordinarias y prioritarias.", duration: "20 pág", type: "pdf", contentUrl: "#" }
              ]
            },
            {
              id: "m_aut_2",
              title: "Módulo 2: Casos Especiales y MIPRES",
              description: "Prescripción y autorización de tecnologías no incluidas en el Plan de Beneficios (MIPRES).",
              lessons: [
                { id: "l_aut_2_1", title: "Práctica: Radicación Virtual de Autorización No-PBS", description: "Simulación paso a paso de cargue de soportes en plataforma MIPRES.", duration: "40 min", type: "document", contentUrl: "#" },
                { id: "l_aut_2_2", title: "Evaluación IA: Validación Jurídica e Integralidad", description: "Test interactivo sobre fallos de tutela y principio de integralidad en salud.", duration: "10 min", type: "quiz", contentUrl: "#" }
              ]
            }
          ]
        },
        {
          id: "c_atencion_usuario",
          title: "Atención al Usuario",
          code: "ATE-104",
          description: "Desarrolla habilidades para brindar excelente servicio al cliente en el sector salud, gestionando PQRS con empatía, asertividad y calidad humana.",
          image: "https://images.unsplash.com/photo-1521791136364-7286472b5399?auto=format&fit=crop&q=80&w=600",
          teacher: "Felipe Ramírez",
          progress: 90,
          studentsCount: 61,
          schedule: "Miércoles y Viernes 04:00 PM",
          category: "Servicio al Cliente",
          duration: "4 meses",
          level: "Técnico Avanzado",
          modules: [
            {
              id: "m_ate_1",
              title: "Módulo 1: Humanización del Servicio en Salud",
              description: "Protocolos de acogida, comunicación asertiva con el paciente vulnerable y empatía clínica.",
              lessons: [
                { id: "l_ate_1_1", title: "Video: Técnicas de Desescalamiento en Sala de Espera", description: "Cómo modular la frustración y la ansiedad de los familiares y pacientes.", duration: "14 min", type: "video", contentUrl: "#" },
                { id: "l_ate_1_2", title: "Manual: Cartilla de Deberes y Derechos de los Usuarios", description: "Marco normativo nacional para la protección de los usuarios de salud.", duration: "18 pág", type: "pdf", contentUrl: "#" }
              ]
            },
            {
              id: "m_ate_2",
              title: "Módulo 2: Recepción y Tramitación de PQRS",
              description: "Procesamiento formal de Peticiones, Quejas, Reclamos y Sugerencias de acuerdo a la ley.",
              lessons: [
                { id: "l_ate_2_1", title: "Práctica: Redacción de Respuesta Escrita a Reclamo Formal", description: "Taller de redacción persuasiva y fundamentación normativa.", duration: "30 min", type: "document", contentUrl: "#" },
                { id: "l_ate_2_2", title: "Evaluación IA: Simulación de Atención Directa", description: "Análisis interactivo de respuestas óptimas a quejas complejas.", duration: "10 min", type: "quiz", contentUrl: "#" }
              ]
            }
          ]
        },
        {
          id: "c_enfermeria",
          title: "Enfermería",
          code: "ENF-105",
          description: "Desarrolla competencias técnicas fundamentales en primeros auxilios, toma y lectura de signos vitales, bioseguridad y asistencia básica en enfermería.",
          image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600",
          teacher: "Carlos Mendoza",
          progress: 54,
          studentsCount: 47,
          schedule: "Sábados 08:00 AM (Práctica Presencial)",
          category: "Salud y Cuidado",
          duration: "6 meses",
          level: "Técnico",
          modules: [
            {
              id: "m_enf_1",
              title: "Módulo 1: Fundamentos de Cuidado Clínico y Primeros Auxilios",
              description: "Principios éticos de enfermería, bioseguridad, lavado de manos técnico y atención primaria en accidentes.",
              lessons: [
                { id: "l_enf_1_1", title: "Video: Técnica Correcta de Lavado de Manos Clínico", description: "Paso a paso de la técnica de la OMS para prevenir infecciones intrahospitalarias.", duration: "10 min", type: "video", contentUrl: "#" },
                { id: "l_enf_1_2", title: "Guía PDF: Protocolo de Toma de Signos Vitales", description: "Tabla de rangos normales y técnica de medición de presión arterial, pulso, temperatura y frecuencia respiratoria.", duration: "16 pág", type: "pdf", contentUrl: "#" }
              ]
            },
            {
              id: "m_enf_2",
              title: "Módulo 2: Bioseguridad y Reanimación Cardiopulmonar (RCP)",
              description: "Administración básica de primeros auxilios y maniobras de RCP para adultos y lactantes.",
              lessons: [
                { id: "l_enf_2_1", title: "Práctica: Ejercicio de Vendaje y Curas de Heridas", description: "Guía metodológica para vendajes circulares, recurrentes y espiga.", duration: "25 min", type: "document", contentUrl: "#" },
                { id: "l_enf_2_2", title: "Evaluación IA: Casos Prácticos de Soporte Vital Básico", description: "Quiz adaptativo con escenarios simulados de emergencias comunes.", duration: "15 min", type: "quiz", contentUrl: "#" }
              ]
            }
          ]
        }
      ];

      for (const course of defaultCourses) {
        await setDoc(doc(db, "courses", course.id), course);
      }
    }

    // 2. Check if global notifications exist
    const notifyCol = collection(db, "notifications");
    const notifySnap = await getDocs(notifyCol);
    if (notifySnap.empty) {
      await addDoc(notifyCol, {
        userId: "all",
        text: "¡Bienvenidos al nuevo ciclo lectivo 2026 de INTECA!",
        unread: true,
        timestamp: serverTimestamp()
      });
      await addDoc(notifyCol, {
        userId: "all",
        text: "Módulo de Auditoría de Seguridad Zero Trust ya habilitado.",
        unread: false,
        timestamp: serverTimestamp()
      });
    }

    // 3. Check if files exist
    const filesCol = collection(db, "files");
    const filesSnap = await getDocs(filesCol);
    if (filesSnap.empty) {
      const defaultFiles: CloudFile[] = [
        { id: "f1", name: "Guia_Soporte_Vital_Avanzado_2026.pdf", size: "4.2 MB", type: "pdf", source: "INTECA Cloud", modifiedAt: "Ayer, 14:20", version: 2 },
        { id: "f2", name: "Plano_Red_Telecomunicaciones_Sedes.dwg", size: "18.5 MB", type: "doc", source: "Drive", modifiedAt: "Hace 3 días, 09:12", version: 1 },
        { id: "f3", name: "Estudio_Caso_Ransomware_Hospitals.xlsx", size: "1.4 MB", type: "xls", source: "OneDrive", modifiedAt: "14 Jun 2026", version: 3 },
        { id: "f4", name: "Configuracion_Red_Inalámbrica_Rural.txt", size: "12 KB", type: "doc", source: "Dropbox", modifiedAt: "10 Jun 2026", version: 1 },
        { id: "f5", name: "Slide_Seguridad_Cifrado_IPsec.pptx", size: "8.1 MB", type: "ppt", source: "INTECA Cloud", modifiedAt: "08 Jun 2026", version: 4 },
        { id: "f6", name: "Simulacro_Triaje_Clinico_Video.mp4", size: "85 MB", type: "video", source: "Drive", modifiedAt: "01 Jun 2026", version: 1 }
      ];
      for (const f of defaultFiles) {
        await setDoc(doc(db, "files", f.id), f);
      }
    }
  } catch (err) {
    console.error("Error seeding initial database:", err);
  }
}