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
    const firstName = req.body.firstName ? req.body.firstName : '';
    const lastName = req.body.lastName ? req.body.lastName : '';
    const emails = req.body.emails ? req.body.email : [];
    const userId = req.body.userId ? req.body.userId : '';
    const identifiers = req.body.identifiers ? req.body.identifiers : [];
    const properties = req.body.properties ? req.body.properties : [];

    if (!userId) {
        return res.json({ success: false, message: 'userId is missing or null, this field is required.' });
    }

    // Cache each identifier mapped to the userId for this user in redis
    try {
        await redisClient.connect();
        identifiers.forEach((ident) => {
            redisClient.set(`${ident.type}:${ident.platform}:${ident.identifier}`, userId);
            redisClient.set(`userId:${userId}`, )
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