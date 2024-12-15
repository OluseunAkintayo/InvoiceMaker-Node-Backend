import dayjs from 'dayjs';
import cron from 'node-cron';


export default function deleteOldItems() {
  try {
    const thirty_days_ago = dayjs().subtract(30, 'days');
    console.log(thirty_days_ago.toISOString());
  } catch (error) {
    
  }
}