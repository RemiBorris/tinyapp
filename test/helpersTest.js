const { assert } = require('chai');

const { userLookup, urlsForUser } = require('../helpers.js');

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

describe('userLookup', function() {
  it('should return a user with valid email', function() {
    const user = userLookup("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user, testUsers[expectedUserID]);
  });
  it('should return null if user is not defined', function() {
    const user = userLookup('fake@email.com', testUsers);
    const expectedResult = null;
    assert.equal(user, expectedResult);
  });
});

describe('urlsForUser', function() {
  // Test case 1: URLs belonging to the specified user
  it('should return URLs that belong to the specified user', function() {
    const userID = 'user1';
    const database = {
      abc123: { longURL: 'http://example.com', userID: 'user1' },
      def456: { longURL: 'http://test.com', userID: 'user1' },
      xyz789: { longURL: 'http://another.com', userID: 'user2' }
    };

    const result = urlsForUser(userID, database);
    assert.deepEqual(result, {
      abc123: 'http://example.com',
      def456: 'http://test.com'
    });
  });

  // Test case 2: Empty object if no URLs belong to the specified user
  it('should return an empty object if the urlDatabase does not contain any URLs that belong to the specified user', function() {
    const userID = 'user3';
    const database = {
      xyz789: { longURL: 'http://another.com', userID: 'user2' }
    };

    const result = urlsForUser(userID, database);
    assert.deepEqual(result, {});
  });

  // Test case 3: Empty object if the urlDatabase is empty
  it('should return an empty object if the urlDatabase is empty', function() {
    const userID = 'user1';
    const database = {};

    const result = urlsForUser(userID, database);
    assert.deepEqual(result, {});
  });

  // Test case 4: No URLs that do not belong to the specified user
  it('should not return any URLs that do not belong to the specified user', function() {
    const userID = 'user1';
    const database = {
      abc123: { longURL: 'http://example.com', userID: 'user1' },
      def456: { longURL: 'http://test.com', userID: 'user2' }
    };

    const result = urlsForUser(userID, database);
    assert.notProperty(result, 'def456');
  });
});