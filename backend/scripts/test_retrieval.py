import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path so we can import from 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv(Path(__file__).parent.parent / ".env")

from app.services.retrieval_service import DebateRetriever

def test_retrieval():
    print("=" * 60)
    print("🔎 TESTING RETRIEVAL SERVICE")
    print("=" * 60)

    try:
        # 1. Initialize
        print("\n1. Initializing DebateRetriever...")
        retriever = DebateRetriever()
        print("   ✅ Initialization successful.")

        # 2. Define a Test Query
        test_query = "Social media causes harm to society"
        print(f"\n2. Searching for: '{test_query}'")

        # 3. Run Retrieval
        results = retriever.retrieve(test_query, top_k=3)

        # 4. Display Results
        print(f"\n   ✅ Found {len(results)} results:\n")
        
        if not results:
            print("   ⚠️ No results found. (Is your Pinecone index empty?)")
        
        for i, res in enumerate(results):
            print(f"   [{i+1}] Score: {res['relevance_score']:.4f} | Quality: {res['quality']}")
            print(f"       Topic: {res['topic']}")
            print(f"       Text:  {res['text'][:150]}...") # Show first 150 chars
            print("-" * 40)

    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_retrieval()