const { assert } = require('chai');

const { getUserByEmail, findUserById, generateRandomString, urlsForUser } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testURLs = {
  "b6UTxQ": {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  "i3BoGr": {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";

    assert.deepEqual(user, testUsers[expectedUserID]);
  });
  it('should return undefined for an invalid email', function() {
    const user = getUserByEmail("abc@example.com", testUsers);

    assert.isUndefined(user);
  });
});

describe('findUserById', function() {
  it('should return a user with valid id', function() {
    const foundId = findUserById("userRandomID", testUsers);
    const expectedUserID = "userRandomID";

    assert.strictEqual(foundId.id, expectedUserID);
  });
  it('should return null for an invalid id', function() {
    const foundId = findUserById("invalidID", testUsers);

    assert.isNull(foundId);
  });
  it('should return the object that matches the user object in database', function() {
    const foundObj = findUserById("user2RandomID", testUsers);
    const expextedObj = testUsers["user2RandomID"];

    assert.deepEqual(foundObj, expextedObj);
  });
});

describe('generateRandomString', function() {
  it('should return a random 6 alphanumeric characters long string for a shortURL', function() {
    const shortURL = generateRandomString();
    const length = 6;

    assert.strictEqual(shortURL.length, 6);
  });
});

describe('urlsForUser', function() {
  it('should return a object containing urls that belong to a valid id', function() {
    const urls = urlsForUser("aJ48lW", testURLs);
    const expected = testURLs;

    assert.deepEqual(urls, expected);
  });
  it('should return an empty object if the id has no urls', function() {
    const urls = urlsForUser("adr6HG", testURLs);

    assert.deepEqual(urls, {});
  });
});

