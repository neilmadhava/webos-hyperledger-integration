import React, { Component } from 'react'
import axios from 'axios';
import './static/RegistrationForm.css';

class Parent extends Component{
    static defaultProps = {
        token: JSON.parse(window.localStorage.getItem("token")) || ""
    }

    constructor(props) {
		super(props);
		this.state = {
            amount: "",
            message: "",
            child: "",
			childPay: "",
			childQuery: ""
        };
        this.handleChange = this.handleChange.bind(this);
        this.handlePay = this.handlePay.bind(this);
		this.handleCreate = this.handleCreate.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
    }
    

    handleChange(e) {
		this.setState({ [e.target.name]: e.target.value })
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

        let url = "/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readChild&args=%5B%22"+this.state.childQuery+"%22%5D";
        
        let response = await instance.get(url);
        console.log(response.data["coins"]);

        this.setState({ amount: response.data["coins"].toString() });
    }

    async handlePay(e) {
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

		let response = await instance.post('/channels/mychannelpc/chaincodes/rewardv1', {
            'peers': ['peer0.parent.example.com'],
            'fcn':'updateChild',
            'args':[`${this.state.childPay}`,`${this.state.amount}`]
        });
        console.log(response);

		this.setState(st => {
			return ({ message: `${response.data.message}`, amount:"", childPay: "" })
		});

		// this.props.addTokens(this.tokensObj);
    }
    
    async handleCreate(e) {
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
		
		console.log(this.props.token);

		let response = await instance.post('/channels/mychannelpc/chaincodes/rewardv1', {
            'peers': ['peer0.parent.example.com'],
            'fcn':'initChild',
            'args':[`${this.state.child}`, "0"]
        });
        console.log(response);

		this.setState(st => {
			return ({ message: `${response.data.message}`, child:""})
		});

		// this.props.addTokens(this.tokensObj);
	}

    
    render(){
        const appForm = (
			<div className="RegistrationForm">
				<div className="form-container">
					<div className="header">
						<h1>Create, Pay, Query Form</h1>
					</div>

                    <form onSubmit={this.handleCreate}>
						<div className="form-group">
							<div className="input-group">
								<label htmlFor="child">Child
                                    <span>*</span>
								</label>
								<input id="child" name="child" placeholder="Child"
									value={
										this.state.child
									}
									onChange={this.handleChange} />
							</div>
						</div>
                        <button className="submit" type="submit">Create</button>
					</form>

					<form onSubmit={this.handlePay}>
						<div className="form-group">
							<div className="input-group">
								<label htmlFor="amount">Amount
                                    <span>*</span>
								</label>
								<input id="amount" name="amount" placeholder="Amount"
									value={
										this.state.amount
									}
									onChange={this.handleChange} />
							</div>
                            <div className="input-group">
								<label htmlFor="childPay">Child
                                    <span>*</span>
								</label>
								<input id="childPay" name="childPay" placeholder="Pay to"
									value={
										this.state.childPay
									}
									onChange={this.handleChange} />
							</div>
						</div>
                        <button className="submit" type="submit">Pay Now</button>
					</form>

                    <form onSubmit={this.handleSubmit}> 
						<div className="form-group">
							<div className="input-group">
								<label htmlFor="child">Query Cryptocurrency
                                <span>*</span>
								</label>
								<input id="childQuery" name="childQuery" placeholder="Query child"
									value={
										this.state.childQuery
									}
									onChange={this.handleChange} />
							</div>
						</div>
						<button className="submit" type="submit">Amount: {this.state.amount} </button>
					</form>

                    <span className="message">{this.state.message}</span>
				</div>
			</div>
        );
        
        return (
            appForm
        )
    }
}

export default Parent;