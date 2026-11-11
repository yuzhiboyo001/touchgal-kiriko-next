# main.py
import os
import secrets
import sys

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

import uvicorn
from fastapi import FastAPI, Request,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes import router
from config import setup_environment
from dlsite_service import fetch_dlsite_game


setup_environment()

INTERNAL_API_SECRET = os.getenv("PYTHON_API_SECRET", "")
PUBLIC_PATHS = {"/health"}
MAX_BODY_BYTES = int(os.getenv("PYTHON_MAX_BODY_BYTES", "1048576"))
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def protect_internal_api(request: Request, call_next):
    if request.url.path not in PUBLIC_PATHS:
        if not INTERNAL_API_SECRET:
            return JSONResponse(
                {"detail": "Python API secret is not configured"},
                status_code=503,
            )
        supplied = request.headers.get("x-internal-token", "")
        if not secrets.compare_digest(supplied, INTERNAL_API_SECRET):
            return JSONResponse({"detail": "unauthorized"}, status_code=401)

    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_BODY_BYTES:
                return JSONResponse(
                    {"detail": "request body too large"}, status_code=413
                )
        except ValueError:
            return JSONResponse(
                {"detail": "invalid content-length"}, status_code=400
            )

    import time
    start = time.time()
    response = await call_next(request)
    print(f"🌐 {request.method} {request.url.path} - {response.status_code} ({time.time() - start:.3f}s)")
    return response

@app.get("/api/dlsite")
async def api_dlsite(code: str):
    try:
        data = await fetch_dlsite_game(code)   # ← await
        return {"data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DLsite 抓取失败: {e}")
app.include_router(router)

if __name__ == "__main__":
    print("=" * 50)
    print("🌸 Galgame 看板娘 LLM + 大脑分支记忆")
    print("=" * 50)
    uvicorn.run(
        app,
        host=os.getenv("PYTHON_HOST", "127.0.0.1"),
        port=int(os.getenv("PYTHON_PORT", "8000")),
        log_level="info",
    )