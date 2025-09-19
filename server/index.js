// index.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messages");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();

// --------- Basic settings ---------
app.set("trust proxy", 1); // important on hosted platforms (Render, Vercel proxies, etc.)

// --------- Middleware ---------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------- CORS (allow production + local dev) ---------
const ALLOWED_ORIGINS = [
  "https://chat-application-jac6.vercel.app", // your deployed frontend
  "http://localhost:3000", // local dev (optional)
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error("CORS policy: Origin not allowed"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // enable Access-Control-Allow-Credentials
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight requests

// --------- Routes ---------
app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/ping", (_req, res) => res.json({ msg: "Ping Successful" }));

// --------- 404 + Error handlers ---------
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err && (err.stack || err.message));
  if ((err && err.message && err.message.includes("CORS")) || err.name === "CorsError") {
    return res.status(401).json({ error: "CORS Error" });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

// --------- Start server after DB connection ---------
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (!process.env.MONGO_URL) {
      console.warn("Warning: MONGO_URL is not set. Database will fail to connect.");
    }
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}`);
    });

    // --------- socket.io setup ---------
    const io = new Server(server, {
      cors: {
        origin: ALLOWED_ORIGINS,
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
        // optional cleanup if you store reverse map
      });
    });

    // optional: handle unexpected rejections
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Rejection:", reason);
    });
  } catch (err) {
    console.error("Failed to start server:", err && (err.stack || err.message));
    process.exit(1);
  }
}

start();
