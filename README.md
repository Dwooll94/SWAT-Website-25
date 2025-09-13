# SWAT Team 1806 Website

A modern web application for FIRST Robotics Competition Team 1806 built with React.js, Node.js, and PostgreSQL.

## Project Structure

```
SWAT-Website-25/
├── frontend/          # React.js application
├── backend/           # Node.js API server
├── database/          # Database schema and migrations
├── plan.md           # Detailed project requirements
└── README.md         # This file
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

## Setup Instructions

### 1. Database Setup

1. Install PostgreSQL and create a database:
   ```sql
   CREATE DATABASE swat_website;
   ```

2. Run the database schema:
   ```bash
   psql -U postgres -d swat_website -f database/schema.sql
   ```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your database credentials and configuration

5. Start development server:
   ```bash
   npm run dev
   ```

   The backend will run on http://localhost:3001

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

   The frontend will run on http://localhost:3000

## Development Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

## Key Features

- **Student Registration System**: Multi-step registration workflow with email validation
- **Role-based Access Control**: Students, mentors, and admins with different permissions
- **Content Management**: Dynamic pages, resources, sponsors, and robot history
- **Subteam Management**: Configurable subteams with student preferences
- **File Uploads**: Contract signatures and document management
- **Security**: JWT authentication, bcrypt password hashing, rate limiting

## Database Schema

The database includes tables for:
- Users and authentication
- Student registration workflow
- Subteams and preferences
- Legal guardians
- Contract signatures
- Dynamic pages and content
- Sponsors and resources
- Robot history
- Site configuration
- Proposed changes (for student maintenance access)

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swat_website
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=SWAT Team 1806 <noreply@team1806.com>
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## Contributing

1. Follow the existing code style and conventions
2. Test your changes thoroughly
3. Update documentation as needed
4. Create pull requests for review

## License

This project is proprietary to FIRST Robotics Competition Team 1806.