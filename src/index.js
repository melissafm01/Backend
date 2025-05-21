import 'dotenv/config'; 
import app from "./app.js";
import { PORT } from "./config.js";
import { connectDB } from "./db.js";  
import { startNotificationCron } from './notification.cron.js';

async function main() {
  try {
    await connectDB();
    app.listen(PORT);
    startNotificationCron();
    console.log(`Listening on port http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`)
  } catch (error) {
    console.error(error);
  }
}

main();
