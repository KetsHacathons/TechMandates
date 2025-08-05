# TechMandates

A modern web application for managing technical mandates and requirements, built with **React TypeScript** frontend and **FastAPI Python** backend.

## 🏗️ Architecture

### Frontend (TypeScript/React)
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **React Router** for navigation
- **TanStack Query** for data fetching
- **React Hook Form** with Zod validation

### Backend (Python/FastAPI)
- **FastAPI** for high-performance API
- **SQLAlchemy** ORM with SQLite database
- **Pydantic** for data validation
- **JWT** authentication with bcrypt password hashing
- **CORS** enabled for frontend integration

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.8+** and **pip**

### Backend Setup

1. **Navigate to backend directory:**
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

5. **Start the backend server:**
   ```bash
   python start.py
   ```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## 📚 Features

### 🔐 Authentication
- User registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Session management

### 📊 Dashboard
- Real-time metrics overview
- Repository statistics
- Security vulnerability tracking
- Test coverage monitoring
- Version upgrade status

### 🔍 Security Scanning
- Multi-language vulnerability detection
- Automated fix generation
- Pull request creation for security fixes
- Severity classification (Critical, High, Medium, Low)

### 📦 Version Management
- Dependency version tracking
- Automated upgrade detection
- Bulk upgrade capabilities
- Pull request generation for upgrades

### 🧪 Coverage Analysis
- Test coverage monitoring
- Coverage improvement suggestions
- Language-specific coverage patterns
- Automated test recommendations

### 🔗 Repository Management
- GitHub/Bitbucket integration
- Repository connection and monitoring
- Scan status tracking
- Coverage data visualization

## 🛠️ Development

### Backend Development

**API Documentation:**
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/health

**Key Endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /repositories` - Get user repositories
- `POST /scans/security` - Run security scan
- `POST /scans/version` - Run version scan
- `POST /scans/coverage` - Run coverage scan
- `GET /dashboard/metrics` - Get dashboard metrics

### Frontend Development

**Available Scripts:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Key Components:**
- `src/pages/` - Main application pages
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/integrations/api/` - API client and types

## 🗄️ Database Schema

The application uses SQLite with the following main tables:

- **users** - User accounts and authentication
- **profiles** - User profile information
- **repositories** - Connected repositories
- **scan_results** - Security, version, and coverage scan results
- **provider_accounts** - OAuth integration tokens

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```bash
DATABASE_URL=sqlite:///./data/tech-mandates.db
SECRET_KEY=your-secret-key-here
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:8000
```

## 🚀 Deployment

### Backend Deployment

**Docker:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "start.py"]
```

**Production Considerations:**
1. Use PostgreSQL instead of SQLite
2. Change default SECRET_KEY
3. Use reverse proxy (nginx) with SSL
4. Add logging and monitoring
5. Implement Redis for caching

### Frontend Deployment

**Build for production:**
```bash
npm run build
```

**Deploy to:**
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Token-based session management
- **CORS Protection**: Configured for frontend integration
- **Input Validation**: Pydantic schemas for API validation
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries

## 📈 Monitoring & Analytics

- **Health Checks**: `/health` endpoint for monitoring
- **Error Logging**: Comprehensive error handling and logging
- **Performance Metrics**: Dashboard analytics and reporting
- **Scan Statistics**: Repository-level scan tracking

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

**Backend:**
- Follow PEP 8 style guidelines
- Add type hints to all functions
- Write tests for new features
- Update API documentation

**Frontend:**
- Use TypeScript for all new code
- Follow React best practices
- Add proper error handling
- Update component documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the backend logs for errors

## 🔄 Migration from SQLite-only

This project has been migrated from a SQLite-only architecture to a proper client-server architecture:

- **Before**: SQLite database with mock functions
- **After**: FastAPI backend with SQLAlchemy ORM

The migration provides:
- Better separation of concerns
- Improved security with proper authentication
- Scalable architecture for production
- Real-time API capabilities
- Better error handling and validation
