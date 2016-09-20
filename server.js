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
//app.use(morgan('combined'));
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

var quotes = [
	'Eat good',
	'Don\'t die',
	'Stay hungry, stay foolish'
]

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
    //console.log('RESULT BELOW');
    //console.log(result)
    if ( result.length == 0 ) {
      loginfailcallback(res,failmessage);
    }
    else {
      user_result = result[0];
      loginsuccesscallback(res);
    }
  });
  return user_result;
}

var loginfailcallback = function(res, failmessage) {
  res.end('fail');
}

var userlogincallback = function(res) {
  dbmaintainservice(user_result, function(err, result) {
    console.log('Date updated');
    db.collection('profiles').find({
      'username':user_result.username,
      'password':user_result.password
      })
    .toArray(function(err,result) {
      user_result = result[0];
      //console.log(user_result);
      res.redirect('/main');
    });
  });
}

var dbmaintainservice = function(user_result, callback) {
  // Set current date in document
  var cur_date = Date.now();
  console.log('Date today', cur_date);
  //cur_date = new Date(cur_date+25*60*60*100);
  var join_date = user_result.when_it_all_started;
  //join_date = new Date(join_date);
  console.log('Date 1st day', join_date);
  
  var cur_day = Math.floor((((cur_date - join_date)/(24*60*60*1000))+1)) 
  //var cur_day =  new Date(cur_date-join_date).getDate();
  console.log('Day today: ',cur_day);
  // Update in database 
  db.collection('profiles').updateOne(
    {
      'username': user_result.username
    },
    {
      $set: {'cur-day': cur_day}
    },
    callback
  );
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
    //console.log(req.body);
    uname = req.body.logname;
    upass = req.body.logpass;

    var failloginmessage = 'wrong username or password. try again';
    //login everything;
    getUserInfo(uname, upass, res, userlogincallback, loginfailcallback, failloginmessage);
  }
});

//app.post('/justtest', urlEncodedParser, function(req,res) {
  //console.log(req.body);
  //if (req.body.nui == 'hello') {
    //req.body.success = 1;
  //}
  //res.send(req.body);
//});

app.post('/signup', urlEncodedParser, function(req, res) {
  console.log("POST",req.body);
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
      'question_new': [
        { 
          'name': 'weight',
          'val': null,
          'text': 'What is your weight in ggggggggggggggggggggggggggggggggggggg is your weight (in kgs)'
        },
        { 
          'name': 'height',
          'val': null,
          'text': 'What is your height (in inches)'
        },
        { 
          'name': 'job',
          'val': null,
          'text': 'How happy are you with your work (1:None, 2:Low, 3:Moderate, 4:High'
        },
        { 
          'name': 'age',
          'val': null,
          'text': 'what is your age (yrs)'
        }
      ],
      'question_existing': [
        { 
          'name': 'stresslevel',
          'val': null,
          'text': 'How much stress you feel today!'
        },
        { 
          'name': 'workhrs',
          'val': null,
          'text': 'How much work did you work today'
        },
        { 
          'name': 'smoke',
          'val': null,
          'text': 'Did you smoke today?'
        },
        { 
          'name': 'junkfood',
          'val': null,
          'text': 'How much junk did you take today!'
        },
        { 
          'name': 'insomnia',
          'val': null,
          'text': 'Did you have any trouble sleeping yesterday'
        },
        { 
          'name': 'food',
          'val': null,
          'text': 'How much did you eat today'
        },
        { 
          'name': 'alcohol',
          'val': null,
          'text': 'How much did you drink today'
        },
        { 
          'name': 'caffeine',
          'val': null,
          'text': 'How much coffee did you drink today'
        },
        { 
          'name': 'funhrs',
          'val': null,
          'text': 'How much fun did you have today (hrs)'
        }
      ],
      'when_it_all_started': Date.now(),
      'answer_new': [
        { 
          'name': 'weight',
          'val': null,
          'text': ''
        },
        { 
          'name': 'height',
          'val': null,
          'text': 'What is your height'
        },
        { 
          'name': 'job',
          'val': null,
          'text': 'What is your job'
        },
        { 
          'name': 'age',
          'val': null,
          'text': 'what is your age (m/f)'
        }
      ],
      'answer_existing': [
        { 
          'name': 'stresslevel',
          'val': null,
          'text': 'What is your happiness'
        },
        { 
          'name': 'workhrs',
          'val': null,
          'text': 'What is your working hrs'
        },
        { 
          'name': 'smoke',
          'val': null,
          'text': 'What is your sadness'
        },
        { 
          'name': 'junkfood',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'insomnia',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'food',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'alcohol',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'caffeine',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'funhrs',
          'val': null,
          'text': 'What is your funhrs'
        }
      ],
      'answer_existing_cum': [
        { 
          'name': 'stresslevel',
          'val': null,
          'text': 'What is your happiness'
        },
        { 
          'name': 'workhrs',
          'val': null,
          'text': 'What is your working hrs'
        },
        { 
          'name': 'smoke',
          'val': null,
          'text': 'What is your sadness'
        },
        { 
          'name': 'junkfood',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'insomnia',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'food',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'alcohol',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'caffeine',
          'val': null,
          'text': 'What is your funhrs'
        },
        { 
          'name': 'funhrs',
          'val': null,
          'text': 'What is your funhrs'
        }
      ],
      'cur-day': 0,
      'finish-day': 1000,
      'ques_index': 0,
      'ques_exist_index': 0,
      'fitness_score':0
    });
    res.end(failmessage);
  }
  var failloginmessage = 'Hello '+uname+', Please login to continue';
  //getUserInfo(uname, upass, res, userlogincallback, loginfaildosignup, failloginmessage);
  
  //Already registered?
  db.collection('profiles').find({'username':uname}).toArray(function(err,result) {
    if (result.length == 0) {
      loginfaildosignup(res,failloginmessage);
    }
    else {
      console.log(result[0].password);
      res.end('You are already registered. You should log in!');
    }
  });
}
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
  if (user_result) {
    //console.log(JSON.stringify(user_result));
    res.render('mainn.html', { username: user_result.username, cur_day: user_result['cur-day'], userresult: JSON.stringify(user_result) });
  }
  else {
    res.redirect('/');
  }
  //user_result = null;
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

app.get('/deldb', function(req, res) {
  db.collection('profile').drop(function(err,result) {
      user_result = null;
      console.log('Dropped table');
      console.log(err);
      console.log(JSON.stringify(result));
  });
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
var bot_msg = {
  name: 'bot',
  msg: 'message received'
}

var increment_ques_index = function(username, new_index, callback) {
  db.collection('profiles').updateOne(
      {'username': username},
      {$set: { 'ques_index': new_index } },
      callback
  );
}
var increment_ques_exist_index = function(username, new_index, callback) {
  db.collection('profiles').updateOne(
      {'username': username},
      {$set: { 'ques_exist_index': new_index } },
      callback
  );
}

var maintain_database = function() {
  console.log('all regular database work go here!');
}

io.on('connection', function(socket) {
  console.log('A user has connected '+socket.id);
  if (user_result) {
    var question_new_len = user_result.question_new.length;
    var i_counter = user_result.ques_index;
    var repeat_counter = user_result.ques_exist_index;
    var question_exist_len = user_result.question_existing.length;
		// Send a question from list, only if questions to ask are all complete
		setInterval(function() {
			if (repeat_counter >= question_exist_len) {
				socket.emit('a-quote', quotes[Math.floor(Math.random()*quotes.length)]);
			}
		}, 50000);
		// A new signup user comes in
    if (i_counter < question_new_len) {
      socket.emit('new_ques', user_result.question_new[i_counter].text);
		}
		// The user has already answered signup questions!
    else {
      if (repeat_counter < question_exist_len) {
        socket
          .emit('new_ques', user_result.question_existing[repeat_counter]
          .text);
      }
    }
		// Got an answer to question. check whose answer it is!
    socket.on('ques-ans', function(msg) {
      if (i_counter < question_new_len ) {
        i_counter += 1;
        console.log('Counter' + i_counter);
        increment_ques_index(user_result.username, i_counter,function() {
          //console.log('Updated counter');
          //console.log('Update mongo with msg!'+msg);
          console.log('Answer received: '+user_result.question_new[i_counter-1].name);
          if ( i_counter < question_new_len) {
            console
              .log('question sent: '+user_result
              .question_new[i_counter]
              .name); 
            socket
              .emit('new_ques', user_result.question_new[i_counter]
              .text);
          }
          else {
            socket
              .emit('new_ques', user_result.question_existing[repeat_counter]
              .text);
          }
        });
      }
      else {
        //This the next level of setup! For existing users!
        if (repeat_counter < question_exist_len) {
          repeat_counter += 1;
          increment_ques_exist_index(user_result.username, repeat_counter,function() {
            if (repeat_counter < question_exist_len) {
              socket.emit('new_ques', user_result.question_existing[repeat_counter].text);
            }
          });
        }
        //This the 
      }
    });
  }
  socket.on('disconnect', function() {
    console.log('Disconnect by client '+socket.id); 
  });
});
//app.listen(port, ip);
server.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
