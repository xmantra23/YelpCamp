require('dotenv').config();
var express = require("express");
var app = express();
var bodyParser = require("body-parser"); //for using req.body.<param> for post requests.
var mongoose = require("mongoose");
var Campground = require("./models/campground");// requiring campground model
var Comment = require("./models/comment"); // requiring comment model
var User = require("./models/user"); //requiring model for user
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");//for put and delete requests
var flash = require("connect-flash");
var moment = require("moment");

//requiring all the routes.
var commentRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var authRoutes = require("./routes/auth");
var userRoutes = require("./routes/users");
var passResetRoutes = require("./routes/reset");
var reviewRoutes = require("./routes/reviews");

//----------CREATING AND CONNECTING TO THE DATABASE--------------------------
mongoose.set('useUnifiedTopology', true); //getting a deprecation warning.
mongoose.set('useFindAndModify', false); //getting a deprecation warning.
mongoose.connect(process.env.DATABASEURL,{ useNewUrlParser: true, useCreateIndex: true });
//----------------------------------------------------------------------------

app.set("view engine","ejs"); //no need to include .ejs after this
app.use(bodyParser.urlencoded({extended:true})); //so that we can use req.body.name for post methods
app.use(express.static(__dirname + "/public")); //serving public directory for css and javascript files
app.use(flash()); //required for flash messages.
app.locals.moment = moment; //using moment.js 
//---------------PASSPORT CONFIGURATION----------------------------------
var expressSession = require("express-session");
app.use(expressSession({
	secret: "Kathmandu Nepal",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//-----------------------------------------------------------------------
app.use(function(req,res,next){   //providing current user to each route if logged in
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.resizeImage = function(image){
		var token = image.split("/");
		var imageUrl = token[0] + "//" + token[2] + "/" + token[3] + "/" + token[4] + 
				"/" + token[5] +  "/" + "w_300,h_150" +  "/" + token[6] +  "/" + token[7] ;
		return imageUrl;
	}
	res.locals.resizeImage2 = function(image){
		var token = image.split("/");
		var imageUrl = token[0] + "//" + token[2] + "/" + token[3] + "/" + token[4] + 
				"/" + token[5] +  "/" + "w_300,h_200" +  "/" + token[6] +  "/" + token[7] ;
		return imageUrl;
	}
	next();
});

app.use(methodOverride("_method"));  //need this for put and delete requests.


//using all the different routes.
app.use(authRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);
app.use("/campgrounds/:id/reviews",reviewRoutes);
app.use(userRoutes);
app.use(passResetRoutes);

app.listen(process.env.PORT,process.env.IP,function(){
	console.log("Yelp Camp Server Has Started.")
});