# Nextjs + LDAPS Employee Portal

**Short Description:**
A modern, secure employee self-service portal built with Next.js 15, featuring Active Directory authentication, biometric attendance integration, and comprehensive account management capabilities.

---

## 🚀 Overview

Nextjs + LDAPS Employee Portal is a comprehensive self-service platform that empowers employees to manage their accounts, passwords, and view attendance data while reducing IT helpdesk burden. Built with modern web technologies and enterprise-grade security.

## ✨ Key Features

### 🔐 **Authentication & Security**
- **LDAPS Integration** - Secure Active Directory authentication
- **NextAuth.js** - Modern authentication framework
- **Role-Based Access Control (RBAC)** - Admin and user permissions based on AD groups
- **Session Management** - Secure JWT tokens with automatic expiry

### 🔑 **Self-Service Account Management**
- **Password Reset** - Email OTP-based secure password resets
- **Password Change** - Direct password updates via LDAPS
- **Account Unlock** - Self-service account unlocking with email verification
- **Account Status** - Real-time password expiry and account status viewing

### 📊 **Attendance Management**
- **eSSL Biometric Integration** - Real-time attendance data from biometric devices
- **Personal Dashboard** - Individual attendance tracking and reports
- **Admin Reports** - Department-wide attendance management (for authorized users)
- **Attendance Calendar** - Visual monthly attendance overview

### 🎨 **Modern User Experience**
- **Responsive Design** - Mobile-first approach with ShadCN UI components
- **Dark/Light Mode** - User preference-based theming
- **Real-time Updates** - Live attendance status and notifications
- **Accessibility** - WCAG compliant interface design

## 🛠️ Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|----------|
| **Frontend** | Next.js | 15.x | React framework with App Router |
| **UI Library** | ShadCN UI | Latest | Modern, accessible components |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS framework |
| **Authentication** | NextAuth.js | 5.x | Authentication framework |
| **Database** | Prisma ORM | 5.x | Type-safe database operations |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Directory** | LDAPS | - | Active Directory integration |
| **Biometric** | eSSL API | - | Attendance system integration |

## 🏗️ Architecture

```mermaid
graph TD
    A[Employee Browser] --> B[Next.js 15 App]
    B --> C[NextAuth.js]
    C --> D[LDAPS/Active Directory]
    B --> E[Prisma ORM]
    E --> F[PostgreSQL Database]
    B --> G[eSSL Biometric API]
    G --> H[Biometric Devices]
    
    I[Admin Browser] --> B
    B --> J[RBAC Middleware]
    J --> K[Admin Dashboard]
```

## 📋 Prerequisites

- **Node.js** 20+ (LTS recommended)
- **PostgreSQL** 14+ database
- **Active Directory** with LDAPS configured
- **eSSL Biometric System** (optional, for attendance features)
- **SMTP Server** (for email notifications)

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/PHPxCODER/ldap-portal.git
cd ldap-portal
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ldap-portal"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# LDAP Configuration
LDAP_URL="ldaps://dc01.yourdomain.com:636"
LDAP_BIND_DN="CN=ServiceAccount,OU=Service,DC=company,DC=com"
LDAP_BIND_PASSWORD="service-account-password"
LDAP_BASE_DN="DC=company,DC=com"

# Email Configuration
SMTP_HOST="smtp.company.com"
SMTP_PORT="587"
SMTP_USER="noreply@company.com"
SMTP_PASSWORD="smtp-password"

# eSSL Integration (optional)
ESSL_API_URL="http://your-essl-server:8080"
ESSL_API_USERNAME="api-user"
ESSL_API_PASSWORD="api-password"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial data (optional)
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
ldap-portal/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── admin/             # Admin-only pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # ShadCN UI components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   └── admin/            # Admin components
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── ldap.ts          # LDAP utilities
│   ├── essl.ts          # eSSL integration
│   └── utils.ts         # General utilities
├── prisma/              # Database schema and migrations
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## 🔧 Configuration

### LDAP/Active Directory Setup
1. Create a service account with read/write permissions
2. Configure LDAPS with proper SSL certificates
3. Set up group mappings for RBAC in `lib/auth.ts`

### eSSL Biometric Integration
1. Enable eBIOServer-New or API access on your eSSL system
2. Configure employee ID mapping between AD and eSSL
3. Set up background sync jobs for attendance data

### Email Configuration
1. Configure SMTP settings for password reset emails
2. Customize email templates in `components/emails/`
3. Set up proper SPF/DKIM records for email delivery

## 🚀 Deployment

### Docker Deployment (Recommended)
```bash
# Build Docker image
docker build -t ldap-portal .

# Run with Docker Compose
docker-compose up -d
```

### Manual Deployment
```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

### Environment-Specific Configurations
- **Development**: Hot reload, debug logging enabled
- **Staging**: Production build with test data
- **Production**: Optimized build, security headers, monitoring

## 🔒 Security Features

- **HTTPS Enforcement** - All connections encrypted
- **CSRF Protection** - Built-in NextAuth.js protection
- **Input Validation** - Zod schema validation
- **Rate Limiting** - API endpoint protection
- **Audit Logging** - All admin actions logged
- **Session Security** - Secure cookie configuration

## 👥 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Employee** | View own profile, change password, view attendance |
| **Department Admin** | Manage team members, view team attendance |
| **HR Admin** | Manage all employees, generate reports |
| **IT Admin** | System configuration, user management, audit logs |
| **Super Admin** | Full system access, security settings |

## 📊 Features by Role

### Employee Dashboard
- Personal profile management
- Password change/reset
- Attendance calendar view
- Monthly attendance reports
- Account status monitoring

### Admin Dashboard
- User management interface
- Bulk password resets
- Department attendance reports
- System health monitoring
- Audit log access

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

## 📈 Monitoring & Analytics

- **Application Performance Monitoring** - Response times, error rates
- **User Activity Tracking** - Login patterns, feature usage
- **System Health Checks** - LDAP connectivity, database performance
- **Security Monitoring** - Failed login attempts, suspicious activity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for detailed information.

## 📄 License

This project is licensed under the MIT License - see the [LICENCE](LICENCE) file for details.

## 🆘 Support

- **Documentation**: [Wiki Pages](../../wiki)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Internal Support**: Contact IT Helpdesk

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **ShadCN** - For the beautiful UI component library
- **NextAuth.js** - For robust authentication solutions
- **eSSL Security** - For biometric integration capabilities

---

**Built with ❤️ for modern workplace efficiency**
