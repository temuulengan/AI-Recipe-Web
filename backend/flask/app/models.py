from . import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

class SearchHistory(db.Model):
    __tablename__ = 'search_history'
    
    id = db.Column('search_id', db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)
    user_query = db.Column(db.Text, nullable=False)
    structured_query = db.Column(JSONB, nullable=True)  # JSONB로 명시적 지정
    search_results = db.Column(JSONB, nullable=True)    # JSONB로 명시적 지정
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """JSON 직렬화를 위한 딕셔너리 변환"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_query': self.user_query,
            'structured_query': self.structured_query,
            'search_results': self.search_results,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class User(db.Model):
    __tablename__ = 'user'
    
    # NestJS의 User 엔티티와 매핑 (필요한 컬럼만 정의)
    id = db.Column(db.String, primary_key=True)  # UUID
    llm_count = db.Column(db.Integer, default=0)
