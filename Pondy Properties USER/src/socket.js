import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL, { transports: ["websocket"] });

export const registerUser = (phoneNumber) => {
  socket.emit("register", phoneNumber);
};

export const listenForNotifications = (callback) => {
  socket.on("newNotification", callback);
};

export default socket;
