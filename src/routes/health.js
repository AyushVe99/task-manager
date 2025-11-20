import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const PORT = process.env.PORT || 3000;

router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
});

export default router;

