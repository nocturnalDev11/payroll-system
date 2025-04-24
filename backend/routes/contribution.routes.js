const express = require('express');
const router = express.Router();
const {
    getContributionRates,
    saveContributions,
    getEmployeeContributions,
    getAllContributions
} = require('../controllers/employee/contribution.controller.js');

router.get('/rates', getContributionRates);
router.post('/', saveContributions);
router.get('/:employeeId', getEmployeeContributions);
router.get('/', getAllContributions);

module.exports = router;