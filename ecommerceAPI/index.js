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
    database:"ecommerce"
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


// const sql = "SELECT * FROM menu";
// const m = [];    
// db.query(sql, (err, data)=>{

// 	if(err) return res.json(err) 
// 	else { 
//         m = data;
//     }
// })

// console.log(m);

app.get("/", (req,res)=>{
    
    res.json("hello this is ecommerce backend :)")
})

app.listen(3001, ()=>{
    console.log("Connected to ecommerce backend!")
})