var app = require('express')();
var bodyparser = require('body-parser');

var jsonParser = bodyparser.json();

app.listen(4000, function(err) {
  if(err) {
    console.log(err);
  }
  else {
    console.log('Listening port 4000');
  }
});

app.get('/', function(req,res) {
  res.send('You shouldn\'t be doing this!');
});

app.post('/cum', jsonParser, function(req,res) {
  var json = {
    'score': 9000,
    'death count': -1
  };
  var data = req.body;
  //data.fitness_score = 9999;
  data.answer_existing_cum =  {'stat1':10000,'stat2':0,'stat3':0,'stat4':0,'stat5':0};
  data['finish-day'] = Math.floor(Math.random()*1000+1000);
  data['fitness_score'] = Math.round(Math.random()*100);
  //console.log(req.body.username);
  console.log(req.body);
  res.json(data);
});

