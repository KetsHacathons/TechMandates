from sqlalchemy.orm import Session
from database import SessionLocal, User, Profile
from schemas import UserCreate, UserLogin
from utils.auth import get_password_hash, verify_password
import uuid
from typing import Optional

class AuthService:
    def __init__(self):
        self.db: Session = SessionLocal()

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user with hashed password."""
        # Check if user already exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise Exception("User already exists")
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_data.password)
        
        user = User(
            id=user_id,
            email=user_data.email,
            hashed_password=hashed_password
        )
        
        self.db.add(user)
        
        # Create profile for the user
        profile = Profile(
            id=str(uuid.uuid4()),
            user_id=user_id
        )
        self.db.add(profile)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate_user(self, email: str, password: str) -> User:
        """Authenticate a user with email and password."""
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise Exception("Invalid credentials")
        
        if not verify_password(password, user.hashed_password):
            raise Exception("Invalid credentials")
        
        return user

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def update_user_profile(self, user_id: str, profile_data: dict) -> Profile:
        """Update user profile."""
        profile = self.db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            raise Exception("Profile not found")
        
        for key, value in profile_data.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        
        self.db.commit()
        self.db.refresh(profile)
        return profile 