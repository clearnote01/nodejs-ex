var mongodb = require('mongodb');
var db = null;
init = function() {
mongodb.connect('mongodb://localhost:27017/test', function(err,conn) {
    console.log('please ');
    if (err) { 
      console.log(err);
      return;
    }
    db = conn;
    console.log(db);
});
}

if(db==null) { 
  init(); 
}
else { 
db.collection('profiles').find().toArray(function(err,resu) {
  console.log(resu);
});
}


