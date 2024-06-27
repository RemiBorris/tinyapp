const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

// function verifies if user exists, if it does it returns the user details else returns null
const userLookup = function(email, database) {
  for (const user in database) {
    if (email === database[user].email) {
      return database[user];
    }
  }
  return null;
};

// function returns thr URL's which belong to the logged in user
const urlsForUser = function(id, database) {
  const userUrls = {};
  for (const urlID in database) {
    if (database[urlID].userID === id) {
      userUrls[urlID] = database[urlID].longURL;
    }
  }
  return userUrls;
};

const helperFunctions = {
  generateRandomString,
  userLookup,
  urlsForUser,
};

module.exports = helperFunctions;