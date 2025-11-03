import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Acesso negado. Nenhum token fornecido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decodedPayload.id;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido." });
  }
};

export default authMiddleware;
