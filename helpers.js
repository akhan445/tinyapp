function getUserByEmail(email, database) {
  for (const key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return null;
}

module.exports = getUserByEmail;