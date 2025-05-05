# Project Name

This is a test project for PSPExpress company

## Prerequisites

- Node.js (v16 or higher recommended)
- npm (v8 or higher)
- Database (PostgreSQL/MySQL/MongoDB - specify which one your project uses)

## Setup

1. **Install MikroORM CLI globally**:
   ```sh
   npm install -g @mikro-orm/
   
2. **Navigate to project directory:**:
   cd ./project

3.Install dependencies:
   npm install

4.Environment Setup
  Create a .env file in the root directory with the following variables:

  PORT=3000
  DB_NAME=your_database_name
  DB_HOST=localhost
  DB_PORT=5432 # (default for PostgreSQL)
  DB_USER=your_db_username
  DB_PASSWORD=your_db_password
  NODE_ENV=development
  JWT_SECRET=your_jwt_secret_key

5.Database migration:
  npm run migration:up

6.Run project:
  npm start

finally you can see project documents in /api rout with swagger