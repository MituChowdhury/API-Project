const express = require('express')
const bcrypt = require('bcryptjs')
const axios = require('axios')

const router = express.Router()

const db = require('../database');


router.post('/addToCart', (req,res)=>{

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

router.get("/cart", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else res.render('cart', {user:req.session.user, cart:req.session.cart})
})

router.post("/changeQuantity", (req,res)=>{
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

router.post("/checkout", (req,res)=>{
    
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

module.exports = router