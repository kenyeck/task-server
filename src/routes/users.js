import express from 'express';
import mongoose from 'mongoose';

const Roles = ['user', 'admin'];
export const defaultRole = Roles[0];

const userSchema = new mongoose.Schema({
   username: { type: String, required: true, unique: true },
   passwordHash: { type: String, required: true, select: false },
   role: { type: String, required: true, enum: Roles, default: defaultRole }
});

userSchema.set('toJSON', {
   transform: (doc, ret) => {
      delete ret.passwordHash;
      return ret;
   }
});

export const User = mongoose.model('users', userSchema);

const router = express.Router();

// get all users
router.get('/', async (req, res) => {
   let users = await User.find();
   res.json({ data: users, user: req.user });
});

export default router;
