var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var Review = require("../models/review");

//-------------------Google Geocoder Api Variable Setup------------------------------------------------------
var NodeGeocoder = require('node-geocoder');
var options = {
	provider: 'google',
	httpAdapter: 'https',
	apiKey: process.env.GEOCODER_API_KEY,
	formatter: null
};
var geocoder = NodeGeocoder(options);
//-------------------------------------------------------------------------------------------------------------------

//-------------------Cloudinary variable setup-----------------------------------------------------------------------
var multer = require('multer');
var storage = multer.diskStorage({
	filename: function(req,file,callback){
		callback(null,Date.now() + file.originalname);
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
//-------------------------------------------------------------------------------------------------------------------

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
router.post("/",middleware.isLoggedIn,upload.single('image'),function(req,res){
	var name = req.body.name;
	var price = req.body.price;
	var description = req.body.description;
	var author = {id: req.user._id,username: req.user.username};
	
	geocoder.geocode(req.body.location, function(err,data){
		if(err || !data.length){
			req.flash('error','Invalid Campground Location');
			return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;	
		
		cloudinary.v2.uploader.upload(req.file.path,function(err,result){
			if(err){
				req.flash("error",err.message);
				return res.redirect('back');
			}
			var image = result.secure_url;
			var imageId = result.public_id;
			
			var newCampGround = {name:name,image:image,imageId:imageId,description:description,
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
});

//NEW
router.get("/new",middleware.isLoggedIn,function(req,res){
	res.render("campgrounds/new");
});

//SHOW
router.get("/:id",function(req,res){
	Campground.findById(req.params.id).populate("comments likes").populate({
		path:"reviews",options:{sort:{createdAt: -1}}//reverse sort reviews
	}).exec(function(err,foundCampGround){
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
router.put("/:id",middleware.checkOwnership,upload.single('image'),function(req,res){
		Campground.findById(req.params.id,async function(err,campground){
			if(err){
				req.flash("error",err.message);
				res.redirect("/campground");
			}else{
				if(req.file){
					try{
						await cloudinary.v2.uploader.destroy(campground.imageId);
						var result = await cloudinary.v2.uploader.upload(req.file.path);
						campground.imageId = result.public_id;
						campground.image = result.secure_url;
					}catch(err){
						req.flash("error",err.message);
						return res.redirect("back");
					}
				}
			}
			geocoder.geocode(req.body.location,function(err,data){
				if(err || !data.length){
					req.flash('error','Invalid Campground Location.');
					return res.redirect('back');
				}
				campground.lat = data[0].latitude;
				campground.lng = data[0].longitude;
				campground.location = data[0].formattedAddress;	
			});
			
			campground.name = req.body.name;
			campground.description = req.body.description;
			campground.price = req.body.price;
			campground.save();
			req.flash("success","Successfully Updated!");
			res.redirect("/campgrounds/" + req.params.id);
		});
	});

//DELETE
router.delete("/:id",middleware.checkOwnership,function(req,res){
	Campground.findById(req.params.id,async function(err,campground){
		if(err){
			console.log(err);
			req.flash("error",err.message);
			return res.redirect("back");
		}
		try{
			await cloudinary.v2.uploader.destroy(campground.imageId);
			Comment.deleteMany({_id:{$in:campground.comments}},function(err){
				if(err){
					console.log(err);
					return res.redirect("/campgrounds");
				}
				Review.deleteMany({_id:{$in:campground.reviews}},function(err){
					if(err){
						console.log(err);
						return res.redirect("/campgrounds");
					}
					//remove campground
					campground.remove();
					req.flash("success","Campground was successfully deleted");
					res.redirect('/campgrounds');
				});
			});
		}catch(err){
			if(err){
				req.flash("error",err.message);
				return res.redirect("back");
			}
		}
	});
});

//Campground Like Route
router.post("/:id/like",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,foundCampground){
		if(err){
			req.flash("error",err.message);
			return res.redirect("/campgrounds");
		}
		
		//check if req.user._id exists in foundCampGround.likes[] array
		var foundUserLike = foundCampground.likes.some(function(like){
			return like.equals(req.user._id);
		});
		
		if(foundUserLike){
			//user already liked, removing liked
			foundCampground.likes.pull(req.user._id);
		}else{
			//adding the new user like
			foundCampground.likes.push(req.user);
		}
		
		foundCampground.save(function(err){
			if(err){
				req.flash("error",err.message);
				return res.redirect("/campgrounds");
			}
			return res.redirect("/campgrounds/"+foundCampground._id); //redirecting to the show page
		});
		
	});
});

function escapeRegex(text){
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&");
};

module.exports = router;
