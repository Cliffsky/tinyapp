// Set dependencies

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const fs = require('fs');

// Set constants

const app = express();
app.use(bodyParser.urlencoded( { extended: false }));
app.use(express.static('public'));
app.use(cookieParser());

// Load or Init database

var urlDb;
fs.readFile('urls', (err, data) => {
  if (err) {
    urlDb = {
      "b2xVn2": "http://www.lighthouselabs.ca", "9sm5xK": "http://www.google.com"
    }
  } else {
    if (Object.keys(JSON.parse(data)).length !== 0){
      urlDb = JSON.parse(data);
    } else {
      urlDb = {
      "b2xVn2": "http://www.lighthouselabs.ca", "9sm5xK": "http://www.google.com"
      }
    }
  }
})

// Set config

app.set('view engine', 'ejs');
app.set('port', process.env.port || 8080);

/* Routes */

// Login

app.post('/login', (req, res) => {
  res.cookie('userName', req.body.userName, { maxAge: 86400 } );
  res.redirect('/');
})

// Logout

app.post('/logout', (req, res) => {
  res.clearCookie('userName');
  res.redirect('/');
})

// C reate

app.post(`/url`, (req, res) => {
  let short = generateRandomString()
  urlDb[short] = req.body.longURL;
  fs.writeFile('urls', JSON.stringify(urlDb), (err, data) => {
  })
  res.redirect(`/url`);
})

// R ead

app.get(`/`, (req, res) => {
  let templateVars = {
    userName: req.cookies["userName"],
  }
  res.render("pages/index", { templateVars});
});

app.get(`/url`, (req, res) => {
  let templateVars = {
    userName: req.cookies["userName"],
    'urls': urlDb,
   };
  res.render(`pages/url`, { templateVars });
})

app.get(`/u/:id`, (req, res) => {
  let templateVars = {
    userName: req.cookies["userName"],
    'long' : urlDb[req.params.id],
  };
  if (templateVars.long) {
    res.redirect(templateVars.long);
  } else {
    res.redirect(`/`);
  }
});

// U pdate

app.get(`/url/:id`, (req, res) => {
  res.redirect(`url/req.body.id/update`);
})

app.get(`/url/:id/update`, (req, res) => {
  let templateVars = {
    userName: req.cookies["userName"],
    short: req.params.id,
    long: urlDb[req.params.id]
  };
  res.render(`pages/update`, { templateVars } );
})

app.post(`/url/:id/update`, (req, res) => {
  urlDb[req.params.id] = req.body.longURL;
  fs.writeFile('urls', JSON.stringify(urlDb), (err, data) => {
  })
  res.redirect(`/url`);
})

// D elete

app.post(`/url/:id/delete`, (req, res) => {
  delete urlDb[req.params.id];
  fs.writeFile('urls', JSON.stringify(urlDb), (err, data) => {
  })
  res.redirect(`/url`);
})

// Get it rolling

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