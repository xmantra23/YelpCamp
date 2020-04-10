var Campground = require("../models/campground");
var Comment = require("../models/comment");

var middleware = {};

middleware.isLoggedIn = function (req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","You are not logged in");
	res.redirect("/login");
};

middleware.checkOwnership = function(req,res,next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id,function(err,foundCampGround){
			if(err){
				req.flash("error","Oops!! something went wrong.");
				res.redirect("back");
			}else{
				if(req.user._id.equals(foundCampGround.author.id) || req.user.isAdmin){
					return next();
				}else{
					req.flash("error","You donot have the permission to do that.");
					res.redirect("/campgrounds/" + req.params.id);
				}
			}
		});
	}else{
		req.flash("error","You are not logged in.");
		res.redirect("back");
	}	
};

middleware.checkCommentOwnership = function(req,res,next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id,function(err,comment){
			if(err){
				req.flash("Oops!! Something went wrong");
				res.redirect("back");
			}else{
				if(req.user._id.equals(comment.author.id) || req.user.isAdmin){
					return next();
				}else{
					req.flash("error","You donot have the permission to do that.");
					res.redirect("back");
				}
			}
		});
	}else{
		req.flash("error","You are not logged in.");
		res.redirect("back");
	}	
};

module.exports = middleware;
