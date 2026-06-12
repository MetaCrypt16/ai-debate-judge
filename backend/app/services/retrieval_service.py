import os
import google.generativeai as genai
from langchain_pinecone.vectorstores import Pinecone as PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pinecone import Pinecone
from typing import List, Dict

class DebateRetriever:
    def __init__(self):
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=os.getenv('EMBEDDING_MODEL'),
            task_type="retrieval_query"
        )
        
        # Initialize Pinecone
        self.pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        self.index = self.pc.Index(os.getenv('PINECONE_INDEX_NAME'))
        
        # Get vector store
        self.vector_store = PineconeVectorStore(
            index=self.index,
            embedding=self.embeddings,
            text_key="text"
        )
        
        # Create retriever
        self.retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
    
    def retrieve(self, query: str, top_k: int = 5, filters: Dict = None) -> List[Dict]:
        """
        Retrieve top-k relevant arguments from Pinecone.
        
        Args:
            query: User's argument/claim
            top_k: Number of results to return
            filters: Optional metadata filters
        
        Returns:
            List of retrieved arguments with metadata
        """
        
        try:
            # Embed query with matching dimension for Pinecone
            query_embedding = genai.embed_content(
                model=os.getenv('EMBEDDING_MODEL'),
                content=query,
                task_type="retrieval_query",
                output_dimensionality=768
            )['embedding']
            
            # Query Pinecone with filters
            filter_dict = None
            if filters:
                filter_dict = {}
                if 'topic' in filters:
                    filter_dict['topic'] = {'$eq': filters['topic']}
                if 'min_quality' in filters:
                    filter_dict['quality'] = {'$gte': filters['min_quality']}
            
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            
            # Format results
            retrieved = []
            for match in results['matches']:
                retrieved.append({
                    'id': match['id'],
                    'text': match['metadata'].get('text', ''),
                    'source': match['metadata'].get('source', ''),
                    'topic': match['metadata'].get('topic', ''),
                    'stance': match['metadata'].get('stance', ''),
                    'quality': float(match['metadata'].get('quality', 0)),
                    'relevance_score': float(match['score']),
                    'dataset_type': match['metadata'].get('dataset_type', '')
                })
            
            return retrieved
        
        except Exception as e:
            print(f"❌ Retrieval error: {e}")
            return []
