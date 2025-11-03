import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  userOneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userTwoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Match = mongoose.model("Match", matchSchema);

export default Match;
