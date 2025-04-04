# Payroll system

This project consists of two parts:

- **Frontend**: Vue 3 application using Vite.
- **Backend**: Express.js backend with MongoDB.

## Frontend Setup

This template should help get you started developing with Vue 3 in Vite.

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Project Setup

```sh
npm install
```

#### Compile and Hot-Reload for Development

```sh
npm run dev
```

#### Type-Check, Compile and Minify for Production

```sh
npm run build
```

---

## Server Setup

This is an Express.js server with MongoDB, using **dotenv** for environment variables.

### Prerequisites

- **Node.js** (Latest LTS recommended)
- **MongoDB** (Running locally or using a cloud service like [MongoDB Atlas](https://www.mongodb.com/atlas))

### Install Dependencies

Navigate to the `server` folder and install dependencies:

```sh
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the `server` folder and configure the necessary environment variables, such as:

```
PORT=
# MONGO_URI=mongodb://localhost:27017/insert_database_name (MongoDB Compass)
MONGO_URI=
# Generate a random string of 32 characters
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
```

### Run the Server

For development with automatic restarts (using **nodemon**):

```sh
npm run dev
```

For production:

```sh
npm start
```

---
