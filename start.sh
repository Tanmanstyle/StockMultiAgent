#!/bin/bash
# Start both backend and frontend

echo "Starting Stock Prediction Auditor..."

# Start backend
cd backend
if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Copy backend/.env.example to backend/.env and add your OpenAI key."
  exit 1
fi

uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "✓ Backend running on http://localhost:8000 (PID: $BACKEND_PID)"

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "✓ Frontend running on http://localhost:3000 (PID: $FRONTEND_PID)"

echo ""
echo "Open http://localhost:3000"
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
