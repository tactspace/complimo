from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
import os

load_dotenv()

# Directory containing your PDFs
pdf_directory = "/Users/ashish/Desktop/start-hack/complimo/backend/data/"

# Function to load and index PDFs
def index_pdfs():
    # Load all PDFs from the directory
    loader = DirectoryLoader(pdf_directory, glob="**/*.pdf", loader_cls=PyPDFLoader)
    documents = loader.load()
    
    # Store original file sources
    document_sources = {doc.metadata["source"]: True for doc in documents}
    
    # For discovery, create document-level chunks with metadata
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    
    docs = text_splitter.split_documents(documents)
    
    # Initialize embedding model
    embedding_model = OpenAIEmbeddings()
    
    # Create ChromaDB and persist data
    vectorstore = Chroma.from_documents(docs, embedding_model, persist_directory="./chroma_db")
    
    return vectorstore, document_sources

# Function to find relevant PDFs for a query
def find_relevant_pdfs(query, top_k=3):
    # Load persisted ChromaDB
    embedding_model = OpenAIEmbeddings()
    retriever = Chroma(persist_directory="./chroma_db", embedding_function=embedding_model).as_retriever(
        search_kwargs={"k": top_k}
    )
    
    # Get relevant documents
    retrieved_docs = retriever.get_relevant_documents(query)
    
    # Extract unique PDF sources
    pdf_sources = set()
    for doc in retrieved_docs:
        pdf_sources.add(doc.metadata["source"])
    

    print(f"\n\n\nRelevant PDFs found: {pdf_sources}\n\n\n")
    
    return list(pdf_sources)

# Function to read a full PDF
def read_full_pdf(pdf_path):
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    print(f"\n\n\nFull Documents loaded: {documents}\n\n\n")
    return documents

# Function to answer a question using RAG on specific PDFs
def answer_question_from_pdfs(query, pdf_paths):
    # Load and process the specific PDFs
    all_docs = []
    for path in pdf_paths:
        docs = read_full_pdf(path)
        all_docs.extend(docs)
    
    # Create a temporary vector store with just these documents
    embedding_model = OpenAIEmbeddings()
    temp_vectorstore = Chroma.from_documents(all_docs, embedding_model)
    
    llm = ChatOpenAI(model_name="gpt-4o", temperature=0.3)
    
    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=temp_vectorstore.as_retriever(),
        chain_type="stuff"
    )
    
    print(f"\n\n\nRAG Chain created: {rag_chain}\n\n\n")
    
    # Answer the question using the full content of the selected PDFs
    response = rag_chain.run(query)
    return response

# Example usage
if __name__ == "__main__":
    # Index PDFs (run this once or when PDFs change)
    # vectorstore, all_sources = index_pdfs()
    
    # Find relevant PDFs for a query
    query = "What is the main requirement for complying to ashrae 62.1?"
    relevant_pdfs = find_relevant_pdfs(query)
    
    print(f"Relevant PDFs found: {relevant_pdfs}")
    
    # Process the query using the full content of relevant PDFs
    answer = answer_question_from_pdfs(query, relevant_pdfs)
    print("\nAnswer:")
    print(answer)