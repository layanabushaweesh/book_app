'use strcit'

// Load environment variables module
require('dotenv').config();

// Load modules into our script 
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;

const options = NODE_ENV === 'production' ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } } : { connectionString: DATABASE_URL };
// App setup 
const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(options);
client.on('error', (err) => console.log(err));
app.use(cors()); //will respond to any request and allow access to our api from another domain
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static('public'));
app.set('view engine', 'ejs'); // Set the view engine for server-side 

app.get('/searches/new', showDetalis);

// Creates a new search to the Google Books API
app.post('/searches', serch);

app.get('*', (req, res) => res.status(404).send(' not exist'));

function showDetalis(req, res) {
    res.render('pages/searches/new')
}

// console.log(superagent)
// render the index.ejs from DB

app.get('/', (req, res) => { 
    const SQL = 'SELECT * FROM books;';
    client
        .query(SQL)
        .then((results) => {
            res.render('pages/index', { book: results.rows });
        })
        .catch((err) => {
            errorHandler(err, req, res);
        });
});
// render the datails of a book

app.get('/books/:id', (req, res) => { 
    const SQL = 'SELECT * FROM books WHERE id=$1;';
    const values = [req.params.id];
    console.log(values);
    client
        .query(SQL, values)
        .then((results) => {
            // console.log(results)
            res.render('pages/books/show', { book: results.rows[0] });
        })
        .catch((err) => {
            errorHandler(err, req, res);
        });
});
// Insert books into DB if not
app.post('/books', (req, res) => { 

    // let values = [req.body.isbn];
    let SQL = 'INSERT INTO books (image_url,title,author,description) VALUES ($1,$2,$3,$4) RETURNING id ;';
    let values = [req.body.img, req.body.title, req.body.author, req.body.description];
    client.query(SQL, values).then((results) => {
            // if (results.rows.length > 0) {
            // res.redirect(`/books/${results.rows[0].id}`);
            //  else {
            res.redirect(`/books/${results.rows[0].id}`);
            // console.log("inside insert")
            // let sqlQuery = 'SELECT * FROM books'
            // client.query(sqlQuery).then((results) => {
            //         console.log('data returned back from db ', results);

        })
        .catch((err) => {
            errorHandler(err, req, res);
        })
        // }
});




function serch(request, response) {
    let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  
    request.body.radio === 'title' ? url += `intitle=${request.body.search}` : url += `inauthor=${request.body.search}`;
    console.log(url);
    

    superagent.get(url)
        .then(apiData => {
            const Books = apiData.body.items.map(data => {
                return new Book(data);
            })
            response.render('pages/searches/show', { book: Books })
        })
        .catch(err => errorHandler(err, request, response))
}




// constructor
function Book(data) {
    this.image_url = data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = data.volumeInfo.title ? data.volumeInfo.title : "DEFULT TITLE";
    this.author = data.volumeInfo.authors ? data.volumeInfo.authors : "DEFULT AUTHOR";
    this.description = data.volumeInfo.description ? data.volumeInfo.description : "DEFULT DESCRIPTION";
    // this.isbn = (data.volumeInfo.industryIdentifiers && data.volumeInfo.industryIdentifiers[0].identifier) ? data.volumeInfo.industryIdentifiers[0].identifier : "NO ISBN AVAILABLE"
}

function errorHandler(err, req, res) {
    res.status(500).send(err);
}

client.connect()
    .then(app.listen(PORT, () =>
        console.log(`app is listening on ${PORT}`)))