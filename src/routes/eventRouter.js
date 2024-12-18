const express = require('express');
const { 
  createEvent, 
  getUserEvents, 
  updateEvent, 
  deleteEvent, 
  getAllEvents 
} = require('../controllers/eventController'); 

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    const event = await createEvent(eventData);
    res.status(201).json({ success: true, message: 'Event created successfully', event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userEvents = await getUserEvents(userId);
    res.status(200).json({ success: true, ...userEvents });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.put('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const updatedEventData = req.body;
    const updatedEvent = await updateEvent(eventId, updatedEventData);
    res.status(200).json({ success: true, message: 'Event updated successfully', updatedEvent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    await deleteEvent(eventId);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const allEvents = await getAllEvents();
    res.status(200).json({ success: true, ...allEvents });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
