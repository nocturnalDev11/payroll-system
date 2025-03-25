const express = require('express');
const router = express.Router();
const Employee = require('../models/employee.model.js');
const Position = require('../models/position.model.js');

const isAdmin = (req, res, next) => {
    const userRole = req.headers['user-role'];
    if (!userRole || userRole.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const normalizeDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
};

router.post('/record', isAdmin, async (req, res) => {
    try {
        const { employeeId, position, salary, startDate } = req.body;

        if (!employeeId || !position || salary === undefined || !startDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const parsedEmployeeId = parseInt(employeeId);
        if (isNaN(parsedEmployeeId)) {
            return res.status(400).json({ error: 'Invalid employeeId format' });
        }

        const employee = await Employee.findOne({ id: parsedEmployeeId });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const newStartDate = new Date(startDate);
        if (isNaN(newStartDate.getTime())) {
            return res.status(400).json({ error: 'Invalid startDate format' });
        }
        if (newStartDate < new Date(employee.hireDate)) {
            return res.status(400).json({ error: `startDate (${newStartDate.toISOString()}) cannot be before hireDate (${employee.hireDate.toISOString()})` });
        }

        const sortedHistory = Array.isArray(employee.positionHistory) && employee.positionHistory.length > 0
        ? employee.positionHistory.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        : [];
        const currentPosition = sortedHistory.find(p => !p.endDate);

        if (currentPosition) {
            const currentStartDate = new Date(currentPosition.startDate);
            if (newStartDate <= currentStartDate) {
                return res.status(400).json({ error: `New startDate (${normalizeDate(newStartDate)}) must be after the current position's startDate (${normalizeDate(currentStartDate)})` });
            }
            const endDate = new Date(newStartDate);
            endDate.setDate(endDate.getDate() - 1);
            currentPosition.endDate = endDate;
        }

        let positionDoc = await Position.findOne({ name: position });
        if (!positionDoc) {
            positionDoc = new Position({ name: position, salary });
            await positionDoc.save();
        } else if (positionDoc.salary !== salary) {
            positionDoc.salary = salary;
            await positionDoc.save();
        }

        employee.positionHistory.push({
            position,
            salary,
            startDate: newStartDate,
            endDate: null
        });

        employee.position = position;
        employee.salary = salary;
        employee.hourlyRate = salary / (8 * 22);

        await employee.save();

        res.status(200).json({
        success: true,
        message: `Position history updated for employee ID ${parsedEmployeeId}`,
        employee: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            position: employee.position,
            salary: employee.salary,
            positionHistory: employee.positionHistory.map(history => ({
            position: history.position,
            salary: history.salary,
            startDate: normalizeDate(history.startDate),
            endDate: history.endDate ? normalizeDate(history.endDate) : null
            }))
        }
        });
    } catch (error) {
        console.error('Error recording position history:', error);
        res.status(500).json({ error: 'Failed to record position history', message: error.message });
    }
});

router.get('/:employeeId', isAdmin, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employeeId format' });
    }

    const employee = await Employee.findOne({ id: employeeId }).select('firstName lastName positionHistory position salary hireDate');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const sortedHistory = Array.isArray(employee.positionHistory) && employee.positionHistory.length > 0
      ? employee.positionHistory.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      : [];

    res.status(200).json({
      success: true,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        salary: employee.salary,
        hireDate: normalizeDate(employee.hireDate),
        positionHistory: sortedHistory.map(history => ({
          position: history.position,
          salary: history.salary,
          startDate: normalizeDate(history.startDate),
          endDate: history.endDate ? normalizeDate(history.endDate) : null
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching position history:', error);
    res.status(500).json({ error: 'Failed to fetch position history', message: error.message });
  }
});

router.put('/update/:employeeId', isAdmin, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ error: 'Invalid employeeId format' });
    }

    const { position, startDate, endDate, newSalary } = req.body;

    if (!employeeId || !position || !startDate) {
      return res.status(400).json({ error: 'Missing required fields: employeeId, position, and startDate are required' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const employee = await Employee.findOne({ id: employeeId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const targetStartDate = normalizeDate(new Date(startDate));
    const historyEntry = employee.positionHistory.find(h => 
      h.position === position && normalizeDate(h.startDate) === targetStartDate
    );

    if (!historyEntry) {
      return res.status(404).json({ error: 'Position history entry not found' });
    }

    if (new Date(historyEntry.startDate) < new Date(employee.hireDate)) {
      return res.status(400).json({ error: `Position startDate (${historyEntry.startDate.toISOString()}) cannot be before hireDate (${employee.hireDate.toISOString()})` });
    }

    if (new Date(historyEntry.startDate) < new Date() && historyEntry.endDate && new Date(historyEntry.endDate) < new Date()) {
      return res.status(400).json({ error: 'Cannot modify past position history entries' });
    }

    if (endDate) {
      const newEndDate = new Date(endDate);
      if (newEndDate <= new Date(historyEntry.startDate)) {
        return res.status(400).json({ error: 'endDate must be after startDate' });
      }
      const sortedHistory = employee.positionHistory.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const entryIndex = sortedHistory.findIndex(h => 
        h.position === position && normalizeDate(h.startDate) === targetStartDate
      );
      if (entryIndex < sortedHistory.length - 1) {
        const nextEntry = sortedHistory[entryIndex + 1];
        if (newEndDate >= new Date(nextEntry.startDate)) {
          return res.status(400).json({ error: 'New endDate overlaps with the next position’s startDate' });
        }
      }
      historyEntry.endDate = newEndDate;
    }

    if (newSalary !== undefined) {
      historyEntry.salary = newSalary;
      if (!historyEntry.endDate) {
        employee.salary = newSalary;
        employee.hourlyRate = newSalary / (8 * 22);
      }
      await Position.findOneAndUpdate(
        { name: position },
        { salary: newSalary },
        { new: true, upsert: true }
      );
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: `Position history updated successfully for employee ID ${employeeId}`,
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        salary: employee.salary,
        hireDate: normalizeDate(employee.hireDate),
        positionHistory: employee.positionHistory.map(history => ({
          position: history.position,
          salary: history.salary,
          startDate: normalizeDate(history.startDate),
          endDate: history.endDate ? normalizeDate(history.endDate) : null
        }))
      }
    });
  } catch (error) {
    console.error('Error updating position history:', error);
    res.status(500).json({ error: 'Failed to update position history', message: error.message });
  }
});

module.exports = router;