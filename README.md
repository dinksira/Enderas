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
    ├── src/
    │   ├── config/
    │   │   ├── db.config.js
    │   │   ├── env.config.js
    │   │   ├── redis.config.js
    │   │   └── logger.config.js
    │   │
    │   ├── models/
    │   │   ├── user.model.js
    │   │   ├── role.model.js
    │   │   ├── kyc.model.js
    │   │   ├── asset.model.js
    │   │   ├── assetOwner.model.js
    │   │   ├── evaluation.model.js
    │   │   ├── auction.model.js
    │   │   ├── auctionDocument.model.js
    │   │   ├── payment.model.js
    │   │   ├── cpo.model.js
    │   │   ├── bid.model.js
    │   │   ├── winner.model.js
    │   │   ├── notification.model.js
    │   │   ├── staff.model.js
    │   │   └── auditLog.model.js
    │   │
    │   ├── controllers/
    │   │   ├── auth.controller.js
    │   │   ├── user.controller.js
    │   │   ├── kyc.controller.js
    │   │   ├── asset.controller.js
    │   │   ├── evaluation.controller.js
    │   │   ├── auction.controller.js
    │   │   ├── document.controller.js
    │   │   ├── payment.controller.js
    │   │   ├── cpo.controller.js
    │   │   ├── bid.controller.js
    │   │   ├── winner.controller.js
    │   │   ├── notification.controller.js
    │   │   ├── staff.controller.js
    │   │   └── dashboard.controller.js
    │   │
    │   ├── services/
    │   │   ├── auth.service.js
    │   │   ├── user.service.js
    │   │   ├── otp.service.js
    │   │   ├── kyc.service.js
    │   │   ├── asset.service.js
    │   │   ├── evaluation.service.js
    │   │   ├── auction.service.js
    │   │   ├── document.service.js
    │   │   ├── payment.service.js
    │   │   ├── addisPay.service.js
    │   │   ├── cpo.service.js
    │   │   ├── bid.service.js
    │   │   ├── winner.service.js
    │   │   ├── notification.service.js
    │   │   ├── sms.service.js
    │   │   ├── email.service.js
    │   │   ├── fileStorage.service.js
    │   │   └── auditLog.service.js
    │   │
    │   ├── routes/
    │   │   ├── index.js
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
    │   │   └── dashboard.routes.js
    │   │
    │   ├── middlewares/
    │   │   ├── auth.middleware.js
    │   │   ├── role.middleware.js
    │   │   ├── error.middleware.js
    │   │   ├── validation.middleware.js
    │   │   ├── upload.middleware.js
    │   │   ├── rateLimit.middleware.js
    │   │   └── audit.middleware.js
    │   │
    │   ├── validations/
    │   │   ├── auth.validation.js
    │   │   ├── user.validation.js
    │   │   ├── asset.validation.js
    │   │   ├── auction.validation.js
    │   │   ├── payment.validation.js
    │   │   ├── bid.validation.js
    │   │   └── cpo.validation.js
    │   │
    │   ├── utils/
    │   │   ├── response.util.js
    │   │   ├── error.util.js
    │   │   ├── jwt.util.js
    │   │   ├── otp.util.js
    │   │   ├── date.util.js
    │   │   └── constants.util.js
    │   │
    │   ├── jobs/
    │   │   ├── auctionCloser.job.js
    │   │   ├── notification.job.js
    │   │   ├── paymentSync.job.js
    │   │   └── reportGenerator.job.js
    │   │
    │   ├── integrations/
    │      ├── addisPay.integration.js
    │      ├── sms.integration.js
    │      ├── email.integration.js
    │      └── fileStorage.integration.js
    │   
    │   
    │   
    │
    ├── tests/
    │   ├── auth.test.js
    │   ├── auction.test.js
    │   ├── bid.test.js
    │   └── payment.test.js
    │-── server.js
    ├── app.js
    ├── package.json
    ├── .env
    ├── .gitignore
    └── README.md