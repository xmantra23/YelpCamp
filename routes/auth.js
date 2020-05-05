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
			req.fileValidationError = "Only image files are allowed";
			return callback(null,false,req.fileValidationError);
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
//^------------------Image upload setup--------------------------^

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
router.post("/admin-register",upload.single('avatar'),function(req,res){
	if(req.fileValidationError){
		req.flash("error","Invalid image file");
		return res.redirect("/admin-register");
	}
	User.exists({email: req.body.email }, function(err, result) {
		if (err) {
		  	return;
		}
		if(result){
			req.flash("error","email already registered");
			return res.redirect("/admin-register");
		}
  	});
	cloudinary.v2.uploader.upload(req.file.path,{folder:"YelpCamp-Users"},function(err,result){
		if(err){
			req.flash("error",err.message);
			return res.redirect("/admin-register");
		}
		var newUser = new User({
			username: req.body.username,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			avatar: result.secure_url,
			avatarId: result.public_id
		});
		
		if(req.body.adminCode === process.env.ADMIN_CODE){
			newUser.isAdmin = true;
		}else{
			cloudinary.v2.uploader.destroy(result.public_id); //if not and admin delete uploaded image as cannot continue with registration
			req.flash("error","Invalid Admin Code")
			return res.redirect("/admin-register");
		}
		User.register(newUser,req.body.password,function(err,user){
			if(err){
				cloudinary.v2.uploader.destroy(result.public_id); //delete uploaded image as registration has failed.
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
});

// REGISTER NEW USER
router.post("/register",upload.single('avatar'),function(req,res){
	if(req.fileValidationError){
		req.flash("error","Invalid image file");
		return res.redirect("/register");
	}
	User.exists({email: req.body.email }, function(err, result) {
		if (err) {
		    return;
		}
		if(result){
			req.flash("error","email already registered");
			return res.redirect("/register");
		}
  	});
	cloudinary.v2.uploader.upload(req.file.path,{folder:"YelpCamp-Users"},function(err,result){
		if(err){
			req.flash("error",err.message);
			return res.redirect("/register");
		}
		var newUser = new User({
			username: req.body.username,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			avatar: result.secure_url,
			avatarId : result.public_id
		});
		User.register(newUser,req.body.password,function(err,user){
			if(err){
				console.log(err);
				cloudinary.v2.uploader.destroy(result.public_id);//if registration fails delete image.
				req.flash("error",err.message);
				return res.redirect("/register");
			}
			passport.authenticate("local")(req,res,function(){
				req.flash("success","welcome " + req.body.username);
				res.redirect("/campgrounds");
			});
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