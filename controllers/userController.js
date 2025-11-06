import User from "../models/user.js";

const userController = {
  getUserProfile: async (req, res) => {
    const { otherUserId } = req.params;

    try {
      const user = await User.findById(otherUserId);

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      const userProfile = {
        name: user.name,
        photos: user.photos,
      };

      res.status(200).json(userProfile);
    } catch (error) {
      console.error("Erro ao buscar o perfil do usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  },
};

export default userController;
