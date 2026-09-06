const express = require('express');
const router = express.Router();

let workflows = [];

router.post('/save', (req, res) => {
  const { name, steps } = req.body;
  if (!name || !steps) {
    return res.status(400).json({ error: 'Name and steps required' });
  }
  const workflow = {
    id: Date.now().toString(),
    name,
    steps,
    createdAt: new Date().toISOString()
  };
  workflows.push(workflow);
  res.json({ success: true, workflow });
});

router.get('/list', (req, res) => {
  res.json({ workflows });
});

router.delete('/:id', (req, res) => {
  workflows = workflows.filter(w => w.id !== req.params.id);
  res.json({ success: true });
});

router.post('/run', (req, res) => {
  const { workflowId } = req.body;
  const workflow = workflows.find(w => w.id === workflowId);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json({ 
    success: true, 
    message: 'Workflow executed',
    steps: workflow.steps 
  });
});

module.exports = router;
