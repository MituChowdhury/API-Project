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
        const {title, author, price, quantity} = req.body
        const subtotal = parseFloat(price) * parseInt(quantity)

        // checking if product already exists in cart

        let exists = false

        for(let i=0;i<req.session.cart.length;i++){
            if(req.session.cart[i].title === title){
                exists = true;
                req.session.cart[i].quantity = parseInt(req.session.cart[i].quantity) + parseInt(quantity)
                req.session.cart[i].subtotal += parseFloat(price) * parseInt(quantity)
                break;
            }
        }

        // if product doesnt exist then adding to cart
    
        if(exists === false) {
            req.session.cart.push({
                title : title,
                author : author,
                image : '/images/'+title+'.jpg',
                price : price,
                quantity : quantity,
                subtotal : subtotal
            })
        }

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

            if(req.session.cart[i].title === req.body.title) {  // product id is better than title
                if(req.body.op === 'decrease' && req.session.cart[i].quantity>1) {
                    req.session.cart[i].quantity--
                    req.session.cart[i].subtotal = parseInt(req.session.cart[i].subtotal) - parseInt(req.session.cart[i].price)
                    break;
                }
                else if(req.body.op === 'increase') {
                    req.session.cart[i].quantity++
                    req.session.cart[i].subtotal = parseInt(req.session.cart[i].subtotal) + parseInt(req.session.cart[i].price)
                    break;
                }
            }
         }
         res.render('cart', {user:req.session.user, cart:req.session.cart})
    }
})

router.post("/removeItem", (req,res)=>{
    const index = req.session.cart.findIndex(object => {
        return object.title === req.body.title;   // product id is better than title
      });
    if (index > -1) {
        req.session.cart.splice(index, 1); 
    }
    res.render('cart', {user:req.session.user, cart:req.session.cart})
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
        'Processing',
    ];

    let currentBalance = 0

    axios.get(`http://localhost:3000/getBalance?email=${req.session.user.email}`)
        .then(function (response) {
            // handle success
            currentBalance = parseFloat(response.data[0].ammount)
            if(currentBalance >= total){
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
            }
            else{
                res.json('Insufficient balance!')
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .finally(function () {
            // always executed
        });
})

module.exports = router