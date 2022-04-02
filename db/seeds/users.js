const fs = require('fs');

const createUser = async function(user, knex) {
  // Convert a users file user to a DB entry
  try {

    await knex.transaction(async trx => {
      const userRecord = {
        user_id: user.id, 
        first_name: user.first_name, 
        last_name: user.last_name,
      };

      console.log(`${JSON.stringify(userRecord)}`);

      const userIds = await(trx('users').insert(userRecord, 'id'));

      // TODO: Make the user generator create multiple emails with type for each user as well as phone numbers
      const userEmails = [{
        user_id: userIds[0],
        email: user.email,
        type: 'primary'
      }];

      userEmails.forEach((email) => email.user_id = userIds[0]);
      const emails = await(trx('emails').insert(userEmails));

      const userIdentifiers = [{
        identifier: user.platforms.ios.anonymous_id,
        type: 'anon_id',
        platform: 'ios',
      }, {
        identifier: user.platforms.android.anonymous_id,
        type: 'anon_id',
        platform: 'android',
      }, {
        identifier: user.platforms.web.anonymous_id,
        type: 'anon_id',
        platform: 'web',
      },{ 
        identifier: user.platforms.ios.advertising_id,
        type: 'ad_id',
        platform: 'ios',
      }];
      
      userIdentifiers.forEach((ident) => ident.user_id = userIds[0]);
      const identifiers = await (trx('identifiers').insert(userIdentifiers).returning('id'));
    });

  } catch(e) {
    // Error in your code bro
    console.error(e);
    throw(e);
  }
};

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('users').del();

  // Load users JSON file
  let rawData = fs.readFileSync('./seeds/users.json');
  let users = JSON.parse(rawData);
  //console.log(`${JSON.stringify(users)}`);
  // Insert each user record

  for(const i in users) {
    console.log(`${JSON.stringify(users[i])}`);
    await createUser(users[i], knex); 
  }
};