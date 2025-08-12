import os
import sys
import json
import markdown
from django.conf import settings
from agentic_app.utils.db import get_project_data, save_agent_output
from agentic_app.utils.rag import FAISSRAG
from agentic_app.utils.llm import generate_idea_analysis

# Ensure the backend directory is in the Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

def generate_use_case_map(features, personas):
    """Generate a Markdown use-case map from features and personas."""
    md_content = "# Use-Case Map\n\n"
    md_content += "## Personas\n"
    for persona in personas:
        md_content += f"- **{persona['role']}**: {persona['needs']}\n"
    md_content += "\n## Features\n"
    for feature in features:
        md_content += f"- **{feature['name']}**: {feature['description']}\n"
    return md_content

def process_idea(project_id, idea, team_metadata):
    """Process a product idea and generate structured output."""
    try:
        # Initialize RAG
        rag = FAISSRAG()
        rag_context = ""
        try:
            # Load PDF if index doesn't exist
            if not os.path.exists(os.path.join(settings.BASE_DIR, 'faiss_index.index')):
                rag.load_pdf_and_embed('data/08.031.17-Agile-Playbook-2.1-v12-One-Per-Student.pdf')
            # Query RAG for Agile context
            results = rag.search("how to extract features in Agile methodology", k=3)
            rag_context = "\n".join([doc for doc, _ in results])
        except Exception as e:
            print(f"Warning: Failed to load RAG context: {e}")
            rag_context = "Use Agile methodology best practices."

        # Generate analysis with LLM
        analysis = generate_idea_analysis(idea, team_metadata, rag_context)

        # Save to MongoDB
        save_agent_output(project_id, "idea_agent", analysis)

        # Generate and save Markdown use-case map
        output_dir = os.path.join(settings.BASE_DIR, 'outputs')
        os.makedirs(output_dir, exist_ok=True)
        md_content = generate_use_case_map(analysis.get('features', []), analysis.get('personas', []))
        md_path = os.path.join(output_dir, f'use_case_map_{project_id}.md')
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(md_content)
        print(f"Saved use-case map to {md_path}")

        return analysis
    except Exception as e:
        raise ValueError(f"Failed to process idea: {e}")