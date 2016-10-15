// Set dependencies

const express = require('express');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const fs = require('fs');

// Declare app

const app = express();

// Set config

app.set('view engine', 'ejs');
app.set('port', process.env.port || 8080);

// Set constants

app.use(bodyParser.urlencoded( { extended: false }));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(cookieSession({
  name: 'userId',
  keys: ['userId']
}));

//

// Load or Init database

var userDb = {};
var userData = fs.readFileSync('userDb');

let jUserData = JSON.parse(userData);
if (Object.keys(jUserData).length) {
  userDb = jUserData;
}


var urlDb = {};
var urlData = fs.readFileSync('urlDb');

let jUrlData = JSON.parse(urlData);
if (Object.keys(jUrlData).length) {
  urlDb = jUrlData;
}

/* Routes */

// Root

app.get(`/`, (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  if (templateVars.userId) {
    res.redirect("/urls");
  } else {
    res.render("pages/index", templateVars);
  }
});

// Login

app.get('/login', (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  res.render('pages/login', templateVars);
});

app.post('/login', (req, res) => {
  let retrievedUser = findUser(req.body.email);
  if (retrievedUser === -1) {
    res.status(403);
    res.redirect(`/error/403`);
  } else if (bcrypt.compareSync(req.body.password, userDb[retrievedUser].password)) {
    req.session.user_id = retrievedUser;
    res.redirect('/urls');
  } else {
    res.status(403);
    res.redirect(`/error/403`);
  }
});

// Logout

app.post('/logout', (req, res) => {
  req.session.user_id = "";
  res.redirect('/');
});

// Register

app.get('/register', (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  res.render('pages/register', templateVars);
});

app.post('/register', (req, res) => {
  let userId = 'user' + generateRandomString();
  if (findUser(req.body.email) !== -1) {
    res.status(400);
    res.redirect(`/error/400`);

  } else {
    userDb[userId] = {
      id: userId,
      email: req.body.email.toLowerCase(),
      password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
    };
    fs.writeFile('userDb', JSON.stringify(userDb));
    req.session.user_id = userId;
  }
  res.redirect('/');
});

// C reate

app.post(`/urls`, (req, res) => {
  if (validUrl.isUri(req.body.longURL)) {
    let short = generateRandomString();
    urlDb[short] = { long: req.body.longURL, userId: req.session.user_id, views: 0, viewerIds: [] };
    fs.writeFile('urlDb', JSON.stringify(urlDb));
    res.redirect(`/urls`);
  } else {
    res.redirect(`/error/400`);
  }
});

// R ead

app.get(`/urls`, (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  res.render(`pages/url`, templateVars);
});

app.get(`/u/:id`, (req, res) => {
  urlDb[req.params.id].views += 1;
  if (req.session.user_id && !urlDb[req.params.id].viewerIds.find((element) => { return element === req.session.user_id })) {
    urlDb[req.params.id].viewerIds.push(req.session.user_id);
  }
  fs.writeFile('urlDb', JSON.stringify(urlDb));
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  if (templateVars.urlDb[req.params.id]) {
    res.redirect(templateVars.urlDb[req.params.id].long);
  } else {
    res.redirect(`/error/404`);
  }
});

// U pdate

app.get(`/urls/:id/update`, (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id,
    short: req.params.id
  };
  if (req.session.user_id === urlDb[req.params.id].userId) {
    res.render(`pages/update`, templateVars );
  } else {
    res.redirect(`/error/404`);
  }
});

app.put(`/urls/:id`, (req, res) => {
  if (req.session.user_id === urlDb[req.params.id].userId) {
    urlDb[req.params.id].long = req.body.longURL;
    fs.writeFile('urlDb', JSON.stringify(urlDb));
    res.redirect(`/urls`);
  } else {
    res.redirect(`/error/404`);
  }
});

// D elete

app.delete(`/urls/:id`, (req, res) => {
  if (req.session.user_id === urlDb[req.params.id].userId) {
    delete urlDb[req.params.id];
    fs.writeFile('urlDb', JSON.stringify(urlDb));
    res.redirect(`/urls`);
  } else {
    res.redirect(`/error/404`);
  }
});

// E rror

app.get('/error/:id', (req, res) => {
  let templateVars = {
    error: req.params.id
  };
  res.status(req.params.id);
  res.render('pages/error', templateVars);
});

// Listener

app.listen(app.get(`port`));

// Methods

function generateRandomString() {
  let string = "";
  for (var i = 0; i < 6; i += 1) {
    string += generateAlphaNumericChar();
  }
  return string;
}

function generateAlphaNumericChar(){
  let char;
  char = Math.random();
  // Conditional chain in place to ensure no non-alphaNumeric characters get returned
  if(char < 10 / 62) {
    char = 48 + Math.floor(char * 62);
  } else if (char >= 10 / 62 && char < 36 / 62) {
    char = 55 + Math.floor(char * 62);
  } else if (char >= 36 / 62) {
    char = 61 + Math.floor(char * 62);
  }
  return String.fromCharCode(char);
}

function findUser(email) {
  let output;
  for(var key in userDb) {
    if(userDb[key].email === email) {
      output = key;
    }
  }
  if(!output) {
    output = -1;
  }
  return output;
}