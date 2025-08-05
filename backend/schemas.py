from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class ScanType(str, Enum):
    SECURITY = "security"
    VERSION = "version"
    COVERAGE = "coverage"

class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Status(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in-progress"
    RESOLVED = "resolved"

# Base schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str

class TokenData(BaseModel):
    sub: Optional[str] = None

# Repository schemas
class RepositoryBase(BaseModel):
    name: str
    full_name: str
    description: Optional[str] = None
    clone_url: str
    is_private: bool = False
    language: Optional[str] = None
    default_branch: str = "main"
    provider: str

class RepositoryCreate(RepositoryBase):
    external_id: str

class RepositoryResponse(RepositoryBase):
    id: str
    user_id: str
    external_id: str
    coverage_percentage: Optional[float] = None
    test_count: Optional[int] = None
    scan_status: str
    last_scan_at: Optional[datetime] = None
    last_coverage_update: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RepositoryList(BaseModel):
    repositories: List[RepositoryResponse]

# Scan Result schemas
class ScanResultBase(BaseModel):
    scan_type: ScanType
    title: str
    description: Optional[str] = None
    severity: Optional[Severity] = None
    status: Status = Status.OPEN
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    package_name: Optional[str] = None
    current_version: Optional[str] = None
    recommended_version: Optional[str] = None
    coverage_percentage: Optional[float] = None
    rule_id: Optional[str] = None
    metadata_json: Optional[str] = None

class ScanResultCreate(ScanResultBase):
    repository_id: str

class ScanResultResponse(ScanResultBase):
    id: str
    repository_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ScanResultList(BaseModel):
    scan_results: List[ScanResultResponse]

# Vulnerability schemas
class Vulnerability(BaseModel):
    id: str
    title: str
    severity: Severity
    cvss: float
    package: str
    version: str
    fixed_in: str
    status: Status
    discovered_date: str
    description: str
    repository: str
    repository_id: str
    platform: str

class VulnerabilityScanRequest(BaseModel):
    repository_id: str
    repository_name: str
    full_name: str
    language: Optional[str] = None
    scan_date: datetime = datetime.now()

class VulnerabilityScanResponse(BaseModel):
    success: bool
    repository_id: str
    repository_name: str
    vulnerabilities: List[Vulnerability]
    scan_date: datetime
    summary: Dict[str, int]

# Version schemas
class Upgrade(BaseModel):
    repository: str
    repository_id: str
    platform: str
    technology: str
    current_version: str
    target_version: str
    status: Status
    priority: str

class VersionScanRequest(BaseModel):
    repository_id: str
    repository_name: str
    full_name: str
    language: Optional[str] = None
    scan_date: datetime = datetime.now()

class VersionScanResponse(BaseModel):
    success: bool
    repository_id: str
    repository_name: str
    upgrades: List[Upgrade]
    scan_date: datetime

# Coverage schemas
class CoverageData(BaseModel):
    repository_id: str
    coverage_percentage: float
    test_count: int
    last_updated: datetime
    language: Optional[str] = None

class CoverageScanRequest(BaseModel):
    repository_id: str
    repository_name: str
    full_name: str
    language: Optional[str] = None
    scan_date: datetime = datetime.now()

class CoverageScanResponse(BaseModel):
    success: bool
    repository_id: str
    repository_name: str
    coverage_data: CoverageData
    scan_date: datetime

# Dashboard schemas
class DashboardMetrics(BaseModel):
    total_repositories: int
    pending_updates: int
    vulnerabilities: int
    test_coverage: str
    loading: bool = False
    error: Optional[str] = None

# Provider Account schemas
class ProviderAccountBase(BaseModel):
    provider: str
    provider_account_id: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    scope: Optional[str] = None
    expires_at: Optional[datetime] = None

class ProviderAccountCreate(ProviderAccountBase):
    pass

class ProviderAccountResponse(ProviderAccountBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Profile schemas
class ProfileBase(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileCreate(ProfileBase):
    user_id: str

class ProfileResponse(ProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 