"use strict";

const express = require('express');
const path = require('path');
const multer = require('multer');
const ExifImage = require('exif').ExifImage;
const DB = require('./modules/database');
const thumbnail = require('./modules/thumbnail');
const config = require('./config');

const app = express();

// set up database
//DB.connect('mongodb://'+config.user+':'+config.pwd+'@localhost/spy', app);
DB.connect('mongodb://'+config.user+':'+config.pwd+'@localhost:27017/spy', app);

const spySchema = {
    time: Date,
    category: String,
    title: String,
    details: String,
    coordinates: {
        lat: Number,
        lng: Number
    },
    thumbnail: String,
    image: String,
    original: String
};

const Spy = DB.getSchema(spySchema, 'Spy');


// set up file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'files/original')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
    }
});
const upload = multer({storage: storage});


// serve files
app.use(express.static('files'));

app.use('/modules', express.static('node_modules'));




// get posts
app.get('/posts', (req, res) => {
    Spy.find().exec().then((posts) => {
        res.send(posts);
    });
});

/// Find document ///
app.get('/posts/:searchBy', (req, res) => {

    const re = new RegExp(req.params.searchBy, 'i');

    Spy.find().or([
        { 'title': { $regex: re }},
        { 'details': { $regex: re }},
        { 'category': { $regex: re }}
    ]).exec((err, result) => {
        res.send(JSON.stringify(result));
    });
});

// add new *************
// get form data and create object for database (=req.body)
app.post('/new', upload.single('file'), (req, res, next) => {
    const file = req.file;
    req.body.thumbnail = 'thumb/' + file.filename;
    req.body.image = 'img/' + file.filename;
    req.body.original = 'original/' + file.filename;
    req.body.time = new Date().getTime();
    req.body.coordinates = {
        lat: 60.2196781,
        lng: 24.8079786 };
    next();
});



// create thumbnails
app.use('/new', (req, res, next) => {
    const small = thumbnail.getThumbnail('files/'+req.body.original, 'files/'+req.body.thumbnail, 300, 300);
    if( typeof small === 'object'){
        res.send(small);
    }
    const medium = thumbnail.getThumbnail('files/'+req.body.original, 'files/'+req.body.image, 720, 480);
    if( typeof medium === 'object'){
        res.send(medium);
    }
    next();
});

// add to DB
app.use('/new', (req, res, next) => {
    // console.log(req.body);
    Spy.create(req.body).then(post => {
        res.send({status: 'OK', post: post});
    }).then(() => {
        res.send({status: 'error', message: 'Database error'});
    });
});
// end add new ******************


// Update document *************

app.patch('/patch', upload.single('file'), (req, res, next) => {

    if (req.file != null) {
        const file = req.file;
        req.body.thumbnail = 'thumb/' + file.filename;
        req.body.image = 'img/' + file.filename;
        req.body.original = 'original/' + file.filename;
        req.body.time = new Date().getTime();
        req.body.coordinates = {
            lat: 60.2196781,
            lng: 24.8079786 };
    }
    next();
});

// create thumbnails
app.use('/patch', (req, res, next) => {
    if (req.file != null) {
        const small = thumbnail.getThumbnail('files/' + req.body.original, 'files/' + req.body.thumbnail, 300, 300);
        if (typeof small === 'object') {
            res.send(small);
        }
        const medium = thumbnail.getThumbnail('files/' + req.body.original, 'files/' + req.body.image, 720, 480);
        if (typeof medium === 'object') {
            res.send(medium);
        }
    }
    next();
});

app.use('/patch', (req, res, next) => {
   console.log(req.body);

    const query = {_id: req.body.id};
    const update = {$set: req.body};

   Spy.findOneAndUpdate(query, update).then(post => {
       //res.send({status: 'OK', post: post});
       res.sendStatus(200);
   }).then(() => {
       //res.send({status: 'error', message: 'Database error'});
       res.sendStatus(400);
   });
});

// End update *************

app.delete('/delete', upload.single('file'), (req, res) => {
    console.log(req.body);
    Spy.findByIdAndRemove(req.body.id, (err, remove) => {
        remove.save((err, deletedItem) => {
            if (err) return handleError(err);
        })
    }).then(post => {
        res.send({status: 'OK', post: post});
    }).then(() => {
        res.send({status: 'error', message: 'Database error'});
    });

});


