'use strict';
// Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const methodOverride = require('method-override');
const app = express();
// Middleware
app.use(cors());
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
// Setup environment
const PORT = process.env.PORT || 3030;
const DATABASE_URL = process.env.DATABASE_URL;

// database Setup
const client =  new pg.Client({
  connectionString: DATABASE_URL,
});
// Just to  a test
app.get('/hello', (req, res) => {
  res.render('pages/index');
});

// HomePage
const renderHomePage = (req, res) => {
  const selectAll = 'select * from books ;';
  client.query(selectAll).then((data) =>{
    res.render('pages/index', {books : data.rows , count: data.rows.length});
  }).catch((err) => errorHandler(err, req, res));
};
// Show Search Results
const renderSearchResults = (req, res) => {
  const searchKeyword = req.body.searched;
  const searchBy = req.body.searchBy;
  const url = `https://www.googleapis.com/books/v1/volumes?langRestrict=en&q=${searchKeyword}+in${searchBy}:`;

  superagent.get(url).then((data) => {
    const bookData = data.body.items;
    const book = bookData.map(item => {
      return new Book(item.volumeInfo );
    });
    res.render('pages/searches/show', { books: book });
  }).catch((err) => errorHandler(err, req, res));
};


// Search for a book by title or author
const renderSearch = (req, res) => {
  res.render('pages/searches/new');
};



// Adding a Book to The Home Page
const addBookToFavorite = (req,res) => {
  let id ;
  let SQL = 'INSERT INTO books (title, author, description, image_url , offShelf ,isbn) VALUES ($1,$2,$3,$4,$5,$6) RETURNING ID;';
  const { title, author, description, image_url , offShelf , isbn } = req.body;
  const values = [title, author, description, image_url , offShelf ,isbn ];
  const query = `SELECT * FROM books WHERE isbn = '${isbn}' ;`;
  client.query(query).then((searchedResult) => {
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

// Single Book Details
const showBookDetails = (req,res) => {
  const SQL = `SELECT * from books WHERE ID=${req.params.ID};`;
  client.query(SQL)
    .then(result => {
      console.log(' result.rows[0]', result.rows[0]);
      res.render('pages/books/show', { books: result.rows[0]});
    }).catch((err) => errorHandler(err, req, res));
};


function deleteBook(req, res) {
  const id = req.params.ID ;
  const sql = `DELETE FROM books WHERE ID = ${id};`;
  client.query(sql)
    .then(() => {
      res.redirect(`/books/${id}`);
    }).catch((err) => errorHandler(err, req, res));


}

// Update Book in The Database
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

// error path rout
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





app.get('/', renderHomePage);
app.get('/searches/new', renderSearch);
app.post('/searches', renderSearchResults);
app.get('/books/:ID', showBookDetails);
app.post('/books', addBookToFavorite);
app.put('/books/:ID', updateBook);
app.delete('/books/:ID', deleteBook);
app.use('*',handelWrongPath);
// constructor
function Book(data ) {
  this.title = (data.title)? data.title : 'Unknown Book Title';
  this.author = (data.authors)? data.authors : 'Unknown Book Authors';
  this.description = (data.description)? data.description : 'Description not available';
  this.thumbnail = (data.imageLinks.thumbnail) ? data.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  this.isbn = data.industryIdentifiers ? `${data.industryIdentifiers[0].type} ${data.industryIdentifiers[0].identifier}` : 'Unknown ISBN';
  this.offShelf = (data.categories) ? data.categories : 'The book is not in a shelf';

}
// Error Handler 
function errorHandler(err, req, res) {
  res.render('pages/error', { err :err.message});
}