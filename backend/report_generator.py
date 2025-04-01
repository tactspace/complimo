import pandas as pd
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_chroma.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

def preprocess_data(file_path: str) -> pd.DataFrame:
    df = pd.read_csv(file_path)
    columns = df.columns.tolist()
    return { "columns": columns, "data": df.values.tolist() }


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


def generate_report(requirements_data: str, data_columns_description: str, analysis_data: str) -> str:
    """Analyze tabular data provided as JSON string."""
    try:
        llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
        
        # If data is a list (multiple rows)
        # prompt = ChatPromptTemplate.from_messages([
        #     ("system", """You are a data analysis expert. The data is time series data, {data_description}. Analyze the provided JSON data and provide insights about:
        #     1. The trends in the data including the peaks and troughs, deviation from the norm and the exact time period of such deviations.
        #     2. Key insights about the data.
        #     3. Factual interpretation of data and trends in the data.
             
        #     Document your analysis in a way that is easy to understand and follow using a simple yet professional tone. Write a full detailed report including any relevant graphs and charts.
            
        #     Format your response as a simple string with clear sections for insights. No markdown, no formatting.
        #     """),
        #     ("user", "Please analyze this data:\n\n {data}")
        # ])

        prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a data analysis expert creating a formal PDF report for an Heating, Ventilation and Air conditioning (HVAC) insurance company who wants to know if a building is complying with the insurance requirements and is eligible to make claims. You are given some the description of columns and the analysis of the corresponding time series HVAC data. The data columns are as follows, {data_columns_description}. 
         
            Note: Prepare the report in pure HTML, no markdown.
            Format all numbers with appropriate units and 2 decimal places where applicable. Emphasize on data driven insights and recommendations and put strong focus from an insurance provider's perspective on what is most relevant information to ensure if the building is eligible for insurance claims. Document your analysis in a way that is easy to understand and follow using a simple yet professional tone. 
            """),
            ("user", "Following are the requirements for the insurance claim:\n\n {requirements_data}\n\n Please analyze this data and generate a report with respect to the data analysis and the requirements specified:\n\n {analysis_data}")
        ])

        messages = prompt.format_messages(requirements_data=requirements_data, analysis_data=analysis_data, data_columns_description=data_columns_description)


        # print length of prompt
        print(len(prompt.format_messages(requirements_data=requirements_data, analysis_data=analysis_data, data_columns_description=data_columns_description)[0].content))

        print(messages)

        # Get analysis from OpenAI
        response = llm.invoke(messages)
        
        return response.content
    except Exception as e:
        return f"Error analyzing data: {str(e)}"
    


def generate_query(data: dict) -> str:
    columns = data["columns"]
    data = data["data"]

    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Based on the tabular data, generate a search query to find relevant insurance eligibility requirements.
            """),
            ("user", "Columns: {columns}\nData:\n\n {data}")
        ])

        messages = prompt.format_messages(data=data, columns=columns)

        # Get analysis from OpenAI
        response = llm.invoke(messages)
        
        return response.content
    except Exception as e:
        return f"Error generating query: {str(e)}"

def search_regulations(query: str) -> str:
    """Search compliance regulations database with the given query."""
    results = retriever.vectorstore.similarity_search(query, k=10)
    formatted_results = []
    for i, doc in enumerate(results):
        formatted_results.append(f"Document {i+1}:\n{doc.page_content}\n")
    return "\n".join(formatted_results)

def analyze_data(data: dict) -> str:
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a data analysis expert. The data is time series data with the following columns: {data_columns_description}. Analyze the provided JSON data and provide insights about:
            1. The trends in the data including the peaks and troughs, deviation from the norm and the exact time period of such deviations.
            2. Key insights about the data.
            3. Factual interpretation of data and trends in the data.
            
            Format your response as a simple string with clear sections for insights. No markdown, no formatting.
            """),
            ("user", "Please analyze this data:\n\n {data}")
        ])

        messages = prompt.format_messages(data=data['data'], data_columns_description=data['columns'])

        # Get analysis from OpenAI
        response = llm.invoke(messages)
        
    except Exception as e:
        return f"Error analyzing data: {str(e)}"


df = preprocess_data("data_points.csv")
similarity_search_query = generate_query(df)
requirements = search_regulations(similarity_search_query)
analysis_data = analyze_data(df)

report = generate_report(requirements, preprocess_data("data_points.csv")['columns'], analysis_data)

# print(report)

# Export the report to a html file
# with open("report.html", "w") as f:
#     f.write(report)