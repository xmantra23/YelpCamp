var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//INDEX
router.get("/",function(req,res){
	Campground.find({},function(err,campgrounds){
		if(err){
			console.log(err);
		}else{
			res.render("campgrounds/index",{campgrounds:campgrounds});
		}
	});
	
});

//CREATE
router.post("/",middleware.isLoggedIn,function(req,res){
	var name = req.body.name;
	var image = req.body.image;
	var price = req.body.price;
	var description = req.body.description;
	var author = {id: req.user._id,username: req.user.username};
	var newCampGround = {name:name,image:image,description:description,author:author,price:price};
	Campground.create(newCampGround,function(err,newlyCreated){
		if(err){
			console.log(err);
		}else{
			res.redirect("campgrounds");
		}
	});	
});

//NEW
router.get("/new",middleware.isLoggedIn,function(req,res){
	res.render("campgrounds/new");
});

//SHOW
router.get("/:id",function(req,res){
	Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampGround){
		if(err){
			console.log(err);
		}else{
			res.render("campgrounds/show",{campground:foundCampGround});
		}
	});	
});	

//EDIT
router.get("/:id/edit",middleware.checkOwnership,function(req,res){
	Campground.findById(req.params.id,function(err,foundCampGround){
		res.render("campgrounds/edit",{campground:foundCampGround})
	});
});

//UPDATE
router.put("/:id",middleware.checkOwnership,function(req,res){
	Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedCampground){
		if(err){
			res.redirect("/campground");
		}else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//DELETE
router.delete("/:id",middleware.checkOwnership,function(req,res){
	Campground.findByIdAndRemove(req.params.id,function(err,campgroundRemoved){
		if(err){
			console.log(err);
		}else{
			Comment.deleteMany({_id:{$in: campgroundRemoved.comments}},function(err){
				if(err){
					console.log(err);
				}
				else{
					res.redirect("/campgrounds");		
				}
			});
		}
	});
});

module.exports = router;
