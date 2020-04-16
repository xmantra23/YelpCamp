var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

var NodeGeocoder = require('node-geocoder');

var options = {
	provider: 'google',
	httpAdapter: 'https',
	apiKey: process.env.GEOCODER_API_KEY,
	formatter: null
};

var geocoder = NodeGeocoder(options);
//INDEX
router.get("/",function(req,res){
	var noMatch = false;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search),'gi');
		Campground.find({name:regex},function(err,campgrounds){
			if(err){
				console.log(err);
			}else{
				if(campgrounds.length === 0)
					noMatch = true;
				res.render("campgrounds/index",{campgrounds:campgrounds,noMatch:noMatch});
			}
		});
	}else{
		Campground.find({},function(err,campgrounds){
			if(err){
				console.log(err);
			}else{
				res.render("campgrounds/index",{campgrounds:campgrounds,noMatch:noMatch});
			}
		});
	}
	
});

//CREATE
router.post("/",middleware.isLoggedIn,function(req,res){
	var name = req.body.name;
	var image = req.body.image;
	var price = req.body.price;
	var description = req.body.description;
	var author = {id: req.user._id,username: req.user.username};
	
	geocoder.geocode(req.body.location,function(err,data){
		if(err || !data.length){
			req.flash('error','Invalid Campground Location');
			console.log(err.message);
			console.log(data[0]);
			return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;
		
		var newCampGround = {name:name,image:image,description:description,
						 author:author,price:price,location:location,lat:lat,lng:lng};
		Campground.create(newCampGround,function(err,newlyCreated){
			if(err){
				console.log(err);
			}else{
				res.redirect("campgrounds");
			}
		});
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
	geocoder.geocode(req.body.location,function(err,data){
		if(err || !data.length){
			req.flash('error','Invalid Campground Location.');
			return res.redirect('back');
		}
		req.body.campground.lat = data[0].latitude;
		req.body.campground.lng = data[0].longitude;
		req.body.campground.location = data[0].formattedAddress;
		
		Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedCampground){
			if(err){
				req.flash("error",err.message);
				res.redirect("/campground");
			}else{
				req.flash("success","Successfully Updated!");
				res.redirect("/campgrounds/" + req.params.id);
			}
		});
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

function escapeRegex(text){
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&");
};

module.exports = router;
