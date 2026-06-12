from fastapi import APIRouter, HTTPException
from app.models.schemas import DebateRequest, JudgmentResponse
from app.services.retrieval_service import DebateRetriever
from app.services.judge_service import DebateJudge
from app.services.scoring_service import DebateScorer
import json
import time

router = APIRouter()

# Initialize services
retriever = DebateRetriever()
judge = DebateJudge()
scorer = DebateScorer()

@router.post("/judge", response_model=JudgmentResponse)
async def judge_debate(debate: DebateRequest):
    """Main debate judging endpoint."""
    
    print(f"\n🏛️  JUDGING: {debate.topic}")
    print("=" * 80)
    
    try:
        # STEP 1: Decompose all arguments
        print("\n📊 STEP 1: Decomposing arguments")
        aff_decomposed = []
        for arg in debate.affirmative:
            dec = judge.decompose_argument(arg, debate.topic)
            aff_decomposed.append({'argument': arg, 'decomposition': dec})
        
        neg_decomposed = []
        for arg in debate.negative:
            dec = judge.decompose_argument(arg, debate.topic)
            neg_decomposed.append({'argument': arg, 'decomposition': dec})
        
        # STEP 2: Retrieve evidence
        print("🔍 STEP 2: Retrieving evidence")
        aff_evidence = []
        for decomp in aff_decomposed:
            for claim in decomp['decomposition'].get('claims', []):
                evidence = retriever.retrieve(claim, top_k=3)
                aff_evidence.extend(evidence)
        
        neg_evidence = []
        for decomp in neg_decomposed:
            for claim in decomp['decomposition'].get('claims', []):
                evidence = retriever.retrieve(claim, top_k=3)
                neg_evidence.extend(evidence)
        
        # STEP 3: Fact-check
        print("✅ STEP 3: Fact-checking")
        aff_facts = []
        for arg in debate.affirmative:
            facts = judge.check_facts(arg)
            aff_facts.append(facts)
        
        neg_facts = []
        for arg in debate.negative:
            facts = judge.check_facts(arg)
            neg_facts.append(facts)
        
        # STEP 4: Score with personas
        # STEP 4: Score with personas
        print("🤖 STEP 4: Scoring with Gemini personas")
        time.sleep(2) # Prevent API rate limit crash
        aff_logic = judge.score_side(debate.affirmative, aff_evidence, 'logician')
        time.sleep(2)
        aff_facts_score = judge.score_side(debate.affirmative, aff_evidence, 'fact_checker')
        time.sleep(2)
        aff_rhetoric = judge.score_side(debate.affirmative, aff_evidence, 'orator')
        
        time.sleep(2)
        neg_logic = judge.score_side(debate.negative, neg_evidence, 'logician')
        time.sleep(2)
        neg_facts_score = judge.score_side(debate.negative, neg_evidence, 'fact_checker')
        time.sleep(2)
        neg_rhetoric = judge.score_side(debate.negative, neg_evidence, 'orator')
        
        # STEP 5: Calculate parameters
        print("📊 STEP 5: Calculating parameters")
        aff_params = scorer.calculate_parameters(
            aff_evidence, debate.affirmative,
            json.dumps([aff_logic, aff_facts_score, aff_rhetoric])
        )
        neg_params = scorer.calculate_parameters(
            neg_evidence, debate.negative,
            json.dumps([neg_logic, neg_facts_score, neg_rhetoric])
        )
        
        # STEP 6: Aggregate scores
        print("📈 STEP 6: Aggregating scores")
        aff_final = (
            0.25 * aff_logic['score'] +
            0.20 * aff_facts_score['score'] +
            0.20 * aff_rhetoric['score'] +
            0.35 * (aff_params['total_normalized'] / 10)
        ) * 10
        
        neg_final = (
            0.25 * neg_logic['score'] +
            0.20 * neg_facts_score['score'] +
            0.20 * neg_rhetoric['score'] +
            0.35 * (neg_params['total_normalized'] / 10)
        ) * 10
        
        # STEP 7: Generate judgment
        print("✍️  STEP 7: Generating judgment")
        judgment_text = judge.generate_judgment(
            debate.topic, debate.affirmative, debate.negative,
            {'aff': aff_evidence, 'neg': neg_evidence},
            aff_final, neg_final
        )
        
        # Determine winner
        winner = 'affirmative' if aff_final > neg_final else 'negative'
        margin = abs(aff_final - neg_final)
        
        # Count evidence sources
        aff_sources = {}
        for e in aff_evidence:
            src = e['source']
            aff_sources[src] = aff_sources.get(src, 0) + 1
        
        neg_sources = {}
        for e in neg_evidence:
            src = e['source']
            neg_sources[src] = neg_sources.get(src, 0) + 1
        
        print("\n" + "=" * 80)
        print(f"RESULT: {winner.upper()} wins {aff_final:.1f} vs {neg_final:.1f}")
        print("=" * 80)
        
        # Return response
        return JudgmentResponse(
            topic=debate.topic,
            judgment=judgment_text,
            affirmative_score=round(aff_final, 1),
            negative_score=round(neg_final, 1),
            winner=winner,
            margin=round(margin, 1),
            affirmative_breakdown=aff_params,
            negative_breakdown=neg_params,
            evidence_sources={
                'affirmative': aff_sources,
                'negative': neg_sources
            }
        )
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
