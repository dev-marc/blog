---
layout: post
title: "Recipe: Angular app on Azure Storage with custom domain and SSL using Azure CDN."
date: 2019-11-16
tags: [angular, azure, cdn]
description: "At Unite.nl we prefer Angular as the frontend stack for the applications we develop and we use Azure as our cloud infrastructure. Over the…"
original_url: "https://medium.com/@marcmathijssen/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn-3611ca92b61a"
---

![]({{ "/assets/images/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn/1-6jcsbd8tzz6d3d7pjtllta.png" | relative_url }})

At [Unite.nl](https://unite.nl) we prefer Angular as the frontend stack for the applications we develop and we use Azure as our cloud infrastructure. Over the last few months we’ve learned what it takes to properly host an Angular app in Azure.

In a few steps i’ll explain what we’ve done to run an Angular app on Azure with:  
\* A custom domain  
\* Free SSL  
\* Clean URLs (using Angulars PathLocationStrategy)  
\* Cache busting  
\* Compression

## 1\. Setup Azure Storage

The output of your Angular build is a bunch of static HTML / Javascript / CSS files. You can put these on an Azure App Service Web App, but Azure also offers a cheaper and faster option: Azure Storage.

Azure Storage, the developers equivalent of Swish army knife, offers the option to host static websites. Create a storage account and enable static website hosting.

![]({{ "/assets/images/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn/1-ivzfjdpfnoxh2kllkzyuha.png" | relative_url }})

Once you’ve uploaded the build output (the files in your dist folder) to the $web container, you can go to the ‘primary endpoint’ in your browser and your website should function properly. By default the LocationStrategy is set to PathLocationStrategy (the clean URLs). These clean urls (e.g. /customers/1234) don’t map to a static file but because we’ve instructed Azure Storage to use index.html as the Error document path, the routes work.

There is a caveat however…

When you check the developer console in your browser, **you’ll see Azure Storage serving 404’s for the clean URLs.** It’s not nice, but it works. In the next steps i’ll show you how to get rid of the 404's.

## 2\. Create an Azure CDN endpoint

Since Azure Storage does not offer running a static website under a custom domain using SSL, we use Azure CDN to do this for us. Our CDN of choice is Azure CDN Premium Verizon because it’s the only CDN which offers rewriting rules which will help us preventing the 404’s on URLs that are created by Angulars PathLocationStrategy.

The downside of this CDN offer is it has really, really slow purge times. Purging is refreshing your CDN cache. But i’ll show you how to get around this later.

**1\. Create an Azure CDN Profile with the Premium Verizon offer**

**2\. Setup an endpoint which points to your Azure Storage primary endpoint using the General Web Delivery profile**

After creating this you’ll be able to reach your Angular app on the azureedge.net CDN domain that pulls and caches the content from your Azure Storage static website.

**3\. Add a custom domain by pointing a CNAME record to the azureedge.net domain**  
⚠ Beware of adding CNAME records to your root domain, you’ll brake your MX records and e-mail will stop working ⚠

**4\. Enable SSL at your CDN endpoint.**

This will take approximately 6 hours to complete. You can choose the ‘CDN Managed’ option and Azure will generate the certificate for you by validating your domain (using e-mail or the CNAME record) or you can import your own keyvault certificate.

We use the ‘CDN Managed’ option since updating your keyvault certificate doesn’t automatically renew the certificate in your CDN. The ‘CDN Managed’ option saves us from this hassle in the future.

## 3\. Optimize Azure CDN Premium Verizon for Angular apps

Configuring the CDN for Angular apps turned out to be the hard part. Changes in the configuration take over 4 hours to propagate to all edges of the CDN which makes debugging very annoying. Hope to save you some time here 😉

We’ve configured the CDN to:  
\* Rewrite the clean PathLocationStrategy URLs to Angulars index.html  
\* Force redirect to HTTPS using a redirect and HSTS headers  
\* Enable compression on static resources

**1.Open the CDN portal**  
Press the ‘manage’ button in your CDN profile

![]({{ "/assets/images/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn/1-omfxn1afpp5wqgwzie544w.png" | relative_url }})

**2\. Rewrite PathLocationStrategy (clean) URLs to Angulars index.html**  
Open up the HTTP Large Rules Engine

![]({{ "/assets/images/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn/1-51ywaegjzo-r5ukf3iogfa.png" | relative_url }})

Setup a URL rewrite rule (IF Always)

```text
((?:[^\?]*/)?)($|\?.*) => index.html$2
((?:[^\?]*/)?[^\?/.]+)($|\?.*) => index.html$2
```

Our rewrite rules look like this:

![]({{ "/assets/images/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn/1-yfquylt8sm65pjvcbtypva.png" | relative_url }})

After approximately 4 hours you’ll have clean Angular URLs with a proper Status 200 response.

**3\. Force HTTPS using redirect and HSTS**  
 Create a new rule to redirect HTTP traffic to HTTPS. If the redirect scheme is HTTP we redirect to:

```text
https://%{host}/$1
```

Our rule looks like this

![]({{ "/assets/images/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn/1-fr5n0ay-qj0me1ujuknebg.png" | relative_url }})

Add a new rule adding a [HSTS header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security) to HTTPS traffic to make sure browsers use HTTPS by default when the user browses to your app.

**⚠ Only add HSTS when you’re pretty sure you’ll only be serving over HTTPS in the future ⚠**

Setup a rule adding the following header to HTTPS traffic:

```text
Strict-Transport-Security: max-age=31536000
```

Our rule looks like this

![]({{ "/assets/images/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn/1-hwvoiq9veboa50fq1ghicg.png" | relative_url }})

**4\. Enable compression**  
By default compression (like GZIP) is turned off on the CDN. Since we’re serving mobile friendly Angular apps we like to save our users bandwith by compressing our files before we send them to the browser.

Go to HTTP Large => Cache Settings => Compression

and add the following file types

```text
text/plain,text/html,text/css,application/x-javascript,text/javascript,application/javascript,application/json
```

## **4\. Cache busting the CDN**

The CDN caches the Azure Storage files and the docs state that by purging the cache you can force the CDN to update the cached files with the new ones from the origin (in this case Azure Storage).

Unfortunately we’ve noticed the ‘purge all’ operation takes a very very long time to actually do this. **In some cases the CDN still served old content hours after purging.**

We’ve worked around this by placing our Angular CSS and Javascript resources in a separate folder containing the version number of our client software. After each deployment we only purge the index.html which happens usually instantaneously after purging.

**1.Customizing the Angular build**

We build with the version (in this example 20191115.3) as deploy-url parameter to tell Angular to load the resources from the versioned folder

```bash
npm run build --deploy-url="20191115.3/"
```

Our post-build script moves the CSS / Javascript files to this versioned folder.

```bash
npm run post-build "20191115.3"
```

Our NodeJs post-build script looks like this

```javascript
const path = require('path');
const fs = require('fs');

const APP_VERSION = process.argv[2];
const DIST_PATH = path.join(__dirname, '../dist');
const VERSIONED_PATH = path.join(DIST_PATH, APP_VERSION);

const distFiles = fs.readdirSync(DIST_PATH);

// Create the version folder
fs.mkdirSync(VERSIONED_PATH);

// Move all files in the dist folder
// to the version folder except for index.html

distFiles.forEach(file => {

const originalPath = path.join(DIST_PATH, file);
const newAbsolutePath = path.join(VERSIONED_PATH, file);

if (!file.endsWith('.html') && fs.lstatSync(originalPath).isFile()) {

fs.renameSync(originalPath, newAbsolutePath);
console.log(`Moved ${originalPath} to ${newAbsolutePath}`);

}
});
```

This is what the output looks like after the build and post-build

![]({{ "/assets/images/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn/1-9-kqhctu9foj6acrxpl2vq.png" | relative_url }})

This is what the index.html looks like

![]({{ "/assets/images/recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn/1-3w1rrq6ofeacadgcua9jbw.png" | relative_url }})

**2\. Purging the index.html**

After you’ve published the output to Azure Storage, you can purge the index.html from the CDN which takes approximately 1 minute.   
Here’s how we do it using an Azure CLI task in an Azure Devops Release pipeline:

```bash
az cdn endpoint purge --resource-group "***" -n "***" --profile-name "***"  --content-paths "/index.html" "/*"
```

Note we also append “/\*” which is the equivalent of ‘purge all’. We do this for our static assets, for which it is acceptable to have a longer cache duration.

Since the index.html is quickly purged and all Angular resources are loaded from a folder which doesn’t exist on the CDN yet, users will get the latest version of the app.

**It took some configuration and trial and error before we finally got it right, but I hope I can save you the trouble by sharing it here 😊**
