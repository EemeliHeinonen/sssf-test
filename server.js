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
DB.connect('mongodb://'+config.user+':'+config.pwd+'@mongodb12949-sssf-eemelih.jelastic.metropolia.fi/spy:27017', app);

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

// add new *************
// get form data and create object for database (=req.body)
app.post('/new', upload.single('file'), (req, res, next) => {
    const file = req.file;
    req.body.thumbnail = 'thumb/' + file.filename;
    req.body.image = 'img/' + file.filename;
    req.body.original = 'original/' + file.filename;
    req.body.time = new Date().getTime();
    // get EXIF data
    try {
        req.body.coordinates = {
            lat: 60.2196781,
            lng: 24.8079786
        };
        next();

    } catch (error) {
        console.log('Error: ' + error.message);
        res.send({status: 'error', message: 'EXIF error'});
    }
});

Spy.find().exec().then((spies) => {
    //TODO update stuff

});

app.put('/update', function (req, res) {
    const catIndex = document.getElementById('select-cat').selectedIndex;
    const myCat = originalData[catIndex];

    Spy.findById(myCat._id, (err, upd) => {
        upd = req.body;
        upd.save((err, updatedItem) => {
          if (err) return handleError(err);
        });
    })
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



// convert GPS coordinates to GoogleMaps format
const gpsToDecimal = (gpsData, hem) => {
    let d = parseFloat(gpsData[0]) + parseFloat(gpsData[1] / 60) + parseFloat(gpsData[2] / 3600);
    return (hem === 'S' || hem === 'W') ? d *= -1 : d;
};

