---
layout: post
title: "Running a .NET core application in an Azure Container Instance"
date: 2018-06-27
tags: [dotnet, docker, azure]
description: "Even though containers have been a popular way to ship applications for a couple of years it was only until recently I found the perfect…"
original_url: "https://medium.com/@marcmathijssen/running-a-net-core-application-in-an-azure-container-instance-b5f84673f135"
---

Even though containers have been a popular way to ship applications for a couple of years it was only until recently I found the perfect problem to solve with a container.

A while ago I created the little web app [ourmixtape.net](http://ourmixtape.net/) that allows you to create a shared playlist based on the favorite Spotify tracks of you and your friends / colleagues / family members. A feature of ourmixtape.net is you can let it regenerate the playlist every night or every week, so when your favorite songs change, so will your shared playlist.

Traditionally I would execute this background task inside a Windows Service, but I didn’t want to buy and maintain a VM or VPS because of the costs and the overhead it would generate. I really don’t need a fullblown server that’s always running.

After investigating some options (Azure Webjobs, Azure Functions) I decided that using [Azure Container Instances](https://azure.microsoft.com/en-us/services/container-instances/) (ACI) was the easiest and cheapest way to run this background task in the cloud. Why?

- Per second billing
- No need to maintain a server (or cluster)

So I created a simple .NET Core console application called *OMT.TaskRunner* which executes all background tasks of ourmixtape.net and closes down when done.

In 3 steps I will show you what I did to run this application inside a Docker container that runs as an Azure Container Instance.

**Before I started I had the following stuff:**

- Docker for Windows (I used the Docker Toolbox since I could not install Hyper-V on my machine)
- A .NET Core console application
- An Azure subscription
- A Docker account

## Step 1: Turn your .NET core console application into a Docker image

The first thing to do is to turn your .NET core console application into a docker image. This is done by creating a [docker file](https://docs.docker.com/engine/reference/builder/). The docker file contains the build instruction of your application.

This is the docker file I used.

```dockerfile
FROM microsoft/dotnet:2.0-sdk AS build-env
WORKDIR /app # copy everything else and build
COPY /OMT.Core/. ./OMT.Core/
COPY /OMT.TaskRunner/. ./OMT.TaskRunner/

RUN dotnet restore ./OMT.TaskRunner/OMT.TaskRunner.csproj
RUN dotnet publish ./OMT.TaskRunner/OMT.TaskRunner.csproj -c Release -o out # build runtime image

FROM microsoft/dotnet:2.0-runtime
WORKDIR /app
COPY --from=build-env /app/OMT.TaskRunner/out ./
ENTRYPOINT ["dotnet", "OMT.TaskRunner.dll"]
```

It copies the source files of the application (OMT.TaskRunner) and the source files of a referenced project it depends on (OMT.Core) to a directory of the .NET 2.0 SDK docker image. When you run this image it will build your application and create a Docker Image with your application on top the the .NET 2.0 runtime image.

I put this Docker file in the root of my solution folder and build the image with the following command

```bash
docker build -t omt.taskrunner .
```

After the build succeeds I have a Docker image called *omt.taskrunner* locally*.* I can run my image on my local machine using the following command

```bash
docker run omt.taskrunner:latest
```

## Step 2: Push your Docker Image to a private repository

Since I want my application to run in the cloud I have to publish this image to a repository. I decided to use the private Docker repository that allows you to have one free private container.

To publish to a private registry you first have to authenticate docker with your private registry (done through [*docker login*](https://docs.docker.com/engine/reference/commandline/login/) ). Once you’ve authenticated you can tag your image using the following command:

```bash
docker tag omt.taskrunner:latest marcmathijssen/omt
```

With this command I tag my local image (omt.taskrunner) with the name of my docker private repo (marcmathijssen/omt). Afterwards I can push the container to the private repository.

```bash
docker push marcmathijssen/omt:latest
```

This will ‘upload’ the image to the private repository.

## Step 3: Schedule Azure Container Instances using Azure Logic Apps

When you look into the [documentation of the Azure Container Instances](https://docs.microsoft.com/en-us/azure/container-instances/container-instances-tutorial-deploy-app) you’ll read about starting container instances by using the command line. Since I want to run my container periodically I need something else. I turned to Azure Logic Apps.

You can schedule your container easily with [Azure Logic Apps](https://azure.microsoft.com/en-us/services/logic-apps/). Azure Logic Apps allow you to visually create workflows with all kinds of predefined tasks. I created an Azure Logic App that runs my container at a predefined time (recurrence trigger) and send me an email afterwards.

Every task I needed was already defined in Azure Logic Apps and all I had to do was editing the properties (container name, credentials etc.) and link the tasks together. This is my Azure Logic App.

I’ve been running the [ourmixtape.net](http://ourmixtape.net/) background tasks inside a docker container for 6 months now. The things I like the most are:

- Easy deployment: Just build & push the container. The Azure Logic App will download the new image the next time it runs
- Pay what you use: Currently I pay average € 0,18 per month for my container that runs for a few minutes per day. These costs will increase as my app gets more users (or the other way around :-))

Hope you enjoyed this little tutorial. [Tweet me](https://twitter.com/marcmathijssen) or send me an [email](mailto:marcmathijssen@gmail.com) if you have any questions or remarks.
