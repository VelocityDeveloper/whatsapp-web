const express = require('express');
const { cookieJwtAuth } = require("../middleware/cookieJwtAuth");

const router = express.Router();

router.get('/', cookieJwtAuth, (req, res) => {
    res.render("index")
});
router.get('/register', (req, res) => {
    res.render("register")
});
router.get('/login', (req, res) => {
    res.render("login")
});

module.exports = router;