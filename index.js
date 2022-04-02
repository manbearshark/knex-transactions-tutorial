const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const knexConfig = require('./db/knexfile');
//initialize knex
const knex = require('knex')(knexConfig[process.env.NODE_ENV])

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/user', (req, res) => {
    knex('users')
        .select({
            id: 'id',
            firstName: 'firstName',
            lastName: 'lastName',
            userId: 'userId'
        })
        .then((users) => {
            return res.json(users);
        })
        .catch((err) => {
            console.error(err);
            return res.json({ success: false, message: 'An error occurred, please try again later.' });
        })
});

app.post('/user', (req, res) => {
    const firstName = req.body.firstName ? req.body.firstName : '';
    const lastName = req.body.lastName ? req.body.lastName : '';
    const email = req.body.email ? req.body.email : '';
    const userId = req.body.userId ? req.body.userId : '';

    if (!firstName || !lastName) {
        return res.json({ success: false, message: 'First and last name are required' });
    }

    knex('users')
        .insert({ firstName, lastName, email, userId })
        .then((userId) => {
            //get user by id
            knex('users')
                .select({
                    userId: 'userId',
                    firstName: 'firstName',
                    lastName: 'lastName',
                    email: 'email',
                })
                .where({ userId })
                .then((user) => {
                    return res.json(user[0]);
                })
        })
        .catch((err) => {
            console.error(err);
            return res.json({ success: false, message: 'An error occurred, please try again later.' });
        });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});