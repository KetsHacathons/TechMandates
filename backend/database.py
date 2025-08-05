from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os
from datetime import datetime

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/tech-mandates.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    username = Column(String)
    full_name = Column(String)
    avatar_url = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="profile")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    external_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    description = Column(Text)
    clone_url = Column(String, nullable=False)
    is_private = Column(Boolean, default=False)
    language = Column(String)
    default_branch = Column(String, default="main")
    provider = Column(String, nullable=False)
    coverage_percentage = Column(Float)
    test_count = Column(Integer)
    scan_status = Column(String, default="pending")
    last_scan_at = Column(DateTime)
    last_coverage_update = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="repositories")
    scan_results = relationship("ScanResult", back_populates="repository")

class ScanResult(Base):
    __tablename__ = "scan_results"
    
    id = Column(String, primary_key=True, index=True)
    repository_id = Column(String, ForeignKey("repositories.id"), nullable=False)
    scan_type = Column(String, nullable=False)  # 'security', 'version', 'coverage'
    title = Column(String, nullable=False)
    description = Column(Text)
    severity = Column(String)  # 'critical', 'high', 'medium', 'low'
    status = Column(String, default="open")  # 'open', 'in-progress', 'resolved'
    file_path = Column(String)
    line_number = Column(Integer)
    package_name = Column(String)
    current_version = Column(String)
    recommended_version = Column(String)
    coverage_percentage = Column(Float)
    rule_id = Column(String)
    metadata_json = Column(Text)  # JSON string for additional data
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    repository = relationship("Repository", back_populates="scan_results")

class ProviderAccount(Base):
    __tablename__ = "provider_accounts"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider = Column(String, nullable=False)  # 'github', 'bitbucket'
    provider_account_id = Column(String, nullable=False)
    access_token = Column(String)
    refresh_token = Column(String)
    scope = Column(String)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="provider_accounts")

# Add relationships to User model
User.profile = relationship("Profile", back_populates="user", uselist=False)
User.repositories = relationship("Repository", back_populates="user")
User.provider_accounts = relationship("ProviderAccount", back_populates="user") 