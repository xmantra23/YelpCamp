var express = require("express");
var router = express.Router();
var User = require("../models/user");
var passport = require("passport");

//HOME PAGE
router.get("/",function(req,res){
	res.render("campgrounds/home");
});

// SHOW REGISTER FORM
router.get("/register",function(req,res){
	if(req.user) //if already logged donot show register form. redirect to campgrounds page
		res.redirect("/campgrounds");
	else
		res.render("register");
});

// REGISTER NEW USER
router.post("/register",function(req,res){
	var newUser = new User({username: req.body.username});
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			console.log(err);
			req.flash("error",err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req,res,function(){
			req.flash("success","welcome " + req.body.username);
			res.redirect("/campgrounds");
		});
	});
});

//SHOW LOGIN FORM
router.get("/login",function(req,res){
	res.render("login");	
});

//HANDLING LOGIN 
router.post("/login",passport.authenticate("local",
	{
		failureRedirect: "/login",
		failureFlash: ("Invalid username/password")
	}),function(req,res){
		req.flash("success","Welcome back " + req.user.username);
		res.redirect("/campgrounds");
});

//LOGOUT ROUTE
router.get("/logout",function(req,res){
	req.logout();
	req.flash("success","You are logged out");
	res.redirect("/campgrounds");
});

module.exports = router;