import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 SiapInterview - AI Mock Interview & Career Copilot")
    print("🌐 Server berjalan di: http://localhost:8000")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
