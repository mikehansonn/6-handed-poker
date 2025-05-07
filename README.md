# 6-Handed Poker (AIce High)🃏
Deployed At: https://aicehigh.netlify.app/ (Server will spin down after time of inactivity, might take 50 seconds to respond on first request)

A full-stack 6-handed poker web app featuring a **React frontend** and a **FastAPI backend**. Players can simulate poker games against bots, receive AI-driven insights, and interact through a smooth, responsive interface.

**GitHub Repository:**  
[https://github.com/mikehansonn/6-handed-poker](https://github.com/mikehansonn/6-handed-poker)

---

## How to Run the Project Locally

### 1. Clone the repository
git clone https://github.com/mikehansonn/6-handed-poker.git
cd 6-handed-poker

### 2. Backend Setup (FastAPI)
```python -m venv venv```
.\venv\Scripts\activate

cd backend
uvicorn main:app --reload

The FastAPI backend will now be running at:  http://127.0.0.1:8000

### 3. Frontend Setup (React) 

cd ../frontend

npm install

npm start

The React app will now be running at: http://localhost:3000
## Dependencies  (Python Backend, requirements.txt)

annotated-types==0.7.0
anyio==4.8.0
certifi==2025.1.31
click==8.1.8
colorama==0.4.6
distro==1.9.0
fastapi==0.115.8
h11==0.14.0
httpcore==1.0.7
httpx==0.28.1
idna==3.10
jiter==0.8.2
openai==1.63.2
pydantic==2.10.6
pydantic_core==2.27.2
python-dotenv==1.0.1
sniffio==1.3.1
starlette==0.45.3
tqdm==4.67.1
typing_extensions==4.12.2
uvicorn==0.34.0

## React Frontend (package.json) 

{
  "dependencies": {
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.7.9",
    "framer-motion": "^12.6.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.2.0",
    "react-scripts": "^5.0.1",
    "recharts": "^2.15.1",
    "web-vitals": "^2.1.4"
  },
  "devDependencies": {
    "@shadcn/ui": "^0.0.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17"
  }
}


## Make sure to create a .env file inside the backend folder with necessary API keys like: 

OPENAI_API_KEY=your-openai-key-here
