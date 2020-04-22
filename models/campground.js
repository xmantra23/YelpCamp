var mongoose = require("mongoose");

var campGroundSchema = new mongoose.Schema({
	name:String,
	price:String,
	image:String,
	imageId:String,
	description:String,
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	author:{
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref:"User"
		},
		username: String
	},
	createdAt: {type:Date, default: Date.now},
	location: String,
	lat: Number,
	lng: Number,
	likes:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		}
	]
});

module.exports = mongoose.model("Campground",campGroundSchema);