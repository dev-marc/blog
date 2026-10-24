---
layout: post
title: "Deploy a .NET Core WebJob within Azure Devops"
date: 2019-04-10
tags: [dotnet, azure-devops, azure]
description: "Recently I created an WebJob to do some background processing for our company’s web app. It took me some time find out how to deploy the…"
original_url: "https://medium.com/@marcmathijssen/deploy-a-net-core-webjob-within-azure-devops-21bfd71d1264"
---

Recently I created an WebJob to do some background processing for our company’s web app. It took me some time find out how to deploy the WebJob using Azure Devops (most documentation is about full framework WebJobs), so I’d like to share my deployment script with you.

---

1. Add an Azure Powershell task to your build or release pipeline

![]({{ "/assets/images/deploy-a-net-core-webjob-within-azure-devops/1-4rwyo3kpfzoohgjlyzmuxq.png" | relative_url }})

2\. Change the variables in the top of the script below to match your resource group / web app / webjob names.

```powershell
# Deploy a .NET Core WebJob using Azure Powershell within a Azure Devops Pipeline

$resourceGroupName = "" #the name of the resource group
$webappName = "" #the name of the webapp you would like to deploy to)
$webjobName = "" #the name of the webjob
$path =  "" #path to the .zip containing the webjob
$scheduleName = "continuous" #Name of the webjob, either 'continuous' or 'triggered'

if (-not (Test-Path $path)) 
{
    throw [System.IO.FileNotFoundException] "$($path) not found."
}

# Retrieve WebDeploy credentials for uploading a file using Kudu
$publishingProfilesXml = [xml](Get-AzureRmWebAppPublishingProfile -OutputFile test.xml -Format WebDeploy -Name $webappName -ResourceGroupName $resourceGroupName )
$publishingProfileWebDeploy = $publishingProfilesXml.FirstChild.ChildNodes[0]   
$username = $publishingProfileWebDeploy.userName
$password = $publishingProfileWebDeploy.userPWD
$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $username,$password)))
$apiBaseUrl = "https://$($webappName).scm.azurewebsites.net/api"

# Upload the deployment zip to Kudu
$files = Get-ChildItem -Path $path -Recurse
Test-Path -Path $files[0]   
$authHeader = " Basic " + $base64AuthInfo
$deployUrl = "$($apiBaseUrl)/$($scheduleName)jobs/$($webjobName)"
  
Write-Host "Uploading " $path  " to " $deployUrl
$ZipHeaders = @{
Authorization = $authHeader
	"Content-Disposition" = "attachment; filename=$($files[0].Name)"
}

$response = Invoke-WebRequest -Uri  $deployUrl -Headers $ZipHeaders -InFile $files[0] -ContentType "application/zip" -Method Put
Write-Host $response
```

[View on GitHub Gist](https://gist.github.com/dev-marc/2d5504f20001f39d7cc26997a28baa33)
