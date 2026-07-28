import os
import glob
import threading
import time  # <-- Herramienta para esperar en silencio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

# Dependencias para leer documentos
from pypdf import PdfReader
import docx
from rank_bm25 import BM25Okapi

# Cargar variables ocultas de seguridad
load_dotenv()

# 1. Inicializamos la aplicación
app = FastAPI(
    title="Motor IA INTECA - Experto en Salud (Anti-Alucinaciones)",
    version="0.5.0"
)

# 2. Configuramos la seguridad (CORS) vital para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Leer la llave de forma invisible desde el archivo .env
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# 4. Definimos la estructura de lo que enviará el estudiante
class ChatRequest(BaseModel):
    message: str
    studentName: str

# --- SISTEMA DE MEMORIA FRAGMENTADA Y MULTITAREA ---
CHUNKS_CONOCIMIENTO = []
BUSCADOR_BM25 = None
ESTADO_MEMORIA = "Cargando"

def cargar_base_conocimiento():
    global CHUNKS_CONOCIMIENTO, BUSCADOR_BM25, ESTADO_MEMORIA
    texto_completo = ""
    ruta_carpeta = "documentos_inteca"
    
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        CHUNKS_CONOCIMIENTO = ["Aún no hay documentos en la biblioteca."]
        BUSCADOR_BM25 = BM25Okapi([["vacio"]])
        ESTADO_MEMORIA = "Lista (Sin documentos)"
        return

    print("Picando y optimizando documentos de la biblioteca secreta...")
    
    # Leer archivos PDF
    for archivo_pdf in glob.glob(f"{ruta_carpeta}/*.pdf"):
        try:
            lector = PdfReader(archivo_pdf)
            for pagina in lector.pages:
                if pagina.extract_text():
                    texto_completo += pagina.extract_text() + " "
        except Exception as e:
            print(f"Error leyendo {archivo_pdf}: {e}")

    # Leer archivos Word (.docx)
    for archivo_word in glob.glob(f"{ruta_carpeta}/*.docx"):
        try:
            doc = docx.Document(archivo_word)
            for parrafo in doc.paragraphs:
                texto_completo += parrafo.text + " "
        except Exception as e:
            print(f"Error leyendo {archivo_word}: {e}")
            
    if not texto_completo.strip():
        CHUNKS_CONOCIMIENTO = ["Aún no hay documentos legibles en la biblioteca."]
        BUSCADOR_BM25 = BM25Okapi([["vacio"]])
        ESTADO_MEMORIA = "Lista (Documentos vacíos)"
        return
        
    # Cortamos el texto gigante en pedacitos de ~150 palabras
    palabras = texto_completo.split()
    tamano_pedazo = 150 
    CHUNKS_CONOCIMIENTO = [' '.join(palabras[i:i + tamano_pedazo]) for i in range(0, len(palabras), tamano_pedazo)]
    
    # Creamos el índice de búsqueda instantánea
    corpus_tokenizado = [pedazo.lower().split() for pedazo in CHUNKS_CONOCIMIENTO]
    BUSCADOR_BM25 = BM25Okapi(corpus_tokenizado)
    
    ESTADO_MEMORIA = "Lista"
    print(f"¡Memoria lista! Se generaron {len(CHUNKS_CONOCIMIENTO)} fragmentos de conocimiento experto.")

# Encender el servidor instantáneamente y mandar a leer en segundo plano
@app.on_event("startup")
def iniciar_lectura():
    hilo = threading.Thread(target=cargar_base_conocimiento)
    hilo.start()
# -----------------------------------------------------------------

# 5. Ruta de prueba
@app.get("/")
def estado_motor():
    return {"estado": f"INTECA LLM encendido. Estado de memoria: {ESTADO_MEMORIA}"}

# 6. EL PUENTE PRINCIPAL: Conexión con IA Real
@app.post("/api/chat")
def procesar_chat(request: ChatRequest):
    try:
        # Espera silenciosa
        while ESTADO_MEMORIA == "Cargando":
            time.sleep(1)

        if not BUSCADOR_BM25:
             return {"respuesta": "Hubo un error cargando los documentos oficiales."}

        # BÚSQUEDA INTELIGENTE
        pregunta_tokenizada = request.message.lower().split()
        pedazos_relevantes = BUSCADOR_BM25.get_top_n(pregunta_tokenizada, CHUNKS_CONOCIMIENTO, n=5)
        
        contexto_filtrado = "\n\n---\n\n".join(pedazos_relevantes)

        # Reglas de comportamiento estrictas y CANDADO DE IGNORANCIA
        instrucciones_sistema = f"""
        Eres el Profesor y Asistente Virtual Inteligente del Campus Virtual INTECA. 
        Responde siempre de manera amable, educativa, clara y motivadora.
        
        ERES UN EXPERTO ABSOLUTO en el sistema de salud de la República Dominicana, 
        la Ley 87-01, el Plan Básico de Salud y las normas de INTECA.
        
        AQUÍ TIENES LA INFORMACIÓN PARA RESPONDER:
        {contexto_filtrado}
        
        REGLAS ESTRICTAS DE COMPORTAMIENTO:
        1. Responde de forma directa, exacta y precisa a lo que se te pregunta.
        2. BAJO NINGUNA CIRCUNSTANCIA menciones que estás leyendo un documento, texto, catálogo o base de datos.
        3. ESTÁ TOTALMENTE PROHIBIDO usar frases como "Según el documento proporcionado", "Después de revisar", "Encontré que", o similares. Asume la información como tu propio conocimiento.
        4. Si te preguntan algo fuera del sistema de salud dominicano o de INTECA, responde cortésmente que tu especialidad se centra exclusivamente en el sistema de salud dominicano y el contenido de INTECA.
        5. CANDADO ESTRICTO: Si la respuesta a la pregunta del estudiante NO SE ENCUENTRA TEXTUALMENTE dentro de la información proporcionada arriba en 'AQUÍ TIENES LA INFORMACIÓN PARA RESPONDER', TIENES ABSOLUTAMENTE PROHIBIDO inventar, suponer, o deducir una respuesta. DEBES responder únicamente diciendo: "Lo siento, esa información no se encuentra en mis manuales oficiales."
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": instrucciones_sistema
                },
                {
                    "role": "user",
                    "content": f"El estudiante {request.studentName} pregunta: {request.message}"
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.0  # <-- NUEVO: Cero creatividad. 100% analítica y precisa.
        )
        
        respuesta_ia = chat_completion.choices[0].message.content
        return {"respuesta": respuesta_ia}

    except Exception as e:
        return {"respuesta": f"Error al conectar con la IA: {str(e)}"}