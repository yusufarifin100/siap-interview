from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import io
import os
import uuid
import pypdf
import requests
import edge_tts

from app.interview_engine import (
    generate_questions_builtin,
    evaluate_answer_builtin,
    analyze_ats_keywords
)

app = FastAPI(
    title="SiapInterview - AI Mock Interview & Career Copilot"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store in-memory sessions for active interviews
sessions_db: Dict[str, Dict[str, Any]] = {}

class StartSessionRequest(BaseModel):
    role_title: str
    persona: str = "hrd"  # 'hrd' or 'user_tech'
    language: str = "id"  # 'id' or 'en'
    cv_text: str = ""
    jd_text: str = ""
    api_key: Optional[str] = None

class EvaluateAnswerRequest(BaseModel):
    session_id: str
    question_id: int
    question: str
    answer: str
    role_title: str
    language: str = "id"

class FinalizeRequest(BaseModel):
    session_id: str
    answers: List[Dict[str, Any]]

class TTSRequest(BaseModel):
    text: str
    persona: str = "hrd"
    language: str = "id"
    elevenlabs_api_key: Optional[str] = None
    voice_id: Optional[str] = None

class QRISPaymentRequest(BaseModel):
    package_name: str
    price: int

async def synthesize_speech(
    text: str,
    persona: str = "hrd",
    language: str = "id",
    elevenlabs_api_key: Optional[str] = None,
    voice_id: Optional[str] = None
) -> bytes:
    # 1. ElevenLabs API if key provided
    api_key = elevenlabs_api_key or os.environ.get("ELEVENLABS_API_KEY")
    if api_key:
        try:
            target_voice = voice_id
            if not target_voice:
                # Rachel (warm female) for Bu Rina, Antoni (confident male) for Pak Dimas
                target_voice = "21m00Tcm4TlvDq8ikWAM" if persona == "hrd" else "ErXwobaYiN019PkySvjV"
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{target_voice}"
            resp = requests.post(
                url,
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                },
                timeout=12
            )
            if resp.status_code == 200 and resp.content:
                return resp.content
        except Exception as err:
            print("ElevenLabs TTS error, falling back to Microsoft Neural TTS:", err)

    # 2. Microsoft Edge Neural Voice (ultra natural, smooth human intonation, free)
    if language == "en":
        voice = "en-US-EmmaNeural" if persona == "hrd" else "en-US-AndrewNeural"
    else:
        # Indonesian Neural Voices: Bu Rina (Gadis), Pak Dimas (Ardi)
        voice = "id-ID-GadisNeural" if persona == "hrd" else "id-ID-ArdiNeural"

    communicate = edge_tts.Communicate(text, voice)
    chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    return b"".join(chunks)

@app.post("/api/extract-cv")
async def extract_cv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        pdf_reader = pypdf.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Tidak dapat membaca teks dari file PDF ini. Pastikan bukan PDF hasil scan foto murni.")
            
        return {"success": True, "cv_text": text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses file PDF: {str(e)}")

@app.post("/api/start-session")
async def start_session(req: StartSessionRequest):
    session_id = str(uuid.uuid4())
    
    # 1. Analyze ATS match
    ats_result = analyze_ats_keywords(req.cv_text, req.jd_text)
    
    # 2. Generate questions tailored to role & persona
    questions = generate_questions_builtin(
        cv_text=req.cv_text,
        jd_text=req.jd_text,
        role_title=req.role_title,
        persona=req.persona,
        lang=req.language
    )
    
    sessions_db[session_id] = {
        "session_id": session_id,
        "role_title": req.role_title,
        "persona": req.persona,
        "language": req.language,
        "cv_text": req.cv_text,
        "jd_text": req.jd_text,
        "ats_result": ats_result,
        "questions": questions,
        "answers": []
    }
    
    return {
        "success": True,
        "session_id": session_id,
        "questions": questions,
        "ats_result": ats_result
    }

@app.post("/api/evaluate-answer")
async def evaluate_answer(req: EvaluateAnswerRequest):
    evaluation = evaluate_answer_builtin(
        question=req.question,
        answer=req.answer,
        role=req.role_title,
        lang=req.language
    )
    return {
        "success": True,
        "evaluation": evaluation
    }

@app.post("/api/finalize-scorecard")
async def finalize_scorecard(req: FinalizeRequest):
    session = sessions_db.get(req.session_id, {})
    ats_result = session.get("ats_result", {
        "match_percentage": 75,
        "matched_keywords": ["komunikasi", "manajemen waktu"],
        "missing_keywords": ["analisis data"],
        "recommendation": "Lengkapi skill teknis."
    })
    
    answers = req.answers
    if not answers:
        total_score = 70
    else:
        scores = [a.get("score", 70) for a in answers]
        total_score = int(sum(scores) / len(scores))
        
    if total_score >= 85:
        verdict = "SANGAT SIAP (Kategori Kandidat Unggulan)"
        verdict_color = "emerald"
        summary = "Struktur jawaban Anda sangat terarah, penggunaan metode STAR jelas, dan penyampaian meyakinkan. Anda memiliki potensi tinggi untuk lolos ke tahapan negosiasi penawaran kerja."
    elif total_score >= 70:
        verdict = "CUKUP SIAP (Lolos Ambang Batas Tahap HRD)"
        verdict_color = "blue"
        summary = "Penyampaian Anda cukup baik dan komunikatif, namun perlu memperkuat bagian 'Result' dengan angka kuantitatif atau dampak nyata proyek Anda."
    else:
        verdict = "PERLU LATIHAN ULANG (Belum Memenuhi Pola STAR)"
        verdict_color = "amber"
        summary = "Jawaban masih cenderung terlalu singkat atau teoritis. Disarankan untuk menggunakan contoh kasus nyata dan menceritakan tindakan konkret Anda."

    return {
        "success": True,
        "overall_score": total_score,
        "verdict": verdict,
        "verdict_color": verdict_color,
        "summary": summary,
        "ats_result": ats_result,
        "answers_breakdown": answers
    }

@app.post("/api/tts")
async def generate_tts(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Teks tidak boleh kosong.")
    try:
        audio_bytes = await synthesize_speech(
            text=req.text,
            persona=req.persona,
            language=req.language,
            elevenlabs_api_key=req.elevenlabs_api_key,
            voice_id=req.voice_id
        )
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses TTS: {str(e)}")

@app.get("/api/tts")
async def generate_tts_get(
    text: str = Query(...),
    persona: str = Query("hrd"),
    language: str = Query("id"),
    elevenlabs_api_key: Optional[str] = Query(None)
):
    if not text.strip():
        raise HTTPException(status_code=400, detail="Teks tidak boleh kosong.")
    try:
        audio_bytes = await synthesize_speech(
            text=text,
            persona=persona,
            language=language,
            elevenlabs_api_key=elevenlabs_api_key
        )
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses TTS: {str(e)}")

@app.post("/api/qris-checkout")
async def qris_checkout(req: QRISPaymentRequest):
    order_id = f"SIAP-{uuid.uuid4().hex[:8].upper()}"
    return {
        "success": True,
        "order_id": order_id,
        "package_name": req.package_name,
        "amount": req.price,
        "qris_code": "00020101021126570014ID.GO.QRIS.WWW01189360050300000000005204581253033605802ID5913SIAPINTERVIEW6007JAKARTA61051234062070703A016304ABCD",
        "expires_in_seconds": 300
    }

@app.post("/api/qris-verify")
async def qris_verify(payload: Dict[str, Any]):
    return {
        "success": True,
        "status": "PAID",
        "message": "Pembayaran QRIS berhasil dikonfirmasi! Kuota 5 sesi wawancara AI telah ditambahkan ke akun Anda.",
        "tokens_added": 5
    }

# Mount static folder
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def serve_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "SiapInterview Backend Ready"}
