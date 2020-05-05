var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");
var cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name: 'xmantra23',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get("/users/:id",function(req,res){
	User.findById(req.params.id,function(err,foundUser){
		if(err){
			req.flash("error","User Not Found");
			return res.redirect("/campgrounds");
		}
		Campground.find().where('author.id').equals(foundUser._id).exec(function(err,campgrounds){
			if(err){
				req.flash("error","System Fatal Error");
				return res.redirect("/campgrounds");
			}
			res.render("users/show",{user: foundUser,campgrounds: campgrounds});
		});
	});
});

router.get("/users",middleware.checkIfAdmin,function(req,res){
	User.find({},function(err,users){
		res.render("users/index",{users:users});
	})
})

router.delete("/users/:id",middleware.checkIfAdmin,function(req,res){
	User.findByIdAndRemove(req.params.id,function(err,removedUser){
		if(err){
			req.flash("error",err.message);
			return res.redirect("back");
		}
		Campground.find({"author.id":removedUser._id},function(err,campgrounds){
			if(err){
				req.flash("error",err.message);
				return res.redirect("back");
			}
			campgrounds.forEach(function(campground){
				cloudinary.v2.uploader.destroy(campground.imageId);
				campground.remove();
			});
		});
		cloudinary.v2.uploader.destroy(removedUser.avatarId);
		req.flash("success", removedUser.username + " successfully deleted");
		res.redirect("/users");
	});
	
});

module.exports = router;