import express from 'express';
import { ObjectId } from 'mongodb';
import NodeCache from 'node-cache';
import mongoose from 'mongoose';
//import db from '../db/connection.js';
import { AppError } from '../error.js';

const recordSchema = new mongoose.Schema(
   {
      position: String,
      level: String,
      firstName: String,
      lastName: String
   },
   {
      virtuals: {
         name: {
            get() {
               return `${this.firstName} ${this.lastName}`;
            },
            set(value) {
               const parts = value.split(' ');
               this.firstName = parts[0];
               this.lastName = parts[1];
            }
         },
         toJSON: { virtuals: true }
      }
   }
);

export const Record = mongoose.model('records', recordSchema);

const router = express.Router();

const cache = new NodeCache({ stdTTL: 30, checkperiod: 15 });
const cacheKey = 'records:all';

// get all records
router.get('/', async (req, res) => {
   console.log('Fetching all records');

   let results = cache.get(cacheKey);
   if (results) {
      console.log('cache hit');
      return res.json({ data: results });
   } else {
      console.log('cache miss');
      results = await Record.find().sort({ name: 1 });
      //results = await db.collection('records').find({}).toArray();
      cache.set(cacheKey, results);
      res.json({ data: results });
   }
});

// get record by name
router.get('/search', async (req, res) => {
   console.log('Fetching record with first name:', req.query.firstName);
   // const record = await Record.aggregate([
   //    { $search: { index: 'default', autocomplete: { query: req.query.name, path: 'name', fuzzy: { maxEdits: 2 } } } },
   //    { $project: { _id: 1, name: 1, position: 1 } }
   // ]);
   const record = await Record.find(
      { firstName: { $regex: req.query.firstName } },
      '_id firstName lastName position'
   );
   //.explain('executionStats');
   //console.log('Record search stats:', record.executionStats);
   if (!record) {
      throw new AppError('Record not found', 404); //return  res.status(404).json({ error: 'Record not found' });
   }
   res.json({ data: record });
});

// get record by id
router.get('/:id', async (req, res) => {
   console.log('Fetching record with id:', req.params.id);
   const id = req.params.id;
   const record = await Record.findById(id);
   //const record = await db.collection('records').findOne({ _id: new ObjectId(id) });
   if (!record) {
      throw new AppError('Record not found', 404); //return  res.status(404).json({ error: 'Record not found' });
   }
   res.json({ data: record });
});

// add new record
router.post('/', async (req, res) => {
   const record = await Record.find({ name: req.body.name });
   //const record = await db.collection('records').findOne({ _id: new ObjectId(id) });
   if (record) {
      throw new AppError('Record already exists', 409);
   }
   let newRecord = {
      name: req.body.name,
      position: req.body.position,
      level: req.body.level
   };
   let result = await Record.create(newRecord);
   //let result = await db.collection('records').insertOne(newRecord);
   res.status(201).json({ data: result });
});

// update record
router.patch('/:id', async (req, res) => {
   const id = req.params.id;
   const updatedRecord = {
      name: req.body.name,
      position: req.body.position,
      level: req.body.level
   };
   const result = await db
      .collection('records')
      .updateOne({ _id: new ObjectId(id) }, { $set: updatedRecord });
   if (result.matchedCount === 0) {
      throw new AppError('Record not found', 404);
   }
   res.json({ data: result });
});

// delete record
router.delete('/:id', async (req, res) => {
   const id = req.params.id;
   const result = await db.collection('records').deleteOne({ _id: new ObjectId(id) });
   if (result.deletedCount === 0) {
      throw new AppError('Record not found', 404);
   }
   res.json({ data: result });
});

export default router;
