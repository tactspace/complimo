# Complimo - HVAC Compliance Agent

![Complimo Logo](public/logo.png)

An AI-powered compliance assistant for HVAC systems that helps validate system configurations against regulatory requirements and industry standards.

## Features

- **Document Analysis**: Upload PDF documents with compliance specifications
- **Real-time Compliance Chat**: AI assistant answers compliance questions in context
- **HVAC Metrics Monitoring**: Visualize system performance metrics
- **Regulatory Check**: Automatic validation against common standards

## Tech Stack

**Frontend**:
- Next.js 15.2 (App Router)
- React 19 + TypeScript
- Recharts for data visualization
- Next/font (Geist)

**Backend**:
- FastAPI
- LangChain + OpenAI integrations
- ChromaDB (Vector Store)

**Infrastructure**:
- Dockerized services
- CORS-enabled API
- Poppler-utils for PDF processing

## Development Setup

### Prerequisites
- Node.js 20+
- Python 3.9+
- Docker (optional)
- OpenAI API key

### Quick Start with Docker
```bash
# Clone repository
git clone [your-repo-url]
cd complimo

# Create .env files
echo "OPENAI_API_KEY=your_key_here" > backend/.env
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local

# Start services
docker-compose up --build
```

### Manual Setup
**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

`backend/.env`:
```ini
OPENAI_API_KEY=your_openai_key
```

`frontend/.env.local`:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
```
