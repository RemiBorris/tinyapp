const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { userLookup, generateRandomString, urlsForUser, siteVisits } = require("./helpers");
const methodOverride = require('method-override');


app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    visits: {
      A1B2C3: ['Thu Jun 27 2024 21:02:50 GMT-0300 (Atlantic Daylight Time)']
    }
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    visits: {
      A1B2C3: ['Thu Jun 27 2024 21:02:57 GMT-0300 (Atlantic Daylight Time)']
    }
  },
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "A1B2C3",
    visits: {
      A1B2C3: ['Thu Jun 27 2024 21:02:53 GMT-0300 (Atlantic Daylight Time)']
    }
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "A1B2C3",
    visits: {
      A1B2C3: ['Thu Jun 27 2024 21:02:42 GMT-0300 (Atlantic Daylight Time)', 'Wed Jun 26 2024 12:30:40 GMT-0300 (Atlantic Daylight Time)'],
      aJ48lW: ['Wed Jun 26 2024 12:30:40 GMT-0300 (Atlantic Daylight Time)']
    }
  },
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  A1B2C3: {
    id: "A1B2C3",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send("You cannot create URL's when not logged in", 401);
    return;
  }
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    visits: {},
  };
  res.redirect(`/urls/${newShortURL}`);
});

app.delete("/urls/:id", (req, res) => { //delete a URL from our database
  if (!req.session.user_id) {
    res.send("You cannot delete URL's when not logged in", 401);
    return;
  }
  if (!urlDatabase[req.params.id]) {
    res.send("That URL is not in our database, please check and try again", 404);
    return;
  }
  const doesUserHaveURL = urlsForUser(req.session.user_id, urlDatabase);
  if (!doesUserHaveURL[req.params.id]) {
    res.send("URL can only be deleted by the original user", 403);
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.put("/urls/:id", (req, res) => { //update long URL from our database keeping the same shortURL
  if (!req.session.user_id) {
    res.send("You cannot modify URL's when not logged in", 401);
    return;
  }
  if (!urlDatabase[req.params.id]) {
    res.send("That URL is not in our database, please check and try again", 404);
    return;
  }
  const doesUserHaveURL = urlsForUser(req.session.user_id, urlDatabase);
  if (!doesUserHaveURL[req.params.id]) {
    res.send("URL can only be modified by the original user", 403);
    return;
  }
  urlDatabase[req.params.id].longURL = req.body.edit;
  res.redirect("/urls");
});

app.post("/login", (req, res) =>{ //checks useranme and hashed passwords then sets encrypted cookies and redirects to /urls
  const confirmRegistered = userLookup(req.body.email, users);
  if (confirmRegistered === null || !bcrypt.compareSync(req.body.password, confirmRegistered.password)) { //verifies if hashed passwords match and user exists
    res.status(403).end('Email not found in database or password does not match');
    return;
  }
  req.session.user_id = confirmRegistered.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => { //clears cookies and redirects to login page
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => { //register username in database, encrypt and set cookies, hash password and redirect to /urls
  const newId = generateRandomString();
  const verifyNotAlreadyRegistered = userLookup(req.body.email, users);
  if (verifyNotAlreadyRegistered || !req.body.email || !req.body.password) {
    res.status(400).end('Email is already registered or fields are empty.');
    return;
  }
  users[newId] = {
    id: newId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10) //hashes password so is not stored on server in plain text
  };
  req.session.user_id = newId;
  res.redirect("/urls");
});

app.get("/login", (req, res) => { //send to Login page if not logged in else redirect to /urls
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send("There are no URL's to show as no user is logged in, please login at try again", 401);
    return;
  }
  const templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => { //send to register page if not logged in else redirect to /urls
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("register", templateVars);
});

app.get("/urls/new", (req, res) => { //send to urls/new page if  logged in else redirect to /login
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => { //send to edit page of shortURL if logged in and the owner of shortURL else get descriptive error message
  if (!req.session.user_id) {
    res.send("There are no URL's to show as no user is logged in, please login at try again", 401);
    return;
  }
  if (!urlDatabase[req.params.id]) {
    res.send("That URL is not in our database, please check and try again", 404);
    return;
  }
  const doesUserHaveURL = urlsForUser(req.session.user_id, urlDatabase);
  if (!doesUserHaveURL[req.params.id]) {
    res.send("URL can only be modified by the original user", 403);
    return;
  }
  const URLVisits = siteVisits(req.params.id, urlDatabase);
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id],
    URLVisits,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => { //visit the longURL from the shortURL created, updated database with visit details
  if (!urlDatabase[req.params.id]) {
    res.send("That URL is not in our database, please check and try again", 404);
    return;
  }
  if (req.session.user_id) {
    if (urlDatabase[req.params.id].visits[req.session.user_id]) {
      urlDatabase[req.params.id].visits[req.session.user_id].push(Date.now());
    } else {
      urlDatabase[req.params.id].visits[req.session.user_id] = [Date.now()];
    }
  } else {
    urlDatabase[req.params.id].visits[generateRandomString()] = [Date.now()];
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/", (req, res) => { //send to /login if not logged in else send to /urls
  if (req.session.user_id) {
    return res.redirect("/urls");
  } else {
    return res.redirect("/login");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});