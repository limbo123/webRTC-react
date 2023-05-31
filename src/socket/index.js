import { io } from "socket.io-client";

const options = {
    "force new connections": true,
    reconnectionAttempts: "Infinity",
    transports: ["websocket"],
};

const socket = io("http://localhost:3001", options);

export default socket;