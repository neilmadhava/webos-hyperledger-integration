jq --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
	echo "Please Install 'jq' https://stedolan.github.io/jq/ to execute this script"
	echo
	exit 1
fi

starttime=$(date +%s)

CC_SRC_PATH="$PWD/chaincode/chain_reward"
LANGUAGE="node"


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
