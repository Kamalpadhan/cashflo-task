var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const imageThumbnail = require('image-thumbnail');


//  jsonwebtoken setup
const jwt = require("jsonwebtoken")

const jwtKey = "my_secret_key"  // secret key to be imported from elsewhere
const jwtExpirySeconds = 300;


var app = express();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.get('/', indexRouter);
// app.get('/users', usersRouter);

app.get("/login", (req, res) => {

  // ideally username, password should be a POST request
  // in this case, since username and password are not being verified, GET is used for simplicity
  let username = req.query.username;
  let password = req.query.password;

  // validate username password here, for our usecase skipping this part

  const token = jwt.sign({ username }, jwtKey, {
		algorithm: "HS256",
		expiresIn: jwtExpirySeconds,
	});

	// set the cookie as the token string, with a similar max age as the token
	// here, the max age is in milliseconds, so we multiply by 1000
	res.cookie("token", token, { maxAge: jwtExpirySeconds * 1000 })
	res.end("you can proceed to /thumbnail with valid uri as query parameter");

})
// protected routes henceforth
app.use((req, res, next) => {
  const token = req.cookies.token;
  // if the cookie is not set, return an unauthorized error
	if (!token) {
		return res.status(401).end("you aren't authorized for this action, please /login")
  }
  let payload;
	try {
    // parse jwt
		payload = jwt.verify(token, jwtKey)
	} catch (e) {
		if (e instanceof jwt.JsonWebTokenError) {
			// if the error thrown is because the JWT is unauthorized, return a 401 error
			return res.status(401).end("bad token");
		}
		// otherwise, return a bad request error
		return res.status(400).end("invalid request");
	}
  next();

});

app.get('/thumbnail',(req, res, next) => {
  let uri = req.query.uri;
  imageThumbnail({uri: uri}, {
    width: 50,
    height: 50
  })
    .then(thumbnail => {
      console.log(thumbnail); 
      res.contentType('image/jpeg');
      return res.end(thumbnail, 'binary');
      // return res.json({"a": 3});
    })
    .catch(err => console.error(err)); 
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
