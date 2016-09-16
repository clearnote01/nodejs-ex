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
//app.use(express.bodyParser());

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
    user_result = null,
    uname = null,
    upass = null;

var initDb = function(callback) {
  mongoURL = 'mongodb://localhost:27017/test';
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

// Helper functions for dbase !!
var getUserInfo = function (db_uname,db_password, res, loginsuccesscallback, loginfailcallback, failmessage) {
  var profiles = db.collection('profiles');
  profiles.find({'username': db_uname, 'password': db_password }).toArray(function(err, result) {
    console.log('RESULT BELOW');
    console.log(result)
    if ( result.length == 0 ) {
      loginfailcallback(res,failmessage);
    }
    else {
      user_result = result[0];
      loginsuccesscallback(res, user_result);
    }
  });
  return user_result;
}

var loginfailcallback = function(res, failmessage) {
  res.end(failmessage);
}

var userlogincallback = function(res,user_result) {
  console.log('USER RESULT');
  console.log(user_result);
  res.redirect('/main');
}

// Routes are defined here!!
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

app.post('/login', urlEncodedParser, function(req, res) {
  //console.log('page opene!');
  user_result = null;
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    uname = req.body.logname;
    upass = req.body.logpass;
    console.log("USER NAME: " + uname);
    console.log("PASSWORD: " + upass);

    var failloginmessage = 'wrong username or password. try again';
    //login everything;
    getUserInfo(uname, upass, res, userlogincallback, loginfailcallback, failloginmessage);
  }
});

app.post('/signup', urlEncodedParser, function(req, res) {
  user_result = null;
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var uname = req.body.signname;
    var upass = req.body.signpass;
    name = uname;
    console.log(uname+upass);
    var profiles = db.collection('profiles');
    var loginfaildosignup = function(res, failmessage) {
      profiles.insert({
          'username': uname, 'password': upass, 
          'question_new': 
            {
              'weight': null,
              'height': null,
              'when_it_all_started': Date.now(),
              'job': null,
              'age': null,
              'gender': null,
            }, 
          'question_existing':
            {
              'working_hrs': 0 
            } 
      });
      res.end(failmessage);
    }
    var failloginmessage = 'Happy sign-in new user!!';
    getUserInfo(uname, upass, res, userlogincallback, loginfaildosignup, failloginmessage);
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
  console.log(JSON.stringify(user_result));
  res.render('main.html', { username: user_result.username, userresult: JSON.stringify(user_result) });
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

// Socket works
var users = [];
var msgs = [];
var msgs_length = 0;
var user_by_id = {};

io.on('connection', function(socket) {
  console.log('A user has connected '+socket.id);
  for(let i=0; i<users.length; i++) {
    console.log(users);
    socket.emit('new-user', users[i]);
  }
  for(let j=0; j<msgs.length; j++) {
    socket.emit('got-a-text', msgs[j]);
  };
  socket.on('disconnect', function() {
    console.log('Disconnect by client '+socket.id); 
    let disc_user = user_by_id[socket.id];
    if (disc_user !== undefined) {
      io.emit('a-user-disc', disc_user);
      console.log('DISC user '+disc_user);
      users.splice(users.indexOf(disc_user),1);
    }
  });
  socket.on('got-a-text', function(msg) {
    console.log('Messgae: ' + msg);
    msgs.push(msg);
    msgs_length += 1;
    if (msgs_length > 200) {
      msgs.shift();
      msgs_length -= 1;
    }
    io.emit('got-a-text', msg);
  });
  socket.on('new-user', function(msg) {
    console.log('New Nick: ' + msg);
    io.emit('new-user', msg);
    user_by_id[socket.id] = msg;
    users.push(msg);
  });
});
//app.listen(port, ip);
server.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
