import os
import json
import google.generativeai as genai
from typing import List, Dict
import re
from dotenv import load_dotenv
from pathlib import Path

# Load env vars if not already loaded
current_file = Path(__file__).resolve()
backend_dir = current_file.parent.parent.parent
load_dotenv(backend_dir / ".env")

class DebateJudge:
    def __init__(self):
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            print("⚠️  WARNING: GOOGLE_API_KEY not found in environment.")
        
        genai.configure(api_key=api_key)
        # Using LLM_MODEL from env (defaults to 3.1-flash-lite for higher free tier limits)
        model_name = os.getenv('LLM_MODEL', 'gemini-3.1-flash-lite')
        self.model = genai.GenerativeModel(model_name)
        
    def _clean_json_response(self, text: str) -> str:
        """Helper to remove markdown formatting from LLM JSON responses."""
        # Remove ```json and ``` lines
        text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
        return text.strip()

    def decompose_argument(self, argument: str, topic: str) -> Dict:
        """Break argument into atomic claims."""
        prompt = f"""Analyze this debate argument and decompose it into atomic claims.

TOPIC: {topic}
ARGUMENT: {argument}

Return ONLY valid JSON (no markdown) with this structure:
{{
    "claims": ["claim1", "claim2"],
    "keywords": ["keyword1", "keyword2"],
    "topics": ["topic1"]
}}
"""
        try:
            response = self.model.generate_content(prompt)
            clean_text = self._clean_json_response(response.text)
            return json.loads(clean_text)
        except Exception as e:
            print(f"   ⚠️ Decompose Error: {e}")
            return {
                'claims': [argument],
                'keywords': argument.split()[:5],
                'topics': [topic]
            }

    def check_facts(self, claim: str) -> Dict:
        """Identify and verify factual claims."""
        prompt = f"""Analyze this claim for factual assertions:
CLAIM: {claim}

Identify specific facts and assess if they are correct based on general knowledge.
Return ONLY valid JSON:
{{
    "has_facts": true/false,
    "facts": [
        {{
            "fact": "the specific fact",
            "status": "verified|unverified|false",
            "confidence": 0.0-1.0
        }}
    ]
}}
"""
        try:
            response = self.model.generate_content(prompt)
            clean_text = self._clean_json_response(response.text)
            return json.loads(clean_text)
        except:
            return {'has_facts': False, 'facts': []}

    def score_side(self, arguments: List[str], evidence: List[Dict], persona: str = 'balanced') -> Dict:
        """Score arguments with specific persona."""
        
        personas = {
            'logician': "Evaluate ONLY on logical coherence, fallacy detection, and reasoning validity.",
            'fact_checker': "Evaluate ONLY on factual accuracy and evidence support.",
            'orator': "Evaluate ONLY on persuasiveness, rhetoric, and delivery effectiveness.",
            'balanced': "Evaluate based on a holistic mix of logic, accuracy, and persuasiveness."
        }
        
        # Prepare evidence snippet for context
        evidence_text = json.dumps(
            [{'text': e.get('text', '')[:200], 'source': e.get('source', 'Unknown')} for e in evidence[:3]], 
            indent=2
        )
        
        # Use simple lookup since we added the key, or default string if completely unknown
        role_description = personas.get(persona, personas['balanced'])

        prompt = f"""You are a professional debate judge.
ROLE: {role_description}

ARGUMENTS:
{json.dumps(arguments, indent=2)}

SUPPORTING EVIDENCE FOUND:
{evidence_text}

Provide evaluation score (0.0-1.0) and reasoning.
Return ONLY valid JSON:
{{
    "score": 0.5,
    "reasoning": "brief explanation"
}}
"""
        try:
            response = self.model.generate_content(prompt)
            clean_text = self._clean_json_response(response.text)
            return json.loads(clean_text)
        except Exception as e:
            print(f"   ⚠️ Scoring Error ({persona}): {e}")
            return {'score': 0.5, 'reasoning': 'Unable to evaluate due to API error'}

    def generate_judgment(self, topic: str, affirmative_args: List[str], 
                          negative_args: List[str], evidence: Dict,
                          aff_score: float, neg_score: float) -> str:
        """Generate detailed judgment text."""
        
        prompt = f"""You are an expert debate judge. Write a final verdict.

TOPIC: {topic}
SCORES: Affirmative {aff_score:.1f}/10, Negative {neg_score:.1f}/10

AFFIRMATIVE ARGUMENTS: {json.dumps(affirmative_args)}
NEGATIVE ARGUMENTS: {json.dumps(negative_args)}

Structure:
1. Executive Summary
2. Affirmative Analysis
3. Negative Analysis
4. Winner & Why
"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"❌ Judgment Generation Error: {e}")
            import traceback
            traceback.print_exc()
            return "Unable to generate judgment."