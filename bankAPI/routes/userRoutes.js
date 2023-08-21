const express = require('express')
const bcrypt = require('bcryptjs')

const router = express.Router()

const db = require('../database');

router.post("/register", (req,res)=>{

    //const hashedPassword = bcrypt.hash(req.body.password, 12)

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

    const q = `SELECT * FROM users WHERE email = '${email}'`

    db.query(q, (err,data)=>{
        if(err || data.length === 0) res.json('No such user exists!')
        else{
            const actualPassword = data[0].password
            // generate a hash and checking
            bcrypt.hash(actualPassword, 10, function(err, hash) {
                bcrypt.compare(password, hash, function(err, matches) {
                    console.log(matches);
                    if(matches){
                        req.session.user = data[0]
                        res.redirect('profile')
                    }
                    else res.json('Wrong password!')
                });
            });
        }
    })
})

router.get("/profile", (req,res)=>{
    if(!req.session.user){
        res.redirect('login')
    }
    else{
        const q = `SELECT * FROM users WHERE email = '${req.session.user.email}'`
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

router.get("/getBalance", (req,res)=>{
    const q = `SELECT ammount FROM users WHERE email = '${req.query.email}'`
    db.query(q, (err,data)=>{
        if(err) console.log('error')
        else res.send(data)
    })
})

router.post("/updateBalance", (req,res)=>{
    const {email, ammount} = req.body
    const q = `UPDATE users SET ammount = ammount+(${ammount}) WHERE email = '${email}'`;
    console.log(q)
    db.query(q, (err,data)=>{
        if(err) console.log('error');
        else{
            console.log(email + ' ' + ammount)
            console.log('update balance done')
            //res.send(data) 
        }
    })
})

router.get("/logout", (req,res)=>{
    req.session.destroy();
    res.redirect('login')
})

module.exports = router