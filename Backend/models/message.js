import mongoose from 'mongoose';

const userMessages = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // for 1-1 chat
    required: false,
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat", // for group chat
    required: false, // <- ❗ change this
  },
  text: { type: String },
  image: { type: String },
  seen: { type: Boolean, default: false },
}, { timestamps: true });

// Optional: Add a pre-save check to ensure either receiverId or chatId is provided
userMessages.pre("save", function (next) {
  if (!this.receiverId && !this.chatId) {
    return next(new Error("Either receiverId or chatId must be provided"));
  }
  next();
});

const Message = mongoose.model("Message", userMessages);
export default Message;
