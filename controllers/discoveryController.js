import User from "../models/user.js";
import Like from "../models/like.js";
import Match from "../models/match.js";

export const getDiscoveryProfiles = async (req, res) => {
  const currentUserId = req.userId;

  try {
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const likes = await Like.find({ likerId: currentUserId });
    const likedIds = likes.map((like) => like.likedId);

    const matches = await Match.find({
      $or: [{ userOneId: currentUserId }, { userTwoId: currentUserId }],
    });
    const matchedIds = matches.map((match) => {
      return match.userOneId.toString() === currentUserId.toString()
        ? match.userTwoId
        : match.userOneId;
    });

    const excludeIds = [currentUserId, ...likedIds, ...matchedIds];

    const queryFilter = {};

    if (currentUser.preference === "homem") {
      queryFilter.gender = "homem";
    } else if (currentUser.preference === "mulher") {
      queryFilter.gender = "mulher";
    } else if (currentUser.preference === "todos") {
      queryFilter.gender = { $in: ["homem", "mulher"] };
    }

    queryFilter._id = { $nin: excludeIds };

    const usersToDiscover = await User.find(queryFilter).limit(10);

    const responseUsers = usersToDiscover.map((user) => ({
      id: user._id,
      name: user.name,
      dateOfBirthday: user.dateOfBirthday,
      photos: user.photos.map((p) => `/${p}`),
    }));

    res.status(200).json(responseUsers);
  } catch (error) {
    console.error("Erro na rota /discovery:", error);
    res.status(500).json({ message: "Erro interno no servidor" });
  }
};
