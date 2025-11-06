import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.js";

const loginController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email e senha são obrigatórios." });
      }

      const user = await User.findOne({ email: email });
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Credenciais inválidas." });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
      };

      res.status(200).json({
        message: "Login bem-sucedido",
        token: token,
        user: userResponse,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ message: "Erro interno no servidor" });
    }
  },
};

export default loginController;
