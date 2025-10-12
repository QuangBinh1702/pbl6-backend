const express = require('express');
const router = express.Router();
const pointController = require('../controllers/point.controller');

router.get('/:userId', pointController.getUserPoints); // Xem điểm PVCD
router.put('/:userId', pointController.updateUserPoints); // Cập nhật điểm (ctsv, đoàn trường)
router.get('/:userId/history', pointController.getUserPointHistory); // Lịch sử điểm
// ...

module.exports = router;
