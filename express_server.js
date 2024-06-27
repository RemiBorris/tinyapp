const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { userLookup, generateRandomString, urlsForUser } = require("./helpers");
const methodOverride = require('method-override');


app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "A1B2C3",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "A1B2C3",
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
  };
  res.redirect(`/urls/${newShortURL}`);
});

app.delete("/urls/:id", (req, res) => {
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

app.put("/urls/:id", (req, res) => {
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

app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/login", (req, res) =>{
  const confirmRegistered = userLookup(req.body.email, users);
  if (confirmRegistered === null || !bcrypt.compareSync(req.body.password, confirmRegistered.password)) { //verifies if hashed passwords match and user exists
    res.status(403).end('Email not found in database or password does not match');
    return;
  }
  req.session.user_id = confirmRegistered.id
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
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

app.get("/login", (req, res) => {
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

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("register", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
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
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.send("That URL is not in our database, please check and try again", 404);
    return;
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  } else {
    return res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});