const getUserByEmail = function (email, database) {
  for (const key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return undefined;
};

const findUserById = function (user_id, database) {
  for (const key in database) {
    if (user_id === key) {
      return database[key];
    }
  }
  return null;
};

const generateRandomString = function () {
  const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortURL = '';

  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * validChars.length);
    shortURL += validChars.charAt(index);
  }
  return shortURL;
};

const urlsForUser = function (user_id, database) {
  let urls = {};
  for (const key in database) {
    if (database[key].userID === user_id) {
      urls[key] = database[key]
    }
  }
  return urls;
};

module.exports = { getUserByEmail, findUserById, generateRandomString, urlsForUser };