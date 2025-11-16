const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statistic.controller');

router.get('/community-points', statisticController.getCommunityPoints); // Thống kê điểm PVCD
router.get('/activities', statisticController.getActivitiesStatistic); // Thống kê hoạt động
router.get('/certificates', statisticController.getCertificatesStatistic); // Thống kê giấy chứng nhận
// ...

module.exports = router;