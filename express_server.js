const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
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

function findUserById(user_id) {
  for (const key in users) {
    if (user_id === key) {
      return users[key];
    }
  }
  return null;
}

function emailAlreadyExists(email) {
  for (const key in users) {
    console.log(users[key].email);
    if (users[key].email === email) {
      return true;
    }
  }
  return false;
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

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/register', (req, res) => {
  //username
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {

  if (!req.body.email || !req.body.password) {
    return res.status(400).send('email or password fields cannot be empty');
  } else if (emailAlreadyExists(req.body.email)) {
    return res.status(400).send('email already exists in user db');
  }
  const user_id = generateRandomString();
  const user = {
    id: user_id,
    email: req.body.email,
    password: req.body.password
  };

  users[user_id] = user; 

  res.cookie('user_id', user_id); //set the cookie
  res.redirect('/urls');
});

// needs refactoring
app.post('/login', (req, res) => {
  //username
  const username = req.body.username;
  res.cookie('username', username); // set the cookie
  res.redirect('/urls');
});

//needs refactoring
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  //username
  // Buggy --> gives each user all urls in database
  const templateVars = { 
    user: findUserById(req.cookies["user_id"]),
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL

  urlDatabase[shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  //username
  const templateVars = {
    user: findUserById(req.cookies["user_id"]),
  };
  res.render('urls_new', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  //username
  const templateVars = {
    user: findUserById(req.cookies["user_id"]),
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  //username
  const templateVars = {
    user: findUserById(req.cookies["user_id"]),
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const key = req.params.shortURL;
  const newURL = req.body.longURL;
  urlDatabase[key] = newURL;
  //username
  const templateVars = {
    user: findUserById(req.cookies["user_id"]),
    shortURL: key,
    longURL: newURL
  };
  res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example server listening on ${PORT}`);
});