import multer from "multer";
import { config } from "../config.js";
import { HttpError } from "../services/imageService.js";

// 서버리스 환경에서도 동작하도록 디스크가 아닌 메모리에 저장
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter(req, file, cb) {
    if (config.acceptedMimeTypes.includes(file.mimetype)) return cb(null, true);
    cb(new HttpError(400, "PNG, JPG, WEBP 이미지만 업로드할 수 있습니다."));
  },
}).single("image");
