import mongoose from "mongoose";
import bcrypt from "bcrypt";

const saltRounds = 10;

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "O email é obrigatório"],
    unique: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: [true, "O nome é obrigatório"],
  },
  password: {
    type: String,
    required: [true, "A senha é obrigatória"],
  },
  dateOfBirthday: {
    type: Date,
    required: [true, "Data de nascimento é obrigatória"],
  },
  gender: {
    type: String,
    enum: ["homem", "mulher"],
    required: [true, "O gênero é obrigatório"],
  },
  preference: {
    type: String,
    enum: ["homem", "mulher", "todos"],
    required: true,
  },
  interests: {
    type: [String],
    default: [],
  },
  photos: {
    type: [String],
    default: [],
  },
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(saltRounds);
    user.password = await bcrypt.hash(user.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
