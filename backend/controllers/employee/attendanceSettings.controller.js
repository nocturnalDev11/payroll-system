const asyncHandler = require('express-async-handler');
const AttendanceSettings = require('../../models/attendanceSettings.model');

/**
 * @desc Get attendance settings
 * @route GET /api/attendance-settings
 */
exports.getAttendanceSettings = asyncHandler(async (req, res) => {
    try {
        console.log('Fetching attendance settings...');
        let settings = await AttendanceSettings.findOne();
        console.log('Settings found:', settings);
        if (!settings) {
            console.log('No settings found, creating new...');
            settings = new AttendanceSettings({});
            await settings.save();
            console.log('New settings saved:', settings);
        }
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error in getAttendanceSettings:', error.message, error.stack);
        throw error;
    }
});

/**
 * @desc Update attendance settings
 * @route PUT /api/attendance-settings
 */
exports.updateAttendanceSettings = asyncHandler(async (req, res) => {
    const { officeStart, lateCutoff, breakStart, breakEnd, officeEnd, gracePeriod, deductionRate } = req.body;

    let settings = await AttendanceSettings.findOne();
    if (!settings) {
        settings = new AttendanceSettings({});
    }

    settings.officeStart = officeStart || settings.officeStart;
    settings.lateCutoff = lateCutoff || settings.lateCutoff;
    settings.breakStart = breakStart || settings.breakStart;
    settings.breakEnd = breakEnd || settings.breakEnd;
    settings.officeEnd = officeEnd || settings.officeEnd;
    settings.gracePeriod = gracePeriod || settings.gracePeriod;
    settings.deductionRate = deductionRate || settings.deductionRate;

    await settings.save();
    res.status(200).json(settings);
});