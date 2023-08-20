const express = require('express')
const bcrypt = require('bcryptjs')
const axios = require('axios')

const router = express.Router()

const db = require('../database');

router.post("/bankRegister", (req,res)=>{
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

router.get("/admin_login", (req,res)=>{
    if(req.session.user && !req.session.user.isAdmin) res.redirect('home')
    res.render('admin_login', {user:req.session.user})
})

router.post("/admin_login", (req,res)=>{
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
                    res.redirect('allOrders') // edit
                }
            }
        })
    }
})

router.get("/allOrders", (req,res)=>{
    let q = ''
    if(req.session.user && req.session.user.isAdmin) q = `SELECT * FROM orders`;
    else q = `SELECT * FROM orders WHERE status != 'placed'`;
    db.query(q, (err, data)=>{
        if(err) return res.json(err)
        else {
            if(req.session.user && req.session.user.isAdmin) res.render('admin_orders', {user: req.session.user, data:data})
            else res.send(data)
        } 
    })
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
    console.log(q)
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