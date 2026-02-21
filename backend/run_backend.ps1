$env:PYTHONPATH = "C:\Users\HP\Desktop\NovaPilot AI\backend"
$env:ENV = "development"
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
