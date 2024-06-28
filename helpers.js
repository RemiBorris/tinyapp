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

const siteVisits = function(shortURL, urlDatabase) {
  const URLVisits = {timestamps:{}, unique: 0, total: 0};
  for (const user in urlDatabase[shortURL].visits) {
    URLVisits.timestamps[user] = urlDatabase[shortURL].visits[user];
  }
  for (const user in URLVisits.timestamps) {
    URLVisits.timestamps[user].forEach(() => {
      URLVisits.total += 1;
    });
    URLVisits.unique += 1;
  }
  return URLVisits;
};

const helperFunctions = {
  generateRandomString,
  userLookup,
  urlsForUser,
  siteVisits,
};

module.exports = helperFunctions;