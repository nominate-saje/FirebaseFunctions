const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

const controllers = {

  // GETS
  getEventById: ({ params }, res) => {
    db.collection('events').doc(params.id).get()
      .then((event) => {
        if (!event.exists) {
          return res.status(404).send('Invalid Event Id')
        } else {
          return res.status(200).send(event.data())
        }
      })
      .catch((err) => res.status(404).send(err))
  },

  getUsersEvents: ({ params }, res) => {
    db.collection('users').doc(params.id).get()
      .then(user => {
        if (!user.exists) {
          return res.status(404).send('Invalid User Id')
        } else {
          return res.status(200).send({ events: user.data().events, user: user.data().firstName + " " + user.data().lastName })
        }
      })
      .catch((err) => res.status(404).send('Error getting events'))
  },

  // POSTS
  vote: ({ params, body }, res) => {
    let eventRef = db.collection('events').doc(params.id);
    db.runTransaction(transaction => {
      return transaction.get(eventRef)
        .then(event => {
          event = event.data();
          let restaurantCopy = [...event.restaurants];
          restaurantCopy[params.restaurantIndex].votes[body.id] = body.value;
          return transaction.update(eventRef, 'restaurants', restaurantCopy)
        })
        .then((response) => {
          res.status(202).send('Vote received, your vote matters, vote or die');
        })
        .catch((err) => {
          res.status(404).send(err)
        })
    })
  },

  addRestaurant: ({ params, body }, res) => {
    let eventRef = db.collection('events').doc(params.id);
    let restaurant = {
      yelpId: body.yelpId,
      name: body.name,
      votes: {},
      nominator: body.userId
    }
    db.runTransaction(transaction => {
      return transaction.get(eventRef)
        .then(event => {
          event = event.data();
          return transaction.update(eventRef, 'restaurants', [...event.restaurants, restaurant])
        })
        .then(() => {
          res.status(202).send('Restaurant Added');
        })
        .catch((err) => {
          res.status(404).send(err);
        })
    })
  },

  addEvent: ({ body }, res) => {
    var event = {
      restaurants: [],
      users: [body.user],
      name: body.name,
      date: body.date
    }
    db.collection('events').add(event)
      .then((response) => {
        return [db.collection('users').doc(body.userId).update({
          events: admin.firestore.FieldValue.arrayUnion({ name: body.name, id: response.id, date: body.date })
        }), response]
      })
      .then((results) => res.status(201).send(results[1].id))
      .catch((err) => res.status(400).send(err))
  },

  addUser: ({ body }, res) => {
    let user = {
      events: [],
      firstName: body.firstName,
      lastName: body.lastName
    }
    db.collection('users').doc(body.id).set(user)
      .then((response) => res.status(201).send('User added'))
      .catch((err) => res.status(400).send(err))
  },

  // PUT
  joinEvent: ({ body, params }, res) => {
    let eventRef = db.collection('events').doc(body.id);
    let userRef = db.collection('users').doc(params.id);
    db.runTransaction(transaction => {
      return transaction.get(eventRef)
        .then(event => {
          event = event.data();
          return transaction.update(userRef, 'events', admin.firestore.FieldValue.arrayUnion({ name: event.name, id: body.id, date: event.date }))
        })
        .then(() => {
          return transaction.update(eventRef, 'users', admin.firestore.FieldValue.arrayUnion(body.username))
        })
        .then(() => res.status(202).send('User joined event'))
        .catch((err) => res.status(404).send('Error joining event'))
    })
  }

}

module.exports = controllers;

