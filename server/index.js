const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messages");
const socket = require("socket.io");
require("dotenv").config();

const app = express();

// ======================
// Middleware
// ======================
app.use(express.json());

// ======================
// CORS Configuration
// ======================
const corsOptions = {
  origin: [
    "https://chat-application-jac6.vercel.app", // deployed frontend
    "http://localhost:3000", // allow local dev too (optional)
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight handling

// ======================
// Routes
// ======================
app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoutes);

// ✅ Removed `/api/avatar/:id` route (frontend calls Multiavatar directly)

// Simple ping route
app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

// ======================
// MongoDB Connection
// ======================
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.log("❌ MongoDB Error:", err.message);
  });

// ======================
// Start Server
// ======================
const server = app.listen(process.env.PORT, () => {
  console.log(`🚀 Server Started on Port ${process.env.PORT}`);
});

// ======================
// Socket.io Setup
// ======================
const io = socket(server, {
  cors: {
    origin: [
      "https://chat-application-jac6.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });

  socket.on("disconnect", () => {
    // Optional: cleanup user from onlineUsers map
  });
});
