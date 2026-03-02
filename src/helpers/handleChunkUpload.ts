import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const handleChunkUpload = async (req: Request, res: Response) => {
  try {
    const chunkFile = req.file;

    const { chunkIndex, totalChunks, originalname } = req.body;
    const uploadId = crypto.randomUUID()
    if (!chunkFile || !uploadId) {
      return res.status(400).json({ message: "Invalid upload request" });
    }

    const baseUploadDir = path.join(__dirname, "../../uploads");
    const tempDir = path.join(baseUploadDir, "temp", uploadId);
    const finalDir = path.join(baseUploadDir, "video");

    // ensure directories exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    // Save chunk separately
    const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
    fs.renameSync(chunkFile.path, chunkPath);

    // Check if all chunks uploaded
    const uploadedChunks = fs.readdirSync(tempDir);

    if (uploadedChunks.length == Number(totalChunks)) {
      const finalFilePath = path.join(finalDir, originalname);

      const writeStream = fs.createWriteStream(finalFilePath);

      for (let i = 0; i < Number(totalChunks); i++) {
        const chunkFilePath = path.join(tempDir, `chunk_${i}`);
        const data = fs.readFileSync(chunkFilePath);
        writeStream.write(data);
      }

      writeStream.end();

      writeStream.on("finish", () => {
        // delete temp chunks
        fs.rmSync(tempDir, { recursive: true, force: true });

        return res.status(200).json({
          message: "Upload completed",
          file: `/uploads/video/${originalname}`,
        });
      });

    } else {
      return res.status(200).json({
        message: "Chunk uploaded successfully",
        uploaded: uploadedChunks.length,
      });
    }

  } catch (error) {
    console.error("Chunk Upload Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};