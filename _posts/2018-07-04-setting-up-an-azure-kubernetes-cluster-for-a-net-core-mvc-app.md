---
layout: post
title: "Setting up an Azure Kubernetes Cluster for a .NET Core MVC app"
date: 2018-07-04
tags: [kubernetes, azure, dotnet]
description: "The last couple of weeks I’ve been playing around with Kubernetes (popular abbreviation: k8s). Kubernetes is the #1 container…"
original_url: "https://medium.com/@marcmathijssen/setting-up-an-azure-kubernetes-cluster-for-a-net-core-mvc-app-72e9b15a713c"
---

The last couple of weeks I’ve been playing around with Kubernetes (popular abbreviation: k8s). Kubernetes is the #1 container orchestration tool that helps you deploying and scaling containers.

It took me some time figuring out how to get my simple .NET Core MVC app running in Kubernetes on Azure. I started off with some very basic Docker knowledge, and it turned out [Kubernetes throws many more concepts in your face](https://kubernetes.io/docs/concepts/) you need to get to know!

I will show you the steps it took to get my .NET Core MVC app running on a managed [Kubernetes cluster in Azure](https://azure.microsoft.com/en-us/services/kubernetes-service/). **I might skip a lot of details here**. If you want to understand some concepts better (like Docker, private container registries, Kubernetes) I suggest you google them during the steps they’re mentioned in.

**Prerequisites:**

- An Azure subscription
- A .NET MVC Core app
- Docker or Docker Toolbox
- A private container registry (for instance [Azure Container Registry](https://azure.microsoft.com/nl-nl/services/container-registry/) )

## Step 1: Create a Kubernetes cluster

You can create a Kubernetes cluster using the Azure CLI (either in the portal or from your local PowerShell). These steps are also available in the portals GUI, but since you’re going to need the command line pretty often in this tutorial we’ll stick to commands only 🙂

First I created a new resource group

```bash
az group create -l westeurope -n k8s
```

Then I added a Kubernetes cluster with a single node (=VM) of the Standard\_A1\_v2 size. By default you’ll get 3 nodes with better specs, but I didn’t need that right now.

**Please note you can always add increase or decrease the nodes, but you won’t be able to add nodes of different VM specs. So this is pretty important decision you make up front.**

```bash
az aks create --resource-group k8s --name cluster01 --generate-ssh-keys --node-vm-size Standard_A1_v2 --node-count 1 --enable-addons http_application_routing
```

I also added this thing called [http\_application\_routing](https://docs.microsoft.com/en-us/azure/aks/http-application-routing) that allows me to easily access the application through http on our cluster.

From my experience it will take a minute or 15 before everything is setup and the nodes have been provisioned. In the Azure portal you’ll see a bunch of new resources and a another new resource group (the cluster infrastructure group).

![]({{ "/assets/images/setting-up-an-azure-kubernetes-cluster-for-a-net-core-mvc-app/0-pm4fa-dyznpiikaj.png" | relative_url }})

When everything is setup you can associate the CLI with the cluster by using the following command

```bash
az aks get-credentials --resource-group=k8s --name=cluster01
```

This allows you to access the cluster through the *kubectl* commands (by default installed on the Azure Portal, if you want to use [kubectl locally check these instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/)).

After this step I can control my Kubernetes cluster through the command line. A simple check is to run this command.

```bash
kubectl get nodes
```

Which showed me:

```text
NAME STATUS ROLES AGE VERSION
aks-nodepool1-12041136-0 Ready agent 10m v1.9.6
```

This is the single node (virtual machine) I provisioned to the cluster. You won’t see a master node. If you see a master node I think you’ve setup an unmanaged kubernetes cluster through Azure Container Service (and used *acs* in stead of *aks* in the commands).

With the unmanaged service you are responsible for updating the control plane, and there are more differences I won’t go into right now.

## Step 2: Dockerize the .NET Core MVC app

There are pretty good tutorials out there explaining this. I’ll show you my docker file and the commands I use.

My project is called OMT.Web en this is the Docker file to build it into a container image.

```dockerfile
FROM microsoft/aspnetcore-build:2.0 AS build-env
WORKDIR /app COPY . ./
RUN dotnet publish ./OMT.Web/OMT.Web.csproj -c Release -o out

# Build runtime image FROM microsoft/aspnetcore:2.0
WORKDIR /app EXPOSE 80
COPY --from=build-env /app/OMT.Web/out .
ENTRYPOINT ["dotnet", "OMT.Web.dll"]
```

It copies the solution to the build container (microsoft/aspnetcore-build) which publishes the MVC project to the runtime container (microsoft/aspnetcore:2.0). By default port 80 is exposed since it’s handling web requests.

I build this Docker file (that’s called Web) from the root of my solution using the following command:

```bash
docker build -t omt.web . -f Web
```

Before I can push it to the private registry I have to authenticate first using [docker login](https://docs.docker.com/engine/reference/commandline/login/).

```bash
docker login marcmathijssen.azurecr.io -u xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx -p myPassword
```

Now I can tag my local image and push it to the private registry

```bash
docker tag omt.web:latest marcmathijssen.azurecr.io/omt/web docker push marcmathijssen.azurecr.io/omt/web
```

It will show me something like:

```text
The push refers to a repository [marcmathijssen.azurecr.io/omt/web]
672fff0c4445: Pushing [=====================================> ] 31.99MB/43.13MB
```

The image is in the registry, and the cluster is ready for use. Let’s deploy.

## Step 3: Deploy the container in Kubernetes

As I told you in the intro: Kubernetes throws a bunch of concepts at you:

- Deployment: Configuring and creating of all of the below
- Pods: One or multiple containers that will be guaranteed to run on the same node (handy if you have multiple containers that depend on each other presence on the same node)
- Services: Allows traffic to your pods
- Ingress: Allows traffic to your services through domain names

I created a YAML file (omt.yaml) that sets up a pod, service and ingress through a deployment:

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
name: omtweb
spec:
template:
metadata:
labels:
app: omtweb
spec:
containers:
- image: marcmathijssen.azurecr.io/omt/web
name: omtweb
ports:
- containerPort: 80
imagePullSecrets:
- name: marcmathijssencr
---
apiVersion: v1
kind: Service
metadata:
name: omtweb
spec:
ports:
- port: 80
protocol: TCP
targetPort: 80
selector:
app: omtweb
type: ClusterIP
---
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
name: omtweb
annotations:
kubernetes.io/ingress.class: addon-http-application-routing
spec:
rules:
- host: ourmixtape.net
http:
paths:
- backend:
serviceName: omtweb
servicePort: 80
path: /
- host: www.ourmixtape.net
http:
paths:
- backend:
serviceName: omtweb
servicePort: 80
path: /
```

As you can see in the file, the image is pulled from my private registry. Kubernetes uses credentials for this. I had to save these credentials in Kubernetes first through the command line.

```bash
kubectl create secret docker-registry marcmathijssencr --docker-server=marcmathijssen.azurecr.io --docker-username=marcmathijssen --docker-password=<my-key> --docker-email=marcmathijssen@gmail.com
```

I created the deployment of my app with the following command.

```bash
kubectl create -f omt.yaml
```

It showed me

```text
deployment "omtweb" created
service "omtweb" created
ingress "omtweb" created
```

So the container is running on the cluster, but how do we access it? The Azure Kubernetes cluster has a public IP assigned to the ingress controller to it. You can find it through querying the ingress.

```bash
kubectl get ing

NAME HOSTS ADDRESS PORTS AGE
omtweb ourmixtape.net,www.ourmixtape.net 13.80.99.67 80 10m
```

You can also let Azure create a domain name for your resource. Read all about this in the documentation of [http application routing](https://docs.microsoft.com/en-us/azure/aks/http-application-routing). Convenient if you just want to add a CNAME record in yourdomain.com pointing to the cluster.

Once you’ve setup the DNS records your .NET Core MVC application will be served from your Kubernetes cluster in Azure.

## Tips

- The tutorials on the [Kubernetes website](https://kubernetes.io/docs/tutorials/kubernetes-basics/) are pretty good if you need more knowledge on Kubernetes itself.
- You can view your Azure Kubernetes dashboard by [using the Azure CLI powershell](https://docs.microsoft.com/en-us/azure/aks/kubernetes-dashboard)
- Test your container on your machine first before you push it to the registry (it’s harder to debug it there :-))
