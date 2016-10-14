// Set dependencies

const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const fs = require('fs');

// Set constants

const app = express();
app.use(bodyParser.urlencoded( { extended: false }));
app.use(express.static('public'));
app.use(cookieSession({
  name: 'userId',
  keys: ['userId']
}));

// Load or Init database

var userDb;
fs.readFile('userDb', (err, data) => {
  if (err) {
    userDb = {};
  } else {
    if (Object.keys(JSON.parse(data)).length !== 0) {
      userDb = JSON.parse(data);
    } else {
      userDb = {};
    }
  }
})

var urlDb;
fs.readFile('urlDb', (err, data) => {
  if (err) {
    urlDb = {
      "b2xVn2": {long: "http://www.lighthouselabs.ca", userId: "user000000"},
      "9sm5xK": {long: "http://www.google.com", userId: "user000000"}
    }
  } else {
    if (Object.keys(JSON.parse(data)).length !== 0){
      urlDb = JSON.parse(data);
    } else {
      urlDb = {
        "b2xVn2": {long: "http://www.lighthouselabs.ca", userId: "user000000"},
        "9sm5xK": {long: "http://www.google.com", userId: "user000000"}
      }
    }
  }
})

// Set config

app.set('view engine', 'ejs');
app.set('port', process.env.port || 8080);

/* Routes */

// Login

app.get('/login', (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  res.render('pages/login', { templateVars })
})

app.post('/login', (req, res) => {
  let retrievedUser = findUser(req.body.email);
  if (retrievedUser === -1) {
    res.status(403);
    res.redirect('/');
  } else if (bcrypt.compareSync(userDb[retrievedUser].password, req.body.password)) {
    req.session.user_id = retrievedUser;
    console.log('hey');
    res.redirect('/url');
  } else {
    res.status(403);
    res.redirect('/');
  }
})

// Logout

app.post('/logout', (req, res) => {
  req.session.user_id="";
  res.redirect('/');
})

// Register

app.get('/register', (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
   };
  res.render('pages/register', { templateVars });
})

app.post('/register', (req, res) => {
  let userId = 'user' + generateRandomString();
  if (findUser(req.body.email) !== -1) {
    res.status(400);
  } else {
    userDb[userId] = {
      id: userId,
      email: req.body.email.toLowerCase(),
      password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
    }
    fs.writeFile('userDb', JSON.stringify(userDb), (err, data) => {
    });
    req.session.user_id = userId;
  }
  res.redirect('/');
})

// C reate

app.post(`/url`, (req, res) => {
  let short = generateRandomString()
  urlDb[short] = { long: req.body.longURL, userId: req.session.user_id };
  fs.writeFile('urlDb', JSON.stringify(urlDb), (err, data) => {
  })
  res.redirect(`/url`);
})

// R ead

app.get(`/url`, (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  res.render(`pages/url`, { templateVars });
})

app.get(`/u/:id`, (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  if (templateVars.urlDb[req.params.id]) {
    res.redirect(templateVars.urlDb[req.params.id].long);
  } else {
    res.redirect(`/`);
  }
});

// U pdate

app.get(`/url/:id/update`, (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  if (req.session.user_id === urlDb[req.params.id].userId) {
    res.render(`pages/update`, { templateVars } );
  } else {
    res.redirect('/');
  }
})

app.post(`/url/:id/update`, (req, res) => {
  if (req.session.user_id === urlDb[req.params.id].userId) {
    urlDb[req.params.id] = req.body.longURL;
    fs.writeFile('urlDb', JSON.stringify(urlDb), (err, data) => {
    })
  }
  res.redirect(`/url`);
})

// D elete

app.post(`/url/:id/delete`, (req, res) => {
  if (req.session.user_id === urlDb[req.params.id].userId) {
    delete urlDb[req.params.id];
    fs.writeFile('urlDb', JSON.stringify(urlDb), (err, data) => {
    })
  }
  res.redirect(`/url`);
})

// Get it rolling


app.get(`/`, (req, res) => {
  let templateVars = {
    userDb: userDb,
    urlDb: urlDb,
    userId: req.session.user_id
  };
  res.render("pages/index", { templateVars });
});


// Listener

app.listen(app.get(`port`), () => {
  console.log(`Listening on port ${app.get('port')}.`);
});

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
  if(char < 10/62) {
    char = 48 + Math.floor(char*62);
  } else if (char >= 10/62 && char < 36/62) {
    char = 55 + Math.floor(char*62);
  } else if (char >= 36/62) {
    char = 61 + Math.floor(char*62);
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