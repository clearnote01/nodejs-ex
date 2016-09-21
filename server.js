//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    request = require('request'),
    app     = express(), eps     = require('ejs'),
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
  var yesterday = user_result['cur-day'];
  var ctr = 0;
  var cur_day = Math.floor((((cur_date - join_date)/(24*60*60*1000))+1)) 
  console.log('Day today: ',cur_day);
  if ( yesterday == cur_day ) {
    ctr = user_result.ques_exist_index;
  }
  
  // Update in database 
  db.collection('profiles').updateOne(
    {
      'username': user_result.username
    },
    {
      $set: {'cur-day': cur_day,
      // DEbatable behaviour
      'ques_exist_index': ctr}
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
  //user_result = null;
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
  //user_result = null;
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
          'text': 'Mr.Fitty has some friends that are too heavy to handle :). But I love them. What is your weight (in kgs) ?'
        },
        { 
          'name': 'height',
          'val': null,
          'text': 'What is your height (in inches) ?. We just need this once. We would not trouble you again bud. '
        },
        { 
          'name': 'job',
          'val': null,
          'text': 'A \'very\' direct question. You know people who love their work, live longer than the turtle. At least their work does. How happy are you with your work?'
        },
        { 
          'name': 'age',
          'val': null,
          'text': 'what is your age (yrs) ?'
        }
      ],
      'question_existing': [
        { 
          'name': 'stresslevel',
          'val': null,
          'text': 'How much stress you feel today!. Donot get all itchy. You know acceptance is the first step to solve your problem right? :)'
        },
        { 
          'name': 'workhrs',
          'val': null,
          'text': 'How much work did you do today? Would like if you quantize it in hrs. :). I am a bit lazy at working things on my own. But I learn!.'
        },
        { 
          'name': 'smoke',
          'val': null,
          'text': 'Did you smoke today?'
        },
        { 
          'name': 'junkfood',
          'val': null,
          'text': 'Oho!. So, Mr.Foody. or Mrs.Foody. Mind not if you are not. Junk Food today?'
        },
        { 
          'name': 'insomnia',
          'val': null,
          'text': 'Did you have any trouble sleeping yesterday?. Sleep is like the fuel of your body.'
        },
        { 
          'name': 'food',
          'val': null,
          'text': 'How much did you eat today ?. Were on a party tonight?'
        },
        { 
          'name': 'alcohol',
          'val': null,
          'text': 'How much did you drink today? Alcohol is a very addictive but unhealthy :P'
        },
        { 
          'name': 'caffeine',
          'val': null,
          'text': 'How much coffee did you drink today? I mean amount of caffiene'
        },
        { 
          'name': 'funhrs',
          'val': null,
          'text': 'How much fun did you have today (hrs)?'
        },
        {
          'name': 'exercisehrs',
          'val':null,
          'text': 'How did you exercise today?'
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
        },
        {
          'name': 'exercisehrs',
          'val':null,
          'text': 'How did you exercise today?'
        }
      ],
      'answer_existing_cum': [
      { 
        'name': 'insomnia',
        'val': 0
       },
       {
         'name': 'exercisehrs',
         'val': 0
        },
       {
         'name': 'stresslevel',
         'val': 0
       },
       {
         'name': 'alcohol',
         'val': 0
      },
       {
         'name': 'junkfood',
         'val': 0
      }
      ],
      'cur-day': 0,
      'finish-day': 66,
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
      //user_result = null;
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

var calculateCumulativeScore = function(callback,arg) {
  //var urlForThis = 'http://127.0.0.1:4000/cum';
  var urlForThis = 'https://suyash.pythonanywhere.com/api1.0/finalstats';
  var data = user_result;
  delete data.password;
  console.log(data);
  request({
      uri: urlForThis,
      method: 'POST',
      json: data
  }, function(err, resp, body) {
    console.log('THIS IS THE RESPONSE I GOT', resp.body);
    console.log('THIS IS THE RESPONSE I GOT', resp.body);
    if (!err) {
      var fitness_score = resp.body.fitness_score;
      var answer_existing_cum = [
        {
          'name':'insomnia',
          'val':resp.body.sleep
        },
        { 
          'name':'exercisehrs',
          'val':resp.body.exercise_hrs
        },
        {
          'name':'stresslevel',
          'val':resp.body.stress
        },
        {
          'name': 'alcohol',
          'val':resp.body.alcohol
        },
        {
          'name': 'junkfood',
          'val':resp.body.Junk
        }
      ];
    var finish_day = resp.body['finish-day'];
    console.log('FITNESS SCORE', fitness_score);
    db.collection('profiles').updateOne(
      {'username': user_result.username},
      {
        $set: {
          'fitness_score': fitness_score,
          'answer_existing_cum': answer_existing_cum,
          'finish-day': finish_day
        }
      },
      function() {
        reloadDb(callback,arg);
      }
    );
    }
  });
  //console.log(user_result);
}

var updateAnswers = function(callback) {
  db.collection('profiles').updateOne(
    { 'username': user_result.username },
    {
      $set: {
        'answer_new': user_result.answer_new,
        'answer_existing': user_result.answer_existing
      }
    },
    callback
  );
}

var reloadDb = function(callback,arg) {
  db.collection('profiles').find({'username':user_result.username}).toArray(function(err,result) {
    user_result = result[0];
    console.log('UPDATED PROFILE',user_result);
    callback(arg);
  });
}

io.on('connection', function(socket) {
  console.log('A user has connected '+socket.id);
  if (user_result) {
    var question_new_len = user_result.question_new.length;
    var i_counter = user_result.ques_index;
    var repeat_counter = user_result.ques_exist_index;
    var question_exist_len = user_result.question_existing.length;

    socket.on('restart', function(msg) {
      socket.emit('restart-ack', '');
      repeat_counter = 0;
      socket.emit('new_ques', user_result.question_existing[repeat_counter].text);
    });

      socket.emit('reload-charts', JSON.stringify(
            {
              'fitness_score':user_result.fitness_score,
              'stats':user_result.answer_existing_cum,
              'finish-day':user_result['finish-day']
            }
      ));

		// Send a question from list, only if questions to ask are all complete
		setInterval(function() {
			if (repeat_counter >= question_exist_len) {
				socket.emit('a-quote', quotes[Math.floor(Math.random()*quotes.length)]);
			}
		}, 50000);

		// A new signup user comes in
    setTimeout(function() {
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
    }, 10);
    
		// Got an answer to question. check whose answer it is!
    socket.on('ques-ans', function(msg) {
      var msg = JSON.parse(msg);
      console.log(msg);
      if (i_counter < question_new_len ) {
        user_result.answer_new[i_counter].val = msg['msg'];
        updateAnswers(function() {
          console.log('updating dbase');
        });
        i_counter += 1;
        console.log('Counter' + i_counter);
        increment_ques_index(user_result.username, i_counter,function() {
          //console.log('Updated counter');
          //console.log('Update mongo with msg!'+msg);
          console.log('Answer received: '+user_result.question_new[i_counter-1].name);
          setTimeout(function() {
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
          }, 10);
        });
      }
      else {
        //This the next level of setup! For existing users!
        setTimeout(function() {
          if (repeat_counter < question_exist_len) {
            user_result.answer_existing[repeat_counter].val = msg['msg'];
            //console.log(user_result);
            updateAnswers(function() {
              console.log('Updating database');
              console.log(user_result);
            });
            repeat_counter += 1;
            increment_ques_exist_index(user_result.username, repeat_counter,function() {
              if (repeat_counter < question_exist_len) {
                socket.emit('new_ques', user_result.question_existing[repeat_counter].text);
              }
            });
            if ( repeat_counter >= question_exist_len) {
              console.log('questions answered all');
              socket.emit('a-quote', 'Thankyou for taking time to answer the questions. Wait a second till we crunch numbers and update stats for you :)');
              calculateCumulativeScore(function() {
                socket.emit('reload-charts', JSON.stringify(
                  {
                    'fitness_score':user_result.fitness_score,
                    'stats':user_result.answer_existing_cum,
                    'finish-day':user_result['finish-day']
                  }
                ));
                console.log('Signal emitted: reload-charts');
              }, socket);
            }
          }
        }, 10);
      }
    });

  }
  socket.on('disconnect', function() {
    //user_result = null;
    console.log('Disconnect by client '+socket.id); 
  });
});
//app.listen(port, ip);
server.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;

// Written by a disfunctional charachter who is forever salty and sucks the fun of every happy-go-lucky group/individual
// his dead-fish eyes has ever set sight upon. What is dead may never die!
