import React, { Component } from 'react';
import {
  Button, TextField, Dialog, DialogActions, LinearProgress,
  DialogTitle, DialogContent, TableBody, Table,
  TableContainer, TableHead, TableRow, TableCell, FormControl, InputLabel, Select, MenuItem
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import swal from 'sweetalert';
import { withRouter } from './utils';
const axios = require('axios');

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      token: '',
      openProductModal: false,
      openProductEditModal: false,
      id: '',
      email:'',
      password:'',
      name: '',
      desg: '',
      joiningDate:'',
      dateOfBirth:'',
      dept:'',
      gender:'',
      status:'',
      mob: '',
      pre_address:'',
      perm_address:'',
      file: '',
      fileName: '',
      salary: '',  
      page: 1,
      search: '',
      products: [],
      pages: 0,
      loading: false

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
    file.append('name', this.state.name);
    file.append('desg', this.state.desg);
    file.append('mob', this.state.mob);
    file.append('salary', this.state.salary);
    file.append('joiningDate', this.state.joiningDate);
    file.append('dateOfBirth', this.state.dateOfBirth);
    file.append('gender', this.state.gender);

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
      this.setState({ name: '', desg: '', mob: '', salary: '',joiningDate:'', dateOfBirth:'',gender:'', file: null, page: 1 }, () => {
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
    file.append('name', this.state.name);
    file.append('desg', this.state.desg);
    file.append('mob', this.state.mob);
    file.append('salary', this.state.salary);
    file.append('joiningDate', this.state.joiningDate);
    file.append('dateOfBirth',this.state.dateOfBirth);
    file.append('gender', this.state.gender);

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
      this.setState({ name: '', desg: '', mob: '', salary: '', joiningDate:'', dateOfBirth: '', gender: '', file: null }, () => {
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
      name: '',
      desg: '',
      salary: '',
      mob: '',
      fileName: '',
      joiningDate: '',
      dateOfBirth: '',
      gender: ''
    });
  };

  handleProductClose = () => {
    this.setState({ openProductModal: false });
  };

  handleProductEditOpen = (data) => {
    this.setState({
      openProductEditModal: true,
      id: data._id,
      name: data.name,
      desg: data.desg,
      salary: data.salary,
      mob: data.mob,
      joiningDate: data.joiningDate,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      fileName: data.image
    });
  };

  handleProductEditClose = () => {
    this.setState({ openProductEditModal: false });
  };

  render() {
    return (
      <div>
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
            type="date"
            autoComplete="off"
            name="joiningDate"
            value={this.state.joiningDate}
            onChange={this.onChange}
            placeholder="Joining Date"
            required
            /><br />
            <TextField
            id="standard-basic"
            type="date"
            autoComplete="off"
            name="dateOfBirth"
            value={this.state.dateOfBirth}
            onChange={this.onChange}
            placeholder="Date of Birth"
            required
            /><br />
            <FormControl required>
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={this.state.gender}
              onChange={this.onChange}
              >

                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                </Select>
                </FormControl>
                <br></br>
                    
            <br /><br />
            
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
              />
            </Button>&nbsp;
            {this.state.fileName}
          </DialogContent>

          <DialogActions>
            <Button onClick={this.handleProductEditClose} color="primary">
              Cancel
            </Button>
            <Button
              disabled={this.state.name == '' || this.state.desg == '' || this.state.mob == '' || this.state.salary == '' || this.state.dateOfBirth == '' || this.state.joiningDate == '' || this.state.gender == ''}
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
            type="date"
            autoComplete="off"
            name="joiningDate"
            value={this.state.joiningDate}
            onChange={this.onChange}
            placeholder="Joining Date"
            required
            /><br />
            <TextField
            id="standard-basic"
            type="date"
            autoComplete="off"
            name="dateOfBirth"
            value={this.state.dateOfBirth}
            onChange={this.onChange}
            placeholder="Date of Birth"
            required
            /><br />
            <FormControl required>
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={this.state.gender}
              onChange={this.onChange}
              >

                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                </Select>
                </FormControl>
                <br></br>
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
              disabled={this.state.name == '' || this.state.desg == '' || this.state.mob == '' || this.state.salary == '' || this.state.dateOfBirth == '' || this.state.joiningDate == '' || this.state.gender == '' || this.state.file == null}
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


*/}
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
                <TableCell align="center">Name</TableCell>
                <TableCell align="center">Photograph</TableCell>
                <TableCell align="center">Designation</TableCell>
                <TableCell align="center">Salary</TableCell>
                <TableCell align="center">Mobile no.</TableCell>
                <TableCell align="center">Joining Date</TableCell>
                <TableCell align="center">Date of Birth</TableCell>
                <TableCell align="center">Gender</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.state.products.map((row) => (
                <TableRow key={row.name}>
                  <TableCell align="center" component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell align="center"><img src={`http://localhost:2000/${row.image}`} width="70" height="70" /></TableCell>
                  <TableCell align="center">{row.desg}</TableCell>
                  <TableCell align="center">{row.salary}</TableCell>
                  <TableCell align="center">{row.mob}</TableCell>
                  <TableCell align="center">{row.joiningDate}</TableCell>
                  <TableCell align="center">{row.dateOfBirth}</TableCell>
                  <TableCell align="center">{row.gender}</TableCell>
                  <TableCell align="center">
                    <Button
                      className="button_style"
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={(e) => this.handleProductEditOpen(row)}
                    >
                      Edit
                  </Button>
                    <Button
                      className="button_style"
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={(e) => this.deleteProduct(row._id)}
                    >
                      Delete
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