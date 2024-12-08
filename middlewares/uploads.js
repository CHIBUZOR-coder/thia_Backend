import multer from "multer";
const storage = multer.memoryStorage(); // Store files in memory as Buffer
const uploads = multer({ storage });

export default  uploads;
