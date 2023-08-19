import express from "express"
import bodyparser from "body-parser"
import session from "express-session"
import axios from "axios"

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


app.set('views', './views');
app.set('view engine', 'ejs');


app.get("/", (req,res)=>{
    res.redirect('login')
})

app.post("/login", (req,res)=>{
    
    const { email, password } = req.body

    if(email === 'supplier@gmail.com' && password === 'supplier123') res.redirect('allOrders')
    else res.json('Wrong login credentials!')
})

app.get("/allOrders", (req,res)=>{

    axios.get(`http://localhost:3001/allOrders?`)
    .then(function (response) {
        // handle success
        res.render('orders', {user:req.session.user, data:response.data})
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    })
    .finally(function () {
        // always executed
    });

})

app.post('/confirmSupply', (req,res)=>{
    console.log(req.body.id)
    axios.post('http://localhost:3001/changeOrderStatus', {
        id : req.body.id,
        status : 'Supplied'
    })
    .then(function (response) {
        console.log('successfully supplied!');
    })
    .catch(function (error) {
        console.log(error);
    });
    res.redirect('allOrders')
})

app.listen(3002, ()=>{
    console.log("Connected to supplier backend!")
})