const express = require('express')

const router = express.Router()

router.get("/", (req,res)=>{
    //res.json("hello this is ecommerce backend :)")
    res.redirect('home')
})

router.get("/home", (req,res)=>{
    res.render('home', {user:req.session.user})
})

module.exports = router