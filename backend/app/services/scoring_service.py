import numpy as np
from typing import List, Dict

class DebateScorer:
    @staticmethod
    def calculate_parameters(evidence: List[Dict], arguments: List[str], 
                            judgment_text: str) -> Dict:
        """Calculate 6 parameters for scoring."""
        
        # P1: Evidence Quality (0-4)
        qualities = [e.get('quality', 0.5) for e in evidence]
        avg_quality = np.mean(qualities) if qualities else 0
        p1 = (avg_quality) * 4
        
        # P2: Evidence Relevance (0-2.55)
        relevances = [e.get('relevance_score', 0.5) for e in evidence]
        avg_relevance = np.mean(relevances) if relevances else 0
        p2 = avg_relevance * 2.55
        
        # P3: Argument Consistency (0-3)
        total_evidence = len(evidence)
        total_arguments = len(arguments)
        consistency = (total_evidence / total_arguments / 2) * 3 if arguments else 0
        p3 = min(consistency, 3.0)
        
        # P4: Stance Coverage (0-2)
        stances = [e.get('stance', 'PRO').upper() for e in evidence]
        has_pro = any(s == 'PRO' for s in stances)
        has_con = any(s == 'CON' for s in stances)
        p4 = 2.0 if (has_pro and has_con) else 1.0
        
        # P5: Argument Diversity (0-2)
        topics = set(e.get('topic', '') for e in evidence if e.get('topic'))
        diversity = (len(topics) / 3) * 2 if topics else 0
        p5 = min(diversity, 2.0)
        
        # P6: Reasoning Quality (0-1)
        positive_keywords = ['strong', 'compelling', 'well-supported', 'proven', 
                           'excellent', 'robust', 'solid', 'convincing']
        keyword_count = sum(1 for word in positive_keywords 
                          if word in judgment_text.lower())
        p6 = min(keyword_count / 5, 1.0)
        
        # Total and normalize
        total = p1 + p2 + p3 + p4 + p5 + p6
        normalized = (total / 14.55) * 10 if total > 0 else 0
        normalized = min(normalized, 10.0)
        
        return {
            'p1_quality': round(p1, 2),
            'p2_relevance': round(p2, 2),
            'p3_consistency': round(p3, 2),
            'p4_stance': round(p4, 2),
            'p5_diversity': round(p5, 2),
            'p6_reasoning': round(p6, 2),
            'total_raw': round(total, 2),
            'total_normalized': round(normalized, 1)
        }
