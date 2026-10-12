# Student Progress Tracker

A private tutoring workflow tool for tracking lesson delivery, student growth, homework, payments, and parent-facing reports.

This project is designed for one tutor to log lessons quickly, monitor progress over time, and generate monthly parent reports without a heavy admin burden.

## Overview

The Student Progress Tracker is a mobile-friendly, tutor-first application built to help a single educator:

- log lessons in a few minutes from a phone
- track student progress by topic and skill
- monitor homework completion and assessment results
- review performance trends and alert states
- generate monthly reports for parents
- share a private read-only report link
- track payments and lesson attendance

The design follows the product and technical specification in this repository and is intended to start as a focused Phase 1 build.

## Product goals

- log a lesson in under 2 minutes
- generate a monthly report in under 10 minutes per student
- highlight students who are improving, stuck, or falling behind
- reduce manual reporting work for a tutor
- keep parent reporting simple, private, and readable

## Core features

### Student management
- student profile with grade, province, time zone, parent contact info, goals, fee, status, and consent tracking
- package and lesson scheduling details
- active, paused, or ended student status

### Lesson logging
- attendance tracking
- duration and date entry
- topic coverage history
- accuracy and attempted totals
- independence and confidence scores
- error code tagging
- homework assignment and notes
- quick defaults from the previous lesson to reduce entry time

### Diagnostics and topic tracking
- baseline diagnostic entry
- correct / speed / confidence / error code tracking
- automatic topic status calculation using Secure, Developing, and Gap rules
- manual override for tutor decisions
- editable topic bank by grade and strand

### Assessments and homework
- quizzes and school test tracking
- homework due dates and results
- performance monitoring across lessons

### Dashboard and alerts
- monthly student summary cards
- trend arrows versus previous month
- homework completion and payment overview
- alert flags for missed lessons, low homework completion, falling accuracy, and overdue payment

### Reports
- monthly student report generation
- report preview before finalization
- HTML output and print-ready PDF workflow
- private share link for parent access
- saved reports by period

### Payments
- fee tracking
- payment status and due date monitoring
- outstanding balance view

### Privacy and backup
- private share links with optional expiry and revoke support
- CSV or JSON export for data backup
- database backup strategy for host-based deployment

## User roles

### Tutor (admin)
- full access to all student, lesson, dashboard, report, and payment data
- manages lesson entries and report generation

### Parent
- read-only access to the student's report via a private, unguessable link
- no login needed in v1

### Student
- no direct app access in v1

## Recommended stack

The product specification calls for:

- Front end: React + Vite + Tailwind
- Back end: Node.js + Express
- Database: MySQL (or MariaDB)
- Authentication: secure session cookie or short-lived auth tokens with bcrypt/argon2 hashing
- Reports: print stylesheet and browser PDF export first, with server-side PDF generation only if supported later
- Testing: unit tests around metric formulas and report calculations

## Repository structure

```text
Student-Tracker/
├── client/                  # React front end
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
├── server/                 # Express API
│   ├── index.js
│   └── package.json
├── .gitignore
├── README.md
└── package.json            # optional root-level workspace config if added later
```

## Local development

### Prerequisites

- Node.js 18 or newer
- npm
- a MySQL/MariaDB instance for production-ready data storage

### Install front end dependencies

```bash
cd client
npm install
```

### Install server dependencies

```bash
cd server
npm install
```

### Start the development server

#### Front end

```bash
cd client
npm run dev
```

#### Back end

```bash
cd server
node index.js
```

## Environment variables

Create environment files for local configuration as needed. Example values:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secret_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_tracker
```

Adjust according to your actual setup.

## Data model highlights

The application is designed around a tutor-owned data model including tables for:

- tutors
- students
- topics
- student_topics
- diagnostics
- diagnostic_items
- lessons
- lesson_topics
- homework
- assessments
- reports
- share_links
- payments

This keeps student data organized by tutor and allows the project to scale toward future multi-tutor support.

## Metric rules

The report and dashboard rely on clear metric definitions, including:

- accuracy = correct / attempted
- independence = average lesson independence score
- confidence = average lesson confidence score
- homework completion = done + 0.5 × partly
- attendance calculations that exclude cancellations by the tutor
- trend logic based on each period compared to the last period
- topic status rules based on repeated performance thresholds

These formulas should be tested carefully because they drive the report numbers.

## Report specification summary

Reports should include:

1. student header and period details
2. focus topics
3. baseline vs current comparison
4. quiz/test results
5. accuracy, independence, and homework trends
6. strengths
7. still developing areas with error analysis
8. next month goals
9. home suggestion
10. school-test note if shared by family

The spec also explicitly requires that report text never promises results and must clearly say when progress is flat.

## Privacy and security requirements

This is a child-data application, so privacy is not optional.

Important requirements from the product spec:

- collect only the minimum necessary information
- do not store surnames, school names, addresses, or photos
- record parental consent before storing student records
- use HTTPS in production
- keep backups away from the web folder
- provide a delete flow for any family who requests it
- never paste identifying student details into AI tools
- verify local compliance and legal advice before launch in Canada

## Build plan

Recommended staged plan:

### Phase 1
- login
- student profiles
- lesson log
- quiz entry
- basic report generation

### Phase 2
- baseline diagnostics
- topic tracker
- homework tracking
- dashboard alerts
- share links

### Phase 3
- payments tracker
- time zone support
- backup export
- polish and reporting workflow improvements

### Future expansion
- multi-tutor support
- tutor invitations
- audit logging
- owner dashboard
- payouts tracking

## Acceptance tests

The project should be validated against the following core checks:

- log a lesson on a phone in under 2 minutes
- generate a report whose figures match manual calculation
- parent links show only the relevant student data
- student deletion removes all associated records
- a lesson time in Nigeria displays correctly for a Saskatchewan-based tutor

## Notes

This repository is a practical starting point for the Student Progress Tracker described in the product spec. The app can be built incrementally, starting with a single tutor workflow and expanding into a fuller multi-tutor platform later.

## License

This project has no explicit license declared yet. If this is being prepared for public use, add a license file such as MIT before sharing externally.

## Recommended next steps

1. confirm whether the hosting environment supports Node.js or only PHP/MySQL
2. define the first real student data set and lesson workflow
3. implement the core lesson logging flow and report generation first
4. add automated tests for the metric formulas before production use
5. review safety and privacy requirements before putting student data online
