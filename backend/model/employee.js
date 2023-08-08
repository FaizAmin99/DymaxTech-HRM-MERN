var mongoose = require('mongoose');
var Schema = mongoose.Schema;

productSchema = new Schema( {
	email:String,
	pass:String,
	name: String,
	desg: String,
	joiningDate:Date,
	dob:Date,
	dept:String,
	gender:String,
	stat:String,
	mob: Number,
	pre_addr:String,
	perm_addr:String,
	salary: Number,
	image: String,
	emer_name: String,
	emer_mob: Number,
	cv_link: String,
	user_id: Schema.ObjectId,
	is_delete: { type: Boolean, default: false },
	//date : { type : Date, default: Date.now }
}),

product = mongoose.model('employees', productSchema);

module.exports = product;