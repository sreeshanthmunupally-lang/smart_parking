"""
SMARTPARK AI - Unified Launcher Script
Runs the FastAPI backend and Vite React frontend concurrently.
"""

import os
import sys
import subprocess
import time
import webbrowser

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    print("=" * 65)
    print("           SMARTPARK AI - UNIFIED APPLICATION LAUNCHER           ")
    print("=" * 65)
    print("1. Starting FastAPI backend on http://127.0.0.1:8000 ...")

    # Start backend
    backend_cmd = [
        sys.executable, "-m", "uvicorn", "backend.app.main:app",
        "--host", "127.0.0.1", "--port", "8000", "--reload"
    ]
    backend_proc = subprocess.Popen(backend_cmd, cwd=root_dir)

    # Wait 2 seconds for backend to initialize
    time.sleep(2)

    print("2. Starting React + TypeScript frontend on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=frontend_dir)

    time.sleep(2)
    print("\nApplication successfully started!")
    print("  -> Web Dashboard: http://localhost:5173")
    print("  -> API Swagger:   http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to terminate both servers.")

    try:
        webbrowser.open("http://localhost:5173")
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down SmartPark AI servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Servers stopped cleanly.")

if __name__ == "__main__":
    main()
