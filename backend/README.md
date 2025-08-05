# TechMandates Backend API

FastAPI backend service for TechMandates - Technical Mandates Management System.

## Features

- **Authentication**: JWT-based authentication with password hashing
- **Repository Management**: Connect and manage GitHub/Bitbucket repositories
- **Security Scanning**: Vulnerability detection and automated fixes
- **Version Management**: Dependency version tracking and upgrades
- **Coverage Analysis**: Test coverage monitoring and improvement
- **Dashboard Metrics**: Real-time analytics and reporting

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Lightweight database (can be replaced with PostgreSQL)
- **Pydantic**: Data validation using Python type annotations
- **JWT**: JSON Web Token authentication
- **bcrypt**: Password hashing

## Quick Start

### Prerequisites

- Python 3.8+
- pip or poetry

### Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Run the server:**
   ```bash
   python start.py
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:

- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Repositories
- `GET /repositories` - Get user repositories
- `POST /repositories` - Create new repository
- `GET /repositories/{repo_id}` - Get specific repository
- `DELETE /repositories/{repo_id}` - Delete repository

### Scans
- `POST /scans/security` - Run security vulnerability scan
- `POST /scans/version` - Run version upgrade scan
- `POST /scans/coverage` - Run test coverage scan

### Dashboard
- `GET /dashboard/metrics` - Get dashboard metrics

### Functions (Supabase Edge Functions replacement)
- `POST /functions/detect-current-version` - Detect current version
- `POST /functions/create-upgrade-pr` - Create upgrade PR
- `POST /functions/fix-vulnerability` - Fix vulnerability
- `POST /functions/fetch-coverage-data` - Fetch coverage data
- `POST /functions/improve-coverage` - Improve coverage

## Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts and authentication
- **profiles**: User profile information
- **repositories**: Connected repositories
- **scan_results**: Security, version, and coverage scan results
- **provider_accounts**: OAuth integration tokens

## Development

### Running in Development Mode

```bash
python start.py
```

The server will run with auto-reload enabled.

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Database Migrations

The database schema is automatically created when the application starts. For production, consider using Alembic for proper migrations.

## Configuration

### Environment Variables

- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: JWT secret key
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time
- `API_HOST`: Server host (default: 0.0.0.0)
- `API_PORT`: Server port (default: 8000)
- `DEBUG`: Debug mode (default: true)

### Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- CORS is configured for frontend integration
- Input validation using Pydantic schemas

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "start.py"]
```

### Production Considerations

1. **Database**: Use PostgreSQL instead of SQLite
2. **Security**: Change default SECRET_KEY
3. **HTTPS**: Use reverse proxy (nginx) with SSL
4. **Monitoring**: Add logging and health checks
5. **Caching**: Implement Redis for session storage

## Architecture

The backend follows a clean architecture pattern:

- **Models**: SQLAlchemy database models
- **Schemas**: Pydantic request/response models
- **Services**: Business logic layer
- **API Routes**: FastAPI endpoint handlers
- **Utils**: Helper functions and utilities

## Integration with Frontend

The backend is designed to work with the React TypeScript frontend. CORS is configured to allow requests from the frontend development server.

## Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Write tests for new features
4. Update API documentation
5. Use conventional commit messages 