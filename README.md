RESTful_Web_App
===============
RESTful Web application is a web based question and answer service similar to stack overflow. We have developed this solution using Node.js, Express,
Swig and Node ORM.

Follow the steps to install and run the API :-

1. Download and extract the folder provided to you.
2. Make sure that the system in which you are about to test this application has Node.js installed. If not, please install it.
3. Navigate to the "RESTful_Web_App" folder in your command prompt (which contains app.js file).
4. Make sure that Sqlite3 is installed. If not, please install it using a simple command "npm install sqlite3" in the command prompt. 
5. Run the command "node app.js".
6. Invoke any browser window and type "http://localhost:3000".
7. You should be able to view the API.


Follow the steps to run the Bash script which consists of series of curl calls:-

1. In order to locate the script open your project and navigate to a folder named "BashScript" which will contain all the
   files and shell script.
2. You need to run the command "node app.js" in one command prompt window and in the other window navigate to the folder 
   as mentioned in the previous step and run the command "./Script.sh".

Note: In order to run the bash script you need to reset the database to its original state because in the program we use counters to assign
numbers to question, answer, comments.Because of this constraint if you create few questions through browser and then run the bash script it won't
produce expected results. Database reset can be achieved by deleting db_file.sqlite3 file under RESTful_Web_App project folder.