from pydantic import BaseModel
from typing import List, Dict, Optional

class DebateRequest(BaseModel):
    topic: str
    affirmative: List[str]
    negative: List[str]

class RetrievedArgument(BaseModel):
    id: str
    text: str
    source: str
    topic: str
    stance: str
    quality: float
    relevance_score: float
    dataset_type: str

class ParameterBreakdown(BaseModel):
    p1_quality: float
    p2_relevance: float
    p3_consistency: float
    p4_stance: float
    p5_diversity: float
    p6_reasoning: float
    total_raw: float
    total_normalized: float

class SideScore(BaseModel):
    total: float
    breakdown: ParameterBreakdown
    evidence_sources: Dict[str, int]

class JudgmentResponse(BaseModel):
    topic: str
    judgment: str
    affirmative_score: float
    negative_score: float
    winner: str
    margin: float
    affirmative_breakdown: ParameterBreakdown
    negative_breakdown: ParameterBreakdown
    evidence_sources: Dict[str, Dict[str, int]]

class SingleSideRequest(BaseModel):
    topic: str
    arguments: str

class SingleSideResponse(BaseModel):
    score: float
    justification: str
    improvements: str
