//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({extended:true}));

const { MongoGridFSChunkError } = require('mongodb');
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect("mongodb://127.0.0.1:27017/userDB" , { useNewUrlParser: true, useUnifiedTopology: true})
.then((result)=> {
    console.log("database is connected successfully") ;
     
}).catch((error)=> {
    console.log(error);
})


const userSch = new mongoose.Schema({
    email : String,
    password : String
});
console.log(process.env.SECRET);

const secret = process.env.SECRET;
userSch.plugin(encrypt,{secret:secret, encryptedFields: ["password"]});
const User = new mongoose.model("User",userSch);


app.get("/",function(req,res){
    res.render("home.ejs");
});


app.get("/register",function(req,res){
    res.render("register.ejs");
});
app.post("/register",function(req,res){
    const e = req.body.username;
    const p = req.body.password;

    const new_user = new User({
        email : e,
        password: p
    })    
    new_user.save().then(res.render("secrets.ejs")).catch(function(err){
        console.log(err);
    });

});


app.get("/login",function(req,res){
    res.render("login.ejs");
});
app.post("/login",function(req,res){
    const user = req.body.username;
    const pass = req.body.password;
    
    User.findOne({email:user}).then(function(founduser){
        if(founduser){
            if(founduser.password === pass){
                res.render("secrets.ejs");
            }
            else{
                console.log("Authentication Failed!!");
                res.render("Home.ejs");
            }
        }
        else{
            console.log("Authentication Failed!!");
            res.render("Home.ejs");
        }
    }).catch(function(err){
        console.log(err);
    });
    
});




app.listen(3000,function(){
    console.log("Hostes successfully on port 3000");
})