var express = require("express");
var router = express.Router();
var User = require("../models/user");
var passport = require("passport");


//------------------Image upload setup--------------------------
var multer = require('multer');
var storage = multer.diskStorage({
	filename: function(req,file,callback){
				callback(null,Date.now()+ file.originalname);
	}
});
var imageFilter = function(req,file,callback){
	//accept image files only
	if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
		return callback(new Error("Only image files are allowed"),false);
	}
	callback(null,true);
}
var upload = multer({storage:storage,fileFilter:imageFilter});
var cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name: 'xmantra23',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});
//------------------Image upload setup--------------------------

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

//SHOW ADMIN-REGISTER FORM
router.get("/admin-register",function(req,res){
	if(req.user) //if already logged donot show register form. redirect to campgrounds page
		res.redirect("/campgrounds");
	else
		res.render("admin-register");
});


// REGISTER NEW ADMIN USER
router.post("/admin-register",function(req,res){
	var newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		avatar: req.body.avatar
	});
	if(req.body.adminCode === process.env.ADMIN_CODE){
		newUser.isAdmin = true;
	}else{
		req.flash("error","Invalid Admin Code")
		return res.redirect("/admin-register");
	}
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

// REGISTER NEW USER
router.post("/register",upload.single('avatar'),function(req,res){
	cloudinary.v2.uploader.upload(req.file.path,function(err,result){
		
		
		
	});
	var newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		avatar: req.body.avatar
	});
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