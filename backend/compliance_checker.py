import json
from typing import Dict, List, Any, Tuple, Optional
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_chroma.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
import langgraph.graph as lg
from langgraph.graph import END, StateGraph
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Define LLM
llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
# Initialize Chroma client
embeddings = OpenAIEmbeddings()

# # Load persisted ChromaDB
retriever = Chroma(
    persist_directory="./chroma_db", 
    embedding_function=embeddings
).as_retriever()

      
# Print all documents in ChromaDB
collection = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)._collection


def analyze_data(data_json: str) -> str:
    """Analyze tabular data provided as JSON string."""
    logger.info(f"Analyzing data: {data_json}")
    try:
        llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
        
        # If data is a list (multiple rows)
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a data analysis expert. Analyze the provided JSON data and provide insights about:
            1. The structure of the data (tabular, nested, flat, etc.)
            2. Key insights about the data
            3. Factual interpretation of data, including what the data is measuring and what the data is trying to tell you
            4. Implications of data and conclusions that can be drawn from the data
            
            Format your response as a simple string with clear sections for insights. No markdown, no formatting.
            """),
            ("user", "Please analyze this data:\n\n {data}")
        ])

        messages = prompt.format_messages(data=data_json)

        # Get analysis from OpenAI
        response = llm.invoke(messages)
        
        return response.content
    except Exception as e:
        return f"Error analyzing data: {str(e)}"
    

def retrieve_regulations(tabular_data: str):
    """Node to retrieve relevant regulations based on the query and data."""
    # Generate a search query based on the data
    query_prompt = ChatPromptTemplate.from_messages([
        ("system", "Based on the tabular data, generate a search query to find relevant compliance regulations."),
        ("user", "Data: {tabular_data} \nGenerate a focused search query for compliance regulations in less than 15 words.")
    ])

    messages = query_prompt.format_messages(tabular_data=tabular_data)
    query = llm.invoke(messages).content
    
    # Search regulations
    regulations = search_regulations(query)
    return regulations


def search_regulations(query: str) -> str:
    """Search compliance regulations database with the given query."""
    logger.info(f"Searching for regulations with query: {query}")
    results = retriever.vectorstore.similarity_search(query, k=3)
    formatted_results = []
    for i, doc in enumerate(results):
        formatted_results.append(f"Document {i+1}:\n{doc.page_content}\n")
    return "\n".join(formatted_results)


def check_compliance(data_analysis: str, regulations: str):
    """Compare data analysis with regulations to find compliance issues."""
    logger.info(f"Checking compliance with data analysis and regulations")
    try:
        llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """
             You are a compliance expert who forwarded a data analysis report along with a list of regulations. `Carefully study the data analysis and the list of regulations. Now, compare the data analysis with regulations to find compliance issues.

             Your task:
             1. Identify the regulations that are relevant to the data analysis.
             2. Compare the data analysis with the relevant regulations to find compliance issues.
             3. Provide a detailed report of the compliance issues, if any. The report should contain next_steps which are specific actionable steps to resolve the compliance issues. Refrain from providing general next steps.

             Format your response as a JSON response. No markdown, no formatting. The following is an example of the format you should follow:
             [
                    {{
                        "regulation": "Regulation description",
                        "compliance_issues": "Compliance issues",
                        "status": "compliant",
                        "next_steps": "Since your heating system is faulty, you should call a technician to fix it."
                    }},
                    {{
                        "regulation": "Regulation description",
                        "compliance_issues": "Compliance issues",
                        "status": "non-Compliant",
                        "next_steps": "Since your system is running since long without reset, make sure to reset it refularly to prevent breakdown of operation."
                    }},
                    {{
                        "regulation": "Regulation description",
                        "compliance_issues": "Compliance issues",
                        "status": "compliant",
                        "next_steps": "Since your system is running since long without reset, make sure to reset it refularly to prevent breakdown of operation."
                    }}
             ]
             """),
            ("user", "Please compare this data with regulations to find compliance issues:\n\n {data_analysis} \n\n {regulations}")
        ])

        messages = prompt.format_messages(data_analysis=data_analysis, regulations=regulations)
        response = llm.invoke(messages)
        
        return json.loads(response.content)
    except Exception as e:
        return 100
    

def compliance_checker(data: str):
    analysis_results = analyze_data(data)

    regulations = retrieve_regulations(data)

    compliance_results = check_compliance(analysis_results, regulations)
    
    while isinstance(compliance_results, int):
        compliance_results = check_compliance(analysis_results, regulations)

    return compliance_results

    
    
    