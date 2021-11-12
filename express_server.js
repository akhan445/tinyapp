const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const users = require('./data/userDB'); 
const urlDatabase = require('./data/urlDB'); 

function findUserById(user_id) {
  for (const key in users) {
    if (user_id === key) {
      return users[key];
    }
  }
  return null;
}

function getUserByEmail(email) {
  for (const key in users) {
    if (users[key].email === email) {
      return { data: users[key], error: null };
    }
  }
  return { data: null, error: "User does not exist" };
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

// app.get('/', (req, res) => {
//   res.send('Hello!');
// });

// app.get('/hello', (req, res) => {
//   res.send('<html><body>Hello <b>World</b></body></html>\n');
// });

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/register', (req, res) => {
  
  if (req.cookies.user_id) {
    res.redirect('/urls');
  }

  res.render('urls_register', { user: null });
});

app.post('/register', (req, res) => {

  if (!req.body.email || !req.body.password) {
    return res.status(400).send('email or password fields cannot be empty');
  }
  const { data, error } = getUserByEmail(req.body.email);
  if (data) { // found a valid email
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

app.get('/login', (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  }

  res.render('urls_login', {user: null}); //change this to redirect urls
});

app.post('/login', (req, res) => {
  //username
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('email or password fields cannot be empty');
  }
  const { data, error } = getUserByEmail(email);
  if (error) {
    return res.status(403).send('incorrect username or password');
  }

  //valid email
  if (data.password !== password) {
    return res.status(403).send('incorrect username or password');
  }
  res.cookie('user_id', data.id); // set the cookie
  res.redirect('/urls');
});

app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  if (!req.cookies.user_id) {
    res.render('urls_index', { user: null , error: 'Login/Register to see the tiny urls!'});
  }
  const templateVars = { 
    user: findUserById(req.cookies.user_id),
    urls: urlsForUser(req.cookies.user_id),
    error: null
  };
  res.render('urls_index', templateVars);
});

// edit url
app.post('/urls', (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(401).send('Action not allowed');
  }
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect('/login');
  }
  const templateVars = {
    user: findUserById(req.cookies["user_id"]),
  };
  res.render('urls_new', templateVars);
  // res.redirect('/urls')
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.cookies.user_id || urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    return res.status(401).send('Unauthorized action');
  }

  //   const userURLs = urlsForUser(req.cookies.user_id);
  //   // find and delete from the user's url;s
  //   if (Object.keys(userURLs).length !== 0) {
  //     if (userURLs.hasOwnProperty(req.params.shortURL)) {
  //     if (userURLs[req.params.shortURL].userID === req.cookies.user_id) {
  //     }
  //   }
  // }
delete urlDatabase[req.params.shortURL];

  const templateVars = {
    user: findUserById(req.cookies["user_id"]),
    urls: urlsForUser(req.cookies.user_id) // get a fresh one after/if deletion has occured
  };

  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  if (!req.cookies.user_id) {
    res.render('urls_show', { user: null, error: "Log in to view this page"});
  }
  const templateVars = {
    user: findUserById(req.cookies.user_id),
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    error: null
  };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  if (!req.cookies.user_id || urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    return res.status(401).send('Unauthorized action');
  }
  
  const key = req.params.shortURL;
  const newURL = req.body.longURL;

  // Add the new url to database which is where it is retrieved from 
  urlDatabase[key] = {
    longURL: newURL,
    userID: req.cookies.user_id
  }
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