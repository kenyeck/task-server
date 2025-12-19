import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI || '';

console.log('MongoDB URI:', uri);
// export const client = new MongoClient(uri, {
//       serverApi: {
//          version: ServerApiVersion.v1,
//          strict: true,
//          deprecationErrors: true
//       }
// });

export const connectDb = async () => {
   try {
      await mongoose.connect(uri, { maxPoolSize: 10, minPoolSize: 5, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
      //await client.db('admin').command({ ping: 1 });
      console.log('Connected to MongoDB successfully!');
   } catch (error) {
      console.error('Error connecting to MongoDB:', error);
   }
};
// await client.connect();
//let db = client.db('task');
//export default db;
