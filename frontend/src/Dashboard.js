import React, { Component, useState, useEffect } from 'react';
import {
  Button, TextField, Dialog, DialogActions, LinearProgress,
  DialogTitle, DialogContent, TableBody, Table,
  TableContainer, TableHead, TableRow, TableCell, FormControl, InputLabel, Select, MenuItem
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import swal from 'sweetalert';
import { withRouter } from './utils';
import { format } from 'date-fns';
import Modal from 'react-modal';

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
      
    } else {
      
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

  return (
    <div>
      {startTime && <p>Start Time: {format(startTime, 'hh:mm:ss a')}</p>}
      {endTime && <p>End Time: {format(endTime, 'hh:mm:ss a')}</p>}
      {duration && <p>Duration: {duration}</p>}
    </div>
  );
};




class Dashboard extends Component {


  
  

  
  handleTimePunchIn = () => {
    const timestamp  = new Date();
    const { isPunchedIn } = this.state;

    const endpoint = isPunchedIn ? 'punch-out' : 'punch-in';
  
    axios
      .post('http://localhost:2000/api/save-timestamp', { timestamp })
      .then((res) => {
        console.log('Timestamp saved successfully:', res.data);
        // Perform any additional actions upon successful save

        const action = isPunchedIn ? 'punched out' : 'punched in';

        swal({
          text: `You ${action} at ${ timestamp.toLocaleTimeString() }`,
          icon: "success",
          type: "success"
        });

        this.setState({ isPunchedIn: !isPunchedIn});
      })
      .catch((error) => {
        console.error('Error saving timestamp:', error);
        // Handle the error if needed
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

      showWelcomeCard: true,
      //username: ''
    };
  }

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

    const { isPunchedIn }=this.state;

    return (
      <div>
         <Clock isPunchedIn={isPunchedIn} />
  <Button variant="contained" color={ isPunchedIn ? 'secondary' : 'primary'} onClick={this.handleTimePunchIn}> {isPunchedIn ? "Time Punch Out" : "Time Punch In"}
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
              disabled={this.state.email == '' || this.state.pass == '' || this.state.name == '' || this.state.desg == '' || this.state.joiningDate == '' || this.state.dob == '' || this.state.dept == '' || this.state.gender == '' || this.state.gender == '' || this.state.stat == '' || this.state.mob == '' || this.state.pre_addr == '' || this.state.perm_addr == '' || this.state.salary == '' || this.state.cv_link == '' || this.state.emer_mob == '' || this.state.emer_name == '' || this.state.file == null}
              onClick={(e) => this.addProduct()} color="primary" autoFocus>
              Add New Employee
            </Button>

            {/*<Button
  className="button_style"
  variant="contained"
  color="primary"
  size="small"

  disabled={
    this.state.name === '' ||
    this.state.role === '' ||
    this.state.mob === '' ||
    this.state.salary === '' ||
    this.state.joiningDate === '' ||
    this.state.dateOfBirth === '' ||
    this.state.gender === '' ||
    this.state.file === null
  }

  onClick={(e) => this.addProduct()}
>
  Add Employee Data 
</Button>


*/

}
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

      </div>
    );
  }
}


export default withRouter(Dashboard);

