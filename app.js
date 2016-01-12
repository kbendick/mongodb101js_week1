'use strict';

const express = require('express'),
      engines = require('consolidate'),
      bodyParser = require('body-parser'),
      MongoClient = require('mongodb').MongoClient,
      assert = require('assert'),
      util = require('util');

var app = express();

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));

// Handler for internal server errors
function errorHandler(err, req, res, next) {
	console.error(err.message);
	console.error(err.stack);
	res.status(500).render('error_template', { error: err });
}

function buildMovieJSON(title, year, imdb) {
	return { "title": title, "year": year, "imdb": imdb };
}


// Connect to a pre-existing local db named video with a movies collection
MongoClient.connect('mongodb://localhost:27017/video', function(err, db) {

	// Defined as a subfunction to allow access to db.
	//  Probably should have just made it a parameter.
	function insertMovie(movieAsJSON) {
		db.collection('movies').insertOne(movieAsJSON, function(err, r) {
			assert.equal(null, err);
			assert.equal(1, r.insertedCount);
		});
	}

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");

    // Register root
    app.get('/', function(req, res, next) {
    	res.render('movie_form');
    });

    // Note that NO error checking is performed on user's data.
    //	... This is bad.
    app.post('/insert_movie', function(req, res, next) {

    	// Get the user's input data from the POST request
    	let title = req.body.title;
    	let year = req.body.year;
    	let imdb = req.body.imdb;

    	assert.notEqual(undefined, title);
    	assert.notEqual(undefined, year);
    	assert.notEqual(undefined, imdb);

    	// assert.notEqual("", title);
    	// assert.notEqual("", year);
    	// assert.notEqual("", imdb);

		if (title == "" || year == "" || imdb == "") {
			next("Please enter all of the requested parameters!");
		}
		else {
			console.log("Received the title %s, year %s, and imdb %s", title, year, imdb);

			// Build JSON from input and 
    		console.log("Parsing the intput...");
    		let movieAsJSON = buildMovieJSON(title, year, imdb);

    		// Attempt to insert the movie into db
	    	console.log("Inserting the movie...");
	    	insertMovie(movieAsJSON);

	    	// Verify that the movie was inserted by searching for it and outputting result to console.
	    	let movieFromDB = db.collection('movies').find({ "title": title , "year": year, "imdb": imdb}).toArray(function(err, documents) {
	    		
	    		if (err || documents.length === 0) {
	    			console.error("Did not successfully insert the movie into the db =(");
	    		}
	    		else {
	    			console.log("Found the movie in the database!");
	    			res.status(200).render('success_template', { message: util.format("Added %s to the database.", title) });
	    		}

	    		db.close();

	    	});

	    }

	}); // END app.post
});

app.use(errorHandler);

// Set up the server
var server = app.listen(3000, function() {
    var port = server.address().port;
    console.log('Express server listening on port %s.', port);
});