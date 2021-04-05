'use strict';

// App Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
// const pg = require('pg');
const cors = require('cors');
// const path = require('path');
// const { response } = require('express');

// App Setup
const app = express();
const PORT = process.env.PORT || 3000;

// App Middleware
app.use(express.urlencoded({ extended: true}));
app.use(cors());
// Setting View Engine
// app.set('views', path.join(__dirname), 'views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public')); // for css


// API Routes
app.get('/', renderHome);
app.get('/searches/new', renderSearch);
app.post('/searches', renderResults);




// Start App
app.listen(PORT, () => console.log(`Up listen on PORT ${PORT}`));







// Render Functions
function renderHome(req, res) {
  res.render('pages/index');
}

function renderSearch(req, res) {
  res.render('pages/searches/new');
}

function renderResults(req, res) {
  

  let url = 'https://www.googleapis.com/books/v1/volumes'
  const search_query = req.body.search;
  const searchBy = req.body.searchBy;

  const queryObj = {};
  if (searchBy === 'title') {
    queryObj['q'] = `+intitle:'${search_query}'`;
  } else if (searchBy === 'author') {
    queryObj['q'] = `+inauthor:'${search_query}'`;
  }
  superagent.get(url).query(queryObj).then(apiResponse => {
    const bookData = apiResponse.body.items.map(bookResult => {
      return new Books(bookResult.volumeInfo);
    });
    res.render('pages/searches/show', {searchResults: bookData});
  }).catch(error => {
    console.log('ERROR', error);
    return res.render('pages/error', { error: error });
  });
}




//// Constructor
function Books(data) {
  this.title = data.title;
  this.author = (data.authors) ? data.authors : 'Many Authors';
  this.description = data.description;
  this.thumbnail = (data.imageLinks.thumbnail) ? data.imageLinks.thumbnail : `https://i.imgur.com/J5LVHEL.jpg`;
}


// Catch-all
app.get('*', (req, res) => res.status(404).send('This route  not HRERE :)'));
