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

app.get("/", (req,res)=>{
    //res.json("hello this is ecommerce backend :)")
    res.redirect('home')
})

app.get("/home", (req,res)=>{
    res.render('home', {user:req.session.user})
})

app.get("/login", (req,res)=>{
    if(!req.session.user) res.render('login', {user:req.session.user})
    else res.redirect('home')
})

app.post("/login", (req,res)=>{
    
    const { email, password } = req.body

    const q = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`

    db.query(q, (err,data)=>{
        if(err) res.json('Wrong login credentials!')
        else{
            const passwordMatch = bcrypt.compare(password, data[0].password);   //// hashed pass database e store korte hobe

            if(!passwordMatch) res.json('Wrong password!')

            else{
                req.session.user = data[0]

                axios.get(`http://localhost:3000/getUID?email=${email}`)
                .then(function (response) {
                    // handle success
                    req.session.user.uid = response.data
                    console.log(response.data);
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                })
                .finally(function () {
                    // always executed
                });

                res.redirect('home')
            }
        }
    })
})

app.get("/register", (req,res)=>{
    if(req.session.user) res.redirect('home')
    else res.render('register', {user:req.session.user})
})

app.post("/register", (req,res)=>{

    const { name, email, password } = req.body
    const q = `INSERT INTO users (name, email, password) VALUES ('${name}','${email}','${password}')`
    db.query(q, (err,data)=>{
        if(err) res.json(err)
        else {
            const q = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`

            db.query(q, (err,data)=>{
                if(err) res.json('Wrong login credentials!')
                else {
                    req.session.user = data[0]
                    res.render('bank_uid', {user:req.session.user})
                }
            })
        }
            
    })
})

app.post("/bankRegister", (req,res)=>{
    axios.post('http://localhost:3000/register', {
        bankuid: req.body.bankuid,
        name: req.session.user.name,
        email: req.session.user.email,
        password: req.body.password
      })
      .then(function (response) {
        console.log('success!');
      })
      .catch(function (error) {
        console.log(error);
      });
    res.redirect('home')
})

app.get("/admin_login", (req,res)=>{
    if(req.session.user && !req.session.user.isAdmin) res.redirect('home')
    res.render('admin_login', {user:req.session.user})
})

app.post("/admin_login", (req,res)=>{
    if(req.session.user && !req.session.user.isAdmin) res.redirect('home')
    else{
        const { email, password } = req.body
        const q = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`

        db.query(q, (err,data)=>{
            if(err) res.json('Wrong login credentials!')
            else{
                if(!data[0].isAdmin) res.json('Not an admin.')
                else{
                    req.session.user = data[0]
                    res.redirect('home') // edit
                }
            }
        })
    }
})

app.post('/confirmOrder', (req,res)=>{
    axios.post('http://localhost:3000/updateBalance', {
        email: 'admin@gmail.com',
        ammount: -req.body.total
    })
    .then(function (response) {
        console.log('successful transaction from admin!');
    })
    .catch(function (error) {
        console.log(error);
    });

    axios.post('http://localhost:3000/updateBalance', {
        email: 'supplier@gmail.com',
        ammount: req.body.total
    })
    .then(function (response) {
        console.log('successful transaction to supplier!');
    })
    .catch(function (error) {
        console.log(error);
    });

    const q = `UPDATE orders SET status = 'Under Shipping' WHERE id = ${req.body.id}`
    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else res.redirect('allOrders')
    })
})

app.post('/changeOrderStatus', (req,res)=>{
    const id = req.body.id
    const status = req.body.status
    
    const q = `UPDATE orders SET status = '${status}' WHERE id = ${id}`
    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else res.send(data)
    })
})

app.post('/addToCart', (req,res)=>{

    if(!req.session.user){
        res.redirect('login')
    }
    else{

        if(!req.session.cart){
            req.session.cart = []
        }
        const {title, price, quantity} = req.body
        const subtotal = parseFloat(price) * parseInt(quantity)
    
        req.session.cart.push({
            title : title,
            price : price,
            quantity : quantity,
            subtotal : subtotal
        })

        res.redirect('home#mn');
    }
});

app.get("/cart", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else res.render('cart', {user:req.session.user, cart:req.session.cart})
})

app.post("/changeQuantity", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else{

        for(let i=0;i<req.session.cart.length;i++) {

            if(req.session.cart[i].title === req.body.title) {
                if(req.body.op === 'decrease' && req.session.cart[i].quantity>1) {
                    req.session.cart[i].quantity--
                    req.session.cart[i].subtotal = parseInt(req.session.cart[i].subtotal) - parseInt(req.session.cart[i].price)
                    break;
                }
                else{
                    req.session.cart[i].quantity++
                    req.session.cart[i].subtotal = parseInt(req.session.cart[i].subtotal) + parseInt(req.session.cart[i].price)
                    break;
                }
            }
         }
         res.render('cart', {user:req.session.user, cart:req.session.cart})
    }
})

// app.post("/increaseQuantity", (req,res)=>{
//     if(!req.session.user){
//         res.redirect('login')
//     }
//     else{

//         for(let i=0;i<req.session.cart.length;i++) {

//             if(req.session.cart[i].title === req.body.title) {
//                 req.session.cart[i].quantity++
//                 req.session.cart[i].subtotal += req.session.cart[i].price
//                 break;
//             }
//          }
//          res.redirect('cart')
//     }
// })

app.get("/orders", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else if(req.session.user.isAdmin){
        res.redirect('allOrders')
    }
    else{
        const q = `SELECT * FROM orders WHERE user_id = ${req.session.user.id}`;
    
        db.query(q, (err, data)=>{
            if(err) return res.json(err)
            else {
                res.render('orders', {user: req.session.user, data:data})
            } 
        })
    }
})

// for admin
app.get("/allOrders", (req,res)=>{
    let q = ''
    if(req.session.user && req.session.user.isAdmin) q = `SELECT * FROM orders`;
    else q = `SELECT * FROM orders WHERE status != 'placed'`;
    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else {
            if(req.session.user && req.session.user.isAdmin) res.render('orders', {user: req.session.user, data:data})
            else res.send(data)
        } 
    })
})

app.post("/checkout", (req,res)=>{
    
    let description = '';
    let price_breakdown = '';        
    let total = 0; 
    for(let i=0;i<req.session.cart.length;i++) {

        description += req.session.cart[i].quantity + ' x ' + req.session.cart[i].title
        if(i < req.session.cart.length-1) description += ', '

        price_breakdown += req.session.cart[i].subtotal
        if(i < req.session.cart.length-1) price_breakdown += ' + '

        total += req.session.cart[i].subtotal

    }
    req.session.cart = [];

    const q1 = "INSERT INTO orders (user_id, user_name, description, price_breakdown, total, createdAt, address, status) VALUES (?)";

    const values = [
        req.session.user.id,
        req.session.user.name,
        description,
        price_breakdown,
        total,
        new Date().toLocaleString(),
        req.body.address,
        'placed',
    ];

    db.query(q1, [values], (err, data)=>{
        if(err) res.json(err)
        else{
            axios.post('http://localhost:3000/updateBalance', {
                bankuid: req.body.bankuid,
                name: req.session.user.name,
                email: req.session.user.email,
                password: req.body.password,
                ammount: -total
            })
            .then(function (response) {
                console.log('successful transaction from user!');
            })
            .catch(function (error) {
                console.log(error);
            });

            axios.post('http://localhost:3000/updateBalance', {
                email: 'admin@gmail.com',
                ammount: total
            })
            .then(function (response) {
                console.log('successful transaction to admin!');
            })
            .catch(function (error) {
                console.log(error);
            });
            res.redirect('orders')
        }
    })
})

app.get("/logout", (req,res)=>{
    console.log(req.session.cart)
    req.session.destroy();
    res.redirect('home')
})

app.listen(3001, ()=>{
    console.log("Connected to ecommerce backend!")
})