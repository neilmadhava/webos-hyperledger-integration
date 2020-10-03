import React, { Component } from 'react'
import axios from 'axios';
import './static/RegistrationForm.css';

class Child extends Component{
    static defaultProps = {
        token: JSON.parse(window.localStorage.getItem("token")) || "",
        username: window.localStorage.getItem("username")
    }

    constructor(props) {
		super(props);
		this.state = {
            message: "",
            child: "",
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleYoutube = this.handleYoutube.bind(this);
        this.handleAmazon = this.handleAmazon.bind(this);
    }

    handleChange(e) {
		this.setState({ [e.target.name]: e.target.value })
    }

    async handleYoutube(e){
        e.preventDefault();

        const instance = axios.create({
            baseURL: 'http://localhost:4000',
            // baseURL: 'http://192.168.0.100:4000',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${
                    this.props.token
                }`
            }
        });

        let url = "/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readChild&args=%5B%22"+this.props.username+"%22%5D";
        
        let response = await instance.get(url);
        console.log(response.data["coins"]);

        let amt = response.data["coins"]
        if ( amt < 50){
            this.setState({ messageAccess: "Insufficient Funds!" });
        }
        else {
            this.setState({ messageAccess: "Your balance is: " + amt + "\nWatch time: " + amt + " mins" });
        }

    }

    async handleAmazon(e){
        e.preventDefault();

        const instance = axios.create({
            baseURL: 'http://localhost:4000',
            // baseURL: 'http://192.168.0.100:4000',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${
                    this.props.token
                }`
            }
        });

        let url = "/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readChild&args=%5B%22"+this.props.username+"%22%5D";
        
        let response = await instance.get(url);
        console.log(response.data["coins"]);

        let amt = response.data["coins"]
        if ( amt < 100){
            this.setState({ messageAccess: "Insufficient Funds!" });
        }
        else {
            this.setState({ messageAccess: "Your balance is: " + amt + "\nWatch time: " + amt + " mins" });
        }

    }

    async handleSubmit(e) {
        e.preventDefault();

        const instance = axios.create({
            baseURL: 'http://localhost:4000',
            // baseURL: 'http://192.168.0.100:4000',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${
                    this.props.token
                }`
            }
        });

        let url = "/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readChild&args=%5B%22"+this.props.username+"%22%5D";
        
        let response = await instance.get(url);
        console.log(response.data["coins"]);

        this.setState({ message: response.data["coins"].toString() });
    }

    render(){
        const query = (
            <div className="RegistrationForm">
				<div className="form-container">
					<div className="header">
						<h1>Child Homepage</h1>
					</div>

                    <form onSubmit={this.handleSubmit}> 
						<div className="form-group">
							<div className="input-group">
								<label htmlFor="child">Your Cryptocurrency
                                <span>*</span>
								</label>
							</div>
                            <button className="submit" type="submit">Amount: {this.state.message} </button>
						</div>
					</form>
                    <form onSubmit={this.handleYoutube}> 
						<div className="form-group">
							<button className="submit" type="submit">Access Youtube</button>
						</div>
					</form>
                    <form onSubmit={this.handleAmazon}> 
						<div className="form-group">
							<button className="submit" type="submit">Access Amazon Prime</button>
						</div>
					</form>
                    <span className="message">{this.state.messageAccess}</span>
				</div>
			</div>
        );

        return (
            query
        );
    }
}

export default Child;