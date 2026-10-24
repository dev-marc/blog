---
layout: post
title: "Breaking up the big application"
date: 2018-06-25
tags: [architecture, microservices]
description: "Cross post from the company blog where I posted this as a lesson learned from visiting NDC Oslo."
original_url: "https://medium.com/@marcmathijssen/breaking-up-the-big-application-d29ae809aa4a"
---

**Cross post from the** [**company blog**](https://www.abf.store/i/nl/news/blog-breaking-up-the-big-application-2/) **where I posted this as a lesson learned from visiting NDC Oslo.**

The last couple of years there has been a strong focus on microservices in about every architecture talk I’ve heard or seen. I believe every developer, project manager and business owner sees advantages in having multiple small services over one big application. I also believe there are big advantages but like anything in IT there are always trade offs.

## What’s a (micro)service?

I believe the term microservice is easy to misunderstand. It has the word micro in it, and we developers easily relate that to the amount of code that runs the service. For me that always felt weird, why do all the hassle to expose some kind of functionality (over HTTP for instance) that could have easily been managed as a regular dependency. When I attended [NDC Oslo](https://ndcoslo.com/) last week I gained more knowledge on this topic by doing a workshop on how to create a service oriented architecture. It started of by defining what a service actually is:

***A service is the technical authority for a specific business capability***

A business capability usually involves retrieving or modifying data and doing some business logic before or after. When you split up your application into smaller services you should strive for the smallest autonomous design. A single service can cross all technical boundaries. A part of it may be deployed as an iOS app, another part exposes a REST API, and another part can be a .dll that’s loaded into a windows application. All these parts make up the business service. The team owning the service should be able to modify all parts (which clearly involves various types of expertise) and also be autonomous in it’s work.

![]({{ "/assets/images/breaking-up-the-big-application/0-8-f6svbxjvfjnprr.png" | relative_url }})

*The S1, S2 and S3 columns are business services that cross multiple technical boundaries. Slide from the ‘SOA architecture done right’ workshop by Adam Ralph and Jimmy Bogard.*

I believe that for most companies this is too hard to achieve (it differs from any common organizational structure), but it made me realize that **‘doing’ microservices really isn’t about the code**. It’s about thinking about what services your business really exposes to it’s customers or internally. The code should eventually resemble those business services and every line of code should eventually belong to one of those business services.

Creating microservices for the sake of it will only add more complexity and will eventually lead to bigger problems large monolithic applications have when it comes to changing requirement or adding new features.

## Our story

When I joined ABF I quickly became solely responsible of > 200.000 lines of code running a dozen applications. Besides the code I also had to manage the infrastructure running these components. Like any developer I felt the urge to break up this monolith into smaller ‘services’, but I also wanted to automate the builds and deployments, create automated tests and add value to the business. I realized that if I wanted to completely break up this application I’d basically doing a rewrite, and there was no justification for that. The applications worked fine and most users were happy with it. The existing code only made it harder to add new features. It felt better to making the monolith easier to deploy first.

Over the 3 years I worked at ABF (and luckily became part of a team of developers ) we slowly started breaking off chunks of the big application and put them in separate components (which we call ‘domains’). We added messages and queues between the domains to make them operate more autonomous and make certain business events more traceable. We still have large parts of the ‘big application’ in place because there hasn’t been a good reason (usually a change or new feature) to move them into smaller components.
