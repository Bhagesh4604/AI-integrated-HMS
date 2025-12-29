const express = require('express');
const router = express.Router();
const { executeQuery } = require('./db.cjs');

// GET all lab tests
router.get('/tests', (req, res) => {
  const sql = `
    SELECT lt.id, lt.testNumber, lt.patientId, CONCAT(p.firstName, ' ', p.lastName) as patientName, lt.testName, lt.testDate, lt.status 
    FROM lab_tests lt 
    JOIN patients p ON lt.patientId = p.id 
    ORDER BY lt.testDate DESC
  `;
  executeQuery(sql, [], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal server error' });
    res.json(results);
  });
});

// POST a new lab test
router.post('/tests/add', (req, res) => {
  const { testNumber, patientId, testName, testDate } = req.body;
  // Assuming doctorId 1 for now, this can be expanded
  const sql = 'INSERT INTO lab_tests (testNumber, patientId, doctorId, testName, testDate, status) VALUES (?, ?, 1, ?, ?, ?)';
  const params = [testNumber, patientId, testName, testDate, 'pending'];
  executeQuery(sql, params, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to add lab test' });
    res.json({ success: true, message: 'Lab test added successfully!' });
  });
});

// PUT (update) a lab test status
router.put('/tests/:id', (req, res) => {
  const { id } = req.params;
  const { status, result_text, ai_analysis_json } = req.body;

  let sql, params;

  if (ai_analysis_json) {
    // If updating AI analysis specifically
    sql = 'UPDATE lab_tests SET ai_analysis_json = ? WHERE id = ?';
    params = [JSON.stringify(ai_analysis_json), id];
  } else {
    // Normal status update
    sql = 'UPDATE lab_tests SET status = ?, result_text = ? WHERE id = ?';
    params = [status, result_text || null, id];
  }

  executeQuery(sql, params, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to update test status' });
    res.json({ success: true, message: 'Test updated successfully!' });
  });
});

// DELETE a lab test
router.delete('/tests/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM lab_tests WHERE id = ?';
  executeQuery(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to delete test' });
    res.json({ success: true, message: 'Test deleted successfully!' });
  });
});

module.exports = router;