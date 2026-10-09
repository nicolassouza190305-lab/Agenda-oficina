from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------- Models (status checks, kept from scaffold) ----------
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# ---------- Models (diagnóstico IA) ----------
class DiagnosticoRequest(BaseModel):
    session_id: str
    mensagem: str
    veiculo: str | None = None

class MensagemDiagnostico(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # "user" | "assistant"
    content: str
    veiculo: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


SYSTEM_PROMPT_DIAGNOSTICO = (
    "Você é 'Mecânico IA', um assistente especialista em diagnóstico automotivo da "
    "Oficina Service. Sempre responda em português do Brasil, em tom direto e técnico, "
    "mas acessível ao cliente leigo. Quando o cliente descrever um problema no veículo:\n"
    "1. Liste de 2 a 4 possíveis causas mais prováveis, em bullet points curtos.\n"
    "2. Para cada causa, sugira um serviço/revisão correspondente que a oficina pode executar.\n"
    "3. Indique a urgência: 🟢 pode esperar, 🟡 agendar logo, 🔴 risco de segurança.\n"
    "4. Se faltar informação crítica (ruído, quando aparece, km rodado), termine com uma "
    "pergunta objetiva para refinar o diagnóstico.\n"
    "Nunca invente peças, códigos ou valores que você não tenha certeza. Mantenha a resposta "
    "em até 180 palavras."
)


# ---------- Rotas básicas ----------
@api_router.get("/download/codigo")
async def download_codigo():
    zip_path = ROOT_DIR / "downloads" / "agenda-oficina.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename="agenda-oficina.zip",
    )


@api_router.get("/")
async def root():
    return {"message": "Oficina API online"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.dict())
    await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    rows = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    return [StatusCheck(**r) for r in rows]


# ---------- Rota: Diagnóstico IA (streaming SSE) ----------
@api_router.post("/diagnostico/stream")
async def diagnostico_stream(payload: DiagnosticoRequest):
    if not payload.mensagem.strip():
        raise HTTPException(status_code=400, detail="Mensagem vazia.")

    session_id = payload.session_id.strip() or str(uuid.uuid4())

    # Persist user message
    user_msg = MensagemDiagnostico(
        session_id=session_id,
        role="user",
        content=payload.mensagem.strip(),
        veiculo=payload.veiculo,
    )
    await db.diagnostico_mensagens.insert_one(user_msg.dict())

    # Build chat with Claude Haiku 4.5 via Emergent Universal Key
    system_prompt = SYSTEM_PROMPT_DIAGNOSTICO
    if payload.veiculo:
        system_prompt += f"\n\nContexto do cliente — veículo em questão: {payload.veiculo}."

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt,
    ).with_model("anthropic", "claude-haiku-4-5-20251001")

    user_message = UserMessage(text=payload.mensagem.strip())

    async def event_generator():
        full_text = ""
        try:
            async for event in chat.stream_message(user_message):
                if isinstance(event, TextDelta):
                    full_text += event.content
                    # SSE "data: <chunk>\n\n"
                    chunk = event.content.replace("\r", "").replace("\n", "\\n")
                    yield f"data: {chunk}\n\n"
                elif isinstance(event, StreamDone):
                    break
        except Exception as e:
            logger.exception("Erro no stream do Claude")
            yield f"event: error\ndata: {str(e)}\n\n"
        finally:
            # Persist assistant message
            if full_text.strip():
                assistant_msg = MensagemDiagnostico(
                    session_id=session_id,
                    role="assistant",
                    content=full_text,
                    veiculo=payload.veiculo,
                )
                await db.diagnostico_mensagens.insert_one(assistant_msg.dict())
            yield "event: done\ndata: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# Non-streaming fallback (handy for React Native where SSE parsing is tricky)
@api_router.post("/diagnostico", response_model=MensagemDiagnostico)
async def diagnostico_once(payload: DiagnosticoRequest):
    if not payload.mensagem.strip():
        raise HTTPException(status_code=400, detail="Mensagem vazia.")

    session_id = payload.session_id.strip() or str(uuid.uuid4())

    user_msg = MensagemDiagnostico(
        session_id=session_id,
        role="user",
        content=payload.mensagem.strip(),
        veiculo=payload.veiculo,
    )
    await db.diagnostico_mensagens.insert_one(user_msg.dict())

    system_prompt = SYSTEM_PROMPT_DIAGNOSTICO
    if payload.veiculo:
        system_prompt += f"\n\nContexto do cliente — veículo em questão: {payload.veiculo}."

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt,
    ).with_model("anthropic", "claude-haiku-4-5-20251001")

    user_message = UserMessage(text=payload.mensagem.strip())

    full_text = ""
    async for event in chat.stream_message(user_message):
        if isinstance(event, TextDelta):
            full_text += event.content
        elif isinstance(event, StreamDone):
            break

    assistant_msg = MensagemDiagnostico(
        session_id=session_id,
        role="assistant",
        content=full_text.strip() or "Desculpe, não consegui gerar uma resposta agora.",
        veiculo=payload.veiculo,
    )
    await db.diagnostico_mensagens.insert_one(assistant_msg.dict())
    return assistant_msg


@api_router.get("/diagnostico/{session_id}", response_model=List[MensagemDiagnostico])
async def diagnostico_history(session_id: str):
    rows = await db.diagnostico_mensagens.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    return [MensagemDiagnostico(**r) for r in rows]


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
