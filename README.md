NSIToDo

Overview
NSIToDo is a Todo Management System built with a Next.js frontend and a Node.js backend using PostgreSQL. It allows users to register, log in, and manage todos with file attachments. Features include user roles (user and admin), todo assignment, notifications, file management, and responsive UI. The system demonstrates clean code practices, modular architecture, and modern web standards.

Features
User authentication with JWT
Profile management with profile picture upload
Admin role with user management
CRUD operations for todos
Assign todos to self or other users
Attach files to todos
Filter todos by "for me" and "for others"
Drag and drop todo ordering and status updates
Notifications for assigned and updated todos
Dedicated files page listing uploaded files
Responsive design for desktop and mobile


Installation
Clone the repository
cd nsitodo

Backend Setup
cd backend
npm install
Create a .env file with the following values
DATABASE_URL="postgresql://user:password@localhost:5432/nsitodo"
JWT_SECRET="yoursecretkey"
Run Prisma migrations--npx prisma migrate dev
Start the backend server--npm run dev

Frontend Setup
cd frontend
npm install
Create a .env.local file with the following values
NEXT_PUBLIC_API_URL="[http://localhost:5000](http://localhost:5000)"
Start the frontend--npm run dev

Running Prisma Studio
To explore the database visually
cd backend
npx prisma studio

Usage
Register a new user and log in
Access the dashboard to view todos
Create and assign todos with files
Admins can view and manage users
Files can be accessed from the files page
Notifications appear when todos are assigned or updated

Development Notes
Use React Query or SWR for API requests
Maintain consistent code formatting
Run lint checks before pushing code
Ensure environment variables are configured correctly
Database migrations should be applied with every schema update
