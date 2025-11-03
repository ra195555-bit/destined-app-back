import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  likerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const like = mongoose.model("Like", likeSchema);

export default like;
