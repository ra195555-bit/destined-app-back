import Like from "../models/like.js";
import Match from "../models/match.js";

const createLike = async (req, res) => {
  const { likedId } = req.body;
  const likerId = req.userId;

  if (!likedId) {
    return res
      .status(400)
      .json({ message: "O ID do usuário 'likedId' é obrigatório." });
  }

  if (likerId === likedId) {
    return res
      .status(400)
      .json({ message: "Você não pode dar like em si mesmo." });
  }

  try {
    const alreadyLiked = await Like.findOne({
      likerId: likerId,
      likedId: likedId,
    });

    if (alreadyLiked) {
      return res.status(200).json({ message: "Você já curtiu este perfil." });
    }

    const theyLikeYou = await Like.findOne({
      likerId: likedId,
      likedId: likerId,
    });

    if (theyLikeYou) {
      const newMatch = await Match.create({
        userOneId: likerId,
        userTwoId: likedId,
      });

      await Like.deleteOne({ _id: theyLikeYou._id });

      return res.status(201).json({
        message: "É um Match! ",
        match: true,
        matchId: newMatch._id,
      });
    } else {
      if (!alreadyLiked) {
        await Like.create({
          likerId: likerId,
          likedId: likedId,
        });
      }

      return res.status(201).json({
        message: "Like registrado com sucesso.",
        match: false,
      });
    }
  } catch (error) {
    console.error("Erro na lógica de like/match:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
};

export default createLike;
