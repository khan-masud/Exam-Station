# Exam Station

A comprehensive, production-ready online examination platform with advanced proctoring, anti-cheat detection, and real-time analytics. Built with Next.js 16, React, TypeScript, and MySQL.

## ✨ Features

### Core Functionality
- 🔐 **Multi-Role System**: Admin, Exam Setter, Proctor, and Student roles with role-based access control
- 📝 **Advanced Exam Management**: Create exams with customizable settings, scheduling, and exam controls
- ❓ **Flexible Question Types**: MCQ, True/False, Dropdown, Short Answer, Essay, Custom HTML, and more
- 👥 **User Management**: Complete user lifecycle management with authentication and authorization
- 🎓 **Program Management**: Create educational programs and enroll students
- 📊 **Comprehensive Analytics**: Student performance tracking, exam analytics, and detailed reports

### Student Experience
- 🧠 **Interactive Exam Taking**: Real-time question navigation with flagging and review options
- ⏱️ **Intelligent Timer**: Accurate countdown with auto-submission on timeout
- 💾 **Auto-save**: Automatic progress saving every 30 seconds
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### Exam Controls & Security
- 🔒 **Answer Control**: Allow/disable answer changes, lock answered questions
- 👁️ **Question Counter**: Optional question numbering display
- 📋 **Review Mode**: Allow students to review their answers before submission
- 🚨 **Anti-Cheat System**: 
  - Face detection using AI/ML (webcam monitoring)
  - Window focus tracking with warnings
  - Tab switch detection
  - IP address logging
  - Screen recording capability for proctors

### Proctoring
- 🎥 **Live Proctoring**: Real-time student monitoring
- 📹 **Webcam Integration**: Face detection and monitoring
- 🔴 **Activity Logging**: Detailed anti-cheat event tracking
- ⚠️ **Alert System**: Automatic alerts for suspicious activities

### Content & Communication
- 📰 **Newsletter System**: Email subscription and newsletter sending
- 💌 **Email Service**: Transactional emails with templates
- 📲 **SMS Integration**: Optional SMS notifications
- 🎨 **Landing Page Editor**: Customizable landing page with multiple section types:
  - Hero Section
  - Statistics/Metrics
  - Features Showcase
  - Programs Listing
  - Testimonials
  - Call-to-Action
  - Newsletter Signup
  - Custom HTML Sections
  - Footer

### Accessibility & Internationalization
- 🌍 **Multi-Language Support**: English and Bengali interfaces
- 🎨 **Dark Mode**: Full dark/light theme support
- ♿ **Accessibility**: WCAG compliant UI components

### Payment & Monetization
- 💳 **Multiple Payment Gateways**: Stripe, PayPal, Razorpay, bKash
- 🎟️ **Coupon System**: Discount codes and promotional campaigns
- 📈 **Revenue Tracking**: Payment analytics and transaction history

### Additional Features
- 🔧 **Settings Management**: Customizable system settings and configurations
- 🆘 **Support Ticket System**: Student support request management
- 📧 **Email Templates**: Customizable email notifications
- 🔐 **Password Reset**: Secure password recovery workflow
- 📱 **OAuth Integration**: Google and Facebook authentication
- 🎭 **Theme Customization**: Customizable colors and branding
- 📦 **Service Worker**: PWA capabilities with offline support
- 💾 **Data Backup**: Export and restore functionality

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Frontend**: React 19 with Hooks
- **Styling**: Tailwind CSS 3
- **UI Components**: shadcn/ui, Radix UI
- **Database**: MySQL 8.0+
- **ORM/Query**: mysql2/promise
- **Authentication**: JWT with httpOnly cookies + OAuth
- **State Management**: React Context + Custom Hooks
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner Toast
- **Real-time**: Socket.io for notifications
- **File Upload**: Multer for image/file uploads
- **ML**: Face-api.js for face detection

## 📋 Prerequisites

- Node.js 18.17+ 
- MySQL 8.0+
- pnpm 8+ (recommended) or npm 9+
- Modern web browser with JavaScript enabled

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/khan-masud/exam-station.git
cd "Exam Station"
```

### 2. Install dependencies

```bash
pnpm install
# or
npm install --legacy-peer-deps
```

### 3. Set up environment variables

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=exam_station

# JWT
JWT_SECRET=your-super-secure-jwt-secret-change-this

# Application
NEXT_PUBLIC_APP_URL=your-url-here
NODE_ENV=development

# Payment Gateways (optional)
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...

# Email Service (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Initialize the Database

The system includes an automated installation wizard. Simply:

1. Start the development server (step 5)
2. Navigate to `https://your-url-here/install`
3. Follow the installation wizard to:
   - Test database connection
   - Create admin account
   - Initialize system

### 5. Run the development server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
Exam Station/
├── app/                           # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                # Authentication
│   │   ├── exams/               # Exam management
│   │   ├── exam-attempts/       # Exam taking
│   │   ├── questions/           # Question bank
│   │   ├── subjects/            # Subjects
│   │   ├── programs/            # Programs
│   │   ├── payments/            # Payment processing
│   │   ├── admin/               # Admin APIs
│   │   ├── analytics/           # Analytics
│   │   ├── public/              # Public APIs
│   │   └── install/             # Installation
│   ├── admin/                    # Admin dashboard
│   │   ├── dashboard/           # Dashboard
│   │   ├── exam-setter/         # Exam creation
│   │   ├── questions/           # Question management
│   │   ├── users/               # User management
│   │   ├── analytics/           # Analytics dashboard
│   │   ├── reports/             # Reports
│   │   ├── settings/            # Settings
│   │   └── [other-admin-routes]/
│   ├── student/                  # Student portal
│   │   ├── dashboard/           # Student dashboard
│   │   ├── exams/               # Exam listing
│   │   ├── exam/[id]/           # Exam taking
│   │   ├── results/[id]/        # Results
│   │   ├── programs/            # Program enrollment
│   │   └── profile/             # Profile
│   ├── proctor/                  # Proctor dashboard
│   ├── login/                    # Login page
│   ├── register/                 # Registration
│   ├── landing/                  # Public landing page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── ui/                      # UI components (shadcn)
│   ├── auth/                    # Auth-related components
│   ├── exam/                    # Exam-taking components
│   ├── admin/                   # Admin components
│   ├── landing-editor/          # Landing page editor
│   ├── landing-section-renderer/# Section rendering
│   └── [other-components]/
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts              # Auth hook
│   ├── use-socket.ts            # WebSocket hook
│   ├── use-pagination.ts        # Pagination
│   └── [other-hooks]/
├── lib/                          # Utility functions
│   ├── db.ts                    # Database connection
│   ├── auth.ts                  # Auth utilities
│   ├── email-service.ts         # Email sending
│   ├── anti-cheat.ts            # Anti-cheat utilities
│   ├── logger.ts                # Logging
│   ├── utils.ts                 # Helper functions
│   └── [other-utilities]/
├── types/                        # TypeScript definitions
│   ├── database.ts              # Database types
│   ├── auth.ts                  # Auth types
│   └── index.ts                 # Index
├── scripts/                      # Utility scripts
│   ├── production-schema.sql    # Database schema
│   └── [other-scripts]/
├── public/                       # Static files
│   ├── uploads/                 # User uploads
│   ├── models/                  # ML models
│   └── [static-assets]/
├── styles/                       # Global styles
├── context/                      # React Context
├── middleware.ts                 # Next.js middleware
├── next.config.mjs              # Next.js config
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind config
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 📚 Key API Endpoints

### Authentication
```
POST   /api/auth/login                    # User login
POST   /api/auth/register                 # New registration
POST   /api/auth/logout                   # Logout
GET    /api/auth/me                       # Current user info
POST   /api/auth/refresh                  # Refresh token
POST   /api/auth/forgot-password          # Password reset request
POST   /api/auth/reset-password           # Reset password
```

### Exams
```
GET    /api/exams                         # List all exams
POST   /api/exams                         # Create exam
GET    /api/exams/[id]                    # Get exam details
PUT    /api/exams/[id]                    # Update exam
DELETE /api/exams/[id]                    # Delete exam
```

### Exam Attempts (Taking Exams)
```
POST   /api/exam-attempts/start           # Start exam
POST   /api/exam-attempts/answer          # Submit answer
POST   /api/exam-attempts/submit          # Submit exam
GET    /api/exam-attempts/[id]            # Get attempt details
POST   /api/exam-attempts/autosave        # Auto-save progress
```

### Questions
```
GET    /api/questions                     # List questions
POST   /api/admin/questions               # Create question
PUT    /api/admin/questions/[id]          # Update question
DELETE /api/admin/questions/[id]          # Delete question
```

### Programs
```
GET    /api/programs                      # List programs
POST   /api/programs                      # Create program
PUT    /api/programs/[id]                 # Update program
GET    /api/programs/[id]/enroll          # Enroll student
```

### Analytics
```
GET    /api/analytics/exams               # Exam analytics
GET    /api/analytics/students            # Student analytics
GET    /api/analytics/questions           # Question analysis
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication with httpOnly cookies
- **Password Security**: Bcrypt hashing with salt rounds
- **SQL Injection Prevention**: Parameterized queries throughout
- **CSRF Protection**: CSRF tokens for state-changing operations
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Zod schema validation on all inputs
- **Role-Based Access Control**: Fine-grained permission system
- **Anti-Cheat Monitoring**: Face detection and activity tracking
- **Secure Headers**: Security headers configured in middleware
- **Environment Variables**: Sensitive data in .env files

## 🧪 Development

### Running in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Database Migrations

Run SQL scripts from `scripts/production-schema.sql` in your MySQL client.

## 📊 Database Tables

Key tables include:
- `users` - User accounts
- `exams` - Exam definitions
- `questions` - Question bank
- `question_options` - MCQ/dropdown options
- `question_types` - Question type definitions
- `exam_attempts` - Exam attempt records
- `exam_progress` - Question-level progress
- `student_answers` - Student responses
- `exam_results` - Result evaluations
- `anti_cheat_logs` - Security events
- `programs` - Educational programs
- `subjects` - Course subjects
- `landing_config` - Landing page settings
- `newsletter_subscribers` - Newsletter subscriptions
- `payments` - Payment transactions
- `support_tickets` - Student support requests

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Email: abdullahalmasudkhan@gmail.com
- Check documentation at `/docs`

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide](https://lucide.dev/) - Icons
- [MySQL](https://www.mysql.com/) - Database
- [Face-api.js](https://github.com/justadudewhohacks/face-api.js/) - Face detection

---

**Last Updated**: December 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅
