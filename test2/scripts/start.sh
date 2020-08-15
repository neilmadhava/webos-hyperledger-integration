#!/bin/sh
#
# Copyright IBM Corp All Rights Reserved
# SCRIPT FOR GENERATING CERTIFICATES AND ARTIFACTS

# export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH="$PWD"
CHANNEL_NAME=mychannelpc
SYS_CHANNEL=byfn-sys-channel

# remove previous crypto material and config transactions
rm -fr config/*
rm -fr crypto-config/*

# generate crypto material
cryptogen generate --config=./crypto-config.yaml

if [ "$?" -ne 0 ]; then
	echo "Failed to generate crypto material..."
	exit 1
fi

# export BYFN_CA1_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/parent.example.com/ca && ls *_sk)
# export BYFN_CA2_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/child.example.com/ca && ls *_sk)
# export CONSENT_CA3_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/users.example.com/ca && ls *_sk)


# generate genesis block for orderer
echo "##########################################################"
echo "#########  Generating Orderer Genesis block ##############"
echo "##########################################################"
echo + configtxgen -profile TwoOrgsOrdererGenesis -channelID $SYS_CHANNEL -outputBlock ./channel-artifacts/genesis.block

configtxgen -profile TwoOrgsOrdererGenesis -channelID $SYS_CHANNEL -outputBlock ./channel-artifacts/genesis.block
if [ "$?" -ne 0 ]; then
	echo "Failed to generate orderer genesis block..."
	exit 1
fi

# generate channel configuration transaction
echo "#################################################################"
echo "### Generating channel configuration transaction 'channel.tx' ###"
echo "#################################################################"
echo + configtxgen -profile PCChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME


configtxgen -profile PCChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME

if [ "$?" -ne 0 ]; then
	echo "Failed to generate channel configuration transaction..."
	exit 1
fi

# generate anchor peer transaction
echo "#################################################################"
echo "#######    Generating anchor peer update for parent   ##########"
echo "#################################################################"
echo + configtxgen -profile PCChannel -outputAnchorPeersUpdate ./channel-artifacts/parentanchors.tx -channelID $CHANNEL_NAME -asOrg parent

configtxgen -profile PCChannel -outputAnchorPeersUpdate ./channel-artifacts/parentanchors.tx -channelID $CHANNEL_NAME -asOrg parent
if [ "$?" -ne 0 ]; then
	echo "Failed to generate anchor peer update for parent..."
	exit 1
fi

# generate anchor peer transaction
echo
echo "#################################################################"
echo "#######    Generating anchor peer update for child       ##########"
echo "#################################################################"
echo + configtxgen -profile PCChannel -outputAnchorPeersUpdate ./channel-artifacts/childanchors.tx -channelID $CHANNEL_NAME -asOrg child

configtxgen -profile PCChannel -outputAnchorPeersUpdate ./channel-artifacts/childanchors.tx -channelID $CHANNEL_NAME -asOrg child

if [ "$?" -ne 0 ]; then
	echo "Failed to generate anchor peer update for child..."
	exit 1
fi


# ./scripts/ccp-generate.sh