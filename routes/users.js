var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");

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

module.exports = router;