var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");

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

middleware.checkReviewOwnership = function(req,res,next){
	if(req.isAuthenticated()){
		Review.findById(req.params.review_id,function(err,foundReview){
			if(err || !foundReview){
				res.redirect("back");
			}else{
				if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}else{
					req.flash("error","You don't have the permission to do that");
				}
			}
		});
	}else{
		req.flash("error","You need to be logged in to do that");
		res.redirect("back");
	}
};

middleware.checkReviewExistence = function(req,res,next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id).populate("reviews").exec(function(err,foundCampGround){
			if(err || !foundCampGround){
				req.flash("error","Campground not found");
				return res.redirect("back");
			}
			//check if user id exists in the found campgrounds reviews
			var foundUserReview = foundCampGround.reviews.some(function(review){
				return review.author.id.equals(req.user._id);
			});
			if(foundUserReview){
				req.flash("error","You already wrote a review");
				return res.redirect("/campgrounds/" + foundCampGround._id);
			}
			//if the review was not found, go to the next middleware
			next();
		});
	}else{
		req.flash("error","You need to login first");
		res.redirect("back");
	}
};

module.exports = middleware;
