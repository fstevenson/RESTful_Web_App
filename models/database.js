var orm = require('orm');

module.exports.connectionString = "sqlite://db_file.sqlite3";

module.exports.define = function (db, models) {
  models.question = db.define("question", {
	title: String,
	content: String,
	createdAt: Date
  });
	models.comment = db.define("comment", {
		body: String,
      	createdAt: Date 
	});
	models.answer = db.define("answer", {
		body: String,
      	createdAt: Date 
	});

	models.answer.hasOne("question", db.models.question, {reverse: 'answer'});
	models.comment.hasOne("question", db.models.question, {reverse: 'comment'});
	models.comment.hasOne("answer", db.models.answer, {reverse: 'comment'});
	//models.comment.hasOne("answer", db.models.answer);
};

module.exports.connect = function (cb) {
  orm.connect(module.exports.connectionString, function(err, db){
    if(err) {
  	 return cb(err);
  	}

  module.exports.define(db);

  cb(null, db);
  });
};