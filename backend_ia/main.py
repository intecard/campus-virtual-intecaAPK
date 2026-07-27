import os
import glob
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

# Dependencias para leer documentos (Los lentes nuevos de la IA)
from pypdf import PdfReader
import docx

# Cargar variables ocultas de seguridad
load_dotenv()

# 1. Inicializamos la aplicación
app = FastAPI(
    title="Motor IA INTECA - Experto en Salud",
    version="0.2.0"
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

# --- NUEVO: SISTEMA DE LECTURA DE DOCUMENTOS (MEMORIA PRIVADA) ---
def cargar_base_conocimiento():
    texto_completo = ""
    ruta_carpeta = "documentos_inteca"
    
    # Si la carpeta no existe, la creamos para que no de error
    if not os.path.exists(ruta_carpeta):
        os.makedirs(ruta_carpeta)
        return "Aún no hay documentos en la biblioteca."

    print("Leyendo documentos de la biblioteca secreta...")
    
    # Leer archivos PDF
    for archivo_pdf in glob.glob(f"{ruta_carpeta}/*.pdf"):
        try:
            lector = PdfReader(archivo_pdf)
            for pagina in lector.pages:
                if pagina.extract_text():
                    texto_completo += pagina.extract_text() + "\n"
        except Exception as e:
            print(f"Error leyendo {archivo_pdf}: {e}")

    # Leer archivos Word (.docx)
    for archivo_word in glob.glob(f"{ruta_carpeta}/*.docx"):
        try:
            doc = docx.Document(archivo_word)
            for parrafo in doc.paragraphs:
                texto_completo += parrafo.text + "\n"
        except Exception as e:
            print(f"Error leyendo {archivo_word}: {e}")
            
    if texto_completo == "":
        return "Aún no hay documentos legibles en la biblioteca."
        
    return texto_completo

# Cargamos el conocimiento a la memoria de la IA al encender el servidor
CONOCIMIENTO_INTECA = cargar_base_conocimiento()
# -----------------------------------------------------------------

# 5. Ruta de prueba
@app.get("/")
def estado_motor():
    return {"estado": "INTECA LLM encendido y leyendo biblioteca privada"}

# 6. EL PUENTE PRINCIPAL: Conexión con IA Real
@app.post("/api/chat")
def procesar_chat(request: ChatRequest):
    try:
        # Construimos el cerebro de la IA con las reglas y su nueva memoria
        instrucciones_sistema = f"""
        Eres el Profesor y Asistente Virtual Inteligente del Campus Virtual INTECA. 
        Responde siempre de manera amable, educativa, clara y motivadora.
        
        ERES UN EXPERTO ABSOLUTO en el sistema de salud de la República Dominicana, 
        la Ley 87-01, el Plan Básico de Salud y las normas de INTECA.
        
        UTILIZA ESTA BASE DE CONOCIMIENTO PRIVADA PARA RESPONDER (es tu memoria oficial):
        {CONOCIMIENTO_INTECA}
        
        Regla de oro: Si el estudiante pregunta algo sobre leyes, planes de salud o reglas de INTECA, 
        responde basándote ÚNICA Y EXCLUSIVAMENTE en la base de conocimiento que te acabo de dar. 
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