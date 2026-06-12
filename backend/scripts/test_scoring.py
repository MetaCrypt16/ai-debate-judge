import sys
import os
import json
from pathlib import Path

# Add parent directory to path so we can import from 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.scoring_service import DebateScorer

def test_scoring_math():
    print("="*60)
    print("🧮 TESTING SCORING SERVICE")
    print("="*60)

    # 1. MOCK DATA
    # Simulating what the Retriever and Judge would provide
    
    mock_arguments = [
        "AI will destroy jobs.",
        "AI is dangerous."
    ]
    
    mock_evidence = [
        {
            "id": "1",
            "quality": 0.9,          # High quality
            "relevance_score": 0.85, # High relevance
            "stance": "PRO",
            "topic": "Economics"
        },
        {
            "id": "2",
            "quality": 0.8,
            "relevance_score": 0.75,
            "stance": "CON",         # Different stance (triggers P4 bonus)
            "topic": "Safety"        # Different topic (triggers P5 diversity)
        },
        {
            "id": "3",
            "quality": 0.7,
            "relevance_score": 0.8,
            "stance": "PRO",
            "topic": "Ethics"        # 3rd topic (triggers max P5)
        }
    ]
    
    mock_judgment_text = "The argument was compelling and robust. It provided solid evidence."

    print("\n1. Input Data:")
    print(f"   Arguments: {len(mock_arguments)}")
    print(f"   Evidence Items: {len(mock_evidence)}")
    print(f"   Judgment Keywords: 'compelling', 'robust', 'solid'")

    # 2. RUN SCORER
    try:
        result = DebateScorer.calculate_parameters(mock_evidence, mock_arguments, mock_judgment_text)
        
        print("\n2. Results:")
        print(json.dumps(result, indent=2))
        
        # 3. VERIFY EXPECTATIONS
        print("\n3. Verification:")
        
        # P1: Avg Quality (0.9+0.8+0.7)/3 = 0.8.  0.8 * 4 = 3.2
        print(f"   P1 (Quality): Expected ~3.2 -> Got {result['p1_quality']}")
        
        # P4: Stance (Has PRO and CON) -> Should be 2.0
        print(f"   P4 (Stance):  Expected 2.0  -> Got {result['p4_stance']}")
        
        # P5: Diversity (3 topics) -> (3/3)*2 = 2.0
        print(f"   P5 (Diversity): Expected 2.0  -> Got {result['p5_diversity']}")

        # Final Score
        print(f"   FINAL SCORE: {result['total_normalized']} / 10.0")
        
        if result['total_normalized'] > 0 and result['total_normalized'] <= 10:
            print("\n✅ Calculation Successful!")
        else:
            print("\n❌ Calculation Out of Bounds!")
            
    except Exception as e:
        print(f"\n❌ Error during scoring: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_scoring_math()