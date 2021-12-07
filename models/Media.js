const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const Schema = mongoose.Schema;

const mediaSchema = new Schema(
	{
		date: {
			type: String,
			default: new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
		},
		document_id: {
			// Returns a String in All Caps, without any special characters
			type: String,
			default: function () {
				return nanoid(22)
					.toUpperCase()
					.replace(/[^a-zA-Z ]/g, "");
			},
		},
		title: { type: String },
		fileLink: { type: String },
		s3_key: { type: String },
		content_id: { type: String },
		artist: { type: String },
	},
	{
		timestamps: true,
	},
);

module.exports = mongoose.model("Media", mediaSchema);
