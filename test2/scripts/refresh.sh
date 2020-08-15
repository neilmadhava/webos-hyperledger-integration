#!/bin/sh

docker-compose -f docker-compose-cli.yaml down

# STOP AND DELETE THE DOCKER CONTAINERS
docker ps -aq | xargs -n 1 docker stop
docker ps -aq | xargs -n 1 docker rm -v

# DELETE THE OLD DOCKER VOLUMES
docker volume prune -f

# DELETE OLD DOCKER NETWORKS (OPTIONAL: seems to restart fine without)
docker network prune -f

# DELETE SCRIPT-CREATED FILES
# rm -rf channel-artifacts/*.block channel-artifacts/*.tx crypto-config
# rm -f docker-compose-e2e.yaml

# VERIFY RESULTS
docker ps -a
docker volume ls