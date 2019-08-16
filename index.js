const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const controllers = require ('./controllers.js');

const app = express();

app.use(cors());

// Get all details for an event by it's ID
app.get('/events/:id', controllers.getEventById);

// Get all events for a user 
app.get('/users/:id', controllers.getUsersEvents);

// Add a restaurant to an event
app.post('/events/:id/restaurants', controllers.addRestaurant);

// Vote on restaurant at that index of the restaurants array
app.post('/events/:id/restaurants/:restaurantIndex', controllers.vote);

// Add an event and add event to users database entry
app.post('/events', controllers.addEvent);

// On signup add user to database
app.post('/users', controllers.addUser)

//PUT 

// On joining of event add to users database entry
app.put('/users/:id', controllers.joinEvent)


exports.api = functions.https.onRequest(app);
