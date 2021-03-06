const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(authRoutes);
const http = require("http").Server(app);
const socketio = require("socket.io");
const mongodb =
  "mongodb+srv://rupesh:India1234@cluster0.lmlpy.mongodb.net/chat-database?retryWrites=true&w=majority";
const mongoose = require("mongoose");
const { addUser, getUser, removeUser } = require("./helper");
const io = socketio(http);
const PORT = process.env.PORT || 5000;
mongoose
  .connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("connected"))
  .catch((err) => console.log(err));
const Room = require("./models/Room");
const Message = require("./models/Message");
const { get } = require("./routes/authRoutes");

app.get("/set-cookies", (req, res) => {
  res.cookie("username", "Tony");
  res.cookie("isAuthenticated", true, { maxAge: 24 * 60 * 60 * 1000 });
  res.send("cookies are set");
});

app.get("/get-cookies", (req, res) => {
  const cookies = req.cookies;
  console.log(cookies);
  res.json(cookies);
});

io.on("connection", (socket) => {
  console.log(socket.id);
  Room.find().then((result) => {
    console.log(result);
    socket.emit("output-rooms", result);
  });
  socket.on("create-room", (name) => {
    //console.log('room name emmited',name)
    const room = Room({ name });
    room.save().then((result) => {
      io.emit("room-created", result);
    });
  });
  socket.on("join", ({ name, room_id, user_id }) => {
    const { error, user } = addUser({
      socket_id: socket.id,
      name,
      room_id,
      user_id,
    });
    socket.join(room_id);
    if (error) {
      console.log("Error in adding user");
    } else {
      console.log("join user", user);
    }
  });
  socket.on("sendMessage", (message, room_id, callback) => {
    const user = getUser(socket.id);
    const msgToStore = {
      name: user.name,
      user_id: user.user_id,
      room_id,
      text: message,
    };
    message = Message(msgToStore);
    message.save().then((result) => {
      io.to(room_id).emit("message", result);
      callback();
    });
  });

  socket.on("get-messages-history", (room_id) => {
    Message.find({ room_id }).then((result) => {
      socket.emit("output-messages", result);
    });
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`listening on PORT:${PORT}`);
});
