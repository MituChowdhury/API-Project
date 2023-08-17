import express from "express"
import mysql from "mysql"
import bodyparser from "body-parser"
import session from "express-session"

const app = express()

// database connection
const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"ithinkiseeu5020",
    database:"supplier"
})

app.use(express.json())

app.use(express.static('public'));

app.use(bodyparser.urlencoded({ extended : false }));
app.use(express.urlencoded({ extended: false }));

app.use(session({
	secret : '1234567890abcdefghijklmnopqrstuvwxyz',
	resave : false,
	saveUninitialized : false,
}));


app.set('views', './views');
app.set('view engine', 'ejs');


app.get("/", (req,res)=>{
    
    res.json("hello this is supplier backend :)")
})

app.listen(3002, ()=>{
    console.log("Connected to supplier backend!")
})