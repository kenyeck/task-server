import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { ObjectId } from 'mongodb';

const fileSchema = new mongoose.Schema({
   filename: String,
   contentType: String,
   data: Buffer,
   uploadedBy: { type: ObjectId, ref: 'User' }
});

export const File = mongoose.model('files', fileSchema);

const storage = multer.memoryStorage();
const upload = multer({
   storage: storage,
   limits: { fileSize: 1024 * 1024 * 16 } // limit to 16MB
});

const router = express.Router();

// upload a file
router.post('/', upload.single('file'), async (req, res) => {
   const newFile = new File({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedBy: req.user ? req.user._id : null
   });

   await newFile.save();
   res.status(201).json({ message: 'File uploaded successfully', id: newFile._id });
});

// get a file by filename
router.get('/', async (req, res) => {
   console.log('Fetching file:', req.query.filename);
   const file = await File.find({ filename: req.query.filename });
   if (!file || file.length === 0) {
      throw new AppError(`File not found: ${req.query.filename}`, 404);
   }
   res.set('Content-Type', file[0].contentType);
   res.send(file[0].data);
});

export default router;
