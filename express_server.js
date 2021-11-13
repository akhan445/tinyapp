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
const getUserByEmail = require('./helpers');

function findUserById(user_id) {
  for (const key in users) {
    if (user_id === key) {
      return users[key];
    }
  }
  return null;
}

function generateRandomString() {
  const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortURL = '';

  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * validChars.length);
    shortURL += validChars.charAt(index);
  }
  return shortURL;
};

function urlsForUser(user_id) {
  let urls = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === user_id) {
      urls[key] = urlDatabase[key]
    }
  }
  return urls;
}

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/register', (req, res) => {
  // Redirect if the user is already logged in
  if (req.session.user_id) {
    res.redirect('/urls');
  }
  // Not logged in, render the registration page. Pass a null value for user for the header partial
  res.render('urls_register', { user: null });
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('email or password fields cannot be empty');
  }

  // Check if user with email already exists
  const user = getUserByEmail(email, users);
  if (user) { // found a valid email
    return res.status(400).send('email already exists in user db');
  } 

  const user_id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: user_id,
    email: email,
    password: hashedPassword
  };

  users[user_id] = newUser; 

  req.session.user_id = user_id; //set the cookie
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  // redirect if user is logged in
  if (req.session.user_id) {
    res.redirect('/urls');
  }

  res.render('urls_login', { user: null }); //change this to redirect urls
});

app.post('/login', (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('email or password fields cannot be empty');
  }
  const user = getUserByEmail(email, users);
  // If no user was found
  if (!user) {
    return res.status(403).send('incorrect email');
  }
  // if password don't match
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('incorrect password');
  }
  req.session.user_id = user.id; //set the cookie
  res.redirect('/urls');
});

app.get('/logout', (req, res) => {
  req.session = null; // clear the cookie
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  // if user is not logged in, pass the error message to be displayed
  if (!req.session.user_id) {
    res.render('urls_index', { user: null , error: 'Login/Register to see the tiny urls!'});
  }
  // data to be displayed on urls_index page
  const templateVars = { 
    user: findUserById(req.session.user_id),
    urls: urlsForUser(req.session.user_id),
    error: null
  };
  res.render('urls_index', templateVars);
});

// edit url
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('Action not allowed');
  }

  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

// add new url, after completing form will post to /urls
app.get('/urls/new', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  const templateVars = {
    user: findUserById(req.session.user_id),
  };

  res.render('urls_new', templateVars);
  // res.redirect('/urls')
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.session.user_id || urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.status(401).send('Unauthorized action');
  }
  // only authenticated user will be able to get this far 
  delete urlDatabase[req.params.shortURL];

  const templateVars = {
    user: findUserById(req.session.user_id),
    urls: urlsForUser(req.session.user_id), // get a fresh one after/if deletion has occured
    error: null
  };

  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id) {
    res.render('urls_show', { user: null, error: "Log in to view this page"});
  }
  const templateVars = {
    user: findUserById(req.session.user_id),
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    error: null
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id || urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.status(401).send('Unauthorized action');
  }
  
  const key = req.params.shortURL;
  const newURL = req.body.longURL;

  // Add the new url to database which is where it is retrieved from 
  urlDatabase[key] = {
    longURL: newURL,
    userID: req.session.user_id
  }
  const templateVars = {
    user: findUserById(req.session.user_id),
    shortURL: key,
    longURL: newURL
  };
  res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example server listening on ${PORT}`);
});