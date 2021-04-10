
'use strict';
// Dependencies

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const cors = require('cors');
const pg = require('pg');
const methodOverride = require('method-override');
const app = express();

// Setup environment
const PORT = process.env.PORT || 3030;
const DATABASE_URL = process.env.DATABASE_URL;



// Search for a book by title 
const renderSearch = (req, res) => {
  res.render('pages/searches/new');
};

// Show Search Results
const renderSearchResults = (req, res) => {
  const searchKeyword = req.body.searched;
  const searchBy = req.body.searchBy;
  // let url = `https://www.googleapis.com/books/v1/volumes?q=${req.body.searchQuery}+${req.body.searchBy === 'title' ? 'intitle' : 'inauthor'}`;
  const url = `https://www.googleapis.com/books/v1/volumes?langRestrict=en&q=${searchKeyword}+in${searchBy}:`;

  superagent.get(url).then((data) => {
    const bookData = data.body.items;
    const book = bookData.map(item => {
      return new Book(item.volumeInfo );
    });
    res.render('pages/searches/show', { books: book });
  }).catch((err) => errorHandler(err, req, res));
};

// Adding  to The Home Page
const addBook = (req,res) => {
  let id ;
  let SQL = 'INSERT INTO books (title, author, description, image_url , offShelf ,isbn) VALUES ($1,$2,$3,$4,$5,$6) RETURNING ID;';
  const { title, author, description, image_url , offShelf , isbn } = req.body;
  const values = [title, author, description, image_url , offShelf ,isbn ];
  const sqlSearch = `SELECT * FROM books WHERE isbn = '${isbn}' ;`;
  client.query(sqlSearch).then((searchedResult) => {
    if (searchedResult.rowCount > 0) {
      res.redirect(`/books/${searchedResult.rows[0].id}`);
    }
    else{
      client.query(SQL,values)
        .then ((result) => {
          id =result.rows[0].id ;
          res.redirect(`/books/${id}`);
        })
        .catch((err) => {
          errorHandler(err, req, res);
        });
    }
  });
};

// Single Book 
const showBook = (req,res) => {
  const SQL = `SELECT * from books WHERE ID=${req.params.ID};`;
  client.query(SQL)
    .then(result => {
      console.log(' result.rows[0]', result.rows[0]);
      res.render('pages/books/show', { books: result.rows[0]});
    }).catch((err) => errorHandler(err, req, res));
};


// Update The Database
const updateBook = (req, res) => {
  const id = req.params.ID ;
  console.log('req.body', req.body);
  console.log('req.params.id' , id);
  const setSQL = `UPDATE books SET title=$1, author=$2, description=$3 , offShelf=$4, isbn=$5
  WHERE id=$6;`;
  const { title, author, description , offShelf , isbn } = req.body;
  const values = [title, author, description, offShelf ,isbn , id];
  client.query(setSQL, values)
    .then(() => {
      res.redirect(`/books/${id}`);
    }).catch((err) => errorHandler(err, req, res));
};

function deleteBook(req, res) {
  const id = req.params.ID ;
  const deleteSQL = `DELETE FROM books WHERE ID = ${id};`;
  client.query(deleteSQL)
    .then(() => {
      res.redirect(`/books/${id}`);
    }).catch((err) => errorHandler(err, req, res));

app.get('/searches/new', show);

// Creates a new search to the Google Books API
app.post('/searches', search);


}

// wrong path rout
const handelWrongPath = (err, req, res) => {
  errorHandler(err, req ,res);
};

// database connection
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('connected to db', client.connectionParameters.database);
    console.log(`The server is running on port ${PORT}`);
  });
}).catch(error => {
  console.log('error', error);
});

