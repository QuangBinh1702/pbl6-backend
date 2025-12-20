const express = require('express');
const router = express.Router();
const statisticController = require('../controllers/statistic.controller');

router.get('/community-points', statisticController.getCommunityPoints); // Thống kê điểm PVCD
router.get('/activities', statisticController.getActivitiesStatistic); // Thống kê hoạt động
router.get('/certificates', statisticController.getCertificatesStatistic); // Thống kê giấy chứng nhận
router.get('/activity-dashboard', statisticController.getActivityDashboard); // Dashboard hoạt động
router.get('/dashboard-by-year', statisticController.getDashboardStatisticByYear); // Dashboard theo năm
router.get('/grades', statisticController.getGradesStatistic); // Thống kê điểm với bộ lọc
router.get('/pvcd-breakdown', statisticController.getPvcdBreakdown); // 🆕 Lấy chi tiết PVCD (attendance + evidence)

module.exports = router;