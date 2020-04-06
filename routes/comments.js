var express = require("express");
var router = express.Router({mergeParams: true}); //for merging the req.params.id fields
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//NEW
router.get("/new",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		res.render("comments/new",{campground:campground});
	});		
});

//CREATE
router.post("/",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		Comment.create(req.body.comment,function(err,comment){
			comment.author.id = req.user._id;
			comment.author.username = req.user.username;
			comment.save();
			
			campground.comments.push(comment);
			campground.save();
			res.redirect("/campgrounds/" + campground._id);
		});
	});
});

//EDIT
router.get("/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
	Comment.findById(req.params.comment_id,function(err,foundComment){
		if(err)
			console.log(err);
		else{
			res.render("comments/edit",{campground_id:req.params.id,comment:foundComment});	
		}
	});
});

//UPDATE
router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updateComment){
		if(err)
			console.log(err);
		else
			res.redirect("/campgrounds/" + req.params.id);
	});
});

//DELETE
router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comment.findByIdAndRemove(req.params.comment_id,function(err,removedComment){
		if(err)
			console.log(err);
		else
			res.redirect("/campgrounds/"+ req.params.id);
	});
});

module.exports = router;