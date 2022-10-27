const express = require("express");
const { cookieJwtAuth } = require("../middleware/cookieJwtAuth");

const router = express.Router();

router.get("/", cookieJwtAuth, (req, res) => {
	res.render("index");
});
router.get("/chat", cookieJwtAuth, (req, res) => {
	res.render("chat");
});
router.get("/user", cookieJwtAuth, (req, res) => {
	res.render("user");
});
router.get("/catatan", cookieJwtAuth, (req, res) => {
	res.render("catatan");
});
router.get("/short", cookieJwtAuth, (req, res) => {
	res.render("short");
});
router.get("/file", cookieJwtAuth, (req, res) => {
	res.render("file");
});
router.get("/register", (req, res) => {
	res.render("register");
});
router.get("/login", (req, res) => {
	res.render("login");
});

module.exports = router;
