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