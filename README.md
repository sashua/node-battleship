# Battleship

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-272727?style=flat&logo=nodedotjs&logoColor=339933)

Implemented a backend server for the battleship game backend using the [ws](https://github.com/websockets/ws) websocket library

## Installation

You must have [Node.js](https://nodejs.org/en/download) installed on your computer

### 1. Clone or copy this repository locally

```sh
# by SSH
git clone git@github.com:sashua/node-battleship.git

# or HTTPS
git clone https://github.com/sashua/node-battleship.git
```

### 2. Go to the project directory

```sh
cd node-battleship
```

### 3. Switch to `dev` branch and install dependencies

```sh
git checkout dev
npm install
```

### 4. Create `.env` file and set `PORT` environment variable (default port is `3000` if not specified)

```sh
echo "PORT=3000" > .env
```

## Usage

Run the server in production or development mode

```sh
# production mode
npm run start

# development mode
npm run start:dev
```

and then open your browser and enjoy the game 🚀 [http://localhost:3000](http://localhost:3000)

## Notes

This project was created as part of the _"Node.js"_ course

[Assignment description](https://github.com/AlreadyBored/nodejs-assignments/blob/main/assignments/battleship/assignment.md)

[![RS School](https://img.shields.io/badge/RS_School-Node.js_2023Q2-F8E856?style=flat)](https://rs.school)
