import { Router } from "express";
import loginController from "../controllers/loginController.js";
import { createLike } from "../controllers/likeController.js";
import { getDiscoveryProfiles } from "../controllers/discoveryController.js";
import UserController from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import User from "../models/user.js";
import Like from "../models/like.js";
import Match from "../models/match.js";
import Message from "../models/message.js";
import userController from "../controllers/userController.js";
import multer from "multer";

const router = Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const fileExtesion = file.mimetype.split("/")[1];
    const name = `${file.fieldname} - ${uniqueSuffix}.${fileExtesion}`;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });

//Create user
router.post("/users", upload.single("profileImage"), async (req, res) => {
  const { email, name, password, dateOfBirthday, preference, gender } =
    req.body;
  try {
    const user = await User.create({
      email,
      name,
      password,
      dateOfBirthday,
      preference,
      gender,
      photos: req.file ? [req.file.path] : [],
    });

    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      dateOfBirthday: user.dateOfBirthday,
      preference: user.preference,
      gender: user.gender,
    };

    res
      .status(201)
      .json({ message: "Usuário criado com sucesso", user: userResponse });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Este email já está em uso." });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Dados inválidos. Verifique os campos.",
        errors: messages,
      });
    }
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
});

router.post("/login", loginController.login);

// Photo Upload
router.post(
  "/users/:userId/photos",
  authMiddleware,
  upload.array("photos", 5),
  async (req, res) => {
    const { userId } = req.params;

    if (req.userId !== userId) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      const photos = req.files.map((file) => file.path);
      user.photos = user.photos.concat(photos);

      const updatedUser = await user.save();

      res.status(200).json({
        message: "Fotos atualizadas com sucesso.",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Erro ao fazer upload de fotos:", error);
      res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
);

//Likes
router.post("/likes", authMiddleware, createLike);

//Home Swipe
router.get("/discovery", authMiddleware, getDiscoveryProfiles);

//Matches
router.get("/matches", authMiddleware, async (req, res) => {
  const currentUserId = req.userId;

  try {
    const userMatches = await Match.find({
      $or: [{ userOneId: currentUserId }, { userTwoId: currentUserId }],
    });

    const userIdToMatchIdMap = {};
    const matchedUserIds = userMatches.map((match) => {
      const otherUserId =
        match.userOneId.toString() === currentUserId.toString()
          ? match.userTwoId
          : match.userOneId;
      userIdToMatchIdMap[otherUserId] = match._id;
      return otherUserId;
    });

    const matchedProfiles = await User.find({ _id: { $in: matchedUserIds } });

    const responseProfiles = matchedProfiles.map((user) => ({
      id: user._id,
      name: user.name,
      dateOfBirthday: user.dateOfBirthday,
      gender: user.gender,
      photos: user.photos,
      matchId: userIdToMatchIdMap[user._id],
    }));

    res.status(200).json(responseProfiles);
  } catch (error) {
    console.error("Erro ao buscar matches:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

router.get("/matches/:matchId", authMiddleware, async (req, res) => {
  const { matchId } = req.params;
  const currentUserId = req.userId;

  try {
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ userOneId: currentUserId }, { userTwoId: currentUserId }],
    });

    if (!match) {
      return res.status(404).json({ message: "Match não encontrado." });
    }

    res.status(200).json(match);
  } catch (error) {
    console.error("Erro ao buscar dados do match:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

//Messages
router.get("/matches/:matchId/messages", authMiddleware, async (req, res) => {
  const { matchId } = req.params;
  const currentUserId = req.userId;

  try {
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ userOneId: currentUserId }, { userTwoId: currentUserId }],
    });

    if (!match) {
      return res.status(404).json({ message: "Match não encontrado." });
    }

    const message = await Message.find({ matchId: matchId }).sort({
      timestamp: 1,
    });

    res.status(200).json(message);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

//Chat
router.get(
  "/users/:otherUserId",
  authMiddleware,
  UserController.getUserProfile
);

router.post("/matches/:matchId/messages", authMiddleware, async (req, res) => {
  const { matchId } = req.params;
  const currentUserId = req.userId;
  const { content } = req.body;

  if (!content) {
    return res
      .status(400)
      .json({ message: "O campo 'content' é obrigatório." });
  }

  try {
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ userOneId: currentUserId }, { userTwoId: currentUserId }],
    });

    if (!match) {
      return res.status(404).json({
        message:
          "Match não encontrado ou você não pode enviar mensagens para ele.",
      });
    }

    const newMessage = await Message.create({
      matchId: matchId,
      senderId: currentUserId,
      content: content,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

//Likes, Interests
router.put("/users/:userId/interests", authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { interests } = req.body;

  if (req.userId !== userId) {
    return res.status(403).json({ message: "Acesso negado." });
  }

  if (!Array.isArray(interests)) {
    return res
      .status(400)
      .json({ message: "Os interesses devem ser um array." });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { interests: interests },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json({
      message: "Interesses atualizados com sucesso.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar interesses:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

router.put("/users/:userId/preference", authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { preference } = req.body;

  if (req.userId !== userId) {
    return res.status(403).json({ message: "Acesso negado." });
  }

  if (!preference || !["homem", "mulher", "todos"].includes(preference)) {
    return res.status(400).json({ message: "Preferência inválida." });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { preference: preference },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const userResponse = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      dateOfBirthday: updatedUser.dateOfBirthday,
      preference: updatedUser.preference,
      gender: updatedUser.gender,
      interests: updatedUser.interests,
      photos: updatedUser.photos,
    };

    res.status(200).json({
      message: "Preferência atualizada com sucesso.",
      user: userResponse,
    });
  } catch (error) {
    console.error("Erro ao atualizar preferência:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

router.get("/likes/who-liked-me", authMiddleware, async (req, res) => {
  const currentUserId = req.userId;

  try {
    const matches = await Match.find({
      $or: [{ userOneId: currentUserId }, { userTwoId: currentUserId }],
    });

    const matchedUserIds = matches.map((match) => {
      return match.userOneId.toString() === currentUserId.toString()
        ? match.userTwoId
        : match.userOneId;
    });

    const likes = await Like.find({
      likedId: currentUserId,
      likerId: { $nin: matchedUserIds },
    });

    const likerIds = likes.map((like) => like.likerId);

    const likerProfiles = await User.find({ _id: { $in: likerIds } });

    const responseUsers = likerProfiles.map((user) => ({
      id: user._id,
      name: user.name,
      dateOfBirthday: user.dateOfBirthday,
      gender: user.gender,
      photos: user.photos ? user.photos.map((p) => `/${p}`) : [],
    }));

    res.status(200).json(responseUsers);
  } catch (error) {
    console.error("Erro ao buscar 'who-liked-me':", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

export default router;
