import uvicorn
from datetime import datetime
from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
import shutil
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import pandas as pd
import json

load_dotenv()
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request body models
class HistoryMessage(BaseModel):
    content: str
    isUser: bool

class ChatWithHistoryRequest(BaseModel):
    query: str
    conversation_history: list[HistoryMessage] = []  # Optional, defaults to empty list

# Add this new response model above existing endpoints
class HVACMetricsResponse(BaseModel):
    HVAC_Metrics: dict

class SensorDataRequest(BaseModel):
    sensor_data: dict

# Initialize components (moved outside endpoint for efficiency)
@app.on_event("startup")
def startup_db_client():
    global rag_chain
    
    # Initialize embedding model
    embedding_model = OpenAIEmbeddings()
    
    # Load persisted ChromaDB
    retriever = Chroma(
        persist_directory="./chroma_db", 
        embedding_function=embedding_model
    ).as_retriever()

    # Print all documents in ChromaDB
    collection = Chroma(
        persist_directory="./chroma_db",
        embedding_function=embedding_model
    )._collection
    
    docs = collection.get()
    print("Documents in ChromaDB:")
    for doc, metadata in zip(docs['documents'], docs['metadatas']):
        print(f"Content: {doc[:100]}...")  # Show first 100 chars
        print(f"Metadata: {metadata}")
        print("-" * 50)
    
    # Initialize LLM
    llm = ChatOpenAI(model_name="gpt-4o", temperature=0.1)
    
    # Create RAG chain
    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff"
    )

@app.post("/chat")
async def chat(request: ChatWithHistoryRequest):
    try:
        # Get the current query and conversation history
        query = request.query
        conversation_history = request.conversation_history
        
        # Format previous exchanges as context for the query if history exists
        if conversation_history:
            context = "\n\n".join([
                f"{'User' if msg.isUser else 'Assistant'}: {msg.content}" 
                for msg in conversation_history
            ])
            
            # Combine context with current query
            enhanced_query = f"""Previous conversation:
{context}

Based on this conversation history, please answer the user's current question: {query}. Answer in pure text, no markdown, no HTML."""
        else:
            enhanced_query = query
        
        # Generate response using RAG chain with the enhanced query
        response = rag_chain.run(enhanced_query)
        
        # Return the response
        return {"response": response}
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.post("/index-pdf")
async def index_pdf(files: list[UploadFile] = File(...)):
    try:
        # Create upload directory if it doesn't exist
        upload_dir = "./uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save files to upload directory
        saved_files = []
        for file in files:
            file_path = os.path.join(upload_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_files.append(file_path)
        
        # PDF processing and indexing
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=8000,
            chunk_overlap=500
        )
        embeddings = OpenAIEmbeddings()
        
        # Process each PDF file
        for file_path in saved_files:
            # Extract text from PDF
            with open(file_path, "rb") as f:
                pdf = PdfReader(f)
                text = "\n".join([page.extract_text() for page in pdf.pages])
                
            # Split text into chunks
            chunks = text_splitter.split_text(text)
            
            # Create and persist Chroma collection
            Chroma.from_texts(
                texts=chunks,
                embedding=embeddings,
                persist_directory="./chroma_db",
                metadatas=[{"source": file_path}] * len(chunks)
            ).persist()
        
        return {
            "message": "PDFs indexed successfully",
            "indexed_files": [f.filename for f in files]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def get_documents():
    try:
        # Initialize Chroma connection
        embedding_model = OpenAIEmbeddings()
        chroma = Chroma(
            persist_directory="./chroma_db",
            embedding_function=embedding_model
        )
        
        # Get all documents and metadata
        collection = chroma._collection
        docs = collection.get()
        
        # Format documents with metadata
        documents = []
        for content, metadata in zip(docs['documents'], docs['metadatas']):
            documents.append({
                "content": content,
                "source": metadata.get('source', 'unknown')
            })
        
        return {
            "count": len(documents),
            "documents": documents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hvac-metrics/{step}", response_model=HVACMetricsResponse)
async def get_hvac_metrics(step: int):
    """
    Returns mock HVAC metrics from CSV for a given step index
    Example CSV format:
    Absolute_Power_W,Delta_Temperature_K,Setpoint_Delta_T_K,Temperature_1_Remote_K,... 
    12500,6.5,7.0,289.5,283.0,75,0.03,14500,4200000000,2800000000,2500,1900,False
    """
    try:
        # Read CSV file (create this file in your project root)
        df = pd.read_csv("data_points.csv")
        
        # Validate step parameter
        if step < 0 or step >= len(df):
            raise HTTPException(status_code=400, detail="Invalid step index")
            
        # Get row for requested step
        row = df.iloc[step].to_dict()
        
        # Structure response according to required format
        return {
            "HVAC_Metrics": {
                "Power_Consumption": {"Absolute_Power_W": row["Absolute_Power_W"]},
                "Temperature_Differential": {
                    "Delta_Temperature_K": row["Delta_Temperature_K"],
                    "Setpoint_Delta_T_K": row["Setpoint_Delta_T_K"],
                    "Temperature_1_Remote_K": row["Temperature_1_Remote_K"],
                    "Temperature_2_Embedded_K": row["Temperature_2_Embedded_K"]
                },
                "Flow_Performance": {
                    "Relative_Flow_Percentage": row["Relative_Flow_Percentage"],
                    "Absolute_Flow_m3_s": row["Absolute_Flow_m3_s"],
                    "Flow_Volume_Total_m3": row["Flow_Volume_Total_m3"]
                },
                "Energy_Consumption": {
                    "Cooling_Energy_J": row["Cooling_Energy_J"],
                    "Heating_Energy_J": row["Heating_Energy_J"]
                },
                "Operational_Metrics": {
                    "Operating_Time_h": row["Operating_Time_h"],
                    "Active_Time_h": row["Active_Time_h"]
                },
                "System_Status": {
                    "Flow_Signal_Faulty": bool(row["Flow_Signal_Faulty"])
                }
            }
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Metrics data not found")

@app.post("/check-compliance")
async def check_compliance_endpoint(request: SensorDataRequest):
    try:
        from compliance_checker import compliance_checker
        
        # Convert sensor data dict to JSON string
        sensor_data = json.dumps(request.sensor_data)
        
        # Call compliance checker
        compliance_results = compliance_checker(sensor_data)
        
        return compliance_results
    except Exception as e:
        print(f"Compliance check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


    
