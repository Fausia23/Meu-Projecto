import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

// Criar pasta caso não exista
import fs from "fs";
const uploadPath = "uploads/materiais/imagens";
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, "img-" + unique);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Envie apenas imagens!"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ROTA DE UPLOAD
router.post("/", upload.single("imagem"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada" });

  const url = `/uploads/materiais/imagens/${req.file.filename}`;
  res.status(201).json({ message: "Upload OK", imagem_url: url });
});

export default router;
