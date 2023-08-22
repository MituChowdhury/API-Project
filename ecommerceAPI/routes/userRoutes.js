const express = require("express");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const router = express.Router();

const db = require("../database");

router.get("/login", (req, res) => {
  const errormsg = "";
  if (!req.session.user) {
    res.render("login", { user: req.session.user, errormsg });
  } else res.redirect("home");
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const q = `SELECT * FROM users WHERE email = '${email}'`;

  db.query(q, (err, data) => {
    if (err || data.length === 0) {
      const errormsg = "Wrong email";
      res.render("login", { errormsg });
    } else {
      const actualPassword = data[0].password;
      // generate a hash and checking
      bcrypt.hash(actualPassword, 10, function (err, hash) {
        bcrypt.compare(password, hash, function (err, matches) {
          console.log(matches);
          if (matches) {
            req.session.user = data[0];

            axios
              .get(`http://localhost:3000/getUID?email=${email}`)
              .then(function (response) {
                // handle success
                req.session.user.uid = response.data;
                console.log(response.data);
              })
              .catch(function (error) {
                // handle error
                console.log(error);
              })
              .finally(function () {
                // always executed
              });

            res.redirect("home");
          } else {
            const errormsg = "Wrong password";
            res.render("login", { errormsg });
          }
        });
      });
    }
  });
});

router.get("/register", (req, res) => {
  if (req.session.user) res.redirect("home");
  else res.render("register", { user: req.session.user });
});

router.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const q = `INSERT INTO users (name, email, password) VALUES ('${name}','${email}','${password}')`;
  db.query(q, (err, data) => {
    if (err) res.json(err);
    else {
      const q = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;

      db.query(q, (err, data) => {
        if (err) res.json("Wrong login credentials!");
        else {
          req.session.user = data[0];
          res.render("bank_uid", { user: req.session.user });
        }
      });
    }
  });
});

router.post("/bankRegister", (req, res) => {
  console.log(req.body);
  axios
    .post("http://localhost:3000/register", {
      bankuid: req.body.bankuid,
      name: req.session.user.name,
      email: req.session.user.email,
      password: req.body.password,
    })
    .then(function (response) {
      console.log("success!");
    })
    .catch(function (error) {
      console.log(error);
    });
  res.redirect("home");
});

router.get("/orders", (req, res) => {
  if (!req.session.user) {
    res.redirect("login");
  } else if (req.session.user.isAdmin) {
    res.redirect("allOrders");
  } else {
    const q = `SELECT * FROM orders WHERE user_id = ${req.session.user.id}`;

    db.query(q, (err, data) => {
      if (err) return res.json(err);
      else {
        res.render("orders", { user: req.session.user, data: data });
      }
    });
  }
});

router.get("/logout", (req, res) => {
  isAdmin = req.session.user.isAdmin;
  req.session.destroy();
  if (isAdmin) res.redirect("admin_login");
  else res.redirect("home");
});

module.exports = router;
