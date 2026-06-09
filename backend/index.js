import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  let currentRoom = null;
  let currentUser = null;

  // JOIN ROOM
  socket.on("join", ({ roomId, userName }) => {

  currentRoom = roomId;
  currentUser = userName;

  socket.join(roomId);

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  rooms.get(roomId).add(userName);

  const roomUsers = Array.from(rooms.get(roomId));

  io.to(roomId).emit("userJoined", roomUsers);

  console.log(roomUsers);
});

  // REALTIME CODE
  socket.on("codeChange", ({ roomId, code }) => {
  io.to(roomId).emit("codeUpdate", code);
});

  // TYPING
  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

// LANGUAGE CHANGE
socket.on("languageChange", ({ roomId, language, code }) => {

  io.to(roomId).emit("languageUpdate", {
    language,
    code,
  });

});


  socket.on("compileCode", async ({ code, roomId, language }) => {

  try {

    let jdoodleLanguage = "";
    let versionIndex = "0";

    // JAVASCRIPT
    if (language === "javascript") {
      jdoodleLanguage = "nodejs";
      versionIndex = "4";
    }

    // PYTHON
    else if (language === "python") {
      jdoodleLanguage = "python3";
      versionIndex = "4";
    }

    // JAVA
    else if (language === "java") {
      jdoodleLanguage = "java";
      versionIndex = "4";
    }

    // CPP
    else if (language === "cpp") {
      jdoodleLanguage = "cpp17";
      versionIndex = "0";
    }

    console.log(jdoodleLanguage);

    const response = await axios.post(
      "https://api.jdoodle.com/v1/execute",
      {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: code,
        language: jdoodleLanguage,
        versionIndex: versionIndex,
      }
    );

    console.log(response.data);

    io.to(roomId).emit("codeResponse", {
      run: {
        output: response.data.output,
      },
    });

  } catch (error) {

    console.log(error.response?.data || error.message);

    io.to(roomId).emit("codeResponse", {
      run: {
        output: "Error running code",
      },
    });

  }

});

  // LEAVE ROOM
  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(currentUser);

      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom))
      );

      socket.leave(currentRoom);
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {

  if (
    currentRoom &&
    currentUser &&
    rooms.has(currentRoom)
  ) {

    rooms.get(currentRoom).delete(currentUser);

    io.to(currentRoom).emit(
      "userJoined",
      Array.from(rooms.get(currentRoom))
    );
  }

  console.log("User disconnected");
});
});

const port = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "frontend/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});