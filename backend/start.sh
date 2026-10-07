#!/bin/sh
cd "$(dirname "$0")" || exit 1

echo "===== NEXORA BACKEND ====="

if ! python -c "import uvicorn, fastapi, sqlalchemy, argon2, jwt, email_validator, dotenv, multipart" >/dev/null 2>&1; then
    echo "Required packages missing. Installing from requirements.txt..."
    python -m pip install -r requirements.txt || exit 1
fi

exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
