var express = require("express");
var app = express();
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var multer = require('multer'),
  bodyParser = require('body-parser'),
  path = require('path');
var mongoose = require("mongoose");
mongoose.connect("mongodb+srv://faiz123:faiz123@clusterfaiz.qupdcy6.mongodb.net/hrm_data");
var fs = require('fs');
var product = require("./model/employee.js");
var user = require("./model/user.js");
var moment = require('moment-timezone');
var cors = require('cors');


var dir = './uploads';

//Importing the model
const Timestamp = require('./model/timestamp');

//Configuring the middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}))

//Defining route to save the timestamp
app.post('/api/save-timestamp', (req,res) => {
  /*const { timestamp } = req.body;

  Timestamp.create({ timestamp }, (error, createdTimestamp) => {
    if (error) {
      res.status(500).json({ error: 'Failed to save timestamp' });
      }

    else {
      res.status(200).json({ sucess: true, timestamp: createdTimestamp });
    }
    try{
    var timestamp = moment().tz('Asia/Karachi').format('YYYY-MM-DD HH:mm:ss');
    // Save the timestamp to the database or perform any other necessary actions
    console.log('Timestamp:', timestamp);
    res.status(200).send('Timestamp saved successfully.');
  } catch (err) {
    console.error('Error saving timestamp:', err);
    res.status(500).send('Error saving timestamp.');
  }
  });*/

  try {
    var karachiTime = moment().tz("Asia/Karachi");
    
    //var timestamp = karachiTime.format('YYYY-MM-DD HH:mm:ss');
    
    const timestamp = karachiTime.toDate();
    
    // Save the timestamp to the database or perform any other necessary actions
    console.log('Timestamp (Karachi Time):', karachiTime.format());
    console.log('Timestamp:', timestamp);

    // Create a new instance of Timestamp model
    var newTimestamp = new Timestamp({
      timestamp: karachiTime.toDate()//toISOString()
    });

    // Save the new timestamp to the database
    newTimestamp.save((err, createdTimestamp) => {
      if (err) {
        console.error('Error saving timestamp:', err);
        res.status(500).json({ error: 'Failed to save timestamp' });
      } else {
        console.log('Timestamp saved:', createdTimestamp);
        res.status(200).json({ success: true, timestamp: createdTimestamp });
      }
    });
  } catch (err) {
    console.error('Error saving timestamp:', err);
    res.status(500).send('Error saving timestamp.');
  }
});


var upload = multer({
  
  storage: multer.diskStorage({

    destination: function (req, file, callback) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      callback(null, './uploads');
    },
    filename: function (req, file, callback) { callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); }

  }),

  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname)
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return callback(/*res.end('Only images are allowed')*/ null, false)
    }
    callback(null, true)
  }
});
app.use(cors());
app.use(express.static('uploads'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: false
}));

app.use("/", (req, res, next) => {
  try {
    if (req.path == "/login" || req.path == "/register" || req.path == "/") {
      next();
    } else {
      /* decode jwt token if authorized*/
      jwt.verify(req.headers.token, 'shhhhh11111', function (err, decoded) {
        if (decoded && decoded.user) {
          req.user = decoded;
          next();
        } else {
          return res.status(401).json({
            errorMessage: 'User unauthorized!',
            status: false
          });
        }
      })
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
})

app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    title: 'Apis'
  });
});

/* login api */
app.post("/login", (req, res) => {
  try {
    if (req.body && req.body.username && req.body.password) {
      user.find({ username: req.body.username }, (err, data) => {
        if (data.length > 0) {

          if (bcrypt.compareSync(data[0].password, req.body.password)) {
            checkUserAndGenerateToken(data[0], req, res);
          } else {

            res.status(400).json({
              errorMessage: 'Username or password is incorrect!',
              status: false
            });
          }

        } else {
          res.status(400).json({
            errorMessage: 'Username or password is incorrect!',
            status: false
          });
        }
      })
    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }

});

/* register api */
app.post("/register", (req, res) => {
  try {
    if (req.body && req.body.username && req.body.password) {

      user.find({ username: req.body.username }, (err, data) => {

        if (data.length == 0) {

          let User = new user({
            username: req.body.username,
            password: req.body.password
          });
          User.save((err, data) => {
            if (err) {
              res.status(400).json({
                errorMessage: err,
                status: false
              });
            } else {
              res.status(200).json({
                status: true,
                title: 'Registered Successfully.'
              });
            }
          });

        } else {
          res.status(400).json({
            errorMessage: `UserName ${req.body.username} Already Exist!`,
            status: false
          });
        }

      });

    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});
function checkUserAndGenerateToken(data, req, res) {
  jwt.sign({ user: data.username, id: data._id }, 'shhhhh11111', { expiresIn: '1d' }, (err, token) => {
    if (err) {
      res.status(400).json({
        status: false,
        errorMessage: err,
      });
    } else {
      res.json({
        message: 'Login Successfully.',
        token: token,
        status: true
      });
    }
  });
}

/* Api to add Product */
app.post("/add-product", upload.any(), (req, res) => {
  try {
    if (req.files && req.body && req.body.name && req.body.desg && req.body.salary &&
      req.body.mob && req.body.emer_name && req.body.emer_mob) {

      let new_product = new product();
      new_product.email = req.body.email;
      new_product.pass = req.body.pass;
      new_product.name = req.body.name;
      new_product.desg = req.body.desg;
      new_product.joiningDate = req.body.joiningDate;
      new_product.dob = req.body.dob;
      new_product.dept = req.body.dept;
      new_product.gender = req.body.gender;
      new_product.stat = req.body.stat;
      new_product.mob = req.body.mob;
      new_product.pre_addr = req.body.pre_addr;
      new_product.perm_addr = req.body.perm_addr;
      new_product.salary = req.body.salary;
      new_product.cv_link = req.body.cv_link;
      new_product.emer_name = req.body.emer_name;
      new_product.emer_mob = req.body.emer_mob;
      new_product.image = req.files[0].filename;
      
      //-----------------------------------------------
      /*var timestamp = moment().tz("Asia/Karachi").format('HH:mm:ss');
      new_product.timestamp = timestamp;*/


      new_product.user_id = req.user.id;
      new_product.save((err, data) => {
        if (err) {
          res.status(400).json({
            errorMessage: err,
            status: false
          });
        } else {
          res.status(200).json({
            status: true,
            title: 'Employee Added successfully.'
          });
        }
      });

    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});

/* Api to update Product */
app.post("/update-product", upload.any(), (req, res) => {
  try {
    if (req.files && req.body && req.body.email && req.body.pass &&req.body.name && req.body.desg && req.body.gender && req.body.joiningDate && req.body.dob && req.body.dept && req.body.stat&& req.body.pre_addr && req.body.perm_addr &&
      req.body.id && req.body.salary && req.body.cv_link && req.body.emer_name && req.emer_mob) {

      product.findById(req.body.id, (err, new_product) => {

        // if file already exist than remove it
        if (req.files && req.files[0] && req.files[0].filename && new_product.image) {
          var path = `./uploads/${new_product.image}`;
          fs.unlinkSync(path);
        }

        if (req.files && req.files[0] && req.files[0].filename) {
          new_product.image = req.files[0].filename;
        }
        if (req.body.email) {
          new_product.email = req.body.email;
        }
        if (req.body.pass) {
          new_product.pass = req.body.pass;
        }
        if (req.body.name) {
          new_product.name = req.body.name;
        }
        if (req.body.desg) {
          new_product.desg = req.body.desg;
        }
        if (req.body.joiningDate) {
          new_product.joiningDate = req.body.joiningDate;
        }
        if (req.body.dob) {
          new_product.dob = req.body.dob;
        }
        if (req.body.dept) {
          new_product.dept = req.body.dept;
        }
        if (req.body.gender) {
          new_product.gender = req.body.gender;
        }
        if (req.body.stat) {
          new_product.stat = req.body.stat;
        }
        if (req.body.mob) {
          new_product.mob = req.body.mob;
        }
        if (req.body.pre_addr) {
          new_product.pre_addr = req.body.pre_addr;
        }
        if (req.body.perm_addr) {
          new_product.perm_addr = req.body.perm_addr;
        }
        if (req.body.salary) {
          new_product.salary = req.body.salary;
        }
        if(req.body.cv_link) {
          new_product.cv_link = req.cv_link;
        }
        if(req.bofy.emer_name){
          new_product.emer_name = req.emer_name;
        }
        if(req.bofy.emer_mob){
          new_product.emer_mob = req.emer_mob;
        }
        
        
        

        new_product.save((err, data) => {
          if (err) {
            res.status(400).json({
              errorMessage: err,
              status: false
            });
          } else {
            res.status(200).json({
              status: true,
              title: 'Employee Data updated.'
            });
          }
        });

      });

    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});

/* Api to delete Product */
app.post("/delete-product", (req, res) => {
  try {
    if (req.body && req.body.id) {
      product.findByIdAndUpdate(req.body.id, { is_delete: true }, { new: true }, (err, data) => {
        if (data.is_delete) {
          res.status(200).json({
            status: true,
            title: 'Employee INACTIVATED !'
          });
        } else {
          res.status(400).json({
            errorMessage: err,
            status: false
          });
        }
      });
    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});

/*Api to get and search product with pagination and search by name*/
app.get("/get-product", (req, res) => {
  try {
    var query = {};
    query["$and"] = [];
    query["$and"].push({
      is_delete: false,
      user_id: req.user.id
    });
    if (req.query && req.query.search) {
      query["$and"].push({
        name: { $regex: req.query.search }
      });
    }
    var perPage = 5;
    var page = req.query.page || 1;
    product.find(query, { date: 1, name: 1, id: 1, desg: 1, salary: 1, mob: 1, joiningDate: 1, dob:1, gender:1, dept:1, email:1, pass:1, pre_addr:1, perm_addr:1, cv_link:1, image: 1, emer_name:1, emer_mob:1 })
      .skip((perPage * page) - perPage).limit(perPage)
      .then((data) => {
        product.find(query).count()
          .then((count) => {

            if (data && data.length > 0) {
              res.status(200).json({
                status: true,
                title: 'Employee retrived.',
                products: data,
                current_page: page,
                total: count,
                pages: Math.ceil(count / perPage),
              });
            } else {
              res.status(400).json({
                errorMessage: 'No Employee Data Found!',
                status: false
              });
            }

          });

      }).catch(err => {
        res.status(400).json({
          errorMessage: err.message || err,
          status: false
        });
      });
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }

});

app.listen(2000, () => {
  console.log("Server is Runing On port 2000");
});
