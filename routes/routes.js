var express = require('express'),
    bodyParser = require('body-parser'),
    orm = require('orm'),
    methodOverride = require('method-override');

var app = express();
var database = require('../models/database');

// 
// REFERENCES
//
// https://github.com/dresende/node-orm2/issues/173
// http://phaninder.com/posts/put-and-delete-can-they-be-used-as-html-form-methods/
// https://github.com/expressjs/method-override

//app.enable('strict routing');
app.use(orm.express(database.connectionString));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

//
// Index page
// 
app.get('/', function (req, res) {
  var questions = [];
  var limit = 5;
  var i;
  req.models.question.count({}, function (err, questionsCount) {
    if (err) {
      console.log(err);
      return;
    }
    if (questionsCount < 5) {
      limit = questionsCount;
    }
  });
  req.models.question.find({}, ["createdAt", "Z"], function (err, results) {
    if (err) {
      console.log(err);
      return;
    }
    for (i = 0; i < limit; i++) {
      questions[i] = results[i];
    }
    console.log("accepts " + questions.length);
    if (req.accepts('html')) {
      res.render('./content/index', {
        pageTitle: 'index',
        pagename: 'Latest questions',
        questions: questions
      });
    } else if (req.accepts('json')) {
      if (questions.length > 0) {
        var json = JSON.stringify(questions);
        console.log("Accepts json " + json);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(questions));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.json({data: false, message: "No questions"});
      }
    } else {
      res.status(406).send("Content type not supported");
    }
  });
});

//
// questions/
//
// All questions
app.get('/questions', function (req, res) {
  var questions = [];
  var i;
  req.models.question.find({}, ["createdAt", "Z"], function (err, results) {
    if (err) {
      console.log(err);
      return;
    }
    for (i = 0; i < results.length; i++) {
      questions[i] = results[i];
    }
    if (req.accepts('html')) {
      res.render('./content/questions', {
        pagename: 'All questions',
        questions: questions
      });
    } else if (req.accepts('json')) {
      if (questions.length > 0) {
        var json = JSON.stringify(questions);
        console.log("Accepts json " + json);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(questions));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.json({data: false, message: "No questions"});
      }
    } else {
      res.status(406).send("Content type not supported");
    }
  });
});

//
// POST - new question
//
//
app.post('/questions', function (req, res) {
  if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
    if (req.body.title === undefined || req.body.content === undefined || req.body.title.trim().length === 0 || req.body.content.trim().length === 0) {
      return res.status(400).send("There is bad syntax in the request");
    }
    req.models.question.create(
      [{
        title: req.body.title,
        content: req.body.content,
        createdAt: new Date()
      }, ], // object
      function (err, questions_created) {
        if (err) {
          console.log("Error: " + err);
        }
        if (req.accepts('html')) {
          res.redirect("/questions");
        } else if (req.accepts('json')) {
          res.status(201).send("question created: " + JSON.stringify(questions_created));
        } else {
          res.status(406).send("Content type not supported");
        }
      }
    );
  } else {
    res.status(406).send("Content type not supported");
  }
});

//
// questions/ask
//
// New question
app.get('/questions/ask', function (req,res) {
  res.render('./content/ask', {
    pagename: 'New question'
  });
});


//
// Question by id
// questions/id
app.get('/questions/:question_id', function (req, res) {
  req.models.question.get(req.params.question_id, function (err, question) {
    if (err) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    question.getAnswer(function (err, answers) {
      if (err) {
        console.log(err);
        return;
      }
      if (answers) {
        console.log(JSON.stringify(answers));
        question.answers = answers;
      }
    });
    question.getComment(function (err, comments) {
      console.log(comments.id);
      if (err) {
        console.log(err);
        return;
      }
      if (comments) {
        console.log(JSON.stringify(comments));
        question.comments = comments;
      }
    });
    var tmp = question.createdAt.toString().substring(0, 10);
    if (req.accepts('html')) {
      res.render('./content/question', {
        question: question,
        date: tmp
      });
    } else if (req.accepts('json')) {
      res.status(200).send(JSON.stringify(question));
    } else {
      res.status(406).send("Content type not supported");
    }
  });
});

//
// Update question
//
app.put('/questions/:question_id', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.question.get(req.params.question_id, function (err, question) {
      if (err) {
        console.log(err);
        res.status(404).send("That answer doesn't exists");
        return;
      }
      if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
        if (req.body.content === undefined || req.body.content.trim().length === 0 || req.body.title === undefined || req.body.title.trim().length === 0) {
          return res.status(400).send("There is bad syntax in the request");
        }
        console.log("ok");
        question.title = req.body.title;
        question.content = req.body.content;
        question.save(function (err) {
          if (err) {
            console.log(err);
            res.end();
            return;
          }
          if (req.accepts('html')) {
            console.log("html");
            res.redirect("/questions/" + req.params.question_id);
          } else if (req.accepts('json')) {
            res.status(202).send("question updated: " + JSON.stringify(question));
          } else {
            res.status(406).send("Content type not supported");
          }
        });
      } else {
        res.status(406).send("Content type not supported");
      }
    });
  });
});

//
// Delete question
//
app.delete('/questions/:question_id', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.question.get(req.params.question_id, function (err, question) {
      if (err) {
        console.log(err);
        res.status(404).send("That answer doesn't exists");
        return;
      }
      req.models.answer.find({"question_id" : question.id}).remove(function (err) {
        if (err) {
          console.log(err);
        }
      });
      req.models.comment.find({"question_id": question.id}).remove(function (err) {
        if (err) {
          console.log(err);
        }
      });
      if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
        question.remove(function (err) {
          if (err) {
            console.log(err);
            res.end();
            return;
          }
          if (req.accepts('html')) {
            console.log("html");
            res.redirect("/questions");
          } else if (req.accepts('json')) {
            res.status(200).json({"success" : true, "message" : "question deleted"});
          } else {
            res.status(406).send("Content type not supported");
          }
        });
      } else {
        res.status(406).send("Content type not supported");
      }
    });
  });
});

//
// Get all answers for a given question id
//
app.get('/questions/:question_id/answers', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.answer.find({'question_id' : req.params.question_id}, function (err, answers) {
      if (err) {
        console.log(err);
        res.status(404).send("Not found");
        return;
      }
      if (req.accepts('html')) {
        res.render('./content/answer', {
          answers: answers,
          question_id: req.params.question_id
        });
      } else if (req.accepts('json')) {
        if (answers.length > 0) {
          res.status(200).send(JSON.stringify(answers));
        } else {
          res.status(200).json({"data" : false, "message" : "No answers for that question"});
        }
      } else {
        res.status(406).send("Content type not supported");
      }
    });
  });
});

//
// Add an answer to a question
//
app.post('/questions/:question_id/answers', function (req, res) {
  req.models.question.get(req.params.question_id, function (err, question) {
    if (err) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
      if (req.body.content === undefined || req.body.content.trim().length === 0) {
        return res.status(400).send("There is bad syntax in the request");
      }
      console.log("req.body: " + req.body.content);
      req.models.answer.create(
        [{
          body: req.body.content,
          createdAt: new Date(),
          question_id: question.id
        }, ], // object
        function (err, answer_created) {
          if (err) {
            console.log("Error: " + err);
          }
          //question.setAnswer(answer_created);
          // TO-DO: add here error handling
          if (req.accepts('html')) {
            res.redirect("/questions/" + question.id);
          } else if (req.accepts('json')) {
            res.status(201).send("answer created: " + JSON.stringify(answer_created));
          } else {
            res.status(406).send("Content type not supported");
          }
        }
      );
    } else {
      res.status(406).send("Content type not supported");
    }
  });
});

//
// Get answer details for given a question id and answer id
//
app.get('/questions/:question_id/answers/:answer_id', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.answer.exists({'id' : req.params.answer_id, 'question_id': req.params.question_id}, function (err, answerExists) {
      if (err) {
        console.log(err);
      }
      if (!answerExists) {
        res.status(404).send("Such answer doesn't exists for that question");
        return;
      }
    });
    req.models.answer.get(req.params.answer_id, function (err, answer) {
      if (err) {
        console.log(err);
        res.status(404).send("Not found");
        return;
      }
      answer.getComment(function (err, comments) {
        console.log(comments);
        if (err) {
          console.log(err);
          return;
        }
        if (comments) {
          console.log(JSON.stringify(comments));
          answer.comments = comments;
        }
        var tmp = answer.createdAt.toString().substring(0, 10);
        if (req.accepts('html')) {
          res.render('./content/answerById', {
            answer: answer,
            question_id: req.params.question_id,
            createdAt: tmp
          });
        } else if (req.accepts('json')) {
          res.status(200).send(JSON.stringify(answer));
        } else {
          res.status(406).send("Content type not supported");
        }
      });
    });
  });
});

//
// Update answer given the question and answer id
//
app.put('/questions/:question_id/answers/:answer_id', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.answer.exists({'id' : req.params.answer_id, 'question_id' : req.params.question_id}, function (err, answerExists) {
      if (err) {
        console.log(err);
      }
      if (!answerExists) {
        res.status(404).send("Such answer for such question doesn't exists");
        return;
      }
      req.models.answer.get(req.params.answer_id, function (err, answer) {
        if (err) {
          console.log(err);
          res.status(404).send("That answer doesn't exists");
          return;
        }
        if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
          if (req.body.content === undefined || req.body.content.trim().length === 0) {
            return res.status(400).send("There is bad syntax in the request");
          }
          console.log("ok");
          answer.body = req.body.content;
          answer.save(function (err) {
            if (err) {
              console.log(err);
              res.end();
              return;
            }
            if (req.accepts('html')) {
              console.log("html");
              res.redirect("/questions/" + req.params.question_id + "/answers/" + req.params.answer_id);
            } else if (req.accepts('json')) {
              res.status(202).send("answer updated: " + JSON.stringify(answer));
            } else {
              res.status(406).send("Content type not supported");
            }
          });
        } else {
          res.status(406).send("Content type not supported");
        }
      });
    });
  });
});

//
// Delete answer and children given a question id and answer id and comment id
//
app.delete('/questions/:question_id/answers/:answer_id', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.answer.exists({'id' : req.params.answer_id, 'question_id' : req.params.question_id}, function (err, answerExists) {
      if (err) {
        console.log(err);
      }
      if (!answerExists) {
        res.status(404).send("Such answer for such question doesn't exists");
        return;
      }
      req.models.answer.get(req.params.answer_id, function (err, answer) {
        if (err) {
          console.log(err);
          res.status(404).send("That answer doesn't exists");
          return;
        }
        req.models.comment.find({"answer_id": answer.id}).remove(function (err) {
          if (err) {
            console.log(err);
          }
        });
        if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
          answer.remove(function (err) {
            if (err) {
              console.log(err);
              res.end();
              return;
            }
            if (req.accepts('html')) {
              console.log("html");
              res.redirect("/questions/" + req.params.question_id + "/answers");
            } else if (req.accepts('json')) {
              res.status(200).json({"success" : true, "message" : "answer deleted"});
            } else {
              res.status(406).send("Content type not supported");
            }
          });
        } else {
          res.status(406).send("Content type not supported");
        }
      });
    });
  });
});

//
// Get answer comment given a question id and answer id
//
app.get('/questions/:question_id/answers/:answer_id/comments', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.answer.find({'question_id' : req.params.answer_id}, function (err, answerExists) {
      if (err) {
        console.log(err);
      }
      if (!answerExists) {
        res.status(404).send("Such answer for such question doesn't exists");
        return;
      }
      req.models.comment.find({'answer_id' : req.params.answer_id}, function (err, comments) {
        if (err) {
          console.log(err);
          res.status(404).send("Not found");
          return;
        }
        if (req.accepts('html')) {
          res.render('./content/commentAnswer', {
            comments: comments,
            answer_id: req.params.answer_id,
            question_id: req.params.question_id
          });
        } else if (req.accepts('json')) {
          if (comments.length > 0) {
            res.status(200).send(JSON.stringify(comments));
          } else {
            res.status(200).json({"data" : false, "message" : "No comments for that question"});
          }
        } else {
          res.status(406).send("Content type not supported");
        }
      });
    });
  });
});

//
// Create a new comment given a question id and answer id
//
app.post('/questions/:question_id/answers/:answer_id/comments', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.answer.get(req.params.answer_id, function (err, answer) {
      if (err) {
        res.status(404).send("Such answer for such question doesn't exists");
        return;
      }
      if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
        if (req.body.content === undefined || req.body.content.trim().length === 0) {
          return res.status(400).send("There is bad syntax in the request");
        }
        console.log("req.body: " + req.body.content);
        req.models.comment.create(
          [{
            body: req.body.content,
            createdAt: new Date(),
            answer_id: answer.id
          }, ], // object
          function (err, comment_created) {
            if (err) {
              console.log("Error: " + err);
            }
            //question.setAnswer(answer_created);
            // TO-DO: add here error handling
            if (req.accepts('html')) {
              res.redirect("/questions/" + answer.question_id + "/answers/" + answer.id + "/comments");
            } else if (req.accepts('json')) {
              res.status(201).json({"success" : true, "message" : "New comment created for answer id: " + answer.id, "comment" : comment_created});
            } else {
              res.status(406).send("Content type not supported");
            }
          }
        );
      } else {
        res.status(406).send("Content type not supported");
      }
    });
  });
});

//
// Get comment comment given a question id and answer id and comment id
//
app.get('/questions/:question_id/answers/:answer_id/comments/:comment_id', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.answer.exists({'id' : req.params.answer_id, 'question_id' : req.params.question_id}, function (err, answerExists) {
      if (err) {
        console.log(err);
      }
      if (!answerExists) {
        res.status(404).send("Such answer for such question doesn't exists");
        return;
      }
      req.models.comment.get(req.params.comment_id, function (err, comment) {
        if (err) {
          console.log(err);
          res.status(404).send("That comment doesn't exists");
          return;
        }
        if (comment.answer_id !== Number(req.params.answer_id)) {
          res.status(404).send("Such comment doesn't belong to the specified question and/or answer");
          return;
        }
        var tmp = comment.createdAt.toString().substring(0, 10);
        if (req.accepts('html')) {
          res.render('./content/commentByIdAnswer', {
            comment: comment,
            question_id: req.params.question_id,
            createdAt: tmp
          });
        } else if (req.accepts('json')) {
          if (comment.length > 0) {
            res.status(200).send(JSON.stringify(comment));
          } else {
            res.status(200).json({"data" : false, "message" : "No comments for that question"});
          }
        } else {
          res.status(406).send("Content type not supported");
        }
      });
    });
  });
});

//
// Update comment given a question id and answer id and comment id
//
app.put('/questions/:question_id/answers/:answer_id/comments/:comment_id', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.answer.exists({'id' : req.params.answer_id, 'question_id' : req.params.question_id}, function (err, answerExists) {
      if (err) {
        console.log(err);
      }
      if (!answerExists) {
        res.status(404).send("Such answer for such question doesn't exists");
        return;
      }
      req.models.comment.exists({'id' : req.params.comment_id, 'answer_id' : req.params.answer_id}, function (err, commentExists) {
        if (err) {
          console.log(err);
        }
        if (!commentExists) {
          res.status(404).send("The comment doesn't exists");
          return;
        }
        req.models.comment.get(req.params.comment_id, function (err, comment) {
          if (err) {
            console.log(err);
            res.status(404).send("That comment doesn't exists");
            return;
          }
          if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
            if (req.body.content === undefined || req.body.content.trim().length === 0) {
              return res.status(400).send("There is bad syntax in the request");
            }
            console.log("ok");
            comment.body = req.body.content;
            comment.save(function (err) {
              if (err) {
                console.log(err);
                res.end();
                return;
              }
              if (req.accepts('html')) {
                console.log("html");
                res.redirect("/questions/" + req.params.question_id + "/answers/" + req.params.answer_id + "/comments/" + comment.id);
              } else if (req.accepts('json')) {
                res.status(202).send("comment updated: " + JSON.stringify(comment));
              } else {
                res.status(406).send("Content type not supported");
              }
            });
          } else {
            res.status(406).send("Content type not supported");
          }
        });
      });
    });
  });
});

//
// Update comment given a question id and answer id and comment id
//
app.delete('/questions/:question_id/answers/:answer_id/comments/:comment_id', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.answer.exists({'id' : req.params.answer_id, 'question_id' : req.params.question_id}, function (err, answerExists) {
      if (err) {
        console.log(err);
      }
      if (!answerExists) {
        res.status(404).send("Such answer for such question doesn't exists");
        return;
      }
      req.models.comment.exists({'id' : req.params.comment_id, 'answer_id' : req.params.answer_id}, function (err, commentExists) {
        if (err) {
          console.log(err);
        }
        if (!commentExists) {
          res.status(404).send("The comment doesn't exists");
          return;
        }
        req.models.comment.get(req.params.comment_id, function (err, comment) {
          if (err) {
            console.log(err);
            res.status(404).send("That comment doesn't exists");
            return;
          }
          if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
            comment.remove(function (err) {
              if (err) {
                console.log(err);
                res.end();
                return;
              }
              if (req.accepts('html')) {
                console.log("html");
                res.redirect("/questions/" + req.params.question_id + "/answers/" + req.params.answer_id);
              } else if (req.accepts('json')) {
                res.status(200).json({"success" : true, "message" : "comment deleted"});
              } else {
                res.status(406).send("Content type not supported");
              }
            });
          } else {
            res.status(406).send("Content type not supported");
          }
        });
      });
    });
  });
});



//
// Get all comments for a given question id
//
app.get('/questions/:question_id/comments', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.comment.find({'question_id' : req.params.question_id}, function (err, comments) {
      if (err) {
        console.log(err);
        res.status(404).send("Not found");
        return;
      }
      if (req.accepts('html')) {
        res.render('./content/comment', {
          comments: comments,
          question_id: req.params.question_id
        });
      } else if (req.accepts('json')) {
        if (comments.length > 0) {
          res.status(200).send(JSON.stringify(comments));
        } else {
          res.status(200).json({"data" : false, "message" : "No comments for that question"});
        }
      } else {
        res.status(406).send("Content type not supported");
      }
    });
  });
});

//
// Add a comment to a question
//
app.post('/questions/:question_id/comments', function (req, res) {
  req.models.question.get(req.params.question_id, function (err, question) {
    if (err) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    console.log(req.get("Content-type"));
    console.log(req.body);
    if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
      if (req.body.content === undefined || req.body.content.trim().length === 0) {
        return res.status(400).send("There is bad syntax in the request");
      }
      req.models.comment.create(
        [{
          body: req.body.content,
          createdAt: new Date(),
          question_id: question.id
        }, ], // object
        function (err, comment_created) {
          if (err) {
            console.log("Error: " + err);
          }
          if (req.accepts('html')) {
            res.redirect("/questions/" + question.id);
          } else if (req.accepts('json')) {
            res.status(201).send("comment created: " + JSON.stringify(comment_created));
          } else {
            res.status(406).send("Content type not supported");
          }
        }
      );
    } else {
      res.status(406).send("Content type not supported");
    }
  });
});

//
// Get only the comment by id
//
app.get('/questions/:question_id/comments/:comment_id', function (req, res) {
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.comment.exists({'id' : req.params.comment_id, 'question_id': req.params.question_id}, function (err, commentExists) {
      if (err) {
        console.log(err);
      }
      if (!commentExists) {
        res.status(404).send("Such comment doesn't exists for that question");
        return;
      }
      req.models.comment.get(req.params.comment_id, function (err, comment) {
        if (err) {
          console.log(err);
          res.status(404).send("Not found");
          return;
        }
        var tmp = comment.createdAt.toString().substring(0, 10);
        if (req.accepts('html')) {
          res.render('./content/commentById', {
            comment: comment,
            question_id: req.params.question_id,
            createdAt: tmp
          });
        } else if (req.accepts('json')) {
          res.status(200).send(JSON.stringify(comment));
        } else {
          res.status(406).send("Content type not supported");
        }
      });
    });
  });
});

//
// Update comment by ID
//
app.put('/questions/:question_id/comments/:comment_id', function (req, res) {
  console.log("PUT");
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.comment.exists({'id' : req.params.comment_id, 'question_id': req.params.question_id}, function (err, commentExists) {
      if (err) {
        console.log(err);
      }
      if (!commentExists) {
        res.status(404).send("Such comment doesn't exists for that question");
        return;
      }
    });
    req.models.comment.get(req.params.comment_id, function (err, comment) {
      if (err) {
        console.log(err);
        res.status(404).send("Not found");
        return;
      }
      console.log(req.get("Content-type"));
      if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
        if (req.body.content === undefined || req.body.content.trim().length === 0) {
          return res.status(400).send("There is bad syntax in the request");
        }
        console.log("ok");
        comment.body = req.body.content;
        comment.save(function (err) {
          if (err) {
            console.log(err);
            res.end();
            return;
          }
          if (req.accepts('html')) {
            console.log("html");
            res.redirect("/questions/" + comment.question_id + "/comments/" + comment.id);
          } else if (req.accepts('json')) {
            res.status(202).send("comment updated: " + JSON.stringify(comment));
          } else {
            res.status(406).send("Content type not supported");
          }
        });
      } else {
        res.status(406).send("Content type not supported");
      }
    });
  });
});

//
// Delete comment by ID
//
app.delete('/questions/:question_id/comments/:comment_id', function (req, res) {
  console.log("PUT");
  req.models.question.exists({'id' : req.params.question_id}, function (err, questionExists) {
    console.log("questionExists: ", questionExists);
    if (err) {
      console.log(err);
    }
    if (!questionExists) {
      res.status(404).send("Such question doesn't exists");
      return;
    }
    req.models.comment.exists({'id' : req.params.comment_id, 'question_id': req.params.question_id}, function (err, commentExists) {
      if (err) {
        console.log(err);
      }
      if (!commentExists) {
        res.status(404).send("Such comment doesn't exists for that question");
        return;
      }
    });
    req.models.comment.get(req.params.comment_id, function (err, comment) {
      if (err) {
        console.log(err);
        res.status(404).send("Not found");
        return;
      }
      if (req.is('json') || req.is('application/json') || req.is('html') || req.is('text/html') || req.is('application/x-www-form-urlencoded')) {
        comment.remove(function (err) {
          if (err) {
            console.log(err);
            res.end();
            return;
          }
          if (req.accepts('html')) {
            console.log("html");
            res.redirect("/questions/" + comment.question_id + "/comments");
          } else if (req.accepts('json')) {
            res.status(200).json({"success" : true, "message" : "comment deleted"});
          } else {
            res.status(406).send("Content type not supported");
          }
        });
      } else {
        res.status(406).send("Content type not supported");
      }
    });
  });
});

//
// Search
//
app.get('/search?:q', function (req, res) {
  console.log("topic2 " + req.query.q);
  var questions = [];
  var i;
  req.models.question.find({title: orm.like("%" + req.query.q + "%")}, function (err, results) {
    if (err) {
      console.log(err);
      return;
    }
    for (i = 0; i < results.length; i++) {
      questions[i] = results[i];
    }
    var json = JSON.stringify(results);
    console.log(json);
  });
  res.render('./content/index', {
    pageTitle: 'index',
    /* pagename: 'Results', */
    questions: questions
  });
});


//
// Error
//
 // app.get('*', function (req,res) {
  // res.status(404).send('Not found, sorry!');
// }); 



module.exports = app;
//app.get('/who/:name?', function (req, res) {
  //var name = req.params.name;
  //res.send(name);
//});

//app.get('/who/:name?/:title?', function (req, res) {
  //var name = req.params.name;
  //var title = req.params.title;
  //res.send(name + " " + title);
//});