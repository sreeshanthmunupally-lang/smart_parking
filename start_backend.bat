@echo off
title SmartPark AI - Backend Server
echo =======================================================
echo          Starting SmartPark AI FastAPI Backend
echo =======================================================
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
