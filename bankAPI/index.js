import express from "express"
import mysql from "mysql"
import bodyparser from "body-parser"
import session from "express-session"
import bcrypt from "bcryptjs"
import axios from 'axios'


const app = express()

// database connection
const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"ithinkiseeu5020",
    database:"bank"
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
    res.json("hello this is bank backend :)")
})

app.post("/register", (req,res)=>{

    const values = [
        req.body.bankuid,
        req.body.name,
        req.body.email,
        req.body.password
    ]

    const q = 'INSERT INTO users (bankuid, name, email, password) VALUES (?)'
    
    db.query(q, [values], (err,data)=>{
        if(err) res.json(err)
        else res.json('account creation successful')
    })
})

app.post("/login", (req,res)=>{
    
    const { email, password } = req.body
    const hashedPassword = bcrypt.hash(password, 12)

    const q = `SELECT * FROM users WHERE email = ${email} AND password = ${password}`

    db.query(q, (err,data)=>{
        if(err) res.json('Wrong login credentials!')
        else{
            const hashedPassword1 = bcrypt.hash(data[0].password, 12)
            if(hashedPassword === hashedPassword1){
                req.session.user = data[0]
            }
            else res.json('Wrong password!')
        }
    })
})

app.get("/getUID", (req,res)=>{
    const q = `SELECT bankuid FROM users WHERE email = '${req.query.email}'`
    db.query(q, (err,data)=>{
        if(err) console.log('error')
        else res.send(data)
    })
})

app.post("/updateBalance", (req,res)=>{
    console.log(req.query)
    const {email, ammount} = req.body
    const q = `UPDATE users SET ammount = ammount-${ammount} FROM users WHERE email = '${email}'`;
    db.query(q, (err,data)=>{
        if(err) console.log('error');
        else{
            console.log('update balance done')
            res.send(data) /// ki pathabo update korte hobe
        }
    })
})


// app.get("/test", (req,res)=>{
    // console.log(req.query.item)
    // const q = `select * from menu where title = '${req.query.item}'`;
    // db.query(q, (err,data)=>{
    //     if(err) console.log('error');
    //     else{
    //        // console.log(data)
    //         ///return data;
    //         res.send(data)
    //     }
    // })
// })

app.listen(3000, ()=>{
    console.log("Connected to bank backend!")
})