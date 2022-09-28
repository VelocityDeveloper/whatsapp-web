const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({
    path: './.env'
});
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_NAME
});

exports.register = (req, res) => {
    if(process.env == true){
        const { name, email, password, passwordConfirm } = req.body;
    
        db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
            if(error) {
                console.log(error);
            }
            if(results.length > 0){
                return res.render('register', {
                    message: 'Email sudah terdaftar'
                });
            } else if(password !== passwordConfirm) {
                return res.render('register', {
                    message: 'Password tidak cocok'
                });
            }
    
            let hashedPassword = await bcrypt.hash(password, 8);
            console.log(hashedPassword);
            
            db.query('INSERT INTO users SET ?', {name:name, email:email, password:hashedPassword}, (error, results) => {
                if(error) {
                    console.log(error);
                } else {
                    return res.render('register', {
                        message: 'Pendaftaran berhasil!'
                    });
                }
            });
            // res.send("Form Submitted");
    
        });
    } else {
        return res.render('register', {
            message: 'Fungsi register dimatikan'
        });
    }

}

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        
        if(error) {
            console.log(error);
        }

        console.log(results);
        const userId = results[0].id;
        const userName = results[0].name;
        const userEmail = results[0].email;
        const userPassword = results[0].password;

        if(email !== userEmail){
            return res.render('login', {
                message: 'Email tidak terdafatar'
            });
        }

        if(await bcrypt.compare(password, userPassword)){

            const accessToken = jwt.sign({userId, userName, userEmail}, process.env.ACCESS_TOKEN,{
                expiresIn: '20s'
            });
            const refreshToken = jwt.sign({userId, userName, userEmail}, process.env.ACCESS_TOKEN,{
                expiresIn: '1d'
            });

            db.query('SELECT user_id FROM auth WHERE user_id = ?', [userId], async (error, results) => {
                if(error){
                    db.query('INSERT INTO auth SET ?', {user_id:userId, token:refreshToken}, (error, results) => {
                        if(error) {
                            console.log(error);
                        } else {
                            console.log('user token update');
                        }
                    });
                } else {
                    db.query('INSERT INTO auth SET ?', {user_id:userId, token:refreshToken}, (error, results) => {
                        if(error) {
                            console.log(error);
                        } else {
                            console.log('user token update');
                        }
                    });
                }
            });
            res.cookie('refreshToken', refreshToken,{
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            });
            // res.json({ accessToken });

            return res.redirect("/");
        } else {
            return res.render('login', {
                message: 'Password salah'
            });
        }

    });

}