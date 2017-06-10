var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');


app.use(cookieParser())

app.set("view engine", "ejs");


var urlDatabase = {
  "b2xVn2": {
    longUrl: "http://www.lighthouselabs.ca",
    userId: 'userRandomID'
  },
  "9sm5xK": {
    longUrl: "http://www.google.com",
    userId: 'user2RandomID'
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < 6; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

function usersUrls(userId) {
  let results = {};

  for(let key in urlDatabase) {
    let url = urlDatabase[key];
    if (url.userId === userId) {
      results[key] = url;
    }
  }
  return results;
}

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


//Middleware
app.use((req, res, next) => {
  if(users[req.cookies.user_id]){
    res.locals.username = users[req.cookies.user_id].email;

  } else {
    res.locals.username = ""
  }
  res.locals.user_id = req.cookies.user_id
  next();
});


//routes
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let userId = req.cookies.user_id;
  let templateVars = {
    urls: usersUrls(userId)
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString();
  var longURL =  req.body.longURL;
  console.log(longURL)
  // update the database
  urlDatabase[shortURL] = {
    longURL: longURL,
    userId: req.cookies.user_id
  };
  // redirect urls
  res.redirect(`/urls`);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id){
    res.render("urls_new");
  } else {
    res.render('login_page');
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    url: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.Url
  res.redirect('/urls' + req.params.id);
});

app.post("/urls/:id/delete", (req, res) =>{
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get('/register', (req, res) => {
  res.render("user-registration");
});

app.post('/register', (req, res) => {
  //const bcrypt = require('bcrypt'); on the top off my app
  // const password = req.params; // you will probably this from req.params
  const {email, password} = req.body;
  const hashed_password = bcrypt.hashSync(password, 10);
  if (email === "" || password === ""){
    res.status(401).send("Please fil out login")
    return;
   }
  for (let user in users) {
   if (users[user].email === email) {
    console.log("Found match: " + JSON.stringify(users[user]) + " with " + email);
     res.status(401).send("user exists!!!!")
     return;
   }
  }
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password : bcrypt.hashSync(password, 10)
  }

  res.cookie('user_id', id);
  res.redirect('/urls');
});

 app.get('/login', (req, res) => {
   res.render("login_page")
 });

 app.post('/login', (req, res) => {
  for (let user in users){
    if ((users[user].email === req.body.email) && (bcrypt.compareSync(req.body.password, users[user].password))){
      res.cookie('user_id', user);
      res.redirect('/urls');
      return;
    }
  }
  res.status(401).send("user wrong!!!!");
});

app.get('/logout', (req, res)=>{
  res.clearCookie('user_id');
  res.redirect('/login');
})

app.get("/u/:shortURL", (req, res) => {
  for (let key in urlDatabase){
    if (req.params.shortURL === key){
      let longURL = urlDatabase[req.params.shortURL].longURL;
      res.redirect(longURL); //({key: value})
    }
  }
  res.status(404).send("Sorry URL not find<br><a href='/urls'>Return to TinyApp</a>");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});





