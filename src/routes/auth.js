import express from 'express';
import jwt from 'jsonwebtoken';
import { User, defaultRole } from './users.js';
import { AppError } from '../error.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

router.post('/register', async (req, res) => {
   const { username, password, role = defaultRole } = req.body;
   if (await User.findOne({ username })) {
      throw new AppError('User already exists', 409);
   }

   let user = await User.create({ username, passwordHash: bcrypt.hashSync(password, 10), role });
   res.status(201).json({ message: 'User registered successfully', user });
});

router.post('/login', async (req, res) => {
   const { username, password } = req.body;
   let user = await User.findOne({ username }, '+passwordHash');
   if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new AppError('Invalid credentials', 401);
   }
   const token = jwt.sign({ _id: user._id, username: user.username, role: user.role }, SECRET_KEY, {
      expiresIn: '1h'
   });
   res.status(200).json({ message: 'Login successful', user, token });
});

export const auth = router;

// Middleware to protect routes
export const authorize = (allowedRoles = []) => {
   return async (req, res, next) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
         throw new AppError('Access token is missing or invalid', 401);
      }

      try {
         const decoded = jwt.verify(token, SECRET_KEY);
         if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
            throw new AppError('Forbidden: You do not have access to this resource', 403);
         }
         req.user = decoded;
         next();
      } catch (error) {
         return res.status(401).json({ message: 'Invalid token' });
      }
   };
};
