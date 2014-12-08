#!/bin/bash

curl -X POST -d @Post_question.txt "http://localhost:3000/questions" --header "Accept: application/json"

curl -g -X GET -H "Accept: application/json" "http://localhost:3000/questions/1"

curl -i -H "Accept: application/json" -X PUT -d @Put_question.txt "http://localhost:3000/questions/1"


curl -X POST  -d @Post_answer.txt "http://localhost:3000/questions/1/answers"  --header "Accept: application/json"

curl -g -X GET -H "Accept: application/json" "http://localhost:3000/questions/1/answers/1"

curl -i -H "Accept: application/json" -X PUT -d @Put_answer.txt "http://localhost:3000/questions/1/answers/1"


curl -X POST -d @Post_question_comment.txt "http://localhost:3000/questions/1/comments"  --header "Accept: application/json"

curl -g -X GET -H "Accept: application/json" "http://localhost:3000/questions/1/comments/1"

curl -i -H "Accept: application/json" -X PUT -d @Put_question_comment.txt "http://localhost:3000/questions/1/comments/1"


curl -X POST -d @Post_answer_comment.txt "http://localhost:3000/questions/1/answers/1/comments" --header "Accept: application/json"

curl -g -X GET -H "Accept: application/json" "http://localhost:3000/questions/1/answers/1/comments/2"

curl -i -H "Accept: application/json" -X PUT -d @Put_answer_comment.txt "http://localhost:3000/questions/1/answers/1/comments/2"

curl -g -X GET -H "Accept: application/json" "http://localhost:3000/questions"
curl -g -X GET -H "Accept: application/json" "http://localhost:3000/questions/1/answers"
curl -g -X GET -H "Accept: application/json" "http://localhost:3000/questions/1/answers/1/comments"
curl -g -X GET -H "Accept: application/json" "http://localhost:3000/questions/1/comments"