# Akadian Showcase

A curated showcase of a production-oriented learning platform.

This repository represents a simplified and publicly shareable version of a larger project. The original platform contains additional modules, business workflows, and domain logic that are intentionally omitted from this repository.

The objective of this showcase is to expose the architecture, engineering practices, and implementation patterns behind the application while keeping the codebase focused and easy to review.

---

## Live Demo

🌐 https://akadian-showcase.netlify.app

## Demo Accounts

### Administrator
```
Email:
admin@showcase.dev

Password:
Pass123!
```

## Purpose

Rather than reproducing every feature of the original platform, this showcase focuses on the areas that best demonstrate the overall architecture and development approach, including:

- Authentication and authorization
- Modular backend architecture
- Frontend organization
- Program management
- Stripe payment integration
- Security best practices
- Error handling and validation
- Production-oriented project structure

---

## Repository Structure

```
akadian-showcase
│
├── frontend/    Angular application
│
└── backend/     NestJS REST API
```

Each application contains its own technical documentation:

- `frontend/README.md`
- `backend/README.md`

---

## Included Features

### Authentication

- Login
- Refresh Token
- Logout
- JWT Authentication (httpOnly cookies)
- Rate limiting
- Login lockout protection

### Program Management

- Program CRUD
- Pagination
- Nested Units
- Nested Unit Classes

### Payments

- Stripe Checkout Session
---

## Technology Stack

### Frontend

- Angular
- TypeScript
- PrimeNg
- TailwindCSS

### Backend

- NestJS
- PostgreSQL
- TypeORM
- Redis
- JWT
- Stripe

---

## Documentation

Technical details, project setup, architecture, and development workflow are documented separately for each application.

- **Frontend:** `frontend/README.md`
- **Backend:** `backend/README.md`

---

## About This Showcase

The goal of this repository is not to reproduce the entire application, but to provide a representative view of the project's architecture, coding standards, and engineering practices in a concise and review-friendly format.
