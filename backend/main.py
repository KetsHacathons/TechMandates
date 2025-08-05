from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional
import os
from dotenv import load_dotenv

from database import engine, Base
from database import User, Repository, ScanResult, Profile, ProviderAccount
from schemas import (
    UserCreate, UserLogin, UserResponse, 
    RepositoryCreate, RepositoryResponse, RepositoryList,
    ScanResultCreate, ScanResultResponse, ScanResultList,
    VulnerabilityScanRequest, VulnerabilityScanResponse,
    VersionScanRequest, VersionScanResponse,
    CoverageScanRequest, CoverageScanResponse,
    AuthResponse, TokenData
)
from services import (
    AuthService, RepositoryService, ScanService,
    SecurityService, VersionService, CoverageService
)
from utils.auth import create_access_token, verify_token

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TechMandates API",
    description="Backend API for TechMandates - Technical Mandates Management System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8081"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Service instances
auth_service = AuthService()
repo_service = RepositoryService()
scan_service = ScanService()
security_service = SecurityService()
version_service = VersionService()
coverage_service = CoverageService()

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = verify_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = auth_service.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "TechMandates API is running"}

# Authentication endpoints
@app.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    try:
        user = auth_service.create_user(user_data)
        access_token = create_access_token(data={"sub": user.id})
        return AuthResponse(
            user=UserResponse.from_orm(user),
            access_token=access_token,
            token_type="bearer"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login", response_model=AuthResponse)
async def login(user_data: UserLogin):
    try:
        user = auth_service.authenticate_user(user_data.email, user_data.password)
        access_token = create_access_token(data={"sub": user.id})
        return AuthResponse(
            user=UserResponse.from_orm(user),
            access_token=access_token,
            token_type="bearer"
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)

# Repository endpoints
@app.get("/repositories", response_model=RepositoryList)
async def get_repositories(current_user: User = Depends(get_current_user)):
    repositories = repo_service.get_user_repositories(current_user.id)
    return RepositoryList(repositories=[RepositoryResponse.from_orm(repo) for repo in repositories])

@app.post("/repositories", response_model=RepositoryResponse)
async def create_repository(
    repo_data: RepositoryCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        repository = repo_service.create_repository(current_user.id, repo_data)
        return RepositoryResponse.from_orm(repository)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/repositories/{repo_id}", response_model=RepositoryResponse)
async def get_repository(
    repo_id: str,
    current_user: User = Depends(get_current_user)
):
    repository = repo_service.get_repository(repo_id, current_user.id)
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")
    return RepositoryResponse.from_orm(repository)

@app.delete("/repositories/{repo_id}")
async def delete_repository(
    repo_id: str,
    current_user: User = Depends(get_current_user)
):
    success = repo_service.delete_repository(repo_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Repository not found")
    return {"message": "Repository deleted successfully"}

# Scan endpoints
@app.post("/scans/security", response_model=VulnerabilityScanResponse)
async def run_security_scan(
    scan_request: VulnerabilityScanRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        vulnerabilities = await security_service.scan_repository(
            scan_request.repository_id,
            scan_request.repository_name,
            scan_request.full_name,
            scan_request.language
        )
        return VulnerabilityScanResponse(
            success=True,
            repository_id=scan_request.repository_id,
            repository_name=scan_request.repository_name,
            vulnerabilities=vulnerabilities,
            scan_date=scan_request.scan_date,
            summary=security_service.get_scan_summary(vulnerabilities)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scans/version", response_model=VersionScanResponse)
async def run_version_scan(
    scan_request: VersionScanRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        upgrades = await version_service.scan_repository(
            scan_request.repository_id,
            scan_request.repository_name,
            scan_request.full_name,
            scan_request.language
        )
        return VersionScanResponse(
            success=True,
            repository_id=scan_request.repository_id,
            repository_name=scan_request.repository_name,
            upgrades=upgrades,
            scan_date=scan_request.scan_date
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scans/coverage", response_model=CoverageScanResponse)
async def run_coverage_scan(
    scan_request: CoverageScanRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        coverage_data = await coverage_service.scan_repository(
            scan_request.repository_id,
            scan_request.repository_name,
            scan_request.full_name,
            scan_request.language
        )
        return CoverageScanResponse(
            success=True,
            repository_id=scan_request.repository_id,
            repository_name=scan_request.repository_name,
            coverage_data=coverage_data,
            scan_date=scan_request.scan_date
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard metrics
@app.get("/dashboard/metrics")
async def get_dashboard_metrics(current_user: User = Depends(get_current_user)):
    try:
        metrics = repo_service.get_dashboard_metrics(current_user.id)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Function endpoints (replacing Supabase edge functions)
@app.post("/functions/detect-current-version")
async def detect_current_version(
    body: dict,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await version_service.detect_current_version(
            body.get("repositoryId"),
            body.get("technology")
        )
        return {"data": result, "error": None}
    except Exception as e:
        return {"data": None, "error": str(e)}

@app.post("/functions/create-upgrade-pr")
async def create_upgrade_pr(
    body: dict,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await version_service.create_upgrade_pr(
            body.get("repositoryId"),
            body.get("technology"),
            body.get("targetVersion")
        )
        return {"data": result, "error": None}
    except Exception as e:
        return {"data": None, "error": str(e)}

@app.post("/functions/fix-vulnerability")
async def fix_vulnerability(
    body: dict,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await security_service.fix_vulnerability(
            body.get("repositoryId"),
            body.get("vulnerabilityId"),
            body.get("packageName"),
            body.get("currentVersion"),
            body.get("fixedVersion"),
            body.get("repositoryFullName")
        )
        return {"data": result, "error": None}
    except Exception as e:
        return {"data": None, "error": str(e)}

@app.post("/functions/fetch-coverage-data")
async def fetch_coverage_data(
    body: dict,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await coverage_service.fetch_coverage_data(
            body.get("repositoryIds", [])
        )
        return {"data": result, "error": None}
    except Exception as e:
        return {"data": None, "error": str(e)}

@app.post("/functions/improve-coverage")
async def improve_coverage(
    body: dict,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await coverage_service.improve_coverage(
            body.get("repositories", [])
        )
        return {"data": result, "error": None}
    except Exception as e:
        return {"data": None, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 