from sqlalchemy.orm import Session
from database import SessionLocal, ScanResult
from schemas import Upgrade, Status
import uuid
import asyncio
from typing import List, Dict, Any
from datetime import datetime
import random

class VersionService:
    def __init__(self):
        self.db: Session = SessionLocal()

    async def scan_repository(
        self, 
        repository_id: str, 
        repository_name: str, 
        full_name: str, 
        language: str = None
    ) -> List[Upgrade]:
        """Scan repository for version upgrades."""
        # Simulate scanning delay
        await asyncio.sleep(1 + random.random() * 2)
        
        # Mock version data based on language
        mock_upgrades = self._get_mock_upgrades(language)
        
        # Randomly select upgrades to simulate real findings
        found_upgrades = []
        if mock_upgrades:
            num_upgrades = random.randint(0, len(mock_upgrades))
            selected_upgrades = random.sample(mock_upgrades, num_upgrades)
            
            for upgrade_data in selected_upgrades:
                upgrade = Upgrade(
                    repository=repository_name,
                    repository_id=repository_id,
                    platform="GitHub",
                    technology=upgrade_data["technology"],
                    current_version=upgrade_data["current_version"],
                    target_version=upgrade_data["target_version"],
                    status=Status.PENDING,
                    priority=upgrade_data["priority"]
                )
                found_upgrades.append(upgrade)
        
        # Save scan results to database
        self._save_scan_results(repository_id, found_upgrades)
        
        return found_upgrades

    async def detect_current_version(self, repository_id: str, technology: str) -> Dict[str, Any]:
        """Detect current version of a technology in a repository."""
        # Mock version detection
        mock_versions = {
            "react": "18.2.0",
            "typescript": "5.0.0",
            "node": "18.0.0",
            "vite": "4.0.0",
            "tailwindcss": "3.3.0",
            "java": "17.0.0",
            "spring-boot": "2.7.0",
            "python": "3.9.0",
            "django": "4.1.0"
        }
        
        return {
            "currentVersion": mock_versions.get(technology.lower(), "1.0.0"),
            "repositoryId": repository_id,
            "technology": technology
        }

    async def create_upgrade_pr(
        self, 
        repository_id: str, 
        technology: str, 
        target_version: str
    ) -> Dict[str, Any]:
        """Create a pull request for version upgrade."""
        # Simulate PR creation delay
        await asyncio.sleep(1 + random.random() * 2)
        
        # Mock PR creation
        pr_number = random.randint(1000, 9999)
        pr_url = f"https://github.com/mock/repo/pull/{pr_number}"
        
        return {
            "success": True,
            "pullRequestNumber": pr_number,
            "pullRequestUrl": pr_url,
            "message": f"Upgrade {technology} to {target_version}"
        }

    def _get_mock_upgrades(self, language: str) -> List[Dict[str, Any]]:
        """Get mock upgrades based on language."""
        upgrades_db = {
            "Java": [
                {
                    "technology": "Spring Boot",
                    "current_version": "2.7.0",
                    "target_version": "3.1.0",
                    "priority": "high"
                },
                {
                    "technology": "Java",
                    "current_version": "17.0.0",
                    "target_version": "21.0.0",
                    "priority": "medium"
                }
            ],
            "TypeScript": [
                {
                    "technology": "Angular",
                    "current_version": "16.0.0",
                    "target_version": "17.0.0",
                    "priority": "high"
                },
                {
                    "technology": "TypeScript",
                    "current_version": "5.0.0",
                    "target_version": "5.2.0",
                    "priority": "low"
                }
            ],
            "JavaScript": [
                {
                    "technology": "Node.js",
                    "current_version": "18.0.0",
                    "target_version": "20.0.0",
                    "priority": "high"
                },
                {
                    "technology": "React",
                    "current_version": "18.2.0",
                    "target_version": "18.3.0",
                    "priority": "medium"
                }
            ],
            "Python": [
                {
                    "technology": "Django",
                    "current_version": "4.1.0",
                    "target_version": "4.2.0",
                    "priority": "high"
                },
                {
                    "technology": "Python",
                    "current_version": "3.9.0",
                    "target_version": "3.11.0",
                    "priority": "medium"
                }
            ]
        }
        
        return upgrades_db.get(language, [])

    def _save_scan_results(self, repository_id: str, upgrades: List[Upgrade]):
        """Save scan results to database."""
        for upgrade in upgrades:
            scan_result = ScanResult(
                id=str(uuid.uuid4()),
                repository_id=repository_id,
                scan_type="version",
                title=f"Upgrade {upgrade.technology}",
                description=f"Upgrade {upgrade.technology} from {upgrade.current_version} to {upgrade.target_version}",
                status=upgrade.status.value,
                package_name=upgrade.technology,
                current_version=upgrade.current_version,
                recommended_version=upgrade.target_version
            )
            self.db.add(scan_result)
        
        self.db.commit() 