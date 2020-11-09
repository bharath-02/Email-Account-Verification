const User = require('../models/user');
const jwt = require('jsonwebtoken');

const mailgun = require("mailgun-js");
const DOMAIN = 'sandbox8e812bd438bb4daf8e32b50b2e6e6b08.mailgun.org';
const mg = mailgun({ apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN });

//  Create user without email account activation
// exports.signup = (req, res) => {
//     console.log(req.body);
//     const { name, email, password } = req.body;
//     User.findOne({ email }).exec((err, user) => {
//         if (user) {
//             return res.status(400).json({ error: "User with this email already exists." });
//         }
//         let newUser = new User({ name, email, password });
//         newUser.save((err, success) => {
//             if (err) {
//                 console.log('Error in signup: ', err);
//                 return res.status(400), json({ error: err })
//             }
//             res.json({
//                 message: "Signup success!!"
//             })
//         })
//     });
// }

exports.signup = (req, res) => {
    console.log(req.body);
    const { name, email, password } = req.body;
    User.findOne({ email }).exec((err, user) => {
        if (user) {
            return res.status(400).json({ error: "User with this email already exists." });
        }

        const token = jwt.sign({ name, email, password }, process.env.JWT_ACC_ACTIVATE, { expiresIn: '20m' });

        const data = {
            from: 'noreply@hello.com',
            to: email,
            subject: 'Account Activation Link',
            html: `
                <h2>Please click on the given link to activate your account</h2>
                <a href="#">${process.env.CLIENT_URL}/authentication/activate/${token}</a>
            `
        };
        mg.messages().send(data, function(error, body) {
            if (error) {
                return res.json({
                    error: err.message
                })
            }
            return res.json({
                message: 'Email has been sent, kindly activate your account'
            })
        });
    });
}

exports.activateAccount = (req, res) => {
    const { token } = req.body;
    if (token) {
        jwt.verify(token, process.env.JWT_ACC_ACTIVATE, (err, decodedToken) => {
            if (err) {
                return res.status(400).json({ error: 'Incorrect or Expired link.' })
            }
            const { name, email, password } = decodedToken;
            User.findOne({ email }).exec((err, user) => {
                if (user) {
                    return res.status(400).json({ error: "User with this email already exists." });
                }
                let newUser = new User({ name, email, password });
                newUser.save((err, success) => {
                    if (err) {
                        console.log('Error in signup while account activation: ', err);
                        return res.status(400), json({ error: 'Error activating account' })
                    }
                    res.json({
                        message: "Signup success!!"
                    })
                })
            });
        })
    } else {
        return res.json({ error: 'Something went wrong!!!' })
    }
}