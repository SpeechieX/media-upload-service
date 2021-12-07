// 'use strict'

require("dotenv").config();
const express = require("express");
const router = express.Router();
const multer = require("multer");
const MEDIA = require("../models/Media");
const fs = require("fs");
var path = require("path");

var AWS = require("aws-sdk");

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

// @desc    Get all MEDIAs and Routes
// @route   GET /api
// @access  Public

router.route("/").get((req, res, next) => {
	MEDIA.find(
		{},
		null,
		{
			sort: { createdAt: 1 },
		},
		(err, docs) => {
			if (err) {
				return next(err);
			}
			res.status(200).send(docs);
		},
	);
});

// @desc    GET Single Exisiting GO Data
// @route   GET /api/:id
// @access  PRIVATE

router.route("/:id").get((req, res, next) => {
	MEDIA.findById(req.params.id, (err, go) => {
		if (err) {
			return next(err);
		}
		res.json(go);
	});
});

// @desc    Upload a Single Song (Audio File)
// @route   GET /api/uploadAudio
// @access  Public

router.post("/uploadAudio", upload.single("file"), function (req, res) {
	const file = req.file;
	const s3FileURL = process.env.AWS_Uploaded_File_URL_LINK;

	let s3bucket = new AWS.S3({
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: process.env.AWS_REGION,
	});

	var params = {
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: file.originalname,
		Body: file.buffer,
		ContentType: file.mimetype,
		ACL: "public-read",
	};

	// fs.stat(MEDIA, (err, stats) => {
	// 	var docSize = stats.size;
	// 	var uploadedSize = 0;

	// 	const percentage = fs.createReadStream(MEDIA);

	// 	percentage.on("data", (buffer) => {
	// 		var segmentLength = buffer.length;

	// 		// Increment the uploaded data counter
	// 		uploadedSize += segmentLength;

	// 		// Display the upload percentage
	// 		console.log(
	// 			"Progress:\t",
	// 			((uploadedSize / docSize) * 100).toFixed(2) + "%",
	// 		);
	// 	});

	// 	percentage.on("open", () => {
	// 		percentage.pipe(res);
	// 	});

	// 	percentage.on("error", (err) => {
	// 		res.end(err);
	// 	});

	// 	percentage.on("end", () => {
	// 		console.log("Event: end");
	// 	});
	// 	percentage.on("close", () => {
	// 		console.log("Event: close");
	// 	});
	// });

	s3bucket.upload(params, function (err, audio) {
		if (err) {
			res.status(500).json({ error: true, Message: err });
		} else {
			res.status(200).send(audio);
			var newFileUploaded = {
				title: req.body.title,
				fileLink: `${s3FileURL}/${file.originalname}`,
				s3_key: params.Key,
				content_id: "audio",
				artist: req.body.artist,
			};

			var media = new MEDIA(newFileUploaded);

			console.log(newFileUploaded);

			media.save(function (error, newFile) {
				if (error) {
					throw error;
				}
			});
		}
	});
});

// @desc    EDIT A RECORDS EXISTING DESCRIPTION FIELD
// @route   GET /api/edit/:id
// @access  PRIVATE

router.route("/edit/:id").put((req, res, next) => {
	MEDIA.findByIdAndUpdate(
		req.params.id,
		{ $set: { description: Object.keys(req.body)[0] } },
		{ new: true },
		(err, updateDoc) => {
			if (err) {
				return next(err);
			}
			res.status(200).send(updateDoc);
		},
	);
});

// @desc    Delete MEDIA
// @route   GET /api/:id
// @access  PRIVATE

router.route("/:id").delete((req, res, next) => {
	MEDIA.findByIdAndRemove(req.params.id, (err, result) => {
		if (err) {
			return next(err);
		}

		// Deleting the File from S3 Bucket
		let s3bucket = new AWS.S3({
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			region: process.env.AWS_REGION,
		});

		let params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: result.s3_key,
		};

		s3bucket.deleteObject(params, (err, data) => {
			if (err) {
				console.log(err);
			} else {
				res.send({
					status: "200",
					responseType: "string",
					response: "success",
				});
			}
		});
	});
});

// PUBLIC
// METHOD : GET
// SEARCH MEDIAS BY CONTENT_ID

router.get("/getContentType/:id", async (req, res) => {
	let id = req.params.id;

	const list = await MEDIA.find({ content_id: `${id}` });

	if (!list) {
		res.status(404).json({
			message: "No Content Available Can Be Found with that Content ID",
		});
	} else {
		res.status(200).json(list);
	}
});

// PUBLIC
// METHOD : GET
// SEARCH SINGLE MEDIA BY MEDIA_ID

router.get("/getSingleContent/:id", async (req, res) => {
	let id = req.params.id;

	const list = await MEDIA.find({ MEDIA_id: `${id}` });

	if (!list) {
		res.status(404).json({
			message: "No Content Available Can Be Found with that MEDIA ID",
		});
	} else {
		res.status(200).json(list);
	}
});

module.exports = router;
