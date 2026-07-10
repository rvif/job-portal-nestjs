# Rozgaar API

A production-ready Job Portal backend built with **NestJS**, designed around real-world hiring workflows, secure authentication, cloud file storage, asynchronous processing, and scalable architecture.

**Live API**

https://job-portal-nestjs.onrender.com/

**Swagger docs**

https://job-portal-nestjs.onrender.com/docs/  (still in dev)

---

## Features

### Authentication

* JWT Authentication
* Refresh Token Rotation
* Email Verification using OTP
* Forgot Password
* Password Reset
* Google OAuth Login
* OAuth User Onboarding
* Account Linking (OAuth users can later create a password)
* Global Role Based Authorization

---

### Users

* Candidate Accounts
* Recruiter Accounts
* Profile Management

---

### Organizations

* Create Organization
* Invite Members
* Role Management
* Permissions
* Organization Dashboard
* Organization Reports
* Manual Organization Verification
* Verified Domains
* Public Organization Profiles

---

### Jobs

* Create / Update / Delete Jobs
* Soft Job Closing
* Advanced Search
* Filtering
* Pagination
* Sorting
* Public Job Listing

---

### Applications

* Resume Upload (Cloudinary)
* Candidate Application Tracking
* Resume Replacement
* Hiring State Machine

Example:

```
Applied
   ↓
Reviewing
   ↓
Shortlisted
   ↓
Hired
```

Invalid transitions are rejected automatically.

Recruiters can update application status while candidates receive email notifications on every status change.

---

### Email System

Emails are sent for:

* Email Verification
* Password Reset
* Application Status Updates
* Organization Reports

Email delivery is handled asynchronously using **BullMQ**.

---

### Redis

Used for

* BullMQ Job Queue
* Dashboard Caching

---

### Cloud Storage

Resume uploads are handled using

* Cloudinary

Features include

* Upload
* Replacement
* Automatic cleanup of old resumes

---

### Security

* Global Validation Pipe
* DTO Validation
* Role Guards
* JWT Guards
* Developer Guard
* Global Rate Limiting
* Refresh Token Revocation

---

## Tech Stack

### Backend

* NestJS
* TypeScript
* TypeORM
* PostgreSQL

### Authentication

* JWT
* Passport
* Google OAuth 2.0
* bcrypt

### Infrastructure

* Neon PostgreSQL
* Upstash Redis
* Cloudinary
* Render

### Background Jobs

* BullMQ

### Email

* Nodemailer

---

## Environment Variables

```env
ENV=DEV/PROD

DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_NAME=

DATABASE_URL=

JWT_SECRET=

MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
UPSTASH_REDIS_URL=

DEVELOPER_MASTER_KEY=
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/rvif/job-portal-nestjs/
```

Install dependencies

```bash
npm install
```

Start development server

```bash
npm run start:dev
```

Build production

```bash
npm run build
```

Run production

```bash
npm run start:prod
```

---

## Database

Development currently uses TypeORM synchronization.

Production should use migrations.

```
TypeORM Migrations (scripts to generate, run migrations added in package.json)
```

---

## API Documentation

Swagger integration has been added and documentation is currently being expanded.

---

## Postman Collection

A complete Postman collection covering authentication, organizations, jobs, applications, OAuth, dashboards, and reports is included in this repository.

---

## Deployment

Current deployment

* Render
* Neon PostgreSQL
* Upstash Redis
* Cloudinary

---

## Future Improvements

* Full Swagger documentation
* Frontend (React)
* Docker
* Kubernetes
* Microservices
* WebSockets
* Elasticsearch
* CI/CD Pipeline
* Unit & Integration Testing

---

## License

MIT
