const jwt = require("jsonwebtoken");

exports.cookieJwtAuth = (req, res, next) => {
    // console.log(req.cookies);
  const refreshToken = req.cookies.refreshToken;
  try {
    const user = jwt.verify(refreshToken, process.env.ACCESS_TOKEN);
    req.user = user;
    next();
  } catch (err) {
    res.clearCookie("refreshToken");
    return res.render('login', {
        message: 'Token kadaluarsa'
    });
  }
};