---
layout: post
title: "Add SSL to Azure Web App using LetsEncrypt"
date: 2018-06-30
tags: [azure, ssl, letsencrypt]
description: "If you’re interested in adding SSL / HTTPS to your Azure Web App you can buy a certificate within Azure, but if you use LetsEncrypt you…"
original_url: "https://medium.com/@marcmathijssen/add-ssl-to-azure-web-app-using-letsencrypt-9125c3fdfb03"
---

If you’re interested in adding SSL / HTTPS to your Azure Web App you can buy a certificate within Azure, but if you use [LetsEncrypt](https://letsencrypt.org/) you can add SSL for free (downside: renew your certificate every 3 months)

I’ve seen scripts & websites automating these steps. I could not get them to work for this specific scenario (.NET Core MVC Webapplication + Azure Web App) and that’s why I wrote down the steps to get it to work. If you do not have this setup, there might be [an easier way](https://letsencrypt.org/docs/client-options/).

**Prerequisites**

- Ubuntu (I used the [Ubuntu app](https://www.microsoft.com/en-us/p/ubuntu/9nblggh4msv6) on my Windows Machine)
- An Azure Web App running on a App Service (platform: Windows, minimal plan supporting SSL: Basic)

## Step 1: Install Certbot & OpenSSL

The tools you need to create the certificate with LetsEncrypt and convert it to a format Azure accepts are

- Certbot: Sets up the challenge with LetsEncrypt to verify your domain
- OpenSSL: Converts the certificates created by Certbot to a format that Azure accepts (PFX)

I’ve installed these tools in the [Ubuntu app](https://www.microsoft.com/en-us/p/ubuntu/9nblggh4msv6) on my Windows Machine using the following commands:

```bash
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get install certbot
sudo apt-get install openssl
```

## Step 2: Setup a challenge with LetsEncrypt

Now we’ve installed Certbot we can tell it to setup a challenge with the LetsEncrypt servers to verify you’re the owner of the domain. In this example I will use the HTTP challenge.

```bash
sudo certbot certonly --preferred-challenges http -d ourmixtape.net --manual
```

We use the flag *manual* to indicate we’re doing this on behalf of a different server, since we’re not running this command from web server itself (Azure doesn’t allow this).

Note: you should replace ourmixtape.net with your own domain.

**Please note that these steps will generate the certificate for the exact domain you enter. It matters if you enter** [**www.yourdomain.com**](http://www.yourdomain.com) **or yourdomain.com! If you want both, complete the steps twice.**

You’ll see instructions on your screen on what file and contents you should create.

Create the file and use the .txt extension . Why? You’ll see in the next step.

## Step 3: Upload the challenge file to your Azure Web App

So now you have a .txt file with the contents that you were supposed to add. You upload this file into a directory on your app service plan. Upload it any way you like (I used FTP).

Since I have a .NET core application I had to upload into the wwwroot folder in the wwwroot of my Azure website. This is the folder for your static files in .NET core.

Check if you can access the file in your browser by going to the full url with the .txt extension.

## Step 4: Modify your web.config to rewrite the challenge file without extension

As you can see in the instructions in Step 1. The servers of LetsEncrypt will visit your challenge file without the .txt extension. By default this isn’t supported by .NET / IIS and that’s why we add an IIS rewrite rule to redirect the url LetsEncrypt checks to the .txt file we’ve uploaded.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
<system.webServer>
<handlers>
<add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModule" resourceType="Unspecified" />
</handlers>
<aspNetCore processPath="dotnet" arguments=".\OMT.Web.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" />
<rewrite>
<rules>
<rule name="wildcard">
<match url=".*well-known/acme-challenge/(?!.*?\.txt$)(.*)$" />
<action type="Redirect" url="/.well-known/acme-challenge/{R:1}.txt" />
</rule>
</rules>
</rewrite>
</system.webServer>
</configuration>
```

Now you should be able to visit the **exact** **url**:

![]({{ "/assets/images/add-ssl-to-azure-web-app-using-letsencrypt/0-gfwvwmgtcsu4e7dl.png" | relative_url }})

When successful (you see the contents of the .txt file) you can press enter in your Ubuntu console to complete the challenge and generate the certificate.

## Step 5: Convert the certificate to PFX using OpenSSL

![]({{ "/assets/images/add-ssl-to-azure-web-app-using-letsencrypt/0-gzyrasozhe5do-k8.png" | relative_url }})

When you’ve done this you can convert the certificates using the following command.

```bash
sudo openssl pkcs12 -export -out /etc/letsencrypt/live/ourmixtape.net/ourmixtape.pfx -inkey /et c/letsencrypt/live/ourmixtape.net/privkey.pem -in /etc/letsencrypt/live/ourmixtape.net/cert.pem
```

It will ask you for a password (remember this) and will generate a .pfx file you can upload into the Azure portal.

If you want to copy the PFX file from your Windows Ubuntu app to your Windows Environment you can use the following folder

```text
%userprofile%\AppData\Local\Packages
```

Search for the *CanonicalGroupLimited.UbuntuonWindows* folder and navigate to the following path in that folder.

```text
%userprofile%\AppData\Local\Packages\CanonicalGroupLimited.UbuntuonWindows_(YOUR_POSTFIX)\LocalState\rootfs\etc\letsencrypt\live\ourmixtape.net
```

There you’ll find the generated PFX file. Copy it to somewhere convenient.

## Step 6: Upload your PFX certificate into the Azure Portal and add the SSL binding

Go to the SSL settings of your web app and press ‘upload certificate’

![]({{ "/assets/images/add-ssl-to-azure-web-app-using-letsencrypt/0-wrhyg3jtcqbo3sv6.png" | relative_url }})

Upload your .pfx file and enter the password you remembered from Step 4.

![]({{ "/assets/images/add-ssl-to-azure-web-app-using-letsencrypt/0-pteu8f7ygts2rmtp.png" | relative_url }})

Add the SSL binding to the uploaded certificate

![]({{ "/assets/images/add-ssl-to-azure-web-app-using-letsencrypt/0-0m5r-o8jnezrspd1.png" | relative_url }})

Wait a few minutes and visit your website using https and you’ll see that it’s served with the LetsEncrypt certificate.

![]({{ "/assets/images/add-ssl-to-azure-web-app-using-letsencrypt/0-5oiq7fklxfcghrco.png" | relative_url }})

**Remember to do these steps for each subdomain**

---

*Originally published at* [*marcmathijssen.nl*](https://marcmathijssen.nl/add-ssl-azure-web-app-letsencrypt/) *on June 30, 2018.*
