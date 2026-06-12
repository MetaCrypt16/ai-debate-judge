import json
import sys
import time
import os
import numpy as np
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path to allow importing from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.dataset_loader import DebateDatasetLoader
import google.generativeai as genai
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

def embed_and_upload():
    print("=" * 80)
    print("EMBEDDING & UPLOADING TO PINECONE")
    print("=" * 80)
    
    # 1. Config Check
    api_key = os.getenv('GOOGLE_API_KEY')
    pc_key = os.getenv('PINECONE_API_KEY')
    pc_index = os.getenv('PINECONE_INDEX_NAME', 'debate-judge')
    
    if not api_key:
        print("❌ CRITICAL: GOOGLE_API_KEY is missing. Check your .env file.")
        return
    if not pc_key:
        print("❌ CRITICAL: PINECONE_API_KEY is missing. Check your .env file.")
        return

    # 2. Init Clients
    try:
        genai.configure(api_key=api_key)
        pc = Pinecone(api_key=pc_key)
    except Exception as e:
        print(f"❌ Client Init Error: {e}")
        return

    # 3. Index Creation/Check
    try:
        existing_indexes = [i.name for i in pc.list_indexes()]
        if pc_index not in existing_indexes:
            print(f"Index '{pc_index}' not found. Attempting creation...")
            try:
                pc.create_index(
                    name=pc_index,
                    dimension=768, 
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )
                print("✅ Serverless index created.")
            except Exception as e:
                print(f"⚠️ Serverless creation failed: {e}")
                print("   (If you are on the Starter tier, create the index manually in the console)")
                return
        else:
            print(f"✅ Index '{pc_index}' exists.")
            
        index = pc.Index(pc_index)
        
    except Exception as e:
        print(f"❌ Pinecone Connection Error: {e}")
        return
    
    # 4. Load Data
    print("\n📖 Loading knowledge base...")
    try:
        loader = DebateDatasetLoader()
        kb = loader.load_knowledge_base()
        if not kb:
            print("❌ Knowledge base is empty. Run 'python backend/app/services/dataset_loader.py' first.")
            return
    except Exception as e:
        print(f"❌ Data Load Error: {e}")
        return
        
    print(f"📊 Loaded {len(kb)} arguments. Starting embed loop...")
    
    # 5. Embed & Upload
    vectors_to_upsert = []
    batch_size = 100
    
    for i, doc in enumerate(kb):
        try:
            # Rate limit protection
            # Pause more frequently (every 50 items) to let the API breathe
            if i > 0 and i % 50 == 0:
                print("   ...pausing 2s for API rate limits...")
                time.sleep(2)

            # Generate Embedding with RETRY LOGIC
            embedding = None
            max_retries = 5
            
            for attempt in range(max_retries):
                try:
                    result = genai.embed_content(
                        model="models/text-embedding-004",
                        content=doc['text'],
                        task_type="retrieval_document"
                    )
                    embedding = result['embedding']
                    break # Success, exit retry loop
                except Exception as api_error:
                    if attempt < max_retries - 1:
                        # Exponential backoff: wait 5s, 10s, 15s...
                        wait_time = (attempt + 1) * 5
                        print(f"   ⚠️  API Error on item {i} (Attempt {attempt+1}/{max_retries}). Retrying in {wait_time}s... Error: {str(api_error)[:100]}")
                        time.sleep(wait_time)
                    else:
                        raise api_error # Retries exhausted, raise to outer block

            
            # Prepare Metadata
            quality_score = float(doc.get('quality', 0.7))
            
            metadata = {
                'text': str(doc.get('text', ''))[:4000], # Pinecone metadata size limit
                'topic': str(doc.get('topic', 'General')),
                'stance': str(doc.get('stance', 'Neutral')),
                'quality': quality_score,
                'source': str(doc.get('source', 'Unknown')),
                'dataset_type': str(doc.get('dataset_type', 'unknown')),
                'confidence': quality_score 
            }
            
            vectors_to_upsert.append({
                "id": str(doc.get('id', f'doc_{i}')), 
                "values": embedding, 
                "metadata": metadata
            })
            
            # Upload Batch
            if len(vectors_to_upsert) >= batch_size:
                index.upsert(vectors=vectors_to_upsert)
                print(f"  ⬆️  Uploaded batch ending at item {i}")
                vectors_to_upsert = []
                time.sleep(0.5) 
                
        except Exception as e:
            print(f"  ❌  Failed to embed item {i}: {e}")
            continue
            
    # Final batch
    if vectors_to_upsert:
        index.upsert(vectors=vectors_to_upsert)
        print("✅ Final batch uploaded.")
        
    print("\n✅ EMBEDDING & UPLOAD COMPLETE!")

if __name__ == "__main__":
    embed_and_upload()