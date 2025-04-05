  
const express = require("express");
const path = require("path");
const User = require("./config");
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const crypto = require('crypto'); 
const nodemailer = require('nodemailer'); 
require('dotenv').config({ path: path.join(__dirname, '.env') });

const session = require('express-session');
const app = express();


app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  
}));

app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.render("home");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get('/forgetpassword', (req, res) => {
    res.render('forgetpassword'); 
});

app.get('/reset-password', (req, res) => {
    const { token, email } = req.query; 
    res.render('restpassword', { token, email }); 
});

// Register User
app.post("/signup", async (req, res) => {
    try {
        const data = {
            name: req.body.username,
            email: req.body.email,
            password: req.body.password
        };

        // Check if the email already exists in the database
        const existingUser  = await User.findOne({ email: data.email });

        if (existingUser ) {
            return res.send('Email already exists. Please choose a different email.'); 
        }else{
        
            
            // Hash the password using bcrypt
            const saltRounds = 10; 
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);
            data.password = hashedPassword; 
             
            const userdata = await User.create(data);
            console.log(userdata);
            req.session.userId = userdata._id;
            return res.send('User  created successfully!'); 
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("An error occurred while creating the user."); 
    }
});

// Login user 
app.post("/login", async (req, res) => {
    try {
        const check = await User.findOne({ name: req.body.username });
        if (!check) {
            return res.status(404).send("User  name cannot found"); 
        }
        
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            return res.status(404).send("wrong Password"); 
        }
        else {
            
        req.session.userId = check._id; 
    
          return res.render("welcom", { username: check.name }); 
        }
    }
    catch (error) {
        console.error(error);
        return res.send("wrong Details"); 
    }
});
     

//forgot-password

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('Email not found.');
        }

        
        const token = crypto.randomBytes(20).toString('hex');

        
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host:"smpt.gmail.com",
            post:587,
            secure:false, 
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS  
            },
            tls: {
                rejectUnauthorized: false 
            }
        });

        const mailOptions = {
            to: email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset Request',
            text: `You password reser link is 
            http://localhost:2000/reset-password?token=${token}&email=${email}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send('Error sending email: ' + error.message);
            }
            res.send('Reset password link has been sent to your email.');
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing your request.');
    }
      
});

//restpassword
app.post('/resetpassword', async (req, res) => {
    const { token, email, newPassword } = req.body;
        try {
            
            const user = await User.findOne({ email 
                //,resetPasswordToken: token,
                //resetPasswordExpires: { $gt: Date.now() } 

            });
    
            
            if (!user) {
                return res.status(400).send('Password reset token is invalid.');
            }

        // Encrypt password
        const saltRounds = 10; 
        user.password = await bcrypt.hash(newPassword, saltRounds); 
        user.resetPasswordToken = undefined 
        user.resetPasswordExpires = undefined; 
        await user.save();

        res.send('Your password has been updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('error .');
    }
});




 
// Define Port for Application
const port = 2000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
