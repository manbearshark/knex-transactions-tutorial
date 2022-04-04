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

app.get('/user', async (req, res, next) => {
    try {
        // Lookup by parameter type
        const { userId, anonymousId } = req.query;

        if(userId) {
            const user = await knex.select(
                'u.user_id',
                'u.first_name',
                'u.last_name'
            ).from('users as u')
            .where('u.user_id', '=', userId);
            return res.json(user);
        } else if(anonymousId) {
            const user = await knex.select(
                'u.user_id',
                'u.first_name',
                'u.last_name'
            ).from('users as u')
            .leftJoin('identifiers as i', 'i.user_id', 'u.id')
            .where('i.identifier', '=', anonymousId);
            return res.json(user);
        }
    } catch(error) {
        console.error(error);
        next(error);
    }
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