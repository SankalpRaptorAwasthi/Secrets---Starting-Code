//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();
app.use(express.static("public"));
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({extended:true}));

const { MongoGridFSChunkError } = require('mongodb');
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

//const encrypt = require('mongoose-encryption');
//const md5 = require('md5');

app.use(session({
    secret:"Hellothisisasecretstring",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://127.0.0.1:27017/userDB" , { useNewUrlParser: true, useUnifiedTopology: true})
.then((result)=> {
    console.log("database is connected successfully") ;
     
}).catch((error)=> {
    console.log(error);
})


const userSch = new mongoose.Schema({
    email : String,
    password : String,
    secret: String
});
//const secret = process.env.SECRET;
userSch.plugin(passportLocalMongoose);
const User = new mongoose.model("User",userSch);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
    res.render("home.ejs");
});


app.get("/secrets",function(req,res){
    User.find({"secret":{$ne: null}}).then(function(founduser){
        res.render("secrets.ejs",{userwithsecret : founduser});
    }).catch(function(err){
        console.log(err);
    });
});

app.get("/register",function(req,res){
    res.render("register.ejs");
});
app.post("/register",function(req,res){
    const e = req.body.username;
    const p = req.body.password;

    // const new_user = new User({
    //     email : e,
    //     password: p
    // })    
    // new_user.save().then(res.render("secrets.ejs")).catch(function(err){
    //     console.log(err);
    // });

    User.register({username: e}, p, function(err,user){
        if(err){
            console.log(err);
        }else{
            passport.authenticate('local')(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});


app.get("/login",function(req,res){
    res.render("login.ejs");
});
app.post("/login",function(req,res){
    // const user = req.body.username;
    // const pass = req.body.password;
    
    // User.findOne({email:user}).then(function(founduser){
    //     if(founduser){
    //         if(founduser.password === md5(pass)){
    //             res.render("secrets.ejs");
    //         }
    //         else{
    //             console.log("DB password"+ founduser.password +" and typed password: " + md5(pass));
    //             console.log("Authentication Failed!!");
    //             res.render("Home.ejs");
    //         }
    //     }
    //     else{
    //         console.log("User not found!!");
    //         console.log("Authentication Failed!!");
    //         res.render("Home.ejs");
    //     }
    // }).catch(function(err){
    //     console.log(err);
    // });

    const user = new User({
        username : req.body.username,
         password : req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err+"Error");
        }else{
            passport.authenticate('local')(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
    
});

app.get('/logout', function(req, res){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});



app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit.ejs");
    }
    else{
        console.log("Authentication failed");
        res.redirect("/login");
    }
});

app.post("/submit", function(req,res){
    const secretvalue = req.body.secret;
    User.findById(req.user.id).then(function(founduser){
        if(founduser){
            founduser.secret = secretvalue;
            founduser.save().then(function(){
                res.redirect("/secrets");
            });
        }
    }).catch(function(err){
        console.log(err);
    });

})



app.listen(3000,function(){
    console.log("Hostes successfully on port 3000");
})