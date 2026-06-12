import json
import os
import pandas as pd
import tarfile
import zipfile
from typing import List, Dict
from datasets import load_dataset
from pathlib import Path
from dotenv import load_dotenv

# 1. Load Environment Variables (for HF Token)
current_file = Path(__file__).resolve()
# Go up 3 levels: backend/app/services -> backend
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
        # 2. UKP DATASET (Manual Local File + Auto Extraction)
        # =========================================================
        print(f"\n[2/2] Looking for UKP files in: {self.manual_dir}")
        print("      (Searching recursively including 'CSV-format' folder...)")
        
        # Step 2a: Auto-Extract archives if present
        self._extract_archives()

        # Step 2b: Load extracted files
        ukp_count = 0
        # Recursive search using rglob to find files inside 'CSV-format' or other subfolders
        files = list(self.manual_dir.rglob("*"))
        
        for file_path in files:
            # Skip hidden/system files and the archive files themselves
            if file_path.name.startswith('.') or file_path.suffix in ['.bz2', '.zip', '.gz', '.tar']: 
                continue
            
            # We only want text-based data files
            if file_path.suffix not in ['.csv', '.tsv', '.txt', '.parquet', '.xml']:
                # Some UKP files might end in .xml.csv, checking if string matches
                if not file_path.name.endswith('.csv'):
                    continue

            try:
                # Intelligent Loader
                if file_path.suffix == '.parquet':
                    df = pd.read_parquet(file_path)
                else:
                    # Specific Fix for UKP .xml.csv files which are TAB separated and headerless
                    if 'xml.csv' in file_path.name or file_path.suffix == '.tsv':
                        try:
                            # header=None is crucial for these files
                            df = pd.read_csv(file_path, sep='\t', header=None, engine='python', on_bad_lines='skip')
                        except:
                            df = pd.read_csv(file_path, sep=None, engine='python')
                    else:
                        # Standard CSV
                        try:
                            df = pd.read_csv(file_path, sep=None, engine='python')
                        except:
                            continue

                # Parse Filename for Topic/Stance (UKPConvArg Structure)
                fname = file_path.name.lower()
                derived_topic = "General"
                derived_stance = "NEUTRAL"
                
                # Logic to extract metadata from filename
                if "_" in fname:
                    parts = fname.split('_')
                    derived_topic = parts[0].replace('-', ' ').title()
                    if len(parts) > 1:
                        if "yes" in parts[1] or "pro" in parts[1]: 
                            derived_stance = "PRO"
                        elif "no" in parts[1] or "con" in parts[1]: 
                            derived_stance = "CON"

                # Process rows
                for i, row in df.iterrows():
                    text = None
                    
                    # 1. Try named columns (if header exists)
                    if 'argument' in df.columns or 'text' in df.columns:
                        for col in ['argument', 'Argument', 'text', 'Text', 'sentence', 'reason', 'content', 'Body']:
                            if col in df.columns and isinstance(row[col], str):
                                text = row[col]
                                break
                    
                    # 2. Fallback for Headerless UKP files (Index-based)
                    # UKP format often: ID_PAIR <tab> LABEL <tab> ARGUMENT
                    if not text:
                        # Try the last column, which is usually the text in these formats
                        if len(row) >= 3:
                            val = row.iloc[-1] # Last column
                            if isinstance(val, str) and len(val) > 10:
                                text = val
                            elif len(row) >= 4: # sometimes argument is 2nd to last
                                val = row.iloc[-2]
                                if isinstance(val, str) and len(val) > 10:
                                    text = val
                        
                        # Fallback to finding the longest string in the row
                        if not text:
                            strings = [str(x) for x in row.values if isinstance(x, str)]
                            if strings:
                                longest = max(strings, key=len)
                                if len(longest) > 20: # Arbitrary filter for real arguments
                                    text = longest

                    # 3. Final Cleaning: Remove IDs if they got stuck in the text
                    # (e.g., "arg123_arg456\tlabel\tActual Text")
                    if text and isinstance(text, str):
                        if '\t' in text:
                            parts = text.split('\t')
                            # Take the longest part, as IDs are short and arguments are long
                            text = max(parts, key=len)
                        
                        # Verify it's not just an ID like "arg123_arg456"
                        if text.startswith('arg') and len(text) < 40 and '_' in text:
                            continue # Skip rows that are just IDs

                    if not text or len(text) < 5: continue
                    
                    combined_kb.append({
                        'id': f"ukp_{ukp_count}",
                        'text': str(text).strip(),
                        'topic': derived_topic,
                        'stance': derived_stance, 
                        'quality': 0.8,
                        'source': 'Manual UKP File',
                        'dataset_type': 'ukp'
                    })
                    ukp_count += 1
                    
            except Exception as e:
                pass 

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

    def _extract_archives(self):
        """Automatically extracts .tar.bz2 or .zip files."""
        for file_path in self.manual_dir.glob("*"):
            try:
                if file_path.name.endswith(".tar.bz2") or file_path.name.endswith(".tar.gz") or file_path.name.endswith(".tar"):
                    print(f"   📦 Extracting {file_path.name}...")
                    if file_path.is_dir(): continue 
                    mode = "r:bz2" if file_path.name.endswith("bz2") else "r:gz" if file_path.name.endswith("gz") else "r"
                    with tarfile.open(file_path, mode) as tar:
                        tar.extractall(path=self.manual_dir)
                    print("      ✅ Extracted tarball.")
                
                elif file_path.name.endswith(".zip"):
                    print(f"   📦 Extracting {file_path.name}...")
                    with zipfile.ZipFile(file_path, 'r') as zip_ref:
                        zip_ref.extractall(self.manual_dir)
                    print("      ✅ Extracted zip.")
            except Exception as e:
                print(f"      ❌ Extraction error for {file_path.name}: {e}")

    def load_knowledge_base(self) -> List[Dict]:
        if not self.kb_path.exists():
            print(f"❌ File not found: {self.kb_path}")
            return []
        with open(self.kb_path, 'r', encoding='utf-8') as f:
            return json.load(f)

if __name__ == "__main__":
    loader = DebateDatasetLoader()
    kb = loader.download_datasets()
    
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