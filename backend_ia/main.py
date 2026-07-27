import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

# Cargar variables ocultas de seguridad
load_dotenv()

# 1. Inicializamos la aplicación
app = FastAPI(
    title="Motor IA INTECA - LLM Local",
    version="0.1.0"
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

# 5. Ruta de prueba
@app.get("/")
def estado_motor():
    return {"estado": "INTECA LLM encendido y conectado a Llama 3.1"}

# 6. EL PUENTE PRINCIPAL: Conexión con IA Real
@app.post("/api/chat")
def procesar_chat(request: ChatRequest):
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Eres el Profesor y Asistente Virtual Inteligente del Campus Virtual INTECA. Responde siempre de manera amable, educativa, clara y motivadora a los estudiantes."
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