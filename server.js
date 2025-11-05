import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import datingAppRoutes from "./routes/datingAppRoutes.js";
import dotenv from "dotenv";

dotenv.config();

console.log("Iniciando o servidor...");
console.log("Tentando conectar ao MongoDB...");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" MongoDB conectado com sucesso!");
    const server = express();
    server.use(express.json());
    server.use(express.urlencoded());
    server.use(cors());
    server.use("/uploads", express.static("uploads"));
    server.use(datingAppRoutes);

    server.get("/health", async (_, res) => {
      try {
        res.status(200).json({ message: "Alive" });
      } catch (error) {
        res.status(500).json({ message: "Servidor offline", error });
      }
    });

    server.listen(5000);
  })
  .catch((error) => {
    console.log("Erro ao conectar ao MongoDB:", error);
  });
