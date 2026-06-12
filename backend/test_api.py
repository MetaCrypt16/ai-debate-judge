import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    print(f"✓ Health: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_judge():
    """Test judge endpoint."""
    debate = {
        "topic": "AI should be regulated",
        "affirmative": [
            "AI poses existential risks if uncontrolled",
            "Regulation is proven effective (GDPR)"
        ],
        "negative": [
            "Innovation will be stifled",
            "Market forces self-regulate"
        ]
    }
    
    print(f"\n📤 Sending debate: {debate['topic']}")
    response = requests.post(f"{BASE_URL}/api/judge", json=debate)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ Judgment received!")
        print(f"  Affirmative: {result['affirmative_score']}/10")
        print(f"  Negative: {result['negative_score']}/10")
        print(f"  Winner: {result['winner']}")
        print(f"  Margin: {result['margin']}")
        print(f"\nJudgment:\n{result['judgment']}")
    else:
        print(f"✗ Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print("=" * 80)
    print("TESTING AI DEBATE JUDGE API")
    print("=" * 80)
    
    test_health()
    test_judge()
