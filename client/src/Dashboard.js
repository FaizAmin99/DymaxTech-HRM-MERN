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
import { writeFile } from 'xlsx';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { startTransition } from 'react';
import axios from 'axios';


//const axios = require('axios');



const Clock = ({ isPunchedIn }) => {
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {

    // POP UP Trigger
    const triggerTime = calculateTriggerTime();
    const timeDifference = triggerTime.getTime() - new Date().getTime();
    const timerId = setTimeout(() => {
    showPopUp();
    }, timeDifference);

   

    if (isPunchedIn) {
     setStartTime(new Date());
      setEndTime(null);
      setDuration(null);
      
    } else if (!isPunchedIn && startTime){
      
        setEndTime(new Date());
      
    }
    return () => clearTimeout(timerId);

  
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

const showPopUp = () => {
  alert('POP-UP: Go Home! Shift time is over...');
};

const calculateTriggerTime = () => {
  const now = new Date();
  const nineAM = new Date(now);
  nineAM.setHours(2, 11, 0);
  
  const eightHoursLater = new Date(nineAM);
  eightHoursLater.setHours(eightHoursLater.getHours() + 9);

  return eightHoursLater;
};

class Dashboard extends Component {
  
  shouldShowModal = (status, punchTimeOut, shiftTimings) => {
    if (status === 'OUT') {
      // Check if the current time is greater than or equal to the punchTimeOut
      const currentTime = new Date();
      return currentTime >= new Date(punchTimeOut);
    } else if (status === 'IN') {
      // Modify the shift end time here (e.g., set it to 5:00 PM)
      shiftTimings.end = new Date(shiftTimings.start.getFullYear(), shiftTimings.start.getMonth(), shiftTimings.start.getDate(), 11, 31, 0); 
  
      // Check if the current time is greater than or equal to the updated shiftTimings
      const currentTime = new Date();
      return currentTime >= shiftTimings.end;
    } else if (status === 'OVERTIME') {
      const currentTime = new Date();
      return currentTime >= shiftTimings.end;
    }
    return false;
  };

  exportToExcel = () => {
    const { attendanceData } = this.state;
    const { username, name, Email } = this.props; // Assuming the user information is passed via props
  
    const formatDate = (date) => format(new Date(date), 'dd/MM/yyyy');
    const formatTime = (time) => format(new Date(time), 'hh:mm:ss a');
  
    const worksheetData = [
      ['Name:', this.state.username],
      [],
      ['Date', 'Time Punch In', 'Time Punch Out', 'Duration', 'Lateness', 'Overtime', 'Status'],
      [],
      ...attendanceData.map((timestamp) => {
        const punchTimeIn = new Date(timestamp.timestamp);
        const punchTimeOut = new Date(timestamp.timestamp_out);
        const { duration, lateness, status, overtime } = this.calculateTimeMetrics(punchTimeIn, punchTimeOut);
  
        return [
          formatDate(punchTimeIn),
          formatTime(punchTimeIn),
          formatTime(punchTimeOut),
          duration,
          lateness,
          overtime,
          status,
        ];
      }),
    ];
  
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
  
    const currentDate = new Date().toISOString().slice(0, 10);
    const fileName = `Attendance_Report_${currentDate}.xlsx`;
  
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary', bookSST: true });
  
    const s2ab = (s) => {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xff;
      }
      return buf;
    };
  
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
  
    if (window.navigator.msSaveOrOpenBlob) { 
      window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    }
  };
  
  


 handleTimePunchIn = () => {
 const { isPunchedIn, endTime } = this.state;

 this.setState({ status: 'IN' });
  
    if (isPunchedIn) {
      swal({
        text: 'You have already punched in for today.',
        icon: 'warning',
        title: 'Warning!',
      });
      return;
    }
 


    const timestamp = new Date();

    var current_user = JSON.stringify(localStorage.getItem('username'))
    current_user = current_user.replace(/['"]+/g, '');

    let time_data = {
      user: current_user,
      timestamp: timestamp
    }

  
    axios.post('http://localhost:2000/api/save-timestamp', { time_data })
      .then((res) => {
        console.log('Timestamp saved successfully:', res.data);
        const action = 'punched in';
        swal({
          text: `You ${action} at ${timestamp.toLocaleTimeString()}`,
          icon: 'success',
          title: 'Success!',
          timer:2500,
          closeOnClickOutside: false,
          button: false,
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
    this.setState({ status: 'OUT' });
    const currentTime = new Date();
    this.setState({ punchTimeOut: currentTime });

  
    if (!isPunchedIn || !startTime) {
      swal({
        text: 'You have not punched in today.',
        icon: 'warning',
        title: 'Warning!',
      });
      return;
    }
  
    if (endTime) {
      swal({
        text: 'You have already punched out for today.',
        icon: 'warning',
        title: 'Warning!',
      });
      return;
    }
      const timestamp = new Date();
  
      var current_user2 = JSON.stringify(localStorage.getItem('username'))
      current_user2 = current_user2.replace(/['"]+/g, '');

      let time_data = {
        user: current_user2,
        timestamp: timestamp
      }

      swal({
      text: `You punched out at ${timestamp.toLocaleTimeString()}`,
      icon: 'success',
      title: 'Success!',
      button: false,
      closeOnClickOutside: false,
      timer:2500,
      
    }).then(() => {
      axios
        .post('http://localhost:2000/api/save-timestamp', { time_data })
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
      error: '',
      showModal: false,
      isdoingOvertime:false,
      status: 'OUT', // Initialize with appropriate default value if needed
      loggedInUsername: localStorage.getItem("username"),
      punchTimeOut: new Date(), // Initialize with appropriate default value if needed
      shiftTimings: {
      start: new Date(),
      end: new Date()
      },
      showWelcomeCard: true,
      sortByDate: 'asc',
      sortByStatus: 'asc',
      sortBy:'',
      sortOrder: ''
    };
  }

  handleSortByDate = () => {
    const newSortByDate = this.state.sortByDate === 'asc' ? 'desc' : 'asc';
    console.log('Sorting by date:', newSortByDate);
    this.setState({ sortByDate: newSortByDate });
  };

  handleSortByStatus = () => {
    const newSortByStatus = this.state.sortByStatus === 'asc' ? 'desc' : 'asc';
    this.setState({ sortByStatus: newSortByStatus });
  };

  handleSortChange = (event) => {
    const sortBy = event.target.value;
    this.setState({ sortBy });
  };

  handleSortOrderChange = (event) => {
    const sortOrder = event.target.value;
    this.setState({ sortOrder });
  };

  handleShowAttendanceReport = () => {
    axios
      .get('http://localhost:2000/api/attendance')
      .then(response => {

        var logged_in_user = localStorage.getItem('username');
        const filteredAttendanceData = response.data.filter(entry => entry.user === logged_in_user);
        this.setState({ attendanceData: filteredAttendanceData, error: null });
      })

      .catch(error => {
        console.error('Error fetching attendance data:', error);
        this.setState({ error: 'Failed to fetch attendance data' });
      });
  };

  componentDidMount = () => {
    let token = localStorage.getItem('token');
    let username = localStorage.getItem('username');
    if (!token) {
      this.props.navigate("/login");
    } else {
      this.setState({ token: token, loggedInUsername: username }, () => {
        this.handleShowAttendanceReport();
        this.getProduct();
      });
    }      
  }

  componentDidMount() {
    this.setupTimer();
  }

  componentWillUnmount() {
    this.clearTimer();
  }
 
  setupTimer() {
    const triggerTime = this.calculateTriggerTime();
    const timeDifference = triggerTime.getTime() - new Date().getTime();
    this.timerId = setTimeout(() => {
      this.showDialog();
    }, timeDifference);
  }

  clearTimer() {
    clearTimeout(this.timerId);
  }

  calculateTriggerTime() {

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
        title: "Error!"
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
        title: "Success!"
      });

      this.setState({ page: 1 }, () => {
        this.pageChange(null, 1);
      });
    }).catch((err) => {
      swal({
        text: err.response.data.errorMessage,
        icon: "error",
        title: "Error!"
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
        title: "Success!"
      });

      this.handleProductClose();
      this.setState({ email: '', pass: '', name: '', desg: '', joiningDate:'', dob:'', dept:'', gender:'', stat:'', mob: '', pre_addr: '', perm_addr: '', salary: '', cv_link: '', emer_name: '', emer_mob: '', file: null, page: 1 }, () => {
        this.getProduct();
      });
    }).catch((err) => {
      swal({
        text: err.response.data.errorMessage,
        icon: "error",
        title: "Error!"
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
        title: "Success!"
      });

      this.handleProductEditClose();
      this.setState({ email: '', pass: '', name: '', desg: '', joiningDate:'', dob:'', dept:'', gender:'', stat:'', mob: '', pre_addr: '', perm_addr: '', salary: '', cv_link: '', emer_name: '', emer_mob: '', file: null }, () => {
       this.getProduct();
      });
    }).catch((err) => {
      swal({
        text: err.response.data.errorMessage,
        icon: "error",
        title: "Error!"
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
    const { attendanceData, error, sortBy, sortOrder, loggedInUsername } = this.state;
    const { isPunchedIn , endTime}=this.state;
    const { showModal } = this.state;
    //const status = this.state.status; 
    const punchTimeOut = this.state.punchTimeOut;
    const shiftTimings = this.state.shiftTimings;
    const status = isPunchedIn ? 'IN' : 'OUT';
    const shouldShowModal = this.shouldShowModal(status, this.state.endTime, this.state.shiftTimings);
    const usernameWithoutSuffix = loggedInUsername.replace('@dymaxtech.com', ' ');


    //console.log('Status: ',this.state.status);
    //console.log('punchTimeOut: ', punchTimeOut);
    //console.log('shiftTimings: ', shiftTimings);

    const sortedData = [...attendanceData];
    if (sortBy === 'date') {
      sortedData.sort((a, b) => {
        if (sortOrder === 'asc') {
          return new Date(a.timestamp) - new Date(b.timestamp);
        } else {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
      });
    } else if (sortBy === 'status') {
      sortedData.sort((a, b) => {
        const statuses = ['Late', 'On Time', 'Overtime'];
        if (sortOrder === 'asc') {
          return statuses.indexOf(a.status) - statuses.indexOf(b.status);
        } else {
          return statuses.indexOf(b.status) - statuses.indexOf(a.status);
        }
      });
    } else if (sortBy === 'status') {
      sortedData.sort((a,b) => {
        const statuses = { 'On Time': 1, Late: 2, Overtime: 3};
        return statuses[a.status] - statuses[b.status];
      })
    }

    return (
      <div>
       <Clock isPunchedIn={isPunchedIn} />
      

    
       <Button
       variant="contained" 
       color={ isPunchedIn ? 'secondary' : 'primary'}
        onClick={isPunchedIn ? this.handleTimePunchOut : this.handleTimePunchIn}
        disabled={Boolean(isPunchedIn && endTime)}
      >
        {isPunchedIn ? 'Time Punch Out' : 'Time Punch In'}
      </Button>

        {/* Render the "Shift End" modal */}
        
        {this.shouldShowModal(status, punchTimeOut, shiftTimings) && (
          <Dialog
            open={this.state.showModal}
            onClose={() => this.hideDialog()}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">Shift End</DialogTitle>
            <DialogContent>
              <p>BRO Go Home! Shift is over</p>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => this.hideDialog()}
                color="primary"
                autoFocus>
                OK
              </Button>
            </DialogActions>
          </Dialog>
        )}


        {this.state.loading && <LinearProgress size={40} />}
        <div>
          <div className='welcome-box'>
          <h2>Welcome, {usernameWithoutSuffix}</h2>
          </div>
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
              
            <Button className="button_style"
            variant="contained"
            color="default"
            size="small"
              onClick={this.exportToExcel}>Export Attendance Report</Button>

        {error && <p>{error}</p>}
        {attendanceData.length > 0 && (
          <div>
            <h2>Attendance Report</h2>
  <Select
  className='select_style'
  value= {sortBy}
  onChange={this.handleSortChange}
  displayEmpty
  >
    <MenuItem value="">Sort By:</MenuItem>
    <MenuItem value="date">Date:</MenuItem>
    <MenuItem value="status">Status:</MenuItem>
    </Select>

  {sortBy === 'date' ? (
  <Select
    className='select_style'
    value={sortOrder}
    onChange={this.handleSortOrderChange}
    >     
      <MenuItem value="asc">Ascending</MenuItem>
      <MenuItem value="desc">Descending</MenuItem>
    </Select>
      ): (
    <Select
    className='select_style'
    value={sortOrder}
    onChange={this.handleSortOrderChange}
    >
      <MenuItem value="onTime">On Time</MenuItem>
      <MenuItem value="late">Late</MenuItem>
      <MenuItem value="overtime">OverTime</MenuItem>
    </Select>

      )}
            <table>
              <thead>
                <tr>
                  <th>Date:</th>
                  <th></th>
                  <th>Time Punch In:</th>
                  <th></th> 
                  <th>Time Punch Out:</th>
                  <th></th>
                  <th>Duration:</th>
                  <th></th> 
                  <th>Lateness:</th>
                  <th></th> 
                  <th>Overtime:</th>
                  <th></th>
                  <th>Status:</th>
                </tr>
              </thead>
              <tbody>
              {sortedData.map((timestamp) => {
                  let user = timestamp.user;
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
      </div>
    );
  }

   calculateTimeMetrics = (punchTimeIn, punchTimeOut) => {
    const shiftTimings = {
      start: new Date(punchTimeIn.getFullYear(), punchTimeIn.getMonth(), punchTimeIn.getDate(), 12, 35, 0), //  shift start time
      end: new Date(punchTimeIn.getFullYear(), punchTimeIn.getMonth(), punchTimeIn.getDate(), 11, 28, 0) //  shift end time
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

    return { duration, lateness, status, overtime };
  };
}

export default withRouter(Dashboard);