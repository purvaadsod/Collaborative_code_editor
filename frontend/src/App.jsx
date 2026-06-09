import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5000");

const App = () => {

  const [joined, setJoined] = useState(false);

  const [roomId, setRoomId] = useState("");

  const [userName, setUserName] = useState("");

  const [language, setLanguage] = useState("javascript");

  const [code, setCode] = useState("// Start coding here");

  const [users, setUsers] = useState([]);

  const [typing, setTyping] = useState("");

  const [output, setOutput] = useState("");

  // SOCKET EVENTS
  useEffect(() => {

    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user) => {

      setTyping(`${user} is typing...`);

      setTimeout(() => {
        setTyping("");
      }, 2000);

    });

    socket.on("languageUpdate", ({ language, code }) => {

      setLanguage(language);

      if (code) {
        setCode(code);
      }

    });

    socket.on("codeResponse", (response) => {

      setOutput(response.run.output);

    });

    return () => {

      socket.off("userJoined");

      socket.off("codeUpdate");

      socket.off("userTyping");

      socket.off("languageUpdate");

      socket.off("codeResponse");

    };

  }, []);

  // JOIN ROOM
  const joinRoom = () => {

    if (roomId && userName) {

      socket.emit("join", {
        roomId,
        userName,
      });

      setJoined(true);
    }
  };

  // LEAVE ROOM
  const leaveRoom = () => {

    socket.emit("leaveRoom");

    setJoined(false);

    setRoomId("");

    setUserName("");

    setCode("// Start coding here");

    setOutput("");

  };

  // COPY ROOM ID
  const copyRoomId = () => {

    navigator.clipboard.writeText(roomId);

    alert("Room ID Copied");

  };

  // REALTIME CODE
  const handleCodeChange = (newCode) => {

    if (newCode === undefined) return;

    setCode(newCode);

    socket.emit("codeChange", {
      roomId,
      code: newCode,
    });

    socket.emit("typing", {
      roomId,
      userName,
    });

  };

  // LANGUAGE CHANGE
  const handleLanguageChange = (e) => {

    const newLanguage = e.target.value;

    setLanguage(newLanguage);

    socket.emit("languageChange", {
      roomId,
      language: newLanguage,
      code,
    });

  };

  // RUN CODE
  const runCode = () => {

    setOutput("Running code...");

    socket.emit("compileCode", {
      code,
      roomId,
      language,
    });

  };

  // JOIN SCREEN
  if (!joined) {

    return (

      <div className="join-container">

        <div className="join-form">

          <h1>Realtime Code Editor</h1>

          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />

          <button onClick={joinRoom}>
            Join Room
          </button>

        </div>

      </div>

    );
  }

  // MAIN SCREEN
  return (

    <div className="editor-container">

      {/* SIDEBAR */}
      <div className="sidebar">

        <div className="room-info">

          <h2>Room: {roomId}</h2>

          <button
            className="copy-button"
            onClick={copyRoomId}
          >
            Copy Room ID
          </button>

        </div>

        <h3>Users</h3>

        <ul>
          {users.map((user, index) => (
            <li key={index}>
              {user}
            </li>
          ))}
        </ul>

        <p className="typing-indicator">
          {typing}
        </p>

        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >

          <option value="javascript">
            JavaScript
          </option>

          <option value="python">
            Python
          </option>

          <option value="java">
            Java
          </option>

          <option value="cpp">
            C++
          </option>

        </select>

        <button
          className="leave-button"
          onClick={leaveRoom}
        >
          Leave Room
        </button>

      </div>

      {/* EDITOR */}
      <div className="editor-wrapper">

        <div className="editor-box">

          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: {
                enabled: false,
              },
              fontSize: 14,
              automaticLayout: true,
            }}
          />

        </div>

        <button
          className="run-btn"
          onClick={runCode}
        >
          Execute
        </button>

        <textarea
          className="output-console"
          value={output}
          readOnly
          placeholder="Output will appear here..."
        />

      </div>

    </div>

  );
};

export default App;