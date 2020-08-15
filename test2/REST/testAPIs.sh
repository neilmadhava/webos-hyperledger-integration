#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

jq --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
	echo "Please Install 'jq' https://stedolan.github.io/jq/ to execute this script"
	echo
	exit 1
fi

starttime=$(date +%s)

CC_SRC_PATH="$PWD/chaincode/chain_reward"
LANGUAGE="node"

echo "POST request Enroll on parent  ..."
echo
ORG1_TOKEN=$(curl -s -X POST \
  http://localhost:4000/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Mukunda&orgName=parent')
echo $ORG1_TOKEN
ORG1_TOKEN=$(echo $ORG1_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG1 token is $ORG1_TOKEN"
echo



echo "POST request Enroll on child ..."
echo
ORG2_TOKEN=$(curl -s -X POST \
  http://localhost:4000/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Madhava&orgName=child')
echo $ORG2_TOKEN
ORG2_TOKEN=$(echo $ORG2_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG2 token is $ORG2_TOKEN"
echo


echo
echo "POST request Create channel  ..."
echo
curl -s -X POST \
  http://localhost:4000/channels \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"channelName":"mychannelpc",
	"channelConfigPath":"../../channel-artifacts/channel.tx"
}'
echo
echo
sleep 5


echo "POST request Join channel on parent"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelpc/peers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.parent.example.com","peer1.parent.example.com"]
}'
echo
echo

echo "POST request Join channel on child"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelpc/peers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.child.example.com","peer1.child.example.com"]
}'
echo
echo


echo "POST request Update anchor peers on Parent"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelpc/anchorpeers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../../channel-artifacts/parentanchors.tx"
}'
echo
echo

echo "POST request Update anchor peers on Child"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelpc/anchorpeers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../../channel-artifacts/childanchors.tx"
}'
echo
echo


echo "POST Install chaincode on parent"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.parent.example.com\"],
	\"chaincodeName\":\"rewardv1\",
	\"chaincodePath\":\"$CC_SRC_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"1.0\"
}"
echo
echo

echo "POST Install chaincode on child"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.child.example.com\"],
  \"chaincodeName\":\"rewardv1\",
  \"chaincodePath\":\"$CC_SRC_PATH\",
  \"chaincodeType\": \"$LANGUAGE\",
  \"chaincodeVersion\":\"1.0\"
}"
echo
echo



echo "POST instantiate chaincode on parent"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelpc/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.parent.example.com\"],
	\"chaincodeName\":\"rewardv1\",
	\"chaincodeVersion\":\"1.0\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"args\":[\"init\"]
}"
echo
echo


sleep 10

echo "POST invoke INITLEDGER chaincode on peers of parent, child and Users"
echo
VALUES=$(curl -s -X POST \
  http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1 \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.parent.example.com\"],
  \"fcn\":\"initChild\",
  \"args\":[\"child1\",\"10\"]
}")
echo $VALUES
# Assign previous invoke transaction id  to TRX_ID
MESSAGE=$(echo $VALUES | jq -r ".message")
TRX_ID=${MESSAGE#*ID: }
echo

# sleep 10

echo "Query as Parent"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readChild&args=%5B%22child1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo
echo echo "Query as Child"
curl -s -X GET \
  "http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readChild&args=%5B%22child1%22%5D" \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json"
echo
echo


echo "POST invoke updateChild chaincode"
echo
VALUES=$(curl -s -X POST \
  http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1 \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.parent.example.com\"],
  \"fcn\":\"updateChild\",
  \"args\":[\"child1\",\"30\"]
}")
echo $VALUES
# Assign previous invoke transaction id  to TRX_ID
MESSAGE=$(echo $VALUES | jq -r ".message")
TRX_ID=${MESSAGE#*ID: }
echo

echo "Query as Parent"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readChild&args=%5B%22child1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo



echo "GET history query chaincode on peer0 of parent"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=getHistoryForPerson&args=%5B%22child1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "Query all users on chaincode on peer0 of parent"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=getPersonsByRange&args=%5B%22%22%2C%20%22%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo


# echo
# echo
# echo echo "Query as MCD"
# curl -s -X GET \
#   "http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readPerson&args=%5B%22user_01%22%2C%20%22mcd%22%5D" \
#   -H "authorization: Bearer $ORG2_TOKEN" \
#   -H "content-type: application/json"
# echo
# echo

# # ORG3_TOKEN stores token for USERS
# sleep 5
# echo "POST invoke REVOKE_CONSENT for child chaincode on peers of parent"
# echo
# VALUES=$(curl -s -X POST \
#   http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1 \
#   -H "authorization: Bearer $ORG3_TOKEN" \
#   -H "content-type: application/json" \
#   -d "{
#   \"peers\": [\"peer0.parent.example.com\"],
#   \"fcn\":\"revokeConsent\",
#   \"args\":[\"user_01\", \"child\"]
# }")
# echo $VALUES
# # Assign previous invoke transaction id  to TRX_ID
# MESSAGE=$(echo $VALUES | jq -r ".message")
# TRX_ID=${MESSAGE#*ID: }
# echo

# sleep 10


# echo "GET query chaincode on peer0 of child"
# echo
# curl -s -X GET \
#   "http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readPerson&args=%5B%22user_01%22%2C%20%22child%22%5D" \
#   -H "authorization: Bearer $ORG2_TOKEN" \
#   -H "content-type: application/json"
# echo
# echo

# echo "POST invoke GIVE_CONSENT for child chaincode on peers of parent"
# echo
# VALUES=$(curl -s -X POST \
#   http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1 \
#   -H "authorization: Bearer $ORG3_TOKEN" \
#   -H "content-type: application/json" \
#   -d "{
#   \"peers\": [\"peer0.parent.example.com\"],
#   \"fcn\":\"giveConsent\",
#   \"args\":[\"user_01\", \"low\", \"child\"]
# }")
# echo $VALUES
# # Assign previous invoke transaction id  to TRX_ID
# MESSAGE=$(echo $VALUES | jq -r ".message")
# TRX_ID=${MESSAGE#*ID: }
# echo

# sleep 10

# echo "GET query chaincode on peer0 of child"
# echo
# curl -s -X GET \
#   "http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readPerson&args=%5B%22user_01%22%2C%20%22child%22%5D" \
#   -H "authorization: Bearer $ORG2_TOKEN" \
#   -H "content-type: application/json"
# echo
# echo




# echo "POST invoke DELETE_PERSON chaincode on peers of parent, child and Users"
# echo
# VALUES=$(curl -s -X POST \
#   http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1 \
#   -H "authorization: Bearer $ORG3_TOKEN" \
#   -H "content-type: application/json" \
#   -d "{
#   \"peers\": [\"peer0.parent.example.com\"],
#   \"fcn\":\"deletePerson\",
#   \"args\":[\"user_01\"]
# }")
# echo $VALUES
# # Assign previous invoke transaction id  to TRX_ID
# MESSAGE=$(echo $VALUES | jq -r ".message")
# TRX_ID=${MESSAGE#*ID: }
# echo

# sleep 10

# echo "GET query chaincode on peer0 of parent"
# echo
# curl -s -X GET \
#   "http://localhost:4000/channels/mychannelpc/chaincodes/rewardv1?peer=peer0.parent.example.com&fcn=readPrivatePerson&args=%5B%22user_01%22%5D" \
#   -H "authorization: Bearer $ORG1_TOKEN" \
#   -H "content-type: application/json"
# echo
# echo







# UNUSED DO NOT UNCOMMENT :




# echo "GET query Block by blockNumber"
# echo
# BLOCK_INFO=$(curl -s -X GET \
#   "http://localhost:4000/channels/mychannelpc/blocks/1?peer=peer0.org1.example.com" \
#   -H "authorization: Bearer $ORG1_TOKEN" \
#   -H "content-type: application/json")
# echo $BLOCK_INFO
# # Assign previous block hash to HASH
# HASH=$(echo $BLOCK_INFO | jq -r ".header.previous_hash")
# echo

# echo "GET query Transaction by TransactionID"
# echo
# curl -s -X GET http://localhost:4000/channels/mychannelpc/transactions/$TRX_ID?peer=peer0.org1.example.com \
#   -H "authorization: Bearer $ORG1_TOKEN" \
#   -H "content-type: application/json"
# echo
# echo


# echo "GET query Block by Hash - Hash is $HASH"
# echo
# curl -s -X GET \
#   "http://localhost:4000/channels/mychannelpc/blocks?hash=$HASH&peer=peer0.org1.example.com" \
#   -H "authorization: Bearer $ORG1_TOKEN" \
#   -H "cache-control: no-cache" \
#   -H "content-type: application/json" \
#   -H "x-access-token: $ORG1_TOKEN"
# echo
# echo

# echo "GET query ChainInfo"
# echo
# curl -s -X GET \
#   "http://localhost:4000/channels/mychannelpc?peer=peer0.org1.example.com" \
#   -H "authorization: Bearer $ORG1_TOKEN" \
#   -H "content-type: application/json"
# echo
# echo

# echo "GET query Installed chaincodes"
# echo
# curl -s -X GET \
#   "http://localhost:4000/chaincodes?peer=peer0.org1.example.com" \
#   -H "authorization: Bearer $ORG1_TOKEN" \
#   -H "content-type: application/json"
# echo
# echo

# echo "GET query Instantiated chaincodes"
# echo
# curl -s -X GET \
#   "http://localhost:4000/channels/mychannelpc/chaincodes?peer=peer0.org1.example.com" \
#   -H "authorization: Bearer $ORG1_TOKEN" \
#   -H "content-type: application/json"
# echo
# echo

# echo "GET query Channels"
# echo
# curl -s -X GET \
#   "http://localhost:4000/channels?peer=peer0.org1.example.com" \
#   -H "authorization: Bearer $ORG1_TOKEN" \
#   -H "content-type: application/json"
# echo
# echo


echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
