const express = require('express')
const bcrypt = require('bcryptjs')

const router = express.Router()

const db = require('../database');

router.post("/register", (req,res)=>{

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

router.get("/login", (req,res)=>{
    if(req.session.user){
        res.redirect('profile')
    }
    else{
        res.render('login', {user:req.session.user})
    }
})
router.post("/login", (req,res)=>{
    
    const { email, password } = req.body
    // const hashedPassword = bcrypt.hash(password, 12)

    const q = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`

    db.query(q, (err,data)=>{
        if(err) res.json('Wrong login credentials!')
        else{
            const passwordMatch = bcrypt.compare(password, data[0].password);   //// hashed pass database e store korte hobe
            console.log(passwordMatch)

            if(!passwordMatch) res.json('Wrong password!')

            else{
                req.session.user = data[0]
                res.redirect('profile')
            }
        }
    })
})

router.get("/profile", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else{
        const q = `SELECT * FROM users WHERE email = '${req.session.user.email}'`
        console.log(q)
        db.query(q, (err,data)=>{
            if(err) console.log('error')
            else res.render('profile', {user:req.session.user, data:data[0]} )
        })
    }
})

router.get("/getUID", (req,res)=>{
    const q = `SELECT bankuid FROM users WHERE email = '${req.query.email}'`
    db.query(q, (err,data)=>{
        if(err) console.log('error')
        else res.send(data)
    })
})

router.post("/updateBalance", (req,res)=>{
    console.log(req.body)
    const {email, ammount} = req.body
    const q = `UPDATE users SET ammount = ammount+(${ammount}) WHERE email = '${email}'`;
    console.log(q)
    db.query(q, (err,data)=>{
        if(err) console.log('error');
        else{
            console.log('update balance done')
            res.send(data) /// ki pathabo update korte hobe
        }
    })
})

router.get("/logout", (req,res)=>{
    req.session.destroy();
    res.redirect('login')
})

module.exports = router