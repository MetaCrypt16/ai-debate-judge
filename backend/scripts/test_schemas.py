import sys
import os
from pathlib import Path

# Add parent directory to path so we can import from 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.schemas import DebateRequest, JudgmentResponse, ParameterBreakdown

def test_schemas():
    print("="*60)
    print("🧪 TESTING DATA SCHEMAS")
    print("="*60)

    # 1. Test DebateRequest (What the frontend sends)
    print("\n1. Testing Input Schema (DebateRequest)...")
    try:
        # Mock data representing a user submission
        req_data = {
            "topic": "AI should be regulated",
            "affirmative": ["It is dangerous", "It causes job loss"],
            "negative": ["It helps medicine", "It increases productivity"]
        }
        # Attempt to validate
        req = DebateRequest(**req_data)
        
        print("   ✅ Input Schema is VALID.")
        print(f"      Topic: {req.topic}")
        print(f"      Affirmative Args: {len(req.affirmative)}")
        print(f"      Negative Args: {len(req.negative)}")
    except Exception as e:
        print(f"   ❌ Input Schema Failed: {e}")

    # 2. Test JudgmentResponse (What the backend replies)
    print("\n2. Testing Output Schema (JudgmentResponse)...")
    try:
        # Create a dummy breakdown object first
        dummy_breakdown = ParameterBreakdown(
            p1_quality=4.0, p2_relevance=2.5, p3_consistency=3.0,
            p4_stance=2.0, p5_diversity=1.5, p6_reasoning=0.8,
            total_raw=13.8, total_normalized=9.5
        )
        
        # Mock response data
        resp_data = {
            "topic": "AI should be regulated",
            "judgment": "The affirmative side wins based on stronger evidence.",
            "affirmative_score": 9.5,
            "negative_score": 6.0,
            "winner": "affirmative",
            "margin": 3.5,
            "affirmative_breakdown": dummy_breakdown,
            "negative_breakdown": dummy_breakdown,
            "evidence_sources": {
                "affirmative": {"IBM": 2, "UKP": 1},
                "negative": {"IBM": 1}
            }
        }
        # Attempt to validate
        resp = JudgmentResponse(**resp_data)
        
        print("   ✅ Output Schema is VALID.")
        print(f"      Winner: {resp.winner}")
        print(f"      Total Normalized Score: {resp.affirmative_breakdown.total_normalized}")
    except Exception as e:
        print(f"   ❌ Output Schema Failed: {e}")

if __name__ == "__main__":
    test_schemas()