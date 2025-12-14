# Exam System v1

A comprehensive online examination system built with Next.js, React, and MySQL.

## Features

- 🔐 **Multi-Role Authentication**: Admin, Teacher, Proctor, and Student roles
- 📝 **Exam Management**: Create, schedule, and manage exams
- ❓ **Question Bank**: Support for MCQ, Short Answer, Essay, and more
- 👥 **User Management**: Manage students, teachers, and proctors
- 📊 **Analytics & Reports**: Detailed performance analytics
- 💳 **Payment Integration**: Support for SSLCommerz, bKash, and Stripe
- 🔒 **Anti-Cheat System**: Browser monitoring and proctoring
- 🌐 **Multi-language**: English and Bengali support
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 16.0
- **Language**: TypeScript
- **Database**: MySQL 8.0+
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Authentication**: JWT with httpOnly cookies

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- pnpm (recommended) or npm

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "Exam System v1"
```

### 2. Install dependencies

```bash
pnpm install
# or
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and configure your database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=exam_system
JWT_SECRET=your-secure-jwt-secret
```

### 4. Set up the database

Run the database setup script:

```bash
node scripts/setup-db.js
```

This will:
- Create the database if it doesn't exist
- Run all database migrations
- Create necessary tables

### 5. Run the development server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Complete installation wizard

On first run, you'll be redirected to `/install` where you can:
- Configure database connection
- Create your first admin account
- Set up your organization

## Project Structure

```
Exam System v1/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── exams/         # Exam management
│   │   ├── questions/     # Question bank
│   │   ├── subjects/      # Subject management
│   │   └── payments/      # Payment processing
│   ├── admin/             # Admin dashboard
│   ├── student/           # Student portal
│   ├── proctor/           # Proctor dashboard
│   └── install/           # Installation wizard
├── components/            # React components
│   ├── ui/               # UI components (shadcn)
│   └── auth/             # Auth components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── db.ts            # Database connection
│   ├── auth.ts          # Authentication utilities
│   └── utils.ts         # Helper functions
├── scripts/              # Setup scripts
│   ├── setup-db.js      # Database setup script
│   └── 01-database-schema.sql  # Database schema
└── types/               # TypeScript type definitions
```

## Database Schema

The system uses the following main tables:

- **users**: User accounts (admin, teacher, proctor, student)
- **organizations**: Educational institutions
- **subjects**: Subjects/courses
- **exams**: Exam definitions
- **questions**: Question bank
- **question_options**: MCQ options
- **exam_registrations**: Student exam enrollments
- **exam_attempts**: Exam attempt tracking
- **student_answers**: Student responses
- **evaluations**: Grading and results
- **anti_cheat_logs**: Security monitoring
- **payment_transactions**: Payment records

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Exams
- `GET /api/exams` - List all exams
- `POST /api/exams` - Create new exam
- `GET /api/exams/[id]` - Get exam details
- `PUT /api/exams/[id]` - Update exam
- `DELETE /api/exams/[id]` - Delete exam

### Questions
- `GET /api/questions` - List questions
- `POST /api/questions` - Create question
- `PUT /api/questions/[id]` - Update question
- `DELETE /api/questions/[id]` - Delete question

### Subjects
- `GET /api/subjects` - List subjects
- `POST /api/subjects` - Create subject

## Development

### Running Tests

```bash
pnpm test
# or
npm test
```

### Building for Production

```bash
pnpm build
# or
npm run build
```

### Starting Production Server

```bash
pnpm start
# or
npm start
```

## Security Features

- JWT-based authentication with httpOnly cookies
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- Role-based access control (RBAC)
- API route protection with middleware
- Anti-cheat monitoring during exams

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@example.com or create an issue in the repository.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
