import os
import glob
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

# Dependencias para leer documentos
from pypdf import PdfReader
import docx
import pandas as pd
from rank_bm25 import BM25Okapi  # <-- NUEVO: El buscador de velocidad luz

# Cargar variables ocultas de seguridad
load_dotenv()

# 1. Inicializamos la aplicación
app = FastAPI(
    title="Motor IA INTECA - Experto en Salud (Ultrarrápido)",
    version="0.3.0"
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

# --- NUEVO: SISTEMA DE MEMORIA FRAGMENTADA Y BÚSQUEDA RÁPIDA ---
# Variables globales para guardar la memoria
CHUNKS_CONOCIMIENTO = []
BUSCADOR_BM25 = None

def cargar_base_conocimiento():
    global CHUNKS_CONOCIMIENTO, BUSCADOR_BM25
    texto_completo = ""
    ruta_carpeta = "documentos_inteca"
    
    # Si la carpeta no existe, prevenimos el error
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        CHUNKS_CONOCIMIENTO = ["Aún no hay documentos en la biblioteca."]
        BUSCADOR_BM25 = BM25Okapi([["vacio"]])
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
            
    # Leer archivos Excel (.xlsx)
    for archivo_excel in glob.glob(f"{ruta_carpeta}/*.xlsx"):
        try:
            df_dict = pd.read_excel(archivo_excel, sheet_name=None)
            for nombre_hoja, df in df_dict.items():
                texto_completo += f" Hoja de Excel: {nombre_hoja} "
                texto_completo += df.to_string(index=False) + " "
        except Exception as e:
            print(f"Error leyendo {archivo_excel}: {e}")
            
    if not texto_completo.strip():
        CHUNKS_CONOCIMIENTO = ["Aún no hay documentos legibles en la biblioteca."]
        BUSCADOR_BM25 = BM25Okapi([["vacio"]])
        return
        
    # --- LA MAGIA DE LA VELOCIDAD ---
    # Cortamos el texto gigante en pedacitos de ~150 palabras
    palabras = texto_completo.split()
    tamano_pedazo = 150 
    CHUNKS_CONOCIMIENTO = [' '.join(palabras[i:i + tamano_pedazo]) for i in range(0, len(palabras), tamano_pedazo)]
    
    # Creamos el índice de búsqueda instantánea
    corpus_tokenizado = [pedazo.lower().split() for pedazo in CHUNKS_CONOCIMIENTO]
    BUSCADOR_BM25 = BM25Okapi(corpus_tokenizado)
    
    print(f"¡Memoria lista! Se generaron {len(CHUNKS_CONOCIMIENTO)} fragmentos de conocimiento experto.")

# Cargamos y fragmentamos el conocimiento UNA SOLA VEZ al encender el servidor
cargar_base_conocimiento()
# -----------------------------------------------------------------

# 5. Ruta de prueba
@app.get("/")
def estado_motor():
    return {"estado": "INTECA LLM encendido, optimizado con buscador BM25 de velocidad luz"}

# 6. EL PUENTE PRINCIPAL: Conexión con IA Real
@app.post("/api/chat")
def procesar_chat(request: ChatRequest):
    try:
        # 1. BÚSQUEDA INTELIGENTE: Extraemos solo los 5 pedazos de texto más relevantes a la pregunta
        pregunta_tokenizada = request.message.lower().split()
        pedazos_relevantes = BUSCADOR_BM25.get_top_n(pregunta_tokenizada, CHUNKS_CONOCIMIENTO, n=5)
        
        # Unimos esos 5 pedacitos para mandárselos a la IA
        contexto_filtrado = "\n\n---\n\n".join(pedazos_relevantes)

        # Construimos el cerebro de la IA
        instrucciones_sistema = f"""
        Eres el Profesor y Asistente Virtual Inteligente del Campus Virtual INTECA. 
        Responde siempre de manera amable, educativa, clara y motivadora.
        
        ERES UN EXPERTO ABSOLUTO en el sistema de salud de la República Dominicana, 
        la Ley 87-01, el Plan Básico de Salud y las normas de INTECA.
        
        UTILIZA EXCLUSIVAMENTE ESTA INFORMACIÓN ESPECÍFICA PARA RESPONDER:
        {contexto_filtrado}
        
        Regla de oro: Si el estudiante pregunta algo sobre leyes, planes de salud o reglas de INTECA, 
        responde basándote ÚNICA Y EXCLUSIVAMENTE en la información específica que te acabo de dar. 
        Si la respuesta está en los documentos, dásela detallada. Si te preguntan algo fuera de tus 
        documentos o de salud de otro país, responde cortésmente que tu especialidad es el sistema 
        de salud dominicano y el contenido de INTECA.
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
        )
        
        respuesta_ia = chat_completion.choices[0].message.content
        return {"respuesta": respuesta_ia}

    except Exception as e:
        return {"respuesta": f"Error al conectar con la IA: {str(e)}"} 