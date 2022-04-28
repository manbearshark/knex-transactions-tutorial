const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const app = express();
const port = 3000;
const knexConfig = require('./db/knexfile');
//initialize knex
const knex = require('knex')(knexConfig[process.env.NODE_ENV])

const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/user', async (req, res, next) => {
    try {
        // Lookup by parameter type
        const { userId, anonymousId, platform } = req.query;

        if(userId) {
            const user = await knex.select(
                'u.user_id',
                'u.first_name',
                'u.last_name'
            ).from('users as u')
            .where('u.user_id', '=', userId);
            return res.json(user);
        } else if(anonymousId && platform) {
            const user = await knex.select(
                'u.user_id',
                'u.first_name',
                'u.last_name'
            ).from('users as u')
            .leftJoin('identifiers as i', 'i.user_id', 'u.id')
            .where('i.identifier', '=', anonymousId)
            .andWhere('i.platform', '=', platform);
            return res.json(user);
        }
    } catch(error) {
        console.error(error);
        next(error);
    }
});

app.post('/event', (req, res) => {
});

app.post('/user', async (req, res, next) => {
    const reqFirstName = req.body.firstName ? req.body.firstName : '';
    const reqLastName = req.body.lastName ? req.body.lastName : '';
    const reqEmails = req.body.emails ? req.body.emails : [];
    const reqUserId = req.body.userId ? req.body.userId : '';
    const reqIdentifiers = req.body.identifiers ? req.body.identifiers : [];
    const reqProperties = req.body.properties ? req.body.properties : [];

    if (!reqUserId) {
        return res.json({ success: false, message: 'userId is missing or null, this field is required.' });
    }

    const trx = await knex.transaction();

    // Upsert to the database, then cache the resulting user records to redis
    try {
        const userRecord = {
            user_id: reqUserId,
            first_name: reqFirstName,
            last_name: reqLastName,
        };

        const userIds = await trx('users').insert(userRecord).onConflict('user_id').merge().returning('id');

        if(reqEmails.length > 0) {
            let userEmails = [];
            reqEmails.forEach((email) => {
                userEmails.push({
                    user_id: userIds[0],
                    email: email.email,
                    type: email.type,
                });
            });
            const emails = await trx('emails').insert(userEmails).onConflict('email').ignore();
        }

        if(reqIdentifiers.length > 0) {
            let userIdentifiers = [];    
            reqIdentifiers.forEach((ident) => {
                userIdentifiers.push({
                    identifier: ident.identifier,
                    type: ident.type,
                    platform: ident.platform,
                });
            });
            await trx('identifiers').insert(userIdentifiers).onConflict('identifier').ignore();
        }

        await trx.commit();

    } catch(e) {
        console.error(e);
        await trx.rollback();
        next(e);
    }

    // Cache each identifier mapped to the userId for this user in redis
    try {
        await redisClient.connect();
        reqIdentifiers.forEach((ident) => {
            redisClient.set(`${ident.type}:${ident.platform}:${ident.identifier}`, reqUserId);
            redisClient.set(`userId:${reqUserId}`, )
        });
        redisClient.quit();
        return res.json({"success": true});
    } catch (error) {
        console.error(error);
        next(error);
    }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});