# TCM Outpatient Medical Record System (中医门诊病案首页系统)

## Project Overview
A web-based system for filling, saving, and exporting Traditional Chinese Medicine (TCM) outpatient medical records.

### Tech Stack
- **Frontend**: React, TypeScript, Vite, Ant Design, Zustand, Axios
- **Backend**: Python, FastAPI, SQLAlchemy, Alembic, Pydantic, OpenPyXL

## Quick Start Guide

### 1. Database Setup
Ensure your database is configured in `backend/.env`.
If using default SQLite (`mz_mfp.db`), no action needed (it's created automatically).
If using MySQL, ensure the DB exists and run migrations:
```bash
cd backend
python -m alembic upgrade head
```

### 2. Start Backend
The backend runs on port **8000**.
```bash
cd backend
# Make sure virtual environment is activated if you use one
uvicorn app.main:app --reload
```
API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Start Frontend
The frontend runs on port **5173**.
```bash
cd frontend
npm run dev
```

### 4. Access System
Open Browser: [http://localhost:5173](http://localhost:5173)

### 5. Login Credentials (Mock)
- **Username**: any (e.g., `admin`)
- **Password**: `123456`

## Workflow Demo
1. **Login**: Use credentials above.
2. **Load Patient**: Enter `123456` in the search box on the dashboard.
3. **Edit**: Fill in diagnosis, operation, or medication info.
4. **Save**: Click "暂存" (Save Draft) or "提交" (Submit).
5. **Print/Export**: Use buttons in the toolbar.
