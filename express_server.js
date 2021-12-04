const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['This is my cookie sesh', 'And here is another key']
}));

const users = require('./data/userDB'); 
const urlDatabase = require('./data/urlDB'); 
const { getUserByEmail, findUserById, generateRandomString, urlsForUser } = require('./helpers');

// Redirect the user for home route
app.get("/", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

app.get('/register', (req, res) => {
  // Redirect if the user is already logged in
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  // Not logged in, render the registration page. Pass a null value for user for the header partial
  res.render('urls_register', { user: null });
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email or password fields cannot be empty');
  }

  // Check if user with email already exists
  const user = getUserByEmail(email, users);
  if (user) { // found a valid email
    return res.status(400).send('Email already exists in user db');
  } 

  // Generates data for a new user on registration. Randomly generated unique string for id, hashed password and added to database
  const user_id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: user_id,
    email: email,
    password: hashedPassword
  };

  users[user_id] = newUser; 

  req.session.user_id = user_id; //set the cookie for the new user
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  // redirect if user is logged in
  if (req.session.user_id) {
    return res.redirect('/urls');
  }

  res.render('urls_login', { user: null }); // Render the login page for non-authenticated user, the null is used for ejs logic on page
});

app.post('/login', (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email or password fields cannot be empty');
  }

  const user = getUserByEmail(email, users);
  // If no user was found
  if (!user) {
    return res.status(403).send('Incorrect email');
  }
  // if password don't match
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('Incorrect password');
  }
  req.session.user_id = user.id; //set the cookie
  res.redirect('/urls');
});

app.get('/logout', (req, res) => {
  req.session = null; // clear the cookie session
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  // if user is not logged in, pass the error message to be displayed
  if (!req.session.user_id) {
    return res.render('urls_index', { user: null , error: 'Login/Register to see the tiny urls!'});
  }
  // data to be displayed on urls_index page
  const templateVars = { 
    user: findUserById(req.session.user_id, users),
    urls: urlsForUser(req.session.user_id, urlDatabase),
    error: null
  };
  res.render('urls_index', templateVars);
});

// edit url
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('Unauthorized Access');
  }

  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

// add new url form page, after completing form will post to /urls
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  const templateVars = {
    user: findUserById(req.session.user_id, users),
  };

  return res.render('urls_new', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.session.user_id || urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.status(403).send('Unauthorized Access');
  }
  // only authenticated user will be able to get this far 
  delete urlDatabase[req.params.shortURL];

  const templateVars = {
    user: findUserById(req.session.user_id, users),
    urls: urlsForUser(req.session.user_id, urlDatabase), // get a fresh one after/if deletion has occured
    error: null
  };

  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id) {
    return res.render('urls_show', { user: null, error: "Log in to view this page"});
  }

  //validate the short url parameter is in the database
  if (!(req.params.shortURL in urlDatabase)) {
    return res.status(502).send('Invalid URL');
  }

  // if the user is logged in and the short url is valid, authenticate user is also the owner of this short URL
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send('Unauthorized Access');
  }

  const templateVars = {
    user: findUserById(req.session.user_id, users),
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    error: null
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id || urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.status(403).send('Unauthorized Access');
  }
  
  const key = req.params.shortURL;
  const newURL = req.body.longURL;

  // Add the new url to database which is where it is retrieved from 
  urlDatabase[key] = {
    longURL: newURL,
    userID: req.session.user_id
  }
  const templateVars = {
    user: findUserById(req.session.user_id, users),
    shortURL: key,
    longURL: newURL
  };
  res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example server listening on ${PORT}`);
});