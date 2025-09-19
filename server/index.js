const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require("./routes/messages");
const socket = require("socket.io");
require("dotenv").config();

const app = express();

const axios = require("axios");




// ======================
// CORS Configuration
// ======================
const corsOptions = {
  origin: "https://chat-application-jac6.vercel.app", // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply CORS to all REST API routes
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// ======================
// Middleware
// ======================
app.use(express.json());

// ======================
// Routes
// ======================
app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/api/avatar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://api.multiavatar.com/${id}`, {
      responseType: "text",
    });
    res.send(response.data); // Send raw SVG back to frontend
  } catch (err) {
    res.status(500).send("Error fetching avatar");
  }
});

// Simple ping route
app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

// ======================
// MongoDB Connection
// ======================
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.log(err.message);
});

// ======================
// Start Server
// ======================
const server = app.listen(process.env.PORT, () => {
  console.log(`Server Started on Port ${process.env.PORT}`);
});

// ======================
// Socket.io Setup
// ======================
const io = socket(server, {
  cors: {
    origin: "https://chat-application-jac6.vercel.app",
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
    // Optional: remove user from onlineUsers map if needed
  });
});
