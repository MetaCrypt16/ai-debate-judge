import json
import os
import pandas as pd
from typing import List, Dict
from datasets import load_dataset
from pathlib import Path
from dotenv import load_dotenv

# 1. Load Environment Variables (for HF Token)
current_file = Path(__file__).resolve()
backend_dir = current_file.parent.parent.parent
env_path = backend_dir / ".env"
load_dotenv(env_path)

class DebateDatasetLoader:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = backend_dir / "data"
        self.manual_dir = self.data_dir / "manual_data"
        
        # Get Token
        self.hf_token = os.getenv("HUGGINGFACE_TOKEN")
        
        # Create directories
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.manual_dir.mkdir(parents=True, exist_ok=True)
        
        self.kb_path = self.data_dir / "knowledge_base.json"
        
    def download_datasets(self) -> List[Dict]:
        print(f"Saving knowledge base to: {self.kb_path}")
        combined_kb = []
        
        # =========================================================
        # 1. IBM ARGUMENT QUALITY (Online via Hugging Face)
        # =========================================================
        print("\n[1/2] Attempting to load IBM ArgQ 30k from Hugging Face...")
        if not self.hf_token:
            print("   ⚠️  WARNING: HUGGINGFACE_TOKEN not found in .env. IBM load might fail.")
            
        try:
            ibm_dataset = load_dataset(
                "ibm-research/argument_quality_ranking_30k", 
                "argument_quality_ranking", 
                split="train", 
                trust_remote_code=True,
                token=self.hf_token
            )
            
            count = 0
            for item in ibm_dataset:
                if count >= 3000: break
                
                text = item.get('argument')
                if text and isinstance(text, str):
                    combined_kb.append({
                        'id': f"ibm_{count}",
                        'text': text,
                        'topic': str(item.get('topic', 'general')),
                        'stance': str(item.get('stance', 'PRO')),
                        'quality': float(item.get('WA', 0.5)), 
                        'source': 'IBM Research HF',
                        'dataset_type': 'ibm'
                    })
                    count += 1
            print(f"   ✅ Success: Loaded {count} IBM arguments.")
            
        except Exception as e:
            print(f"   ❌ IBM Load Failed: {e}")

        # =========================================================
        # 2. UKP DATASET (Manual Local File)
        # =========================================================
        print("\n[2/2] Looking for UKP files in 'backend/data/manual_data/'...")
        
        ukp_count = 0
        # Look for any file with "ukp" or "train" or "aspect" in the name
        files = list(self.manual_dir.glob("*"))
        
        for file_path in files:
            # Skip hidden files or system files
            if file_path.name.startswith('.'): continue
            
            try:
                print(f"   📄 Processing file: {file_path.name}...")
                
                # Intelligent Loader: Handles CSV, TSV, Parquet
                if file_path.suffix == '.parquet':
                    df = pd.read_parquet(file_path)
                elif file_path.suffix == '.tsv':
                    df = pd.read_csv(file_path, sep='\t', quoting=3) # quoting=3 handles messy quotes
                else:
                    # Try comma first, then tab if that looks wrong
                    try:
                        df = pd.read_csv(file_path)
                        if len(df.columns) < 2: # Likely failed parsing
                            df = pd.read_csv(file_path, sep='\t', quoting=3)
                    except:
                        df = pd.read_csv(file_path, sep='\t', quoting=3)

                # Process rows
                for i, row in df.iterrows():
                    # Flexible column finder for UKP data
                    # UKP Aspect often uses: 'sentence', 'topic', 'sentiment'
                    text = (
                        row.get('sentence') or 
                        row.get('text') or 
                        row.get('argument') or 
                        row.get('reason')
                    )
                    
                    if not text or not isinstance(text, str): continue
                    
                    combined_kb.append({
                        'id': f"ukp_{ukp_count}",
                        'text': str(text),
                        'topic': str(row.get('topic', 'General')),
                        'stance': 'NEUTRAL', # UKP Aspect is often about topic relevance, not just pro/con
                        'quality': 0.75,
                        'source': 'Manual UKP File',
                        'dataset_type': 'ukp'
                    })
                    ukp_count += 1
                    
            except Exception as e:
                print(f"   ⚠️ Could not read {file_path.name}: {e}")

        if ukp_count > 0:
            print(f"   ✅ Success: Loaded {ukp_count} arguments from manual files.")
        else:
            print("   ⚠️  No valid arguments found in manual_data folder.")

        # =========================================================
        # Final Save
        # =========================================================
        if not combined_kb:
            print("\n❌ CRITICAL: No data loaded from either source.")
            return []

        with open(self.kb_path, 'w', encoding='utf-8') as f:
            json.dump(combined_kb, f, indent=2)
            
        print(f"\n✅ FINAL SUCCESS: Saved {len(combined_kb)} total arguments to knowledge_base.json")
        return combined_kb

    def load_knowledge_base(self) -> List[Dict]:
        if not self.kb_path.exists():
            print(f"❌ File not found: {self.kb_path}")
            return []
        with open(self.kb_path, 'r', encoding='utf-8') as f:
            return json.load(f)

if __name__ == "__main__":
    loader = DebateDatasetLoader()
    kb = loader.download_datasets()
    
    # Verification Report
    print("\n" + "="*40)
    print("   VERIFICATION REPORT   ")
    print("="*40)
    print(f"Total Documents Loaded: {len(kb)}")
    
    sources = {}
    for item in kb:
        s = item.get('source', 'Unknown')
        sources[s] = sources.get(s, 0) + 1
        
    print("Breakdown by Source:")
    for source, count in sources.items():
        print(f"  - {source}: {count}")
    
    if len(kb) > 0:
        print("\nSample UKP Entry (if available):")
        ukp_sample = next((x for x in kb if x['dataset_type'] == 'ukp'), None)
        if ukp_sample:
            print(json.dumps(ukp_sample, indent=2))