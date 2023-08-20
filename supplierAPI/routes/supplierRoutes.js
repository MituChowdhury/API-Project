const express = require('express')
const axios = require('axios')

const router = express.Router()

router.get("/login", (req,res)=>{
    res.render('login', {user:req.session.user})
})

router.post("/login", (req,res)=>{
    
    const { email, password } = req.body
    console.log(email + " " + password)
    if(email === 'supplier@gmail.com' && password === 'supplier123') {
        req.session.user = {
            email : 'supplier@gmail.com',
            password : 'supplier123'
        }
        res.redirect('allOrders')
    }
    else res.json('Wrong login credentials!')
})

router.get("/allOrders", (req,res)=>{

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

router.post('/confirmSupply', (req,res)=>{
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

router.get("/logout", (req,res)=>{
    req.session.destroy();
    res.redirect('login')
})

module.exports = router