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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


    
