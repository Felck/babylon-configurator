container=babylon-configurator

if [ "$(docker inspect -f '{{.State.Running}}' $container 2>/dev/null)" = "true" ]
then
  docker stop $container
  docker rm $container
fi

docker build -t $container .
docker run -d --name $container -p 80:80 $container
