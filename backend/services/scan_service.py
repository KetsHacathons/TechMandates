from sqlalchemy.orm import Session
from database import SessionLocal, ScanResult
from schemas import ScanResultCreate, ScanResultResponse
import uuid
from typing import List, Optional
from datetime import datetime

class ScanService:
    def __init__(self):
        self.db: Session = SessionLocal()

    def create_scan_result(self, scan_data: ScanResultCreate) -> ScanResult:
        """Create a new scan result."""
        scan_result = ScanResult(
            id=str(uuid.uuid4()),
            repository_id=scan_data.repository_id,
            scan_type=scan_data.scan_type.value,
            title=scan_data.title,
            description=scan_data.description,
            severity=scan_data.severity.value if scan_data.severity else None,
            status=scan_data.status.value,
            file_path=scan_data.file_path,
            line_number=scan_data.line_number,
            package_name=scan_data.package_name,
            current_version=scan_data.current_version,
            recommended_version=scan_data.recommended_version,
            coverage_percentage=scan_data.coverage_percentage,
            rule_id=scan_data.rule_id,
            metadata=scan_data.metadata
        )
        
        self.db.add(scan_result)
        self.db.commit()
        self.db.refresh(scan_result)
        return scan_result

    def get_scan_results(self, repository_id: str, scan_type: Optional[str] = None) -> List[ScanResult]:
        """Get scan results for a repository."""
        query = self.db.query(ScanResult).filter(ScanResult.repository_id == repository_id)
        
        if scan_type:
            query = query.filter(ScanResult.scan_type == scan_type)
        
        return query.all()

    def get_scan_result(self, scan_id: str) -> Optional[ScanResult]:
        """Get a specific scan result by ID."""
        return self.db.query(ScanResult).filter(ScanResult.id == scan_id).first()

    def update_scan_result(self, scan_id: str, update_data: dict) -> Optional[ScanResult]:
        """Update a scan result."""
        scan_result = self.get_scan_result(scan_id)
        if not scan_result:
            return None
        
        for key, value in update_data.items():
            if hasattr(scan_result, key):
                setattr(scan_result, key, value)
        
        scan_result.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(scan_result)
        return scan_result

    def delete_scan_result(self, scan_id: str) -> bool:
        """Delete a scan result."""
        scan_result = self.get_scan_result(scan_id)
        if not scan_result:
            return False
        
        self.db.delete(scan_result)
        self.db.commit()
        return True

    def get_recent_scans(self, repository_id: str, limit: int = 10) -> List[ScanResult]:
        """Get recent scan results for a repository."""
        return self.db.query(ScanResult).filter(
            ScanResult.repository_id == repository_id
        ).order_by(ScanResult.created_at.desc()).limit(limit).all()

    def get_scan_statistics(self, repository_id: str) -> dict:
        """Get scan statistics for a repository."""
        scan_results = self.get_scan_results(repository_id)
        
        stats = {
            "total_scans": len(scan_results),
            "security_scans": len([s for s in scan_results if s.scan_type == "security"]),
            "version_scans": len([s for s in scan_results if s.scan_type == "version"]),
            "coverage_scans": len([s for s in scan_results if s.scan_type == "coverage"]),
            "open_issues": len([s for s in scan_results if s.status == "open"]),
            "resolved_issues": len([s for s in scan_results if s.status == "resolved"]),
            "critical_issues": len([s for s in scan_results if s.severity == "critical"]),
            "high_issues": len([s for s in scan_results if s.severity == "high"])
        }
        
        return stats 