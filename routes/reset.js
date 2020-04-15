var express = require("express");
var router = express.Router();
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var User = require("../models/user");
var Campground = require("../models/campground");

router.get("/forgot",function(req,res){
	res.render('forgot');
});

router.post("/forgot",function(req,res,next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20,function(err,buf){
				var token = buf.toString('hex');
				done(err,token);
			});
		},
		function(token,done){
			User.findOne({email:req.body.email},function(err,user){
				if(!user){
					req.flash("error","No account with that email address exists");
					return res.redirect("/forgot");
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
				
				user.save(function(err){
					if(err){
						req.flash("error","Error resetting password. Please contact admin.");
						return res.redirect("/forgot");
					}
					done(err,token,user);
				});
			});
		},
		function(token,user,done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: 'jupiter.ranger@gmail.com',
					pass: process.env.GMAIL_PASSWORD
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'jupiter.ranger@gmail.com',
				subject: 'YelpCamp Password Reset',
				text: 'You are receiving this because you (or someone else) has requested to reset your account '+
				    'password. Please click on the following link, or paste this into your browser:\n\n'+
					'http://' + req.headers.host + '/reset/' + token + '\n\n' + 
					'If you did not request this, please ignore this email.\n'
			};
			smtpTransport.sendMail(mailOptions,function(err){
				if(err){
					console.log(err);
					req.flash('error',"Email could not be send. Contact IT Support");
					return res.redirect("/forgot");
				}else{
					req.flash('success','An email has been send to ' + user.email + 
							  ' with further instructions.');
					done(err,'done');
				}
			});
		}],function(err){
			if(err){
				return next(err);
			}
			res.redirect('/forgot');
		});
});

router.get('/reset/:token',function(req,res){
	User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires:{$gt:Date.now()}},function(err,user){
		if(!user){
			req.flash('error','Password reset token is invalid or has expired.');
			return res.redirect('back');
		}
		res.render('reset',{token: req.params.token});
	});
});

router.post('/reset/:token',function(req,res){
	async.waterfall([
		function(done){
			User.findOne({resetPasswordToken: req.params.token, 
			  resetPasswordExpires:{$gt:Date.now()}},function(err,user){
					if(!user){
						req.flash('error','Password rest token is invalid or has expired');
						return res.redirect('back');
					}					
					if(req.body.password === req.body.confirm){
						user.setPassword(req.body.password,function(err){
							user.resetPasswordToken = undefined;
							user.resetPasswordExpires = undefined;
							user.save(function(err){
								req.logIn(user,function(err){
									done(err,user);
								});
							});
						});	
					}else{
						req.flash("error","Passwords do not match.");
						return res.redirect('back');
					}
			});
		},
		function(user,done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth:{
					user: 'jupiter.ranger@gmail.com',
					pass: process.env.GMAIL_PASSWORD
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'jupiter.ranger@gmail.com',
				subject: 'Your password has been changed',
				text: 'Hello,\n\n' +
					'This is a confirmation that the password for your account ' + user.email + 
					'has just been changed.\n'
			};
			smtpTransport.sendMail(mailOptions,function(err){
				req.flash('success','Success! Your password has been changed.');
				done(err);
			});
		}
	],function(err){
		res.redirect('/campgrounds');
	});
});

module.exports = router;