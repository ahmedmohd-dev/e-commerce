const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { setNotificationSocket } = require("./services/notification.service");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "").split(
        ","
      ) || "*",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("notifications:join", (userId) => {
    if (!userId) return;
    socket.join(String(userId));
  });

  socket.on("disconnect", () => {});
});

setNotificationSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
