from sqlalchemy.orm import Session
from database import SessionLocal, Repository, ScanResult, User
from schemas import RepositoryCreate, DashboardMetrics
import uuid
from typing import List, Optional
from datetime import datetime

class RepositoryService:
    def __init__(self):
        self.db: Session = SessionLocal()

    def create_repository(self, user_id: str, repo_data: RepositoryCreate) -> Repository:
        """Create a new repository for a user."""
        # Check if repository already exists for this user
        existing_repo = self.db.query(Repository).filter(
            Repository.external_id == repo_data.external_id,
            Repository.user_id == user_id
        ).first()
        
        if existing_repo:
            raise Exception("Repository already exists for this user")
        
        repository = Repository(
            id=str(uuid.uuid4()),
            user_id=user_id,
            external_id=repo_data.external_id,
            name=repo_data.name,
            full_name=repo_data.full_name,
            description=repo_data.description,
            clone_url=repo_data.clone_url,
            is_private=repo_data.is_private,
            language=repo_data.language,
            default_branch=repo_data.default_branch,
            provider=repo_data.provider
        )
        
        self.db.add(repository)
        self.db.commit()
        self.db.refresh(repository)
        return repository

    def get_user_repositories(self, user_id: str) -> List[Repository]:
        """Get all repositories for a user."""
        return self.db.query(Repository).filter(Repository.user_id == user_id).all()

    def get_repository(self, repo_id: str, user_id: str) -> Optional[Repository]:
        """Get a specific repository by ID and user."""
        return self.db.query(Repository).filter(
            Repository.id == repo_id,
            Repository.user_id == user_id
        ).first()

    def delete_repository(self, repo_id: str, user_id: str) -> bool:
        """Delete a repository."""
        repository = self.get_repository(repo_id, user_id)
        if not repository:
            return False
        
        self.db.delete(repository)
        self.db.commit()
        return True

    def update_repository_scan_status(self, repo_id: str, status: str) -> bool:
        """Update repository scan status."""
        repository = self.db.query(Repository).filter(Repository.id == repo_id).first()
        if not repository:
            return False
        
        repository.scan_status = status
        repository.last_scan_at = datetime.utcnow()
        self.db.commit()
        return True

    def update_repository_coverage(self, repo_id: str, coverage: float, test_count: int) -> bool:
        """Update repository coverage data."""
        repository = self.db.query(Repository).filter(Repository.id == repo_id).first()
        if not repository:
            return False
        
        repository.coverage_percentage = coverage
        repository.test_count = test_count
        repository.last_coverage_update = datetime.utcnow()
        self.db.commit()
        return True

    def get_dashboard_metrics(self, user_id: str) -> DashboardMetrics:
        """Get dashboard metrics for a user."""
        # Get total repositories
        total_repositories = self.db.query(Repository).filter(
            Repository.user_id == user_id
        ).count()

        # Get scan results for this user's repositories
        scan_results = self.db.query(ScanResult).join(Repository).filter(
            Repository.user_id == user_id
        ).all()

        # Calculate pending updates (version scan results with open status)
        pending_updates = len([
            result for result in scan_results 
            if result.scan_type == 'version' and result.status == 'open'
        ])

        # Calculate vulnerabilities (security scan results with high/critical severity)
        vulnerabilities = len([
            result for result in scan_results 
            if result.scan_type == 'security' 
            and result.status == 'open'
            and result.severity in ['high', 'critical']
        ])

        # Calculate average test coverage
        coverage_results = [
            result for result in scan_results 
            if result.scan_type == 'coverage' and result.coverage_percentage is not None
        ]
        
        avg_coverage = 0
        if coverage_results:
            total_coverage = sum(result.coverage_percentage for result in coverage_results)
            avg_coverage = total_coverage / len(coverage_results)

        return DashboardMetrics(
            total_repositories=total_repositories,
            pending_updates=pending_updates,
            vulnerabilities=vulnerabilities,
            test_coverage=f"{avg_coverage:.0f}%"
        )

    def get_repository_by_external_id(self, external_id: str, user_id: str) -> Optional[Repository]:
        """Get repository by external ID."""
        return self.db.query(Repository).filter(
            Repository.external_id == external_id,
            Repository.user_id == user_id
        ).first() 