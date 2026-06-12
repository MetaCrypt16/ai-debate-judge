import sys
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Setup paths to allow importing from 'app'
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
sys.path.append(str(backend_dir))
load_dotenv(backend_dir / ".env")

from app.services.judge_service import DebateJudge

def test_judge_class():
    print("="*60)
    print("⚖️  TESTING JUDGE SERVICE (ISOLATED)")
    print("="*60)
    
    # 1. Initialize
    print("\n1. Initializing DebateJudge...")
    try:
        judge = DebateJudge()
        print("   ✅ Service initialized.")
    except Exception as e:
        print(f"   ❌ Failed to init: {e}")
        return

    # 2. Test Decomposition
    topic = "Nuclear Energy"
    arg = "Nuclear energy provides clean power but creates dangerous waste."
    print(f"\n2. Testing Decomposition on: '{arg}'...")
    try:
        decomp = judge.decompose_argument(arg, topic)
        claims = decomp.get('claims', [])
        if claims:
            print("   ✅ Claims extracted:")
            for claim in claims:
                print(f"      - {claim}")
        else:
            print("   ⚠️ No claims extracted (Check API response)")
    except Exception as e:
        print(f"   ❌ Decomposition Failed: {e}")

    # 3. Test Scoring
    print("\n3. Testing Scoring (Persona: Logician)...")
    try:
        # Mock evidence (Simulating what RAG would provide)
        mock_evidence = [{'text': 'Nuclear waste remains radioactive for thousands of years.', 'source': 'Science Journal', 'quality': 0.9}]
        
        result = judge.score_side([arg], mock_evidence, persona='logician')
        print(f"   ✅ Score Received: {result.get('score')}")
        print(f"   ✅ Reasoning: {result.get('reasoning')}")
    except Exception as e:
        print(f"   ❌ Scoring Failed: {e}")

    # 4. Test Judgment Generation
    print("\n4. Testing Final Judgment Generation...")
    try:
        verdict = judge.generate_judgment(
            topic="Nuclear Energy",
            affirmative_args=["It is zero carbon."],
            negative_args=["It is dangerous."],
            evidence={},
            aff_score=8.5,
            neg_score=7.0
        )
        if verdict and len(verdict) > 50:
            print("   ✅ Verdict Generated.")
            print(f"   Preview: {verdict[:150]}...")
        else:
            print("   ❌ Verdict generation returned empty or short string.")
    except Exception as e:
        print(f"   ❌ Judgment Failed: {e}")

if __name__ == "__main__":
    test_judge_class()