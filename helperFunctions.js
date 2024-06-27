const {users, urlDatabase} = require("./express_server");

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

const userLookup = function(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return null;
};

const urlsForUser = function(id) {
  const userUrls = {};
  for (const urlID in urlDatabase) {
    if (urlDatabase[urlID].userID === id) {
      userUrls[urlID] = urlDatabase[urlID].longURL;
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