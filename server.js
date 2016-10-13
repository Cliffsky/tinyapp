// Set dependencies

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const fs = require('fs');

// Set constants

const app = express();
app.use(bodyParser.urlencoded( { extended: false }));
app.use(express.static('public'));

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

// C reate

// R ead

app.get(`/`, (req, res) => {
  res.render("pages/index");
});

app.get(`/url`, (req, res) => {
  let urls = urlDb;
  res.render(`pages/url`, { urls });
})

app.post(`/url`, (req, res) => {
  let short = generateRandomString()
  urlDb[short] = req.body.longURL;
  fs.writeFile('urls', JSON.stringify(urlDb), (err, data) => {
  })
  res.redirect(`/url/${short}`);
})

app.get(`/url/:id`, (req, res) => {
  let urls = urlDb;
  res.render(`pages/url`, { urls } );
})

app.get(`/u/:id`, (req, res) => {
  let longURL = urlDb[req.params.id];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.redirect(`/`);
  }
});

// U pdate

app.get(`/url/:id/update`, (req, res) => {
  let short = req.params.id;
  let long = urlDb[req.params.id];
  res.render(`pages/update`, { short, long } );
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