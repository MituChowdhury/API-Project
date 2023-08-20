const express = require('express')
const bodyparser = require('body-parser')
const session = require('express-session')

const userRoutes = require('./routes/userRoutes')
const homeRoutes = require('./routes/homeRoutes')

const app = express()

app.use(express.json())

app.use(express.static('public'));

app.use(bodyparser.urlencoded({ extended : false }));
app.use(express.urlencoded({ extended: false }));

app.use(session({
	secret : '1234567890abcdefghijklmnopqrstuvwxyz',
	resave : false,
	saveUninitialized : false,
}));

app.use(userRoutes)
app.use(homeRoutes)

app.set('views', './views');
app.set('view engine', 'ejs');


app.listen(3000, ()=>{
    console.log("Connected to bank backend!")
})