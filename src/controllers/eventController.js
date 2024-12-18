const { db } =require('../config/firebase');
const { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where } = require('firebase/firestore'); 

const EVENTS_COLLECTION = 'events'; 


const createEvent = async (eventData) => {
  try {
    const { userId, title, startDate, endDate } = eventData;

    if (!userId || !title || !startDate || !endDate) {
      throw new Error('Missing required fields: userId, title, startDate, or endDate');
    }

    const duration = Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24); 

    const event = {
      userId,
      title,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      duration,
      createdAt: Date.now(),
    };

    await addDoc(collection(db, EVENTS_COLLECTION), event);
    console.log('Event created successfully!');
    return event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Event creation failed');
  }
};

const getUserEvents = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const eventQuery = query(collection(db, EVENTS_COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(eventQuery);

    const events = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalEvents = events.length;

    console.log(`Total events for user ${userId}:`, totalEvents);
    return {
      totalEvents,
      events,
    };
  } catch (error) {
    console.error('Error getting user events:', error);
    throw new Error('Failed to fetch user events');
  }
};


const updateEvent = async (eventId, updatedEventData) => {
  try {
    const { title, startDate, endDate } = updatedEventData;

    if (!eventId || !title || !startDate || !endDate) {
      throw new Error('Missing required fields: eventId, title, startDate, or endDate');
    }

    const duration = Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24); 

    const updatedEvent = {
      title,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      duration,
      updatedAt: Date.now(),
    };
    const eventDocRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(eventDocRef, updatedEvent);

    console.log('Event updated successfully!');
    return updatedEvent;
  } catch (error) {
    console.error('Error updating event:', error);
    throw new Error('Event update failed');
  }
};

const deleteEvent = async (eventId) => {
  try {
    if (!eventId) throw new Error('Event ID is required');

    const eventDocRef = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(eventDocRef);

    console.log('Event deleted successfully!');
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw new Error('Event deletion failed');
  }
};

/**
 * Get all events.
 * @returns {Object} An object containing the total number of events and the list of events.
 */
const getAllEvents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, EVENTS_COLLECTION));
    const events = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalEvents = events.length;

    console.log('Total events:', totalEvents);
    return {
      totalEvents,
      events,
    };
  } catch (error) {
    console.error('Error getting all events:', error);
    throw new Error('Failed to fetch all events');
  }
};

module.exports = {
  createEvent,
  getUserEvents,
  updateEvent,
  deleteEvent,
  getAllEvents,
};
