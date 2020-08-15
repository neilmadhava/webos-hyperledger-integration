/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {
  async Init(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('=========== Instantiated Reward Blockchain Chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    console.info('Transaction ID: ' + stub.getTxID());
    console.info(util.format('Args: %j', stub.getArgs()));

    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.log('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  // ===============================================
  // initChild - create a new person
  // ===============================================
  async initChild(stub, args, thisClass) {
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }
    // ==== Input sanitation ====
    console.info('--- start init child ---')
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }

    let childName = args[0];
    let coins = parseInt(args[1]);
    if (typeof coins !== 'number') {
      throw new Error('2nd argument must be a numeric string');
    }

    // ==== Check if child already exists ====
    let childState = await stub.getState(childName);
    if (childState.toString()) {
      throw new Error('An entry with this child already exists: ' + childName);
    }

    // ==== Create child object and marshal to JSON ====
    let child = {};
    child.docType = 'child';
    child.name = childName;
    child.coins = coins;

    // === Save child to state ===
    await stub.putState(childName, Buffer.from(JSON.stringify(child)));

    console.info('- end init child');

  }


  async getPersonsByRange(stub, args, thisClass) {

    if (args.length < 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let startKey = args[0];
    let endKey = args[1];

    let resultsIterator = await stub.getStateByRange(startKey, endKey);
    let method = thisClass['getAllResults'];
    let results = await method(resultsIterator, false);

    return Buffer.from(JSON.stringify(results));
  }

  async getAllResults(iterator, isHistory) {
    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        if (isHistory && isHistory === true) {
          jsonRes.TxId = res.value.tx_id;
          jsonRes.Timestamp = res.value.timestamp;
          jsonRes.IsDelete = res.value.is_delete.toString();
          try {
            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Value = res.value.value.toString('utf8');
          }
        } else {
          jsonRes.Key = res.value.key;
          try {
            jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Record = res.value.value.toString('utf8');
          }
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  }

  // ===========================
  // readChild - read a child
  // ===========================
  async readChild(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting childName to query');
    }

    let userID = args[0];
    if (!userID) {
      throw new Error(' childName must not be empty');
    }
    let personAsBytes = await stub.getState(userID); //get the person from chaincode state
    if (!personAsBytes.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'Child does not exist: ' + userID;
      throw new Error(JSON.stringify(jsonResp));
    }
    console.info('=======================================');
    console.log(personAsBytes.toString());
    console.info('=======================================');
    return personAsBytes;
  }

  // =======================================
  // updateChild - update coins for a child
  // =======================================

  async updateChild(stub, args, thisClass) {
    //   0       1
    // 'name', '-40'
    if (args.length < 2) {
      throw new Error('Incorrect number of arguments. Expecting childname and coinAddition')
    }

    let childName = args[0];
    let coinAddition = parseInt(args[1]);
    if (typeof coinAddition !== 'number') {
      throw new Error('2nd argument must be a numeric string');
    }
    console.info('- start updateChild ', childName, coinAddition);

    let childAsBytes = await stub.getState(childName);
    if (!childAsBytes || !childAsBytes.toString()) {
      throw new Error('child does not exist');
    }
    let updatedChild = {};
    try {
      updatedChild = JSON.parse(childAsBytes.toString()); //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + childName;
      throw new Error(jsonResp);
    }
    console.info(updatedChild);
    updatedChild.coins += coinAddition; //change the coins

    let marbleJSONasBytes = Buffer.from(JSON.stringify(updatedChild));
    await stub.putState(childName, marbleJSONasBytes); //rewrite the child

    console.info('- end updateChild (success)');
  }


  // ===================================================
  // deletePerson - delete a person from all collections
  // ===================================================
  async deletePerson(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting userID of the person to delete');
    }
    let userID = args[0];
    if (!userID) {
      throw new Error('userID must not be empty');
    }

    let valAsbytes = await stub.getPrivateData("testCollection", userID); //get the person from chaincode state
    let jsonResp = {};
    if (!valAsbytes) {
      jsonResp.error = 'person does not exist';
      throw new Error(jsonResp);
    }

    //remove the person from testCollection
    await stub.deletePrivateData("testCollection", userID);

    valAsbytes = await stub.getPrivateData("testCollectionCCD", userID); //get the person from chaincode state
    jsonResp = {};
    if (valAsbytes) {
      //remove the person from testCollectionCCD
      await stub.deletePrivateData("testCollectionCCD", userID);
    }

    valAsbytes = await stub.getPrivateData("testCollectionMCD", userID); //get the person from chaincode state
    jsonResp = {};
    if (valAsbytes) {
      //remove the person from testCollectionCCD
      await stub.deletePrivateData("testCollectionMCD", userID);
    }

    let personAsBytes = await stub.getState(userID);
    if (!personAsBytes || !personAsBytes.toString()) {
      throw new Error('person does not exist');
    }
    let personPublic = {};
    try {
      personPublic = JSON.parse(personAsBytes.toString()); //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + userID;
      throw new Error(jsonResp);
    }
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date+' '+time;
    personPublic.timeOfAction = dateTime;
    personPublic.consent_status = "deleted data from all records";

    let personJSONasBytes = Buffer.from(JSON.stringify(personPublic));
    await stub.putState(userID, personJSONasBytes); //rewrite the person
  }

  // ==================================================
  // delete - remove a child key/value pair from state
  // ==================================================
  async delete(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the child to delete');
    }
    let childName = args[0];
    if (!childName) {
      throw new Error('child name must not be empty');
    }
    // to maintain the color~name index, we need to read the child first and get its color
    let valAsbytes = await stub.getState(childName); //get the child from chaincode state
    let jsonResp = {};
    if (!valAsbytes) {
      jsonResp.error = 'child does not exist: ' + name;
      throw new Error(jsonResp);
    }
    let childJSON = {};
    try {
      childJSON = JSON.parse(valAsbytes.toString());
    } catch (err) {
      jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + childName;
      throw new Error(jsonResp);
    }

    await stub.deleteState(childName); //remove the child from chaincode state
  }

  async getHistoryForPerson(stub, args, thisClass) {

    if (args.length < 1) {
      throw new Error('Incorrect number of arguments. Expecting 1')
    }
    let username = args[0];
    console.info('- start getHistoryForPerson: %s\n', username);

    let resultsIterator = await stub.getHistoryForKey(username);
    let method = thisClass['getAllResults'];
    let results = await method(resultsIterator, true);

    return Buffer.from(JSON.stringify(results));
  }

  async getPersonsByRange(stub, args, thisClass) {
    if (args.length < 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let startKey = args[0];
    let endKey = args[1];

    let resultsIterator = await stub.getStateByRange(startKey, endKey);
    let method = thisClass['getAllResults'];
    let results = await method(resultsIterator, false);

    return Buffer.from(JSON.stringify(results));
  }

};

shim.start(new Chaincode());
