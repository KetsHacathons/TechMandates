from sqlalchemy.orm import Session
from database import SessionLocal, ScanResult
from schemas import Vulnerability, Severity, Status
import uuid
import asyncio
from typing import List, Dict, Any
from datetime import datetime
import random

class SecurityService:
    def __init__(self):
        self.db: Session = SessionLocal()

    async def scan_repository(
        self, 
        repository_id: str, 
        repository_name: str, 
        full_name: str, 
        language: str = None
    ) -> List[Vulnerability]:
        """Scan repository for security vulnerabilities."""
        # Simulate scanning delay
        await asyncio.sleep(2 + random.random() * 3)
        
        # Mock vulnerability database based on language
        mock_vulnerabilities = self._get_mock_vulnerabilities(language)
        
        # Randomly select vulnerabilities to simulate real findings
        found_vulnerabilities = []
        if mock_vulnerabilities:
            num_vulns = random.randint(0, len(mock_vulnerabilities))
            selected_vulns = random.sample(mock_vulnerabilities, num_vulns)
            
            for vuln in selected_vulns:
                vulnerability = Vulnerability(
                    id=vuln["id"],
                    title=vuln["title"],
                    severity=vuln["severity"],
                    cvss=vuln["cvss"],
                    package=vuln["package"],
                    version=vuln["version"],
                    fixed_in=vuln["fixed_in"],
                    status=Status.OPEN,
                    discovered_date=datetime.now().strftime("%Y-%m-%d"),
                    description=vuln["description"],
                    repository=repository_name,
                    repository_id=repository_id,
                    platform="GitHub"
                )
                found_vulnerabilities.append(vulnerability)
        
        # Save scan results to database
        self._save_scan_results(repository_id, found_vulnerabilities)
        
        return found_vulnerabilities

    def get_scan_summary(self, vulnerabilities: List[Vulnerability]) -> Dict[str, int]:
        """Get summary of vulnerability scan."""
        return {
            "total": len(vulnerabilities),
            "critical": len([v for v in vulnerabilities if v.severity == Severity.CRITICAL]),
            "high": len([v for v in vulnerabilities if v.severity == Severity.HIGH]),
            "medium": len([v for v in vulnerabilities if v.severity == Severity.MEDIUM]),
            "low": len([v for v in vulnerabilities if v.severity == Severity.LOW])
        }

    async def fix_vulnerability(
        self,
        repository_id: str,
        vulnerability_id: str,
        package_name: str,
        current_version: str,
        fixed_version: str,
        repository_full_name: str
    ) -> Dict[str, Any]:
        """Create a fix for a vulnerability."""
        # Simulate fix creation delay
        await asyncio.sleep(1 + random.random() * 2)
        
        # Mock PR creation
        pr_number = random.randint(1000, 9999)
        pr_url = f"https://github.com/{repository_full_name}/pull/{pr_number}"
        
        # Update vulnerability status in database
        self._update_vulnerability_status(vulnerability_id, Status.IN_PROGRESS)
        
        return {
            "success": True,
            "pullRequestNumber": pr_number,
            "pullRequestUrl": pr_url,
            "message": f"Upgrade {package_name} from {current_version} to {fixed_version}"
        }

    def _get_mock_vulnerabilities(self, language: str) -> List[Dict[str, Any]]:
        """Get mock vulnerabilities based on language."""
        vulnerabilities_db = {
            "Java": [
                {
                    "id": "CVE-2024-1001",
                    "title": "SQL Injection vulnerability in Spring Security",
                    "severity": Severity.CRITICAL,
                    "cvss": 9.8,
                    "package": "spring-security-core",
                    "version": "5.7.2",
                    "fixed_in": "6.1.0",
                    "description": "Authentication bypass through SQL injection in login endpoint"
                },
                {
                    "id": "CVE-2024-1002",
                    "title": "Deserialization vulnerability in Jackson",
                    "severity": Severity.HIGH,
                    "cvss": 8.5,
                    "package": "jackson-databind",
                    "version": "2.14.2",
                    "fixed_in": "2.15.0",
                    "description": "Remote code execution through unsafe deserialization"
                }
            ],
            "TypeScript": [
                {
                    "id": "CVE-2024-2001",
                    "title": "Cross-site scripting in Angular",
                    "severity": Severity.HIGH,
                    "cvss": 7.5,
                    "package": "@angular/common",
                    "version": "16.0.0",
                    "fixed_in": "16.2.1",
                    "description": "XSS vulnerability in user input validation"
                }
            ],
            "JavaScript": [
                {
                    "id": "CVE-2024-3001",
                    "title": "Remote code execution in Node.js",
                    "severity": Severity.CRITICAL,
                    "cvss": 9.2,
                    "package": "node",
                    "version": "18.0.0",
                    "fixed_in": "18.17.1",
                    "description": "RCE through malicious package import"
                }
            ],
            "Python": [
                {
                    "id": "CVE-2024-4001",
                    "title": "SQL injection in Django ORM",
                    "severity": Severity.HIGH,
                    "cvss": 8.1,
                    "package": "Django",
                    "version": "4.1.0",
                    "fixed_in": "4.2.5",
                    "description": "SQL injection through raw query parameters"
                }
            ]
        }
        
        return vulnerabilities_db.get(language, [])

    def _save_scan_results(self, repository_id: str, vulnerabilities: List[Vulnerability]):
        """Save scan results to database."""
        for vuln in vulnerabilities:
            scan_result = ScanResult(
                id=str(uuid.uuid4()),
                repository_id=repository_id,
                scan_type="security",
                title=vuln.title,
                description=vuln.description,
                severity=vuln.severity.value,
                status=vuln.status.value,
                package_name=vuln.package,
                current_version=vuln.version,
                recommended_version=vuln.fixed_in
            )
            self.db.add(scan_result)
        
        self.db.commit()

    def _update_vulnerability_status(self, vulnerability_id: str, status: Status):
        """Update vulnerability status in database."""
        scan_result = self.db.query(ScanResult).filter(
            ScanResult.id == vulnerability_id
        ).first()
        
        if scan_result:
            scan_result.status = status.value
            self.db.commit() 