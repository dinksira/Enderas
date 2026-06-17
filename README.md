# enderass-auction-system
The purpose of this system is to digitize and manage the core auction lifecycle for Enderass National PLC through a web application and mobile applications.


Project Technical Architecture & Environment Rules

Backend Stack

* Node.js
* Express.js
* Pure JavaScript (No TypeScript)

Frontend Stack

* Vite
* Modern frontend architecture
* Clean component structure
* Scalable folder organization

Database

* MySQL
* Sequelize ORM
* No Prisma

Environment Variable Rules

* No hardcoded values anywhere in the project
* Every configurable value must come from the `.env` file
* All secrets, credentials, URLs, ports, tokens, database configurations, and external service keys must be environment-based
* Database connection must dynamically use environment variables
* Database name must NEVER be hardcoded
* The system must support changing database credentials and database names directly from `.env` without modifying source code
* All environments (development, staging, production) must be configurable independently

Required Environment Variables

* PORT
* NODE_ENV
* DB_HOST
* DB_PORT
* DB_NAME
* DB_USER
* DB_PASSWORD
* JWT_SECRET
* JWT_EXPIRES_IN
* CLIENT_URL
* API_BASE_URL
*others
Backend Architecture Rules

* Use clean and scalable architecture
* Use modular folder structure
* Separate:

  * models
  * controllers
  * services
  * middleware
  * routes
  * validations
  * utilities
  * configuration
* Keep controllers thin
* Business logic must be inside services
* Use centralized error handling
* Use async/await consistently
* Use reusable response utilities
* Use reusable validation patterns
* Use proper authentication and authorization middleware

Database Rules

* Use Sequelize associations properly
* Use migrations and seeders
* Include timestamps in all tables
* Use soft delete where necessary
* Use UUIDs where appropriate
* Maintain clean relational structure

Security Rules

* Hash passwords securely
* Protect sensitive routes with JWT authentication
* Validate all incoming requests
* Prevent SQL injection and common vulnerabilities
* Never expose sensitive environment variables to frontend

Code Quality Rules

* Write production-ready code
* Use consistent naming conventions
* Keep files modular and reusable
* Avoid duplicated logic
* Follow RESTful API principles
* Write maintainable and scalable code

Frontend Rules

* Use reusable components
* Use modular page structure
* Keep API calls centralized
* Use environment variables for API URLs
* No hardcoded backend URLs
* Build responsive layouts
* Keep clean state management structure

General Development Rules

* Build scalable enterprise-ready architecture
* Prioritize maintainability and readability
* Optimize for future feature expansion
* Keep the project clean for team collaboration
* Ensure deployment flexibility across different servers and database names

backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── db.config.js
│   │   ├── env.config.js
│   │   ├── redis.config.js
│   │   ├── mail.config.js
│   │   └── sms.config.js
│   │
│   ├
│   ├
│   │
│   ├── routes/
│   │   ├── index.routes.js
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── kyc.routes.js
│   │   ├── asset.routes.js
│   │   ├── evaluation.routes.js
│   │   ├── auction.routes.js
│   │   ├── document.routes.js
│   │   ├── payment.routes.js
│   │   ├── cpo.routes.js
│   │   ├── bid.routes.js
│   │   ├── winner.routes.js
│   │   ├── notification.routes.js
│   │   ├── staff.routes.js
│   │   ├── report.routes.js
│   │   └── rbac.routes.js
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   ├── auth.validation.js
│   │   │   └── auth.model.js
│   │   │
│   │   ├── user/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.repository.js
│   │   │   ├── user.model.js
│   │   │   └── user.validation.js
│   │   │
│   │   ├── kyc/
│   │   │   ├── kyc.controller.js
│   │   │   ├── kyc.service.js
│   │   │   ├── kyc.repository.js
│   │   │   ├── kyc.model.js
│   │   │   └── kyc.validation.js
│   │   │
│   │   ├── asset/
│   │   │   ├── asset.controller.js
│   │   │   ├── asset.service.js
│   │   │   ├── asset.repository.js
│   │   │   ├── asset.model.js
│   │   │   └── asset.validation.js
│   │   │
│   │   ├── evaluation/
│   │   │   ├── evaluation.controller.js
│   │   │   ├── evaluation.service.js
│   │   │   ├── evaluation.repository.js
│   │   │   ├── evaluation.model.js
│   │   │   └── evaluation.validation.js
│   │   │
│   │   ├── auction/
│   │   │   ├── auction.controller.js
│   │   │   ├── auction.service.js
│   │   │   ├── auction.repository.js
│   │   │   ├── auction.model.js
│   │   │   └── auction.validation.js
│   │   │
│   │   ├── document/
│   │   │   ├── document.controller.js
│   │   │   ├── document.service.js
│   │   │   ├── document.repository.js
│   │   │   ├── document.model.js
│   │   │   └── document.validation.js
│   │   │
│   │   ├── payment/
│   │   │   ├── payment.controller.js
│   │   │   ├── payment.service.js
│   │   │   ├── payment.repository.js
│   │   │   ├── payment.model.js
│   │   │   └── payment.validation.js
│   │   │
│   │   ├── cpo/
│   │   │   ├── cpo.controller.js
│   │   │   ├── cpo.service.js
│   │   │   ├── cpo.repository.js
│   │   │   ├── cpo.model.js
│   │   │   └── cpo.validation.js
│   │   │
│   │   ├── bid/
│   │   │   ├── bid.controller.js
│   │   │   ├── bid.service.js
│   │   │   ├── bid.repository.js
│   │   │   ├── bid.model.js
│   │   │   └── bid.validation.js
│   │   │
│   │   ├── winner/
│   │   │   ├── winner.controller.js
│   │   │   ├── winner.service.js
│   │   │   ├── winner.repository.js
│   │   │   └── winner.model.js
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.controller.js
│   │   │   ├── notification.service.js
│   │   │   ├── notification.repository.js
│   │   │   ├── notification.model.js
│   │   │   └── notification.provider.js
│   │   │
│   │   ├── staff/
│   │   │   ├── staff.controller.js
│   │   │   ├── staff.service.js
│   │   │   ├── staff.repository.js
│   │   │   ├── staff.model.js
│   │   │   └── staff.validation.js
│   │   │
│   │   ├── report/
│   │   │   ├── report.controller.js
│   │   │   ├── report.service.js
│   │   │   ├── report.repository.js
│   │   │   └── report.generator.js
│   │   │
│   │   └── rbac/
│   │       ├── rbac.middleware.js
│   │       ├── role.model.js
│   │       ├── permission.model.js
│   │       └── rbac.service.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── role.middleware.js
│   │   ├── upload.middleware.js
│   │   └── rateLimit.middleware.js
│   │
│   ├── integrations/
│   │   ├── addisPay.integration.js
│   │   ├── sms.gateway.js
│   │   ├── email.service.js
│   │   └── storage.service.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   ├── response.helper.js
│   │   ├── otp.helper.js
│   │   ├── date.helper.js
│   │   ├── file.helper.js
│   │   └── encryption.helper.js
│   │
│   ├── jobs/
│   │   ├── auction.scheduler.js
│   │   ├── notification.job.js
│   │   ├── payment.verification.job.js
│   │   └── cpo.expiry.job.js
│   │
│   ├── constants/
│   │   ├── roles.constant.js
│   │   ├── status.constant.js
│   │   ├── messages.constant.js
│   │   └── system.constant.js
│   │
│   ├── database/
│   │   ├── connection.js
│   │   ├── migrations/
│   │   └── seeders/
│   │
│   └── tests/
│       ├── auth.test.js
│       ├── auction.test.js
│       ├── payment.test.js
│       └── bid.test.js
│
├── uploads/
│   ├── kyc/
│   ├── assets/
│   ├── evaluations/
│   ├── documents/
│   ├── payments/
│   └── cpo/
│
├── logs/
│   ├── app.log
│   ├── error.log
│   └── audit.log
│── server.js
|── app.js
├── .env
├── .gitignore
├── package.json
├── README.md
└── nodemon.json