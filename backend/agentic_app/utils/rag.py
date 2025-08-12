import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import sys
import pickle
from django.conf import settings
import django
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Ensure the backend directory is in the Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

# Configure Django settings for standalone script
if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
    try:
        django.setup()
    except Exception as e:
        print(f"Failed to configure Django settings: {e}")
        sys.exit(1)

class FAISSRAG:
    def __init__(self, model_name='all-MiniLM-L6-v2', index_path='faiss_index.index', docs_path='documents.pkl'):
        """Initialize FAISS index, document storage, and sentence transformer model."""
        self.model = SentenceTransformer(model_name)
        self.index_path = os.path.join(settings.BASE_DIR, index_path)
        self.docs_path = os.path.join(settings.BASE_DIR, docs_path)
        self.documents = []
        self.index = None
        self.load_index_and_documents()

    def load_index_and_documents(self):
        """Load FAISS index and documents if they exist."""
        try:
            if os.path.exists(self.index_path) and os.path.exists(self.docs_path):
                self.index = faiss.read_index(self.index_path)
                with open(self.docs_path, 'rb') as f:
                    self.documents = pickle.load(f)
                print(f"Loaded FAISS index and {len(self.documents)} documents from disk.")
            else:
                self.index = None
                self.documents = []
        except Exception as e:
            raise ValueError(f"Failed to load FAISS index or documents: {e}")

    def load_pdf_and_embed(self, pdf_path):
        """Load PDF, extract text, split into chunks, embed, and save to FAISS and pickle."""
        try:
            pdf_path = os.path.join(settings.BASE_DIR, pdf_path)
            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

            # Extract text from PDF
            reader = PdfReader(pdf_path)
            text = ""
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                else:
                    print(f"Warning: No text extracted from page {i + 1}")

            if not text.strip():
                raise ValueError("No text extracted from PDF. It may be scanned or encrypted.")

            # Split text into chunks
            splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
            self.documents = splitter.split_text(text)

            if not self.documents:
                raise ValueError("No document chunks created after splitting.")

            # Generate embeddings
            embeddings = self.model.encode(self.documents, convert_to_numpy=True)

            # Initialize FAISS index
            dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
            self.index.add(embeddings)

            # Save index and documents to disk
            faiss.write_index(self.index, self.index_path)
            with open(self.docs_path, 'wb') as f:
                pickle.dump(self.documents, f)
            print(f"Embedded and stored {len(self.documents)} chunks from PDF into {self.index_path} and {self.docs_path}")
        except Exception as e:
            raise ValueError(f"Failed to load and embed PDF: {e}")

    def search(self, query, k=3):
        """Search for top-k relevant documents for a given query."""
        try:
            if self.index is None or not self.documents:
                raise ValueError("FAISS index or documents not initialized. Call load_pdf_and_embed first.")
            
            # Encode the query
            query_embedding = self.model.encode([query], convert_to_numpy=True)
            # Search FAISS index
            distances, indices = self.index.search(query_embedding, k)
            # Retrieve matching documents
            results = [(self.documents[idx], distances[0][i]) for i, idx in enumerate(indices[0]) if idx < len(self.documents)]
            return results
        except Exception as e:
            raise ValueError(f"Failed to search FAISS index: {e}")

if __name__ == "__main__":
    # Initialize RAG and process the Agile playbook PDF
    try:
        rag = FAISSRAG()
        pdf_path = 'data/08.031.17-Agile-Playbook-2.1-v12-One-Per-Student.pdf'
        rag.load_pdf_and_embed(pdf_path)
        # Test retrieval
        query = "How to extract features in Agile methodology?"
        results = rag.search(query, k=2)
        print(f"Query: {query}")
        for doc, dist in results:
            print(f"Document: {doc[:100]}..., Distance: {dist:.4f}")
    except Exception as e:
        print(f"Failed to initialize RAG or process PDF: {e}")