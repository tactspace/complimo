from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
import os
import datetime
import glob
from pathlib import Path

load_dotenv()

def ingest_document(document_path, custom_metadata=None, persist_directory="./chroma_db"):
    """
    Ingest a single document into ChromaDB with optional custom metadata.
    
    Args:
        document_path (str): Path to the document file (PDF)
        custom_metadata (dict, optional): Additional metadata to store with the document chunks
        persist_directory (str): Directory to persist the ChromaDB
        
    Returns:
        Chroma: The updated vector store
    """
    # Extract file information
    filename = os.path.basename(document_path)
    file_extension = os.path.splitext(filename)[1].lower()
    
    # Load the document based on file type
    if file_extension == '.pdf':
        loader = PyPDFLoader(document_path)
    else:
        raise ValueError(f"Unsupported file extension: {file_extension}")
    
    # Extract documents
    documents = loader.load()
    
    # Define text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    
    # Split the documents into chunks
    docs = text_splitter.split_documents(documents)
    
    # Add custom metadata to each chunk
    for doc in docs:
        # Base metadata
        doc.metadata.update({
            "source": document_path,
            "filename": filename,
            "ingestion_date": datetime.datetime.now().isoformat(),
        })
        
        # Add custom metadata if provided
        if custom_metadata:
            doc.metadata.update(custom_metadata)
    
    # Initialize embedding model
    embedding_model = OpenAIEmbeddings()
    
    # Check if ChromaDB already exists
    if os.path.exists(persist_directory):
        # Load existing ChromaDB and add new documents
        vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embedding_model)
        vectorstore.add_documents(docs)
    else:
        # Create new ChromaDB and persist data
        vectorstore = Chroma.from_documents(docs, embedding_model, persist_directory=persist_directory)
    
    # Ensure data is persisted
    vectorstore.persist()
    
    return vectorstore

def ingest_documents_from_folder(folder_path, custom_metadata_func=None, persist_directory="./chroma_db"):
    """
    Ingest all PDF documents from a specified folder into ChromaDB.
    
    Args:
        folder_path (str): Path to the folder containing documents
        custom_metadata_func (callable, optional): Function that takes a file path and returns metadata dict
        persist_directory (str): Directory to persist the ChromaDB
        
    Returns:
        Chroma: The updated vector store
    """
    # Ensure folder path exists
    if not os.path.exists(folder_path):
        raise ValueError(f"Folder path does not exist: {folder_path}")
    
    # Get all PDF files in the folder and subfolders
    pdf_files = glob.glob(os.path.join(folder_path, "**/*.pdf"), recursive=True)
    
    if not pdf_files:
        print(f"No PDF files found in {folder_path}")
        return None
    
    # Initialize embedding model
    embedding_model = OpenAIEmbeddings()
    
    # Check if ChromaDB already exists
    if os.path.exists(persist_directory):
        # Load existing ChromaDB
        vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embedding_model)
    else:
        # Initialize empty vectorstore for first run
        vectorstore = None
    
    # Process each file
    for document_path in pdf_files:
        print(f"Processing: {document_path}")
        
        # Generate custom metadata if function provided
        if custom_metadata_func:
            custom_metadata = custom_metadata_func(document_path)
        else:
            # Default metadata - can be expanded based on filename patterns
            filename = os.path.basename(document_path)
            custom_metadata = {
                "document_type": "pdf",
                "filename": filename,
            }
        
        # Load the document
        loader = PyPDFLoader(document_path)
        documents = loader.load()
        
        # Define text splitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        
        # Split the documents into chunks
        docs = text_splitter.split_documents(documents)
        
        # Add custom metadata to each chunk
        for doc in docs:
            doc.metadata.update({
                "source": document_path,
                "ingestion_date": datetime.datetime.now().isoformat(),
            })
            doc.metadata.update(custom_metadata)
        
        # Add documents to vectorstore
        if vectorstore is None:
            vectorstore = Chroma.from_documents(
                docs, 
                embedding_model, 
                persist_directory=persist_directory
            )
        else:
            vectorstore.add_documents(docs)
            
        # Persist after each file to avoid data loss
        vectorstore.persist()
    
    print(f"Processed {len(pdf_files)} PDF files from {folder_path}")
    return vectorstore

# Example of a custom metadata function that extracts info from filenames
def extract_metadata_from_filename(file_path):
    """Example function to extract metadata from filename patterns"""
    filename = os.path.basename(file_path)
    name_parts = Path(filename).stem.split('_')
    
    metadata = {
        "document_type": "standard" if "standard" in filename.lower() else "document",
    }
    
    # Example: extract organization and standard number from filenames like "ASHRAE_62_1.pdf"
    if len(name_parts) >= 2:
        metadata["organization"] = name_parts[0]
        if len(name_parts) >= 3:
            metadata["standard_number"] = f"{name_parts[1]}.{name_parts[2]}"
    
    return metadata

# Example usage
if __name__ == "__main__":
    # Configure the folder containing your PDFs
    documents_folder = "/Users/ashish/Desktop/start-hack/complimo/backend/data"
    
    # Process all documents in the folder
    vectorstore = ingest_documents_from_folder(
        documents_folder, 
        custom_metadata_func=extract_metadata_from_filename
    )
    
    if vectorstore:
        # Now you can use the vectorstore for retrieving information
        retriever = vectorstore.as_retriever()
        
        # Example query
        query = "What is the main requirement for complying to ashrae 62.1?"
        retrieved_docs = retriever.get_relevant_documents(query)
        
        # Display results
        for doc in retrieved_docs:
            print(f"Source: {doc.metadata['source']}")
            print(f"Metadata: {doc.metadata}")
            print(f"Content: {doc.page_content[:200]}...")
            print("-" * 50)
        
        # Use with RAG chain
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
        
        rag_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            chain_type="stuff"
        )
        
        # Ask a question
        response = rag_chain.run(query)
        print(response)