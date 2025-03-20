import json
from typing import Dict, List, Any, Tuple, Optional
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
import langgraph.graph as lg
from langgraph.graph import END, StateGraph
from dotenv import load_dotenv

load_dotenv()

# Define state schema
class AgentState:
    def __init__(self):
        self.query: str = ""
        self.documents: List[Dict] = []
        self.tabular_data: Dict = {}
        self.analysis_results: Dict = {}
        self.regulation_matches: List[Dict] = []
        self.compliance_status: str = ""
        self.intermediate_steps: List[str] = []
        self.final_answer: str = ""

# Initialize Chroma client
embeddings = OpenAIEmbeddings()
compliance_db = Chroma(
    collection_name="compliance_regulations",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)

# Define tools
@tool
def search_regulations(query: str) -> str:
    """Search compliance regulations database with the given query."""
    results = compliance_db.similarity_search(query, k=3)
    formatted_results = []
    for i, doc in enumerate(results):
        formatted_results.append(f"Document {i+1}:\n{doc.page_content}\n")
    return "\n".join(formatted_results)

@tool
def analyze_data(data_json: str) -> str:
    """Analyze tabular data provided as JSON string."""
    try:
        data = json.loads(data_json) if isinstance(data_json, str) else data_json
        
        # Basic analysis - can be expanded based on needs
        analysis = {
            "row_count": len(data) if isinstance(data, list) else 1,
            "columns": list(data[0].keys()) if isinstance(data, list) and len(data) > 0 else list(data.keys()),
            "summary": {}
        }
        
        # If data is a list (multiple rows)
        if isinstance(data, list) and len(data) > 0:
            sample_row = data[0]
            for key in sample_row.keys():
                if isinstance(sample_row[key], (int, float)):
                    values = [row[key] for row in data if key in row]
                    analysis["summary"][key] = {
                        "min": min(values),
                        "max": max(values),
                        "avg": sum(values) / len(values)
                    }
        
        return json.dumps(analysis, indent=2)
    except Exception as e:
        return f"Error analyzing data: {str(e)}"

@tool
def check_compliance(data_analysis: str, regulations: str) -> str:
    """Compare data analysis with regulations to find compliance issues."""
    try:
        analysis = json.loads(data_analysis) if isinstance(data_analysis, str) else data_analysis
        
        # This is a simplified implementation - in a real system, you would have more
        # sophisticated logic to match regulations with data patterns
        
        results = []
        
        # Example logic - you'll need to customize this based on your specific requirements
        if "summary" in analysis:
            for field, stats in analysis["summary"].items():
                if "max" in stats and stats["max"] > 1000:  # Example threshold
                    results.append({
                        "field": field,
                        "issue": f"Value exceeds maximum allowed threshold (1000): {stats['max']}",
                        "regulation": "Find relevant regulation in the provided regulations text"
                    })
        
        if len(results) > 0:
            return json.dumps(results, indent=2)
        else:
            return "No compliance issues detected based on current analysis."
    except Exception as e:
        return f"Error checking compliance: {str(e)}"

# Define LLM
llm = ChatOpenAI(model="gpt-4o")

# Define the agent nodes
def retrieve_regulations(state: AgentState) -> AgentState:
    """Node to retrieve relevant regulations based on the query and data."""
    # Generate a search query based on the data
    query_prompt = ChatPromptTemplate.from_messages([
        ("system", "Based on the tabular data, generate a search query to find relevant compliance regulations."),
        ("user", f"Data: {state.tabular_data}\nGenerate a focused search query for compliance regulations.")
    ])
    
    query = llm.invoke(query_prompt).content
    state.intermediate_steps.append(f"Generated search query: {query}")
    
    # Search regulations
    regulations = search_regulations(query)
    state.documents = regulations
    state.intermediate_steps.append(f"Retrieved regulations:\n{regulations}")
    
    return state

def analyze_tabular_data(state: AgentState) -> AgentState:
    """Node to analyze the tabular data."""
    analysis = analyze_data(state.tabular_data)
    state.analysis_results = analysis
    state.intermediate_steps.append(f"Data analysis results:\n{analysis}")
    
    return state

def evaluate_compliance(state: AgentState) -> AgentState:
    """Node to evaluate compliance based on regulations and data analysis."""
    compliance_results = check_compliance(state.analysis_results, state.documents)
    state.regulation_matches = compliance_results
    state.intermediate_steps.append(f"Compliance evaluation results:\n{compliance_results}")
    
    # Determine compliance status
    if "No compliance issues detected" in compliance_results:
        state.compliance_status = "COMPLIANT"
    elif "Error" in compliance_results:
        state.compliance_status = "CANNOT_BE_DETERMINED"
    else:
        state.compliance_status = "NON_COMPLIANT"
    
    return state

def generate_final_answer(state: AgentState) -> AgentState:
    """Node to generate the final answer based on all the collected information."""
    if state.compliance_status == "COMPLIANT":
        state.final_answer = "The data is compliant with all relevant regulations."
    elif state.compliance_status == "NON_COMPLIANT":
        compliance_issues = state.regulation_matches
        state.final_answer = f"COMPLIANCE ISSUES FOUND:\n{compliance_issues}"
    else:
        state.final_answer = "Compliance status cannot be determined with the available information."
    
    return state

# Build the graph
def build_compliance_agent() -> StateGraph:
    """Build and return the compliance agent graph."""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("retrieve_regulations", retrieve_regulations)
    workflow.add_node("analyze_tabular_data", analyze_tabular_data)
    workflow.add_node("evaluate_compliance", evaluate_compliance)
    workflow.add_node("generate_final_answer", generate_final_answer)
    
    # Add edges
    workflow.add_edge("analyze_tabular_data", "retrieve_regulations")
    workflow.add_edge("retrieve_regulations", "evaluate_compliance")
    workflow.add_edge("evaluate_compliance", "generate_final_answer")
    workflow.add_edge("generate_final_answer", END)
    
    # Set entrypoint
    workflow.set_entry_point("analyze_tabular_data")
    
    return workflow.compile()

# Function to run the agent
def run_compliance_check(tabular_data: Dict[str, Any]) -> str:
    """Run the compliance agent on the provided tabular data."""
    agent = build_compliance_agent()
    
    initial_state = AgentState()
    initial_state.tabular_data = tabular_data
    
    result = agent.invoke(initial_state)
    
    # Return final answer
    return result.final_answer

# Example usage
if __name__ == "__main__":
    # Example tabular data in JSON format
    sample_data = [
        {"id": 1, "amount": 1500, "transaction_date": "2023-01-15", "customer_id": "C12345"},
        {"id": 2, "amount": 800, "transaction_date": "2023-01-16", "customer_id": "C12346"},
        {"id": 3, "amount": 2500, "transaction_date": "2023-01-17", "customer_id": "C12347"}
    ]
    
    result = run_compliance_check(sample_data)
    print("Compliance Check Result:")
    print(result)
