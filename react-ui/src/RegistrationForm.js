import React, {Component} from 'react';
import axios from 'axios';
import $ from 'jquery';
import regForm from './static/regForm.jpg';
import './static/RegistrationForm.css';
import './static/Loaders.css';
import uuid from 'uuid/v4';

class RegistrationForm extends Component {
    constructor(props) {
        super(props);
		this.state = {
			username: "",
			isLoading: false,
			orgname: "parent",
			token: {},
			message: "",
			registered: false
		};
		this.tokensObj = {};
		this.handleChange = this.handleChange.bind(this);
		this.handleRegister = this.handleRegister.bind(this);
		this.handleSetup = this.handleSetup.bind(this);
		this.handleSetupChild = this.handleSetupChild.bind(this);
    }

    componentDidMount(){
        var background = 'url(' + regForm + ')';
        console.log("Inside component did mount")
        $('body').css('background-image', background);
        $('body').css('background-position', 'center');
        $('body').css('background-repeat', 'no-repeat');
        $('body').css('background-size', 'cover');
    }

    handleChange(e) {
        this.setState({[e.target.name]: e.target.value})
    }

    async handleRegister(e) {
        e.preventDefault();

		this.setState({
			isLoading: true
		});

		let response = await axios.post('http://localhost:4000/users', {
			username: `${
				this.state['username']
				}`,
			orgName: `${
				this.state['orgname']
				}`
		});
		console.log(response);
		this.setState(st => {
			return ({ message: st.message + `${response.data.message} ✅\n` })
		});
		this.tokensObj["token"] = response.data.token;

		console.log(this.tokensObj);
		this.setState({
			token: this.tokensObj,
			isLoading: false
		}, () =>
			window.localStorage.setItem("token", JSON.stringify(this.state.token["token"]))
		);
		if (this.state.orgname === "child") {
			window.localStorage.setItem("username", this.state.username)
		}
        this.props.addTokens(this.tokensObj);
    }

    async handleSetup(e) {
        e.preventDefault();

		this.setState({
			isLoading: true,
			message: ""
		});

		// CREATE Axios instance with suitable configurations
		const instance = axios.create({
			baseURL: 'http://localhost:4000',
			// baseURL: 'http://192.168.0.102:4000',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${
					this.tokensObj['token']
					}`
			}
		});

		// Creating Channel
		if (this.state.orgname === 'parent') {
			let response = await instance.post('/channels', {
				"channelName": "mychannelpc",
				"channelConfigPath": "../../channel-artifacts/channel.tx"
			});
			console.log(response);
			this.setState({ message: response.data.message + " ✅\n" });
		}

		// Join peers to channel
		let result = await this.joinChannel(instance);
		console.log(result);

		// Update anchor peers
		result = await this.updateAnchorPeers(instance);
		console.log(result);

		// Install chaincode on parent organization
		result = await this.installChaincode(instance);
		console.log(result);

		// Instantiating chaincode on channel
		if (this.state.orgname === 'parent') {
			let response = await instance.post('/channels/mychannelpc/chaincodes', {
				'peers': ['peer0.parent.example.com'],
				'chaincodeName': 'rewardv1',
				'chaincodeVersion': '1.0',
				'chaincodeType': 'node',
				'args': ['init']
			});
			console.log(response);
			this.setState(st => {
				return ({ message: st.message + `${response.data.message} ✅\n` })
			});
		}

        this.setState({registered: true})
        
        this.props.history.push({
            pathname: '/parent',
            state: this.state.tokens
          });
    }

	async handleSetupChild(e){
		e.preventDefault();

		this.setState({
			isLoading: true,
			message: ""
		});

		// CREATE Axios instance with suitable configurations
		const instance = axios.create({
			baseURL: 'http://localhost:4000',
			// baseURL: 'http://192.168.0.102:4000',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${
					this.tokensObj['token']
					}`
			}
		});

		// Join peers to channel
		let result = await this.joinChannel(instance);
		console.log(result);

		// Update anchor peers
		result = await this.updateAnchorPeers(instance);
		console.log(result);

		// Install chaincode on child organization
		result = await this.installChaincode(instance);
		console.log(result);

		this.props.history.push({
            pathname: '/child',
            state: this.state.tokens
          });
	}

    async joinChannel(instance) {
		let response = await instance.post('/channels/mychannelpc/peers', {
			'peers': [`peer0.${
				this.state.orgname
				}.example.com`]
		}, {
			headers: {
				Authorization: `Bearer ${
					this.tokensObj['token']
					}`
			}
		});
		console.log(response);
		this.setState(st => {
			return ({ message: st.message + `${response.data.message} ✅\n` })
		});
		return true;
	}

    async updateAnchorPeers(instance) {

		let response = await instance.post('/channels/mychannelpc/anchorpeers', {
			'configUpdatePath': `../../channel-artifacts/${this.state.orgname}anchors.tx`
		}, {
			headers: {
				Authorization: `Bearer ${this.tokensObj['token']}`
			}
		});
		console.log(response);
		this.setState(st => {
			return ({ message: st.message + `${response.data.message} ✅\n` })
		});

		return true;
	}

    async installChaincode(instance) {
		let response = await instance.post('/chaincodes', {
			'peers': [`peer0.${
				this.state.orgname
				}.example.com`],
			'chaincodeName': 'rewardv1',
			'chaincodePath': './chaincode/chain_reward',
			'chaincodeType': 'node',
			'chaincodeVersion': '1.0'
		}, {
			headers: {
				Authorization: `Bearer ${
					this.tokensObj['token']
					}`
			}
		});
		console.log(response);
		this.setState(st => {
			return ({ message: st.message + `${response.data.message} ✅\n` })
		});
		return true;
	}

    render() {
        const regForm = (
			<div className="RegistrationForm">
				<div className="form-container">
					<div className="header">
						<h1>Registration Form</h1>
					</div>

					<form onSubmit={this.handleRegister}>

						<div className="form-group">
							<div className="input-group">
								<label htmlFor="username">Username
                                    <span>*</span>
								</label>
								<input id="username" name="username" placeholder="Username"
									value={
										this.state.username
									}
									onChange={this.handleChange} />
							</div>
							<div className="input-group">
								<label htmlFor="orgname">Choose a orgname type:</label>
								<select name="orgname" onChange={this.handleChange}>
									<option value="parent">Parent</option>
									<option value="child">Child</option>
								</select>
							</div>
						</div>
						{
							this.state.isLoading ?
								(
									<div>
										<div className="loader-39" />
										<br />
										{
											this.state.message !== "" && this.state.message.split("\n").map(m => {
												return (
													m !== "" && <div key={uuid()} className="message">{m}</div>
												);
											})
										}
									</div>
								) :
								<button className="submit" type="submit">Register Now</button>
						}
					</form>
				</div>
			</div>
		);

        const setup = (
			<div className="RegistrationForm">
				<div className="form-container">
					<div className="header">
						<h1>Set Up Network</h1>
					</div>
					<form onSubmit={this.state.orgname === "parent" ? this.handleSetup : this.handleSetupChild}>
						{
							this.state.isLoading ?
								<div>
									<div className="loader-39" />
									<br />
									{
										this.state.message !== "" && this.state.message.split("\n").map(m => {
											return (
												m !== "" && <div key={uuid()} className="message">{m}</div>
											);
										})
									}
								</div> :
								<button className="submit" type="submit">Set Up Network</button>
						}
					</form>
				</div>
			</div>
		); 

        return (
            <div> 
                {this.state.token["token"] === undefined && !this.state.registered? regForm : setup}
                {/* {setup} */}
                {/* {this.props.tokens.airport === undefined ? regForm : setup} */}
            </div>
        );
    }
}

export default RegistrationForm;
