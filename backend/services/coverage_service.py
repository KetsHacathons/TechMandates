from sqlalchemy.orm import Session
from database import SessionLocal, ScanResult
from schemas import CoverageData
import uuid
import asyncio
from typing import List, Dict, Any
from datetime import datetime
import random

class CoverageService:
    def __init__(self):
        self.db: Session = SessionLocal()

    async def scan_repository(
        self, 
        repository_id: str, 
        repository_name: str, 
        full_name: str, 
        language: str = None
    ) -> CoverageData:
        """Scan repository for test coverage."""
        # Simulate scanning delay
        await asyncio.sleep(1 + random.random() * 2)
        
        # Mock coverage data based on language
        coverage_data = self._get_mock_coverage_data(language)
        
        # Save scan results to database
        self._save_scan_results(repository_id, coverage_data)
        
        return coverage_data

    async def fetch_coverage_data(self, repository_ids: List[str]) -> List[CoverageData]:
        """Fetch coverage data for multiple repositories."""
        coverage_data_list = []
        
        for repo_id in repository_ids:
            # Mock coverage data for each repository
            coverage_data = CoverageData(
                repository_id=repo_id,
                coverage_percentage=random.uniform(60.0, 95.0),
                test_count=random.randint(50, 500),
                last_updated=datetime.now(),
                language=random.choice(["Java", "TypeScript", "JavaScript", "Python"])
            )
            coverage_data_list.append(coverage_data)
        
        return coverage_data_list

    async def improve_coverage(self, repositories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate coverage improvement suggestions."""
        improvements = []
        
        for repo in repositories:
            # Mock improvement suggestions
            improvement = {
                "repositoryId": repo.get("id"),
                "suggestedTests": random.randint(5, 20),
                "estimatedCoverageIncrease": random.randint(5, 25),
                "priority": random.choice(["high", "medium", "low"]),
                "suggestions": [
                    "Add unit tests for untested functions",
                    "Increase integration test coverage",
                    "Add edge case testing"
                ]
            }
            improvements.append(improvement)
        
        return {
            "success": True,
            "improvements": improvements
        }

    def _get_mock_coverage_data(self, language: str) -> CoverageData:
        """Get mock coverage data based on language."""
        # Language-specific coverage patterns
        coverage_patterns = {
            "Java": {"min": 70.0, "max": 90.0, "test_count": (100, 300)},
            "TypeScript": {"min": 65.0, "max": 85.0, "test_count": (80, 250)},
            "JavaScript": {"min": 60.0, "max": 80.0, "test_count": (60, 200)},
            "Python": {"min": 75.0, "max": 95.0, "test_count": (90, 350)}
        }
        
        pattern = coverage_patterns.get(language, {"min": 65.0, "max": 85.0, "test_count": (70, 250)})
        
        return CoverageData(
            repository_id="mock-repo-id",
            coverage_percentage=random.uniform(pattern["min"], pattern["max"]),
            test_count=random.randint(*pattern["test_count"]),
            last_updated=datetime.now(),
            language=language
        )

    def _save_scan_results(self, repository_id: str, coverage_data: CoverageData):
        """Save scan results to database."""
        scan_result = ScanResult(
            id=str(uuid.uuid4()),
            repository_id=repository_id,
            scan_type="coverage",
            title="Test Coverage Analysis",
            description=f"Coverage: {coverage_data.coverage_percentage:.1f}%, Tests: {coverage_data.test_count}",
            coverage_percentage=coverage_data.coverage_percentage,
            status="completed"
        )
        self.db.add(scan_result)
        self.db.commit() 