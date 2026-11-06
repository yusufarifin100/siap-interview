import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    is_prod = bool(os.environ.get("PORT"))
    print("=" * 60)
    print("🚀 SiapInterview - AI Mock Interview & Career Copilot")
    print(f"🌐 Server berjalan di port: {port}")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=not is_prod)
