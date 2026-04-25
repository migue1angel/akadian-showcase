# Akadian Showcase

Akadian is an academic platform that manages classes, users, roles, and payments in a unified flow.
It combines teaching operations, administration, and subscriptions in a single system.

**Stack**

- Angular
- NestJS
- PostgreSQL
- Stripe

## 📸 Screenshots

**Coordinator dashboard**

![Coordinator dashboard](docs/images/coordinator-dashborad-student.png)

**Coordinator student management**

![Coordinator student management](docs/images/coordinator-student-managment.png)

**Coordinator new program**

![Coordinator new program](docs/images/coordinator-new-program.png)

**Coordinator file manager**

![Coordinator file manager](docs/images/coordinator-file-manager.png)

**Student main page**

![Student main page](docs/images/student-main-page.png)

**Student course page**

![Student course page](docs/images/student-course-page.png)

**Student progress page**

![Student progress page](docs/images/student-progress-page.png)

## 🏗️ Architecture

![Architecture](docs/architecture.png)

**ERD (database)**

![ERD](docs/bd-schema-erd-1.png)
![ERD](docs/bd-schema-erd2.png)

**Key notes**

- Clear frontend/backend separation for independent deployment and scaling.
- Modular NestJS architecture for domains like users, classes, subscriptions, and payments.
- Role-based authentication (RBAC) to separate admin, tutor, and student flows.
- Stripe integration for charges, subscription states, and webhooks.

## ⚙️ Features

- Roles and permissions (admin, tutor, student)
- Class, session, and attendance management
- Subscriptions and recurring payments
- Admin panel with catalogs and reports

## 🧪 Technical decisions

- **NestJS** for its modular architecture and alignment with DDD for domain growth.
- **Database design** normalized with versioned migrations to avoid drift.
- **Stripe webhooks** to keep payment state and user access in sync.
- **DigitalOcean Spaces** for files and evidence without overloading the core API.

## 🔒 Code note

The full source code is private due to project scope, but selected modules and architectural samples are included in this repository. Full access can be granted upon request.

