//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan'),
    bodyparser = require('body-parser'),
    server = require('http').Server(app),
    io = require('socket.io')(server);
    
var urlEncodedParser = bodyparser.urlencoded({extended:false});
var jsonParser = bodyparser.json()

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));
app.use('/static', express.static(__dirname+'/public'));
app.use(express.bodyParser());

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object(),
    name = null,
    user_result = null;

var initDb = function(callback) {
  //mongoURL = 'mongodb://localhost:27017/test';
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

//app.post('/login', urlEncodedParser, function(req, res) {
  ////console.log('page opene!');
  //if (!db) {
    //initDb(function(err){});
  //}
  //if (db) {
    //let uname = req.body.logname;
    //let upass = req.body.logpass;
    //console.log("USER NAME: " + uname);
    //console.log("PASSWORD: " + upass);

    //db.collection('profiles').find({'username': uname, 'password': upass})
        //.toArray(function(err, result) {
          //console.log(result);
          //if (result.length==0) {
            //res.redirect('/');
          //}
          //else {
            //name = uname;
            //user_result = result;
            //res.redirect('/main');
          //}
    //});
  //}
//});

app.post('/signup', function(req, res) {
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    let uname = req.body.signname;
    let upass = req.body.signpass;
    
    var profiles = db.collection('profiles');
    profiles.insert(
      {'username': uname, 'password': upass, 
        'question_new': 
        {
          'weight': [],
          'height': [],
          'job': null,
          'age': null,
          'gender': null
        }, 
        'question_existing':
        {
          'working_hrs': 0 
        } 
    });

    res.redirect('/test2');
  }
});

app.get('/dbase', function(req, res) {
  console.log(db);
});

app.get('/test', function(req, res) {
  res.send('Oh the world!!');
});

app.get('/test2', function(req, res) {
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('profiles');
    col.find().toArray(function(err, result) {
      res.send(JSON.stringify(result));
    });
  }
});

app.get('/main', function(req,res) {
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var profiles = db.collection('profiles');
    var uname = 'raju',
        upass = 'raju';
    profiles.insert(
      {'username': uname, 'password': upass, 
        'question_new': 
        {
          'weight': [],
          'height': [],
          'job': null,
          'age': null,
          'gender': null
        }, 
        'question_existing':
        {
          'working_hrs': 0 
        } 
    });
    res.render('main.html', { username: name, userresult: JSON.stringify(user_result) });
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});


// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

//app.listen(port, ip);
server.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
