import express from 'express';
import mongoose from 'mongoose';
import { AppError } from '../error.js';

export const Task = mongoose.model(
   'tasks',
   new mongoose.Schema({ title: String, completed: Boolean, user: String })
);

const router = express.Router();

// get all tasks
router.get('/', async (req, res) => {
   let result = await Task.find();
   res.json({ data: result });
});

// get paged tasks
router.get('/paged', async (req, res) => {
   const pageSize = parseInt(req.query.pageSize) || 10;
   const pageNumber = parseInt(req.query.pageNumber) || 1;
   const sort = req.query.sort || 'title';
   let result = await Task.aggregate([
      { $match: { user: req.user.username } },
      { $sort: { [`${sort}`]: 1, _id: 1 } },
      {
         $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize }]
         }
      },
      {
         $project: {
            total: { $arrayElemAt: ['$metadata.total', 0] },
            data: 1
         }
      }
   ]);
   res.json({ result });
});

// get task counts by user
router.get('/user', async (req, res) => {
   let result = await Task.aggregate([
      { $group: { _id: '$user', taskCount: { $count: {} } } },
      { $sort: { taskCount: -1 } }
   ]);
   res.json({ data: result.map((r) => ({ user: r._id, taskCount: r.taskCount })) });
});

// get task counts by status
router.get('/status', async (req, res) => {
   let result = await Task.aggregate([
      { $group: { _id: '$completed', taskCount: { $count: {} } } },
      { $sort: { taskCount: -1 } }
   ]);
   res.json({ data: result.map((r) => ({ completed: r._id, taskCount: r.taskCount })) });
});

// search tasks
router.get('/search', async (req, res) => {
   let keys = Object.keys(req.query);
   if (keys.length === 0) {
      throw new AppError('No search parameters provided', 400);
   }
   let query = {};
   // if (req.query.user) {
   //    query.user = { $regex: req.query.user };
   // }
   // if (req.query.title) {
   //    query.title = { $regex: req.query.title };
   // }
   // if (req.query.completed) {
   //    query.completed = req.query.completed === 'true';
   // }

   keys.forEach((key) => {
      query[key] = {
         $regex: ['true', 'false'].includes(req.query[key])
            ? req.query[key] === 'false'
               ? false
               : true
            : req.query[key]
      };
   });

   console.log('Searching tasks with query:', query);
   let result = await Task.find(query);
   res.json({ data: result });
});

// add new task
router.post('/', async (req, res) => {
   let task = await Task.findOne({ title: req.body.title });
   if (task) {
      throw new AppError('Task already exists', 409);
   }

   let newTask = {
      title: req.body.title,
      completed: false,
      user: req.user.username
   };
   let result = await Task.create(newTask);
   res.status(201).json({ data: result });
});

// update task
router.put('/', async (req, res) => {
   let task = await Task.findOneAndUpdate(
      { _id: req.body.id },
      { title: req.body.title, completed: req.body.completed, user: req.user.username }
   );
   if (!task) {
      throw new AppError('Task not found', 404);
   }

   res.status(201).json({ data: task });
});

export default router;
