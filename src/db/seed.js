import { Task } from '../routes/tasks.js';

export const seedTasks = async () => {
   let count = await Task.countDocuments();
   if (count === 0) {
      console.log('Seeding tasks collection with sample data...');
      for (let i = 1; i <= 1000; i++) {
         Task.create({
            title: `Task ${i}`,
            completed: Math.floor(Math.random() * 10) < 5,
            user: `user${(Math.floor(Math.random() * 10) % 10) + 1}`
         });
      }
   }
};
