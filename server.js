  // req
'use strcit'

// Load environment variables module
require('dotenv').config();

// Load modules into our script 
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
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
app.use(methodOverride('_method')); //tell the server to override post method to listen to UPDATE/DELETE queries
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static('public'));
app.set('view engine', 'ejs'); // Set the view engine for server-side 





app.get('/', (req, res) => { // render the index.ejs from DB
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


app.get('/books/:id', (req, res) => { 
    const SQL = 'SELECT * FROM books WHERE id=$1;';
    const values = [req.params.id];
    // console.log(values);
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

app.post('/books', (req, res) => { // Insert books into DB if not

    let SQL = 'INSERT INTO books (image_url,title,author,description) VALUES ($1,$2,$3,$4) RETURNING id ;';
    let values = [req.body.img, req.body.title, req.body.author, req.body.description];
    client.query(SQL, values).then((results) => {
           
            res.redirect(`/books/${results.rows[0].id}`);
            

        })
        .catch((err) => {
            errorHandler(err, req, res);
        })
        // }
});

app.get('/searches/new', show);

// Creates a new search to the Google Books API
app.post('/searches', search);

app.get('*', (req, res) => res.status(404).send('This route does not exist'));

function show(req, res) {
    res.render('pages/searches/new')
}


function search(request, response) {
    let url = 'https://www.googleapis.com/books/v1/volumes?q=';

    console.log(request.body);
    console.log(request.body.search);
    console.log(request.body.radio)
        // console.log(request.body.search[1]);
        // console.log(request.body.search[0]);

    // can we convert this to ternary?
    request.body.radio === 'title' ? url += `intitle=${request.body.search}` : url += `inauthor=${request.body.search}`;
    console.log(url);
   

    superagent.get(url)
        .then(apiResponse => {
            const Books = apiResponse.body.items.map(data => {
                // console.log(data.id);
                return new Book(data);
            })
            response.render('pages/searches/show', { book: Books })
        })
        .catch(err => errorHandler(err, request, response))
}


app.get('/edit/:id', (req, res) => { 
    const SQL = 'SELECT * FROM books WHERE id=$1;';
    const values = [req.params.id];
    console.log(values)
    client
        .query(SQL, values)
        .then((results) => {
            console.log(resutls)
            res.render('pages/books/edit', { book: results.rows[0] });
        })
        .catch((err) => {
            errorHandler(err, req, res);
        });
});

app.put('/update/:id', (req, res) => {
    const SQL = 'UPDATE books SET image_url=$1,title=$2,author=$3,description=$4,isbn=$5 WHERE id=$6;';
    const values = [req.body.img, req.body.title, req.body.author, req.body.description, req.body.isbn, req.params.id];
    client
        .query(SQL, values).then(() => res.redirect(`/books/${req.params.id}`))
        .catch((err) => errorHandler(err, req, res))
});


app.delete('/delete/:id', (req, res) => {
    const SQL = 'DELETE FROM books WHERE id=$1';
    const values = [req.params.id];
    client
        .query(SQL, values)
        .then(() => res.redirect('/'))
        .catch((err) => errorHandler(err, req, res))
});



function errorHandler(err, req, res) {
    res.status(500).send(err);
}

// constructor books
function Book(data) {
    this.image_url = data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = data.volumeInfo.title ? data.volumeInfo.title : "DEFULT TITLE";
    this.author = data.volumeInfo.authors ? data.volumeInfo.authors : "DEFULT AUTHOR";
    this.description = data.volumeInfo.description ? data.volumeInfo.description : "DEFULT DESCRIPTION";
    this.isbn = (data.volumeInfo.industryIdentifiers) ? data.volumeInfo.industryIdentifiers[0].identifier : `Unknown ISBN`;
}


client.connect()
    .then(app.listen(PORT, () =>
        console.log(`app is listen on ${PORT}`)))