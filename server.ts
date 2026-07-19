import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// 1. ESCUDO DE SEGURIDAD: Oculta la firma del servidor
app.disable("x-powered-by"); 

// 2. ESCUDO DE SEGURIDAD: Puerto Dinámico para Producción (CORREGIDO)
const PORT = Number(process.env.PORT) || 3000;

// 3. ESCUDO DE SEGURIDAD: Limitador de Peticiones Anti-DDoS (En memoria)
const requestCounts = new Map<string, { count: number, resetTime: number }>();
const aiRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
  const now = Date.now();
  const userRecord = requestCounts.get(ip);

  if (!userRecord || now > userRecord.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + 60000 }); // Ventana de 1 minuto
    next();
  } else if (userRecord.count < 15) { // Límite: 15 consultas a la IA por minuto por usuario
    userRecord.count++;
    next();
  } else {
    res.status(429).json({ 
      error: "Alerta de saturación: Has superado el límite de consultas. Espera 60 segundos.",
      isSimulated: true,
      text: "Has alcanzado el límite de consultas por minuto. Toma un breve descanso y vuelve a intentarlo.",
      feedback: { score: 0, critique: "Límite de consultas excedido.", plagiarismScore: 0, plagiarismReport: "", strengths: [], improvements: [] },
      quizzes: []
    });
  }
};

// Aplicar el escudo Anti-DDoS solo a las rutas de la IA
app.use("/api/", aiRateLimiter);

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
const isRealApiKey = apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "";

let ai: GoogleGenAI | null = null;
if (isRealApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("Running in simulation mode. Configure GEMINI_API_KEY for real AI integration.");
}

// 1. Tutor Virtual 24/7 Endpoint
app.post("/api/tutor", async (req, res) => {
  const { messages, courseContext } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const latestMessage = messages[messages.length - 1]?.text || "";
  const conversationHistory = messages.map(m => `${m.sender === 'user' ? 'Estudiante' : 'Tutor'}: ${m.text}`).join("\n");

  const systemInstruction = `Eres "INTECA Intellect", el tutor inteligente del Instituto Técnico del Caribe (INTECA).
Estás especializado en las materias técnicas de INTECA:
- Fundamentos de Telemedicina y Paramédicos
- Ciberseguridad e Infraestructura Crítica
- Redes y Telecomunicaciones Inteligentes

Tu objetivo es guiar de forma interactiva, profesional, empática e inspiradora a estudiantes caribeños.
Usa expresiones claras, profesionales y amigables. Explica conceptos con analogías del mundo real.
El curso actual del estudiante es: ${courseContext || "Materias generales de INTECA"}.
Siempre responde en español.`;

  if (isRealApiKey && ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: `Historial de conversación:\n${conversationHistory}\n\nNueva pregunta:\n${latestMessage}` }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      return res.json({ text: response.text, isSimulated: false });
    } catch (err: any) {
      console.error("Gemini tutoring error:", err);
      return res.json({
        text: `Lo siento, experimenté una interrupción de conexión con mi núcleo cognitivo principal. Sin embargo, analizando tu duda de "${latestMessage}", te sugiero revisar las unidades de telemetría clínica o seguridad de datos. (Detalle: ${err.message})`,
        isSimulated: true
      });
    }
  } else {
    // Elegant simulated response based on the message keyword
    let simResponse = `¡Hola! Como tu tutor inteligente de INTECA, he recibido tu pregunta. `;
    const q = latestMessage.toLowerCase();
    
    if (q.includes("telemedicina") || q.includes("paramédico") || q.includes("emergencia") || q.includes("ambulancia")) {
      simResponse += `En el ámbito de la telemedicina en INTECA, el protocolo de transmisión de signos vitales es vital. Siempre priorizamos el canal cifrado para resguardar el historial clínico de emergencia del paciente mientras se coordina con la central hospitalaria. ¿Te gustaría que hagamos un simulacro de triaje remoto?`;
    } else if (q.includes("ciberseguridad") || q.includes("redes") || q.includes("hacking") || q.includes("ataque") || q.includes("seguridad")) {
      simResponse += `La seguridad en redes críticas requiere una arquitectura de Zero Trust (Confianza Cero). En INTECA enseñamos que cada nodo de red debe autenticarse constantemente, en especial si maneja telemetría médica o infraestructura industrial del Caribe. ¿Quieres que detallemos cómo mitigar ataques de Ransomware?`;
    } else if (q.includes("resumen") || q.includes("resumir")) {
      simResponse += `¡Por supuesto! Aquí tienes el resumen clave de la sesión técnica:
1. **Seguridad Extrema**: Cifrado AES-256 en todo canal de comunicación educativa y médica.
2. **Latencia Baja**: Uso de protocolos optimizados en áreas rurales del Caribe.
3. **Monitoreo Continuo**: Registro de asistencia e indicadores de aprendizaje para prevenir el abandono estudiantil mediante alertas IA.`;
    } else {
      simResponse += `Es una excelente consulta para tu desarrollo profesional en INTECA. Aborda un pilar técnico crucial. Te sugiero investigar los esquemas de enrutamiento seguro y protocolos de respuesta inmediata. ¿Qué aspecto específico te gustaría que exploremos más a fondo hoy?`;
    }
    
    return res.json({ text: simResponse, isSimulated: true });
  }
});

// 2. AI Quiz Generator Endpoint
app.post("/api/quiz/generate", async (req, res) => {
  const { topic, difficulty, courseId } = req.body;
  const prompt = `Genera un cuestionario interactivo de opción múltiple sobre el tema: "${topic || "Fundamentos Técnicos"}" con dificultad "${difficulty || "intermedio"}" para el Instituto Técnico del Caribe.
Debe contener exactamente 3 preguntas de opción múltiple relevantes y desafiantes.`;

  if (isRealApiKey && ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Lista de 3 preguntas de evaluación",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactamente 4 opciones de respuesta"
                },
                correctAnswer: { type: Type.INTEGER, description: "Índice de la respuesta correcta (0 a 3)" },
                explanation: { type: Type.STRING, description: "Breve explicación de por qué es la correcta" }
              },
              required: ["id", "question", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });
      
      const quizzes = JSON.parse(response.text || "[]");
      return res.json({ quizzes, isSimulated: false });
    } catch (err) {
      console.error("Gemini quiz error:", err);
      return res.json({ quizzes: getSimulatedQuizzes(topic), isSimulated: true });
    }
  } else {
    return res.json({ quizzes: getSimulatedQuizzes(topic), isSimulated: true });
  }
});

// 3. Auto-Homework Grader Endpoint
app.post("/api/homework/grade", async (req, res) => {
  const { studentName, taskTitle, submittedText } = req.body;
  if (!submittedText || submittedText.trim().length < 5) {
    return res.status(400).json({ error: "Submission text is too short or empty" });
  }

  const prompt = `Evalúa la siguiente tarea técnica del estudiante "${studentName}" para el curso de INTECA.
Título de la tarea: "${taskTitle}"
Texto entregado por el estudiante:
---
${submittedText}
---

Evalúa con rigor técnico. Genera una calificación de 0 a 100, un análisis de plagio (0-100%), fortalezas, aspectos de mejora y una crítica constructiva detallada.`;

  if (isRealApiKey && ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Calificación numérica de 0 a 100" },
              critique: { type: Type.STRING, description: "Crítica académica detallada y recomendaciones" },
              plagiarismScore: { type: Type.INTEGER, description: "Porcentaje estimado de copia o coincidencia externa (0 a 100)" },
              plagiarismReport: { type: Type.STRING, description: "Breve reporte del análisis de originalidad" },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de 2 o 3 puntos fuertes de la entrega"
              },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de 2 o 3 oportunidades específicas de mejora"
              }
            },
            required: ["score", "critique", "plagiarismScore", "plagiarismReport", "strengths", "improvements"]
          }
        }
      });

      const feedback = JSON.parse(response.text || "{}");
      return res.json({ feedback, isSimulated: false });
    } catch (err) {
      console.error("Gemini grading error:", err);
      return res.json({ feedback: getSimulatedFeedback(submittedText), isSimulated: true });
    }
  } else {
    return res.json({ feedback: getSimulatedFeedback(submittedText), isSimulated: true });
  }
});

// Helper for simulated quizzes
function getSimulatedQuizzes(topic: string) {
  const normalizedTopic = (topic || "").toLowerCase();
  
  if (normalizedTopic.includes("medicina") || normalizedTopic.includes("signos") || normalizedTopic.includes("triaje")) {
    return [
      {
        id: "q1",
        question: "¿Cuál es el protocolo prioritario al recibir un reporte de telemetría médica inestable?",
        options: [
          "Ignorar hasta que el paciente llegue al hospital",
          "Cifrar y transmitir inmediatamente los signos vitales al especialista en turno",
          "Publicar los datos en foros técnicos para opiniones abiertas",
          "Reiniciar los sensores de telemetría de forma indefinida"
        ],
        correctAnswer: 1,
        explanation: "Transmitir la telemetría cifrada inmediatamente asegura que el especialista cuente con datos fidedignos sin comprometer la privacidad del paciente."
      },
      {
        id: "q2",
        question: "¿Qué significa el acrónimo HIPAA en el resguardo de información clínica?",
        options: [
          "High Integrity Patient Audio Protocol",
          "Health Insurance Portability and Accountability Act",
          "Hospital Intelligence and Protection Agency",
          "Habilitación Inmediata de Paramédicos Asociados"
        ],
        correctAnswer: 1,
        explanation: "Es la ley norteamericana que establece estándares para la protección y privacidad de datos médicos, un referente mundial obligatorio para telemedicina."
      },
      {
        id: "q3",
        question: "Al realizar una reanimación cardiopulmonar asistida por video remoto, ¿cuál es el factor clave?",
        options: [
          "La velocidad y claridad de las indicaciones por voz en tiempo real",
          "El color de fondo de la videollamada",
          "La resolución de video de los participantes inactivos",
          "La marca comercial del micrófono utilizado"
        ],
        correctAnswer: 0,
        explanation: "La claridad, fluidez y sincronía de las instrucciones es el factor crucial para guiar de manera exitosa en situaciones de vida o muerte."
      }
    ];
  }

  // Default tech/networks quiz
  return [
    {
      id: "q1",
      question: "¿Qué medida de seguridad es indispensable para evitar accesos no autorizados en una red institucional?",
      options: [
        "Desconectar el módem los fines de semana",
        "Implementar autenticación multifactor (MFA) y políticas Zero Trust",
        "Escribir las contraseñas complejas en un archivo de texto público",
        "Eliminar todos los routers de la infraestructura"
      ],
      correctAnswer: 1,
      explanation: "MFA y Zero Trust aseguran que cada intento de acceso sea validado estrictamente, bloqueando credenciales vulneradas."
    },
    {
      id: "q2",
      question: "¿Cuál es el propósito principal de configurar una VLAN (Virtual LAN)?",
      options: [
        "Aumentar el consumo de energía eléctrica del router",
        "Segmentar la red de forma lógica para aislar tráfico y mejorar seguridad",
        "Eliminar la necesidad de cables ethernet",
        "Descargar archivos multimedia a mayor velocidad"
      ],
      correctAnswer: 1,
      explanation: "Las VLAN aíslan lógicamente el tráfico de departamentos sensibles (ej. finanzas o telemetría clínica) de accesos generales de estudiantes."
    },
    {
      id: "q3",
      question: "¿Cuál de los siguientes protocolos asegura el cifrado de datos web en tránsito?",
      options: [
        "HTTP estándar",
        "FTP sin credenciales",
        "HTTPS (SSL/TLS)",
        "Telnet directo"
      ],
      correctAnswer: 2,
      explanation: "HTTPS cifra la comunicación entre el navegador y el servidor, previniendo ataques de intercepción de datos (Man-in-the-Middle)."
    }
  ];
}

// Helper for simulated grading
function getSimulatedFeedback(submittedText: string) {
  const textLength = submittedText.trim().length;
  const plagiarismScore = textLength > 200 ? 8 : 18; // shorter texts have higher generic match potential
  
  let score = 85;
  if (textLength > 500) score = 95;
  else if (textLength < 100) score = 65;

  return {
    score: score,
    critique: "El estudiante demuestra una comprensión sólida de los estándares de infraestructura de INTECA. Formula de manera acertada el rol de la telemetría clínica y los perímetros de seguridad. No obstante, se beneficiaría enormemente de profundizar más en las métricas de latencia de red y redundancia física de servidores de respaldo.",
    plagiarismScore: plagiarismScore,
    plagiarismReport: `Análisis de originalidad completado. Coincidencia menor detectada en terminología de redes del sector técnico del Caribe. Originalidad del material: ${100 - plagiarismScore}%.`,
    strengths: [
      "Excelente articulación de las directrices de ciberseguridad.",
      "Uso impecable de la jerga académica y terminología de telecomunicación.",
      "Redacción clara, estructurada y profesional."
    ],
    improvements: [
      "Incluir diagramas de flujo de datos simulados para ilustrar la comunicación.",
      "Especificar los estándares de la IEEE u organizaciones reguladoras aplicables.",
      "Considerar contingencias climáticas locales al diseñar redes inalámbricas."
    ]
  };
}


// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`INTECA Virtual Campus Server running on http://localhost:${PORT}`);
  });
}

startServer();