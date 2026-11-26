# Port Damage Reporting System

A full-stack web application for submitting, managing, and tracking port damage reports.

## Technologies

### Frontend
- Vue 3
- Quasar
- Pinia
- Vite

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Zod
- Multer

## Features

- Submit new port damage reports
- Upload images with damage reports
- View and filter damage reports
- Track reports using tracking codes
- Update report statuses
- Delete reports
- View damage report statistics
- Validate incoming data
- Secure API with Helmet and CORS

## Project Structure

```text
port-damage-control/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── stores/
│   └── styles/
├── server/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   └── tests/
├── package.json
└── README.md
```

## Requirements

- Node.js 20 or later
- npm
- PostgreSQL

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/zohreh-zhr/port-damage-control.git
cd port-damage-control
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory using `.env.example` as a template.

Configure your PostgreSQL connection:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads/damage-images
MAX_FILE_SIZE_BYTES=2097152
```

Replace the database connection placeholders with your own PostgreSQL credentials and database name.

### 5. Set up the database

Make sure PostgreSQL is running and the database exists.

Run:

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 6. Start the backend

From the `server` directory:

```bash
npm run dev
```

The backend runs at:

`http://localhost:3000`

Health check:

`http://localhost:3000/health`

### 7. Start the frontend

Open a second terminal in the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

`http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports` | Get reports |
| POST | `/api/reports` | Create a report |
| GET | `/api/reports/:id` | Get a report by ID |
| PATCH | `/api/reports/:id/status` | Update report status |
| DELETE | `/api/reports/:id` | Delete a report |

## Testing

Backend tests:

```bash
cd server
npm test
```

Frontend API client tests are located in:

`src/services/__tests__/reportsApi.test.mjs`

## Security

- Real environment variables and credentials must never be committed.
- The `.env.example` file contains placeholder values only.
- Uploaded runtime files and dependencies are excluded from Git.

## Author

GitHub: [zohreh-zhr](https://github.com/zohreh-zhr)

## License

This project was developed as an educational project.