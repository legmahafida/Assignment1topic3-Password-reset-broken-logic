const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb+srv://abir:35035@cluster0.yqlahmz.mongodb.net/Login?retryWrites=true&w=majority&appName=Cluster0");

// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch(() => {
    console.log("Database cannot be Connected");
})

// Create Schema
const Loginschema = new mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    email: {
        type:String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: { 
        type: String,
        default: null 
    },
    resetPasswordExpires: {
        type: Date,
        default: null 
    }
});

// collection part
const User  = new mongoose.model("users", Loginschema);

module.exports = User ;