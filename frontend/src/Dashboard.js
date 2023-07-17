import React, { Component, useState, useEffect } from 'react';
import {
  Button, TextField, Dialog, DialogActions, LinearProgress,
  DialogTitle, DialogContent, TableBody, Table,
  TableContainer, TableHead, TableRow, TableCell, FormControl, InputLabel, Select, MenuItem
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import swal from 'sweetalert';
import { withRouter } from './utils';
import { format, differenceInMinutes  } from 'date-fns';
import Modal from 'react-modal';
import { paginationItemClasses } from '@mui/material';


const axios = require('axios');


const Clock = ({ isPunchedIn }) => {
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    if (isPunchedIn) {
     setStartTime(new Date());
      setEndTime(null);
      setDuration(null);
      
    } else if (!isPunchedIn && startTime){
      
        setEndTime(new Date());
      
    }
  }, [isPunchedIn]);

  useEffect(() => {
    if (startTime && endTime) {
      const durationMs = Math.abs(endTime - startTime);
      const formattedDuration = new Date(durationMs).toISOString().substr(11, 8);
      setDuration(formattedDuration);
    }
  }, [startTime, endTime]);


  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date) => {
    const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12:'true'};
    return date.toLocaleTimeString('en-US', options);
  };

  return (
    <div>
      {startTime && (
        <p>
          Date: <i><b>{formatDate(startTime)}</b></i>
        </p>
      )}
      {startTime && (
        <p>
          Start Time: <b>{formatTime(startTime)}</b>
          
        </p>
      )}
      {isPunchedIn && endTime && (
        <p>
          End Time: <b>{formatTime(endTime)}</b>
        </p>      
      )}
      {duration && <p>Duration: <b>{duration}</b></p>}
    </div>
  );

  
};

Modal.setAppElement('#root');


class Dashboard extends Component {
  
  
 handleTimePunchIn = () => {
 const { isPunchedIn, endTime } = this.state;
  
    if (isPunchedIn) {
      swal({
        text: 'You have already punched in for today.',
        icon: 'warning',
        type: 'warning',
      });
      return;
    }
  
    const timestamp = new Date();
  
    axios.post('http://localhost:2000/api/save-timestamp', { timestamp })
      .then((res) => {
        console.log('Timestamp saved successfully:', res.data);
        const action = 'punched in';
        swal({
          text: `You ${action} at ${timestamp.toLocaleTimeString()}`,
          icon: 'success',
          type: 'success',
        });
        this.setState({ isPunchedIn: true, startTime: timestamp });
  
        // Store punch status in local storage
        localStorage.setItem('punchStatus', 'in');
      })
      .catch((error) => {
        console.error('Error saving timestamp:', error);
      });
  };
  
  handleTimePunchOut = () => {
    const { isPunchedIn, startTime, endTime } = this.state;
  
    if (!isPunchedIn || !startTime) {
      swal({
        text: 'You have not punched in today.',
        icon: 'warning',
        type: 'warning',
      });
      return;
    }
  
    if (endTime) {
      swal({
        text: 'You have already punched out for today.',
        icon: 'warning',
        type: 'warning',
      });
      return;
    }
      const timestamp = new Date();
  
      swal({
      text: `You punched out at ${timestamp.toLocaleTimeString()}`,
      icon: 'success',
      type: 'success',
    }).then(() => {
      axios
        .post('http://localhost:2000/api/save-timestamp', { timestamp })
        .then((res) => {
          console.log('Timestamp saved successfully:', res.data);
          this.setState({ endTime: timestamp }, () => {
            // Store punch status in local storage
            localStorage.setItem('punchStatus', 'out');
          });
        })
        .catch((error) => {
          console.error('Error saving timestamp:', error);
        });
    });
  };
  
  
  componentDidMount() {
    // Retrieve punch status from local storage
    const punchStatus = localStorage.getItem('punchStatus');
  
    if (punchStatus === 'in') {
      this.setState({ isPunchedIn: true });
    } else if (punchStatus === 'out') {
      this.setState({ isPunchedIn: false });
    }
  }
  
  
  handlePunchInModalClose = () => {
  this.setState({ punchInModalOpen: false });
};



  constructor() {
    super();
    this.state = {
      token: '',
      openProductModal: false,
      openProductEditModal: false,
      id: '',
      email:'',
      pass:'',
      name: '',
      desg: '',
      joiningDate:'',
      dob:'',
      dept:'',
      gender:'',
      stat:'',
      mob: '',
      pre_addr:'',
      perm_addr:'',
      file: '',
      fileName: '',
      salary: '',  
      cv_link: '',
      emer_name: '',
      emer_mob: '',
      page: 1,
      search: '',
      products: [],
      pages: 0,
      loading: false,
      isPunchedIn: false,
      clockTime: null,
      attendanceData: [],
      error: null,
      attendanceData: [],
      error: '',
      showModal: false,
      isdoingOvertime:false,

      showWelcomeCard: true,
      //username: ''
    };
  }

  handleShowAttendanceReport = () => {
    axios
      .get('http://localhost:2000/api/attendance')
      .then(response => {
        this.setState({ attendanceData: response.data, error: null });
      })

      .catch(error => {
        console.error('Error fetching attendance data:', error);
        this.setState({ error: 'Failed to fetch attendance data' });
      });
  };

  componentDidMount = () => {
    let token = localStorage.getItem('token');
    if (!token) {
      // this.props.history.push('/login');
      this.props.navigate("/login");
    } else {
      this.setState({ token: token }, () => {
        this.getProduct();
      });
    }
  }

  
  handlePunchOut = () => {
    // Perform the punch out action
    this.setState({ showModal: false });
    // ...
  };

  handleContinueOvertime = () => {
    this.setState({ showModal: false, isDoingOvertime: true });
  };

  componentDidMount() {
    const shiftEnd = new Date();
    shiftEnd.setHours(13, 4, 0); //shift end time 
    const now = new Date();
    const hasPunchedIn = this.state.attendanceData.length > 0;

    if (now > shiftEnd) {
      this.setState({ showModal: true });
    }

    // Automatically punch out after 3 minutes
    setTimeout(() => {
      if (!this.state.isDoingOvertime) {
        this.handlePunchOut();
      }
    }, 1 * 60 * 1000);
  }

  startClock = () => {
    const startTime = new Date();
    this.setState({ clockTime: startTime });
  };
  
  stopClock = () => {
    const { clockTime } = this.state;
    if (clockTime) {
      const endTime = new Date();
      const duration = Math.abs(endTime - clockTime);
      const formattedDuration = new Date(duration).toISOString().substr(11, 8);
      console.log('Clock stopped:', formattedDuration);
      this.setState({ clockTime: null });
    }
  };
  






  getProduct = () => {
    
    this.setState({ loading: true });

    let data = '?';
    data = `${data}page=${this.state.page}`;
    if (this.state.search) {
      data = `${data}&search=${this.state.search}`;
    }
    axios.get(`http://localhost:2000/get-product${data}`, {
      headers: {
        'token': this.state.token
      }
    }).then((res) => {
      this.setState({ loading: false, products: res.data.products, pages: res.data.pages });
    }).catch((err) => {
      swal({
        text: err.response.data.errorMessage,
        icon: "error",
        type: "error"
      });
      this.setState({ loading: false, products: [], pages: 0 },()=>{});
    });
  }

  deleteProduct = (id) => {
    axios.post('http://localhost:2000/delete-product', {
      id: id
    }, {
      headers: {
        'Content-Type': 'application/json',
        'token': this.state.token
      }
    }).then((res) => {

      swal({
        text: res.data.title,
        icon: "success",
        type: "success"
      });

      this.setState({ page: 1 }, () => {
        this.pageChange(null, 1);
      });
    }).catch((err) => {
      swal({
        text: err.response.data.errorMessage,
        icon: "error",
        type: "error"
      });
    });
  }

  pageChange = (e, page) => {
    this.setState({ page: page }, () => {
      this.getProduct();
    });
  }

  logOut = () => {
    localStorage.setItem('token', null);
    // this.props.history.push('/');
    this.props.navigate("/");
  }

  onChange = (e) => {
    if (e.target.files && e.target.files[0] && e.target.files[0].name) {
      this.setState({ fileName: e.target.files[0].name }, () => { });
    }
    this.setState({ [e.target.name]: e.target.value }, () => { });
    if (e.target.name == 'search') {
      this.setState({ page: 1 }, () => {
        this.getProduct();
      });
    }
  };

  addProduct = () => {
    const fileInput = document.querySelector("#fileInput");
    const file = new FormData();
    file.append('file', fileInput.files[0]);
    file.append('email', this.state.email);
    file.append('pass', this.state.pass);    
    file.append('name', this.state.name);
    file.append('desg', this.state.desg);
    file.append('joiningDate', this.state.joiningDate);
    file.append('dob', this.state.dob);
    file.append('dept', this.state.dept);
    file.append('gender', this.state.gender);
    file.append('stat', this.state.stat);
    file.append('mob', this.state.mob);
    file.append('pre_addr', this.state.pre_addr);
    file.append('perm_addr', this.state.perm_addr);
    file.append('salary', this.state.salary);
    file.append('cv_link', this.state.cv_link);
    file.append('emer_name', this.state.emer_name);
    file.append('emer_mob', this.state.emer_mob);


    axios.post('http://localhost:2000/add-product', file, {
      headers: {
        'content-type': 'multipart/form-data',
        'token': this.state.token
      }
    }).then((res) => {

      swal({
        text: res.data.title,
        icon: "success",
        type: "success"
      });

      this.handleProductClose();
      this.setState({ email: '', pass: '', name: '', desg: '', joiningDate:'', dob:'', dept:'', gender:'', stat:'', mob: '', pre_addr: '', perm_addr: '', salary: '', cv_link: '', emer_name: '', emer_mob: '', file: null, page: 1 }, () => {
        this.getProduct();
      });
    }).catch((err) => {
      swal({
        text: err.response.data.errorMessage,
        icon: "error",
        type: "error"
      });
      this.handleProductClose();
    });

  }

  updateProduct = () => {
    const fileInput = document.querySelector("#fileInput");
    const file = new FormData();
    file.append('id', this.state.id);
    file.append('file', fileInput.files[0]);
    file.append('email', this.state.email);
    file.append('pass', this.state.pass);    
    file.append('name', this.state.name);
    file.append('desg', this.state.desg);
    file.append('joiningDate', this.state.joiningDate);
    file.append('dob', this.state.dob);
    file.append('dept', this.state.dept);
    file.append('gender', this.state.gender);
    file.append('stat', this.state.stat);
    file.append('mob', this.state.mob);
    file.append('pre_addr', this.state.pre_addr);
    file.append('perm_addr', this.state.perm_addr);
    file.append('salary', this.state.salary);
    file.append('emer_name', this.state.emer_name);
    file.append('emer_mob', this.state.emer_mob);
    file.append('cv_link', this.state.cv_link);

    axios.post('http://localhost:2000/update-product', file, {
      headers: {
        'content-type': 'multipart/form-data',
        'token': this.state.token
      }
    }).then((res) => {

      swal({
        text: res.data.title,
        icon: "success",
        type: "success"
      });

      this.handleProductEditClose();
      this.setState({ email: '', pass: '', name: '', desg: '', joiningDate:'', dob:'', dept:'', gender:'', stat:'', mob: '', pre_addr: '', perm_addr: '', salary: '', cv_link: '', emer_name: '', emer_mob: '', file: null }, () => {
       this.getProduct();
      });
    }).catch((err) => {
      swal({
        text: err.response.data.errorMessage,
        icon: "error",
        type: "error"
      });
      this.handleProductEditClose();
    });
  }

  handleProductOpen = () => {
    this.setState({
      openProductModal: true,
      id: '',
      email:'',
      pass:'',
      name: '',
      desg: '',
      joiningDate:'',
      dob:'',
      dept:'',
      gender:'',
      stat:'',
      mob: '',
      pre_addr:'',
      perm_addr:'',
      file: '',
      fileName: '',
      salary: '', 
      emer_name:'',
      emer_mob:'',
      cv_link: '', 
      page: 1,
      search: '',
      products: [],
      pages: 0,
      loading: false
    });
  };

  handleProductClose = () => {
    this.setState({ openProductModal: false });
  };

  handleProductEditOpen = (data) => {
    this.setState({
      openProductEditModal: true,
      id: data._id,
      email: data.email,
      pass: data.pass,
      name: data.name,
      desg: data.desg,
      joiningDate: data.joiningDate,
      dob: data.dob,
      dept: data.dept,
      gender: data.gender,
      stat: data.stat,
      mob: data.mob,
      pre_addr: data.pre_addr,
      perm_addr: data.perm_addr,
      salary: data.salary,
      emer_name: data.emer_name,
      emer_mob: data.emer_mob,
      cv_link: data.cv_link,
      fileName: data.image
    });
  };

  handleProductEditClose = () => {
    this.setState({ openProductEditModal: false });
  };

 render() {
    const { attendanceData, error } = this.state;
    const { isPunchedIn , endTime}=this.state;
    const { showModal } = this.state;

    console.log(attendanceData);
   
    return (
      <div>
       <Clock isPunchedIn={isPunchedIn} />
       <Button
       variant="contained" 
       color={ isPunchedIn ? 'secondary' : 'primary'}
        onClick={isPunchedIn ? this.handleTimePunchOut : this.handleTimePunchIn}
        disabled={isPunchedIn && endTime}
      >
        {isPunchedIn ? 'Time Punch Out' : 'Time Punch In'}
      </Button>

        {this.state.loading && <LinearProgress size={40} />}
        <div>
          <h2>Dashboard</h2>
          <Button
            className="button_style"
            variant="contained"
            color="primary"
            size="small"
            onClick={this.handleProductOpen}
          >
            Add Employee
          </Button>
          <Button
            className="button_style"
            variant="contained"
            size="small"
            color="secondary"
            onClick={this.logOut}
          >
            Log Out
          </Button>
        </div>

        {/* Edit Employee */}
        <Dialog
          open={this.state.openProductEditModal}
          onClose={this.handleProductClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Edit Employee</DialogTitle>
          <DialogContent>
          <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="email"
              value={this.state.email}
              onChange={this.onChange}
              placeholder="Employee Email"
              required
            /><br />

              <TextField
              id="standard-basic"
              type="password"
              autoComplete="off"
              name="pass"
              value={this.state.pass}
              onChange={this.onChange}
              placeholder="Employee Password"
              required
            /><br />

            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="name"
              value={this.state.name}
              onChange={this.onChange}
              placeholder="Employee Name"
              required
            /><br />
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="desg"
              value={this.state.desg}
              onChange={this.onChange}
              placeholder="Designation"
              required
            /><br /><br />
             <TextField
            id="standard-basic"
            type="date"
            autoComplete="off"
            name="joiningDate"
            value={this.state.joiningDate}
            onChange={this.onChange}
            label="Joining Date"
            required
            InputLabelProps={{
              shrink: true,
            }}
          /><br /><br />
             <TextField
            id="standard-basic"
            type="date"
            autoComplete="off"
            name="dob"
            value={this.state.dob}
            onChange={this.onChange}
            label="Date of Birth"
            required
            InputLabelProps={{
              shrink: true,
            }}
          /><br />

              <FormControl required>
              <InputLabel id="dept-label">Department</InputLabel>
              <Select
              labelId="dept-label"
              id="dept"
              name="dept"
              value={this.state.dept}
              onChange={this.onChange}
              >

                <MenuItem value="Development">Development</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Management">Management</MenuItem>
                </Select>
                </FormControl>
                <br></br>
                
                <FormControl required>
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={this.state.gender}
              onChange={this.onChange}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                </Select>
                </FormControl>
                <br></br>
                <FormControl required>
              <InputLabel id="stat-label">Status</InputLabel>
              <Select
              labelId="stat-label"
              id="stat"
              name="stat"
              value={this.state.stat}
              onChange={this.onChange}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
                </FormControl>
                <br></br>
                <TextField
              id="standard-basic"
              type="number"
              autoComplete="off"
              name="mob"
              value={this.state.mob}
              onChange={this.onChange}
              placeholder="Mobile no."
              required
            /><br />
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="pre_addr"
              value={this.state.pre_addr}
              onChange={this.onChange}
              placeholder="Present Address"
              required
            /><br />
            
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="perm_addr"
              value={this.state.perm_addr}
              onChange={this.onChange}
              placeholder="Permenant Address"
              required
            /><br />

            <TextField
              id="standard-basic"
              type="number"
              autoComplete="off"
              name="salary"
              value={this.state.salary}
              onChange={this.onChange}
              placeholder="Salary"
              required
            /><br />

            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="emer_name"
              value={this.state.emer_name}
              onChange={this.onChange}
              placeholder="Emergency Contact Name"
              required
            /><br />

              <TextField
              id="standard-basic"
              type="number"
              autoComplete="off"
              name="emer_mob"
              value={this.state.emer_mob}
              onChange={this.onChange}
              placeholder="Emergency Contact Mobile no."
              required
            /><br />
           
           <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="cv_link"
              value={this.state.cv_link}
              onChange={this.onChange}
              placeholder="Link of Resume/CV"
              required
            /><br />
                <br></br>
            <Button
              variant="contained"
              component="label"
            > Upload
            <input
                type="file"
                accept="image/*"
                name="file"
                value={this.state.file}
                onChange={this.onChange}
                id="fileInput"
                placeholder="File"
                hidden
                required
              />
            </Button>&nbsp;
            {this.state.fileName}
          </DialogContent>

          <DialogActions>
            <Button onClick={this.handleProductEditClose} color="primary">
              Cancel
            </Button>
            <Button
              disabled={this.state.name == '' || this.state.desg == '' || this.state.mob == '' || this.state.salary == '' || this.state.dob == '' || this.state.joiningDate == '' || this.state.gender == '' || this.emer_mob || this.emer_name }
              onClick={(e) => this.updateProduct()} color="primary" autoFocus>
              Edit Employee
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Employee */}
        <Dialog
          open={this.state.openProductModal}
          onClose={this.handleProductClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Add Employee</DialogTitle>
          <DialogContent>

          <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="email"
              value={this.state.email}
              onChange={this.onChange}
              placeholder="Employee Email"
              required
            /><br />

              <TextField
              id="standard-basic"
              type="password"
              autoComplete="off"
              name="pass"
              value={this.state.pass}
              onChange={this.onChange}
              placeholder="Employee Password"
              required
            /><br />

            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="name"
              value={this.state.name}
              onChange={this.onChange}
              placeholder="Employee Name"
              required
            /><br />
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="desg"
              value={this.state.desg}
              onChange={this.onChange}
              placeholder="Designation"
              required
            /><br /><br />
             <TextField
            id="standard-basic"
            type="date"
            autoComplete="off"
            name="joiningDate"
            value={this.state.joiningDate}
            onChange={this.onChange}
            label="Joining Date"
            required
            InputLabelProps={{
              shrink: true,
            }}
          /><br /><br />
             <TextField
            id="standard-basic"
            type="date"
            autoComplete="off"
            name="dob"
            value={this.state.dob}
            onChange={this.onChange}
            label="Date of Birth"
            required
            InputLabelProps={{
              shrink: true,
            }}
          /><br />

              <FormControl required>
              <InputLabel id="dept-label">Department</InputLabel>
              <Select
              labelId="dept-label"
              id="dept"
              name="dept"
              value={this.state.dept}
              onChange={this.onChange}
              >

                <MenuItem value="Development">Development</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Management">Management</MenuItem>
                </Select>
                </FormControl>
                <br></br>
                

                <FormControl required>
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={this.state.gender}
              onChange={this.onChange}
              >

                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                </Select>
                </FormControl>
                <br></br>
                <FormControl required>
              <InputLabel id="stat-label">Status</InputLabel>
              <Select
              labelId="stat-label"
              id="stat"
              name="stat"
              value={this.state.stat}
              onChange={this.onChange}
              >

                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
                </FormControl>
                <br></br>
                <TextField
              id="standard-basic"
              type="number"
              autoComplete="off"
              name="mob"
              value={this.state.mob}
              onChange={this.onChange}
              placeholder="Mobile no."
              required
            /><br />
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="pre_addr"
              value={this.state.pre_addr}
              onChange={this.onChange}
              placeholder="Present Address"
              required
            /><br />
            
            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="perm_addr"
              value={this.state.perm_addr}
              onChange={this.onChange}
              placeholder="Permenant Address"
              required
            /><br />

            <TextField
              id="standard-basic"
              type="number"
              autoComplete="off"
              name="salary"
              value={this.state.salary}
              onChange={this.onChange}
              placeholder="Salary"
              required
            /><br />

            <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="emer_name"
              value={this.state.emer_name}
              onChange={this.onChange}
              placeholder="Emergency Contact Name"
              required
            /><br />

            <TextField
              id="standard-basic"
              type="number"
              autoComplete="off"
              name="emer_mob"
              value={this.state.emer_mob}
              onChange={this.onChange}
              placeholder="Emergency Contact Mobile no."
              required
            /><br />
           
           <TextField
              id="standard-basic"
              type="text"
              autoComplete="off"
              name="cv_link"
              value={this.state.cv_link}
              onChange={this.onChange}
              placeholder="Link of Resume/CV"
              required
            /><br />
                <br></br>
            <Button
              variant="contained"
              component="label"
            > Upload
            <input
                type="file"
                accept="image/*"
                name="file"
                value={this.state.file}
                onChange={this.onChange}
                id="fileInput"
                placeholder="File"
                hidden
                required
              />
            </Button>&nbsp;
            {this.state.fileName}
          </DialogContent>

          <DialogActions>
            <Button onClick={this.handleProductClose} color="primary">
              Cancel
            </Button>

            <Button
              disabled={this.state.email === '' || this.state.pass === '' || this.state.name === '' || this.state.desg === '' || this.state.joiningDate === '' || this.state.dob === '' || this.state.dept === '' || this.state.gender === '' || this.state.gender === '' || this.state.stat === '' || this.state.mob === '' || this.state.pre_addr === '' || this.state.perm_addr === '' || this.state.salary === '' || this.state.cv_link === '' || this.state.emer_mob === '' || this.state.emer_name === '' || this.state.file === null}
              onClick={(e) => this.addProduct()} color="primary" autoFocus>
              Add New Employee
            </Button>

            
          </DialogActions>
        </Dialog>

        <br />

        <TableContainer>
          <TextField
            id="standard-basic"
            type="search"
            autoComplete="off"
            name="search"
            value={this.state.search}
            onChange={this.onChange}
            placeholder="Search Employee name"
            required
          />
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center"><b>Photograph</b></TableCell>
                <TableCell align="center"><b>Name</b></TableCell>
                <TableCell align="center"><b>Designation</b></TableCell>
                <TableCell align="center"><b>Department</b></TableCell>
                <TableCell align="center"><b>Email</b></TableCell>
                <TableCell align="center"><b>Password</b></TableCell>
                <TableCell align="center"><b>Mobile no.</b></TableCell>
                <TableCell align="center"><b>Present Address</b></TableCell>
                <TableCell align="center"><b>Permenant Address</b></TableCell>
                <TableCell align="center"><b>Gender</b></TableCell>
                <TableCell align="center"><b>Date of Birth</b></TableCell>
                <TableCell align="center"><b>Salary</b></TableCell>
                <TableCell align="center"><b>Joining Date</b></TableCell>
                <TableCell align="center"><b>Emergency Contact Name</b></TableCell>
                <TableCell align="center"><b>Emergency Contact Number</b></TableCell>
                <TableCell align="center"><b>Link for Resume/CV</b></TableCell>
                <TableCell align="center"><b>Status</b></TableCell>
              </TableRow>
            </TableHead>


            <TableBody>
              {this.state.products.map((row) => (
                <TableRow key={row.name}>
                  <TableCell align="center"><img src={`http://localhost:2000/${row.image}`} width="70" height="70" /></TableCell>
                  <TableCell align="center" component="th" scope="row">
                    {<i>{row.name}</i>}
                  </TableCell>
                  <TableCell align="center">{row.desg}</TableCell>
                  <TableCell align="center">{row.dept}</TableCell>
                  <TableCell align="center">{row.email}</TableCell>
                  <TableCell align="center">{row.pass}</TableCell>
                  <TableCell align="center">{row.mob}</TableCell>
                  <TableCell align="center">{row.pre_addr}</TableCell>
                  <TableCell align="center">{row.perm_addr}</TableCell>
                  <TableCell align="center">{row.gender}</TableCell>
                  <TableCell>{format(new Date(row.dob), 'dd/MM/yyyy')}</TableCell>  
                  <TableCell align="center">Rs. {row.salary}/=</TableCell>
                  <TableCell>{format(new Date(row.joiningDate), 'dd/MM/yyyy')}</TableCell>  
                  <TableCell align="center">{row.emer_name}</TableCell>
                  <TableCell align="center">{row.emer_mob}</TableCell>
                  <TableCell><a href={row.cv_link} target="_blank" rel="noopener noreferrer">CV/Resume</a></TableCell>
                  <TableCell align="center">
                    <Button
                      className="button_style"
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={(e) => this.handleProductEditOpen(row)}
                    >
                      EDIT
                  </Button>
                    <Button
                      className="button_style"
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={(e) => this.deleteProduct(row._id)}
                    >
                      Inactive
                  </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <br />
          <Pagination count={this.state.pages} page={this.state.page} onChange={this.pageChange} color="primary" />
        </TableContainer>

<br></br>
      <Button className="button_style"
            variant="contained"
            color="default"
            size="small"
            onClick={this.handleShowAttendanceReport}> Show Attendance Report</Button>

{error && <p>{error}</p>}
        {attendanceData.length > 0 && (
          <div>
            <h2>Attendance Report</h2>
            <table>
              <thead>
                <tr>
                  <th>Date:</th>
                  <th></th>
                  <th>Time Punch In:</th>
                  <th></th> {/* Break column */}
                  <th>Time Punch Out:</th>
                  <th></th>
                  <th>Duration:</th>
                  <th></th> {/* Break column */}
                  <th>Lateness:</th>
                  <th></th> {/* Break column */}
                  <th>Overtime:</th>
                  <th></th> {/* Break column */}
                  <th>Status:</th>
                </tr>
              </thead>
              <tbody>
              {attendanceData.map((timestamp) => {
                  const punchTimeIn = new Date(timestamp.timestamp);
                  const punchTimeOut = new Date(timestamp.timestamp_out);
                  const { duration, lateness, status, overtime } = this.calculateTimeMetrics(
                    punchTimeIn,
                    punchTimeOut
                  );

                  return (
                    <tr key={timestamp._id}>
                      <td>{format(punchTimeIn, 'dd/MM/yyyy')}</td>
                      <td></td>
                      <td>{format(punchTimeIn, 'hh:mm:ss a')}</td>
                      <td></td>
                      <td>{format(punchTimeOut, 'hh:mm:ss a')}</td>
                      <td></td>
                      <td>{duration}</td>
                      <td></td>
                      <td>{lateness}</td>
                      <td></td>
                      <td>{overtime}</td>
                      <td></td>
                      <td>{status}</td>
                      <td></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
         <Modal
         
          isOpen={showModal}
          contentLabel="Shift End"
          appElement={null}
        >
          <h2>Your shift time is over. Are you doing overtime?</h2>
          <button onClick={this.handleContinueOvertime}>Yes</button>
          <button onClick={this.handlePunchOut}>No</button>
        </Modal>
      </div>
    );
  }

  shouldShowModal = (status, punchTimeOut, shiftTimings) => {
    return punchTimeOut > shiftTimings.end;
  };

  calculateTimeMetrics = (punchTimeIn, punchTimeOut) => {
    const shiftTimings = {
      start: new Date(punchTimeIn.getFullYear(), punchTimeIn.getMonth(), punchTimeIn.getDate(), 12, 16, 0), //  shift start time
      end: new Date(punchTimeIn.getFullYear(), punchTimeIn.getMonth(), punchTimeIn.getDate(), 13, 4, 0) //  shift end time
    };
  
    const differenceInMinutesIn = differenceInMinutes(punchTimeIn, shiftTimings.start);
    const differenceInMinutesOut = differenceInMinutes(punchTimeOut, shiftTimings.end);
    const timeDiff = punchTimeOut.getTime() - punchTimeIn.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
  
    let duration = `${hours} hr : ${minutes} min`;
    let lateness = differenceInMinutesIn <= 0 ? 'On Time' : `${differenceInMinutesIn} mins late`;
    let status =
      differenceInMinutesIn > 0 ? 'Late' : differenceInMinutesOut > 30 ? 'Overtime' : 'On Time';
    let overtime =
      differenceInMinutes(punchTimeOut, shiftTimings.end) > 0
        ? `${differenceInMinutes(punchTimeOut, shiftTimings.end)} mins overtime`
        : '-';

       /* if (status === 'Late' && punchTimeOut > shiftTimings.end) {
          this.setState({ showModal: true });
        }
  */
    return { duration, lateness, status, overtime };
  };
}







  /*  calculateDuration = (punchTimeIn, punchTimeOut) => {
    const timeDiff = punchTimeOut.getTime() - punchTimeIn.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
   

    return `${hours} hr : ${minutes}min`;
  };
  calculateLateness = (punchTimeIn) => {
    const shiftTimings = {
      start: new Date(punchTimeIn.getFullYear(), punchTimeIn.getMonth(), punchTimeIn.getDate(), 9, 0, 0), // Replace with your shift start time
      end: new Date(punchTimeIn.getFullYear(), punchTimeIn.getMonth(), punchTimeIn.getDate(), 17, 0, 0) // Replace with your shift end time
    };

    const difference = differenceInMinutes(punchTimeIn, shiftTimings.start);

    if (difference <= 0) {
      return 'On Time';
    } else {
      return `${difference} minutes late`;
    }
  };


  calculateStatus = (punchTimeIn, punchTimeOut) => {
    const shiftTimings = {
      start: new Date(punchTimeIn.getFullYear(), punchTimeIn.getMonth(), punchTimeIn.getDate(), 10, 20, 0), // Shift start time
      end: new Date(punchTimeIn.getFullYear(), punchTimeIn.getMonth(), punchTimeIn.getDate(), 9, 45, 0) // shift end time
    };

    const differenceInMinutesIn = differenceInMinutes(punchTimeIn, shiftTimings.start);
    const differenceInMinutesOut = differenceInMinutes(punchTimeOut, shiftTimings.end);

    if (differenceInMinutesIn > 0) {
      return 'Late';
    } else if (differenceInMinutesOut > 30) {
      return 'Overtime';
    } else {
      return 'On Time';
    }
  };




  calculateOvertime = (punchTimeOut) => {
    const shiftTimings = {
      start: new Date(punchTimeOut.getFullYear(), punchTimeOut.getMonth(), punchTimeOut.getDate(), 9, 0, 0), //shift start time
      end: new Date(punchTimeOut.getFullYear(), punchTimeOut.getMonth(), punchTimeOut.getDate(), 17, 0, 0) //shift end time
    };

    const difference = differenceInMinutes(punchTimeOut, shiftTimings.end);

    if (difference <= 0) {
      return 'No Overtime';
    } else {
      const hours = Math.floor(difference / 60);
      const minutes = difference % 60;
      return `${minutes} minutes overtime`;
    }
  };
*/








export default withRouter(Dashboard);       
