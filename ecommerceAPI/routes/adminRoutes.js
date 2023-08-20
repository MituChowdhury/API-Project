const express = require('express')
const bcrypt = require('bcryptjs')
const axios = require('axios')

const router = express.Router()

const db = require('../database');

router.get("/admin_login", (req,res)=>{
    if(req.session.user){
        if(!req.session.user.isAdmin) res.redirect('home')
        else res.redirect('allOrders')
    }
    else res.render('admin_login', {user:req.session.user})
})

router.post("/admin_login", (req,res)=>{
    
    if(req.session.user && !req.session.user.isAdmin) res.redirect('home')
    else{
        const { email, password } = req.body

        const q = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`

        db.query(q, (err,data)=>{
            if(err || data.length === 0) res.json('Wrong login credentials!')
            else{
                if((password !== data[0].password) || !data[0].isAdmin) res.json('Not an admin or wrong password!')
                else{
                    req.session.user = data[0]
                    res.redirect('allOrders') 
                }
            }
        })
    }
})

router.get("/allOrders", (req,res)=>{
    if(req.session.user && !req.session.user.isAdmin) res.redirect('home')
    else if(req.session.user && req.session.user.isAdmin){
        const q = `SELECT * FROM orders`;
        db.query(q, (err, data)=>{
            if(err) return res.json(err)
            else res.render('admin_orders', {user: req.session.user, data:data})
        })
    }
    else if(req.query.id) {
        const q = `SELECT * FROM orders WHERE status != 'Processing'`;
        db.query(q, (err, data)=>{
            if(err) return res.json(err)
            else res.send(data)
        })
    }
    else res.json('Page not found')
})

router.post('/confirmOrder', (req,res)=>{
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

router.post('/changeOrderStatus', (req,res)=>{
    const id = req.body.id
    const status = req.body.status
    
    const q = `UPDATE orders SET status = '${status}' WHERE id = ${id}`
    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else res.send(data)
    })
})

module.exports = router