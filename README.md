# Payroll system

This project consists of two parts:

- **Client**: Vue 3 application using Vite.
- **Server**: Express.js backend with MongoDB.

## Client Setup

This template should help get you started developing with Vue 3 in Vite.

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

### Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Project Setup

```sh
npm install
```

#### Compile and Hot-Reload for Development

```sh
npm run client
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
cd server
npm install
```

### Environment Variables

Create a `.env` file in the `server` folder and configure the necessary environment variables, such as:

```
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/your-database

# Generate a random string of 32 characters
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Run the Server

For development with automatic restarts (using **nodemon**):

```sh
npm run server
```

For production:

```sh
npm start
```

---
