const express = require('express');

const router = express.Router();

router.post('/register', authController.register);


module.exports = router;