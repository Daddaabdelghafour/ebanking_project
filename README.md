# 🏦 E-Banking Application

<p align="center">
  <img src="https://img.shields.io/badge/Angular-19.2.11-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

A modern, secure, and user-friendly e-banking application with role-based access control for clients, bank agents, and administrators. Built with Angular and TailwindCSS.

## ✨ Features

### 👤 Client Portal

- Dashboard with financial overview
- Bank card management
- Transaction history and analytics
- Account management
- Funds transfer capabilities
- Customizable user interface

### 👨‍💼 Bank Agent Capabilities

- Client enrollment and verification
- Transaction monitoring and verification
- Profile and branch management
- Customer support tools

### 👑 Admin Features

- System-wide monitoring dashboard
- User management
- Currency management
- Security settings and controls
- Activity and audit logs

## 🏗️ Architecture

The application follows a modular architecture with feature-based organization:

```
e-banking-app/
├── src/
│   ├── app/
│   │   ├── features/             # Feature modules
│   │   │   ├── client/           # Client-specific features
│   │   │   ├── admin/            # Admin-specific features
│   │   │   └── bank-agent/       # Bank agent features
│   │   │
│   │   ├── layouts/              # Layout components
│   │   │   ├── client-layout/
│   │   │   ├── admin-layout/
│   │   │   └── agent-layout/
│   │   │
│   │   ├── shared/               # Shared modules and components
│   │   │   ├── ui/               # Reusable UI components
│   │   │   ├── navigation/       # Navigation components
│   │   │   └── services/         # Shared services
│   │   │
│   │   ├── app.routes.ts         # Application routes
│   │   └── app.config.ts         # App configuration
│   │
│   ├── assets/                   # Static assets
│   └── styles.css                # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/e-banking-app.git
cd e-banking-app
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
ng serve
```

4. Open your browser and navigate to `http://localhost:4200`

## 🖥️ User Interfaces

### Role-Based Layouts

The application provides three distinct layouts based on user roles:

- **Client Layout** (`/dashboard`) - Personal banking interface
- **Bank Agent Layout** (`/bank-agent/dashboard`) - Agent operations interface
- **Admin Layout** (`/admin/dashboard`) - Administrative control panel

## 🔄 Workflow

### Client Journey

```mermaid
graph TD
    A[Login] --> B[Dashboard]
    B --> C[View Accounts]
    B --> D[View Cards]
    B --> E[Transfer Funds]
    B --> F[Pay Bills]
    E --> G[Transaction Confirmation]
    F --> G
```

### Bank Agent Journey

```mermaid
graph TD
    A[Login] --> B[Agent Dashboard]
    B --> C[Client Enrollment]
    B --> D[Transaction Verification]
    B --> E[Update Profile]
    C --> F[Submit for Approval]
    D --> G[Flag Suspicious Activity]
```

## 📱 Responsive Design

The application is fully responsive and works seamlessly across desktop, tablet, and mobile devices thanks to TailwindCSS utility classes.

## 🔒 Security Features

- Role-based access control
- Session management
- Input validation and sanitization
- Secure API communication
- Suspicious activity monitoring

## 🛠️ Development

### Adding New Components

```bash
ng generate component features/my-feature/my-component --standalone
```

### Running Tests

```bash
# Unit tests
ng test

# End-to-end tests
ng e2e
```

### Building for Production

```bash
ng build --configuration production
```

## 🔌 Backend Integration

The frontend is designed to integrate with any modern REST API. Configure the API endpoints in the environment files.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
