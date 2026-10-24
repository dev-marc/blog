---
layout: post
title: "Migrating corsozundert.nl to Azure"
date: 2018-06-22
tags: [azure, migration]
description: "This a crosspost of the write-up I created after we (a small team of volunteers) migrated the website corsozundert.nl to Azure to prepare…"
original_url: "https://medium.com/@marcmathijssen/migrating-corsozundert-nl-to-azure-3b98a9966e31"
---

**This a crosspost of the write-up I created after we (a small team of volunteers) migrated the website** [**corsozundert.nl**](https://corsozundert.nl/) **to Azure to prepare it for the yearly high traffic weekend. First posted** [**here**](http://corsozundert.nl/en/nieuws/migrating-corsozundert-nl-to-azure/)**.**

On the first sunday in september the small town of Zundert (The Netherlands) receives a lot of visitors. On this day the [biggest flower parade of the world](https://corsozundert.nl/en/our-corso/) takes place in the streets of Zundert. Volunteers (and mostly inhabitants of Zundert) have been working on giant floats covered in flowers for almost half a year!

![A float displaying the famous painter ‘Vincent van Gogh’ covered entirely in flowers. Vincent van Gogh was born in Zundert.]({{ "/assets/images/migrating-corsozundert-nl-to-azure/1-mfx6o8tlzl-njk69xincwg.png" | relative_url }})
*A float displaying the famous painter ‘Vincent van Gogh’ covered entirely in flowers. Vincent van Gogh was born in Zundert.*

## The first weekend of september

![]({{ "/assets/images/migrating-corsozundert-nl-to-azure/0-8awcnifwarj65v2z.png" | relative_url }})

Just before, after and during this weekend, corsozundert.nl gets a lot of visitors:

- On sunday morning people are looking for information about the entrance fees, parking options, and at what time the parade will start.
- On sunday evening people visit the website to see how the floats ranked.
- All weekend we have a lot of visitors showing interest after they’ve read or seen something in the dutch media

For corsozundert.nl it all comes down to the first weekend in september!

Last year corsozundert.nl wasn’t able to handle the amount of visitors and let them down with ugly PHP error messages. Those errors weren’t doing any justice to the beautifull floats, so that’s why we (a small team of volunteers with an IT background) decided this year we would try to take corsozundert.nl to the next level.

Corsozundert.nl ran on a single VPS (running PHP and MySQL). It made the WordPress perform great during times traffic was low, but had no options to handle the traffic spike during this weekend. That’s why we decided to move corsozundert.nl to the cloud. Since we had some experience in our day-to-day jobs with Microsoft technologies and our organisation met all conditions to apply for the [Microsoft for Nonprofits program](https://nonprofit.microsoft.com/), Microsoft’s Azure was the obvious choice.

## Optimizing WordPress for Azure

We started of with thefollowing resources to move the WordPress installation to:

- [App Service (Linux)](https://azure.microsoft.com/nl-nl/services/app-service/)
- [Database for MySQL](https://azure.microsoft.com/en-us/services/mysql/)

We had it up and running pretty quicky. So now we had this scalable platform for corsozundert.nl. In the Azure Portal we could easily create more instances (scale out) or upgrade to better plans (scale up). There is only one downside to this: you have to pay for this 🙂

We needed to make sure we were getting as much as we could from every euro spent and that’s why we investigated if we could optimize our WordPress installation.

What we already had was:

- The [WP Super Cache](https://nl.wordpress.org/plugins/wp-super-cache/) plugin which creates static files for your WordPress pages so the server won’t have to get to the database.

What we did to make more efficient use of the resources was:

- Checking the WP Super Cache plugin. It turned out another plugin ([Polylang](https://nl.wordpress.org/plugins/polylang/)) forced the homepage not to be cached. Any visitor of the homepage would take the server more resources than necessary.
- Replacing the plugins [Really Simple SSL](https://nl.wordpress.org/plugins/really-simple-ssl/) and [Simple 301 redirects](https://nl.wordpress.org/plugins/simple-301-redirects/) with code in .htaccess. This is much and much faster because you get the redirect before you hit the PHP execution.
- Setup [Azure Redis Cache](https://azure.microsoft.com/en-us/services/cache/) as a distributed object cache for WordPress.
- Moving our uploads directory to [Azure Storage](https://azure.microsoft.com/en-us/services/storage/) and make it act like a CDN. The images are directly served from the Azure Storage servers which leverages our webserver and enables the browser to asynchronously load resources from 2 different servers.

After these optimizations we noticed the homepage performed way better. The Chrome Developer Console showed us the following rendering times of the homepage (with browser caching disabled)

- VPS: 1.77 seconds
- Azure: 0.55 seconds

## Simulate lots of traffic

To check if we were doing any good we knew we had to simulate a busy day. We did that using [Siege](https://github.com/JoeDog/siege). This really nice open source tool helps you generate a lot of requests to a website and reports back how long it took and how many requests were succesfull. We ran a few simple test scenarios against our VPS and our Azure setup (1 x S1 App Service, 1 x MySQL B1, Redis C0) to compare the results.

**100 concurrent users for 1 minute randomly visiting a page every 0 to 3 seconds**

![]({{ "/assets/images/migrating-corsozundert-nl-to-azure/1-tygj6hpkyjjdtio-jsl6rg.png" | relative_url }})

**200 concurrent users for 1 minute randomly visiting a page every 0 to 3 seconds**

![]({{ "/assets/images/migrating-corsozundert-nl-to-azure/1-befd1qvljiipr-nskloyew.png" | relative_url }})

**500 concurrent users for 1 minute randomly visiting a page every 0 to 3 seconds**

![]({{ "/assets/images/migrating-corsozundert-nl-to-azure/1-wphf4-k3sh987mngvwchxw.png" | relative_url }})

After these tests we were confident our Azure setup was outperforming the old VPS. Even though it was slowing down at 500 concurrent users it still had a >99% availability.

## Scale up or out?

The next step was to experiment with different setups to see what would give the best performance under load. We examined the logs of previous load tests and saw in the metrics the MySQL database didn’t consume a lot of resources. Therefore we focussed on the App Service

We added the price of running all weekend for each setup just to check what it it would cost to run this setup during the busiest weekend of the year.

These were the setups we tried and the results when for 1 minute, 500 concurrent users visit a page every 0 to 3 seconds.

![]({{ "/assets/images/migrating-corsozundert-nl-to-azure/1-wgqijnanojnqph04hdhrkg.png" | relative_url }})

As you can see our WordPress installation gained more performance (and value for money) when we scaled up to a P1v2 compared to scaling out to an extra instance of the S1. We think this is due to the fact the P App Services have a SSD hard drive whereas the S App Services have a HDD hard drive. Since the WP Super Cache plugin makes sure most of the pages are served from disk, we believe our WordPress really benefits from the SSD drives.

## After the event…

Corsozundert.nl ended up serving twice the number of pages compared to 2017 in 25% of the average page download time

## What did we monitor?

We created an Azure dashboard with some very simple metrics of the servers running corsozundert.nl

![]({{ "/assets/images/migrating-corsozundert-nl-to-azure/0-6-vv-hx-e6dwvqrb.png" | relative_url }})

Obviously we needed to know if the servers were running out of resources so we started monitoring the CPU/Memory. To get a sense of what our visitors were experiencing we also monitored

- The number of requests that resulted in an error
- The average response time of the app service
- The egress of our storage account that serves as a poor mans CDN for corsozundert.nl media

We setup some alerts in Azure to warn us when some of the metrics went bad. To monitor the website from the outside world we setup [StatusCake](https://statuscake.com/) which is a great and simple monitoring tool for your website. It checked the most important corsozundert.nl pages from data centers across the world.

## Before the event

A week before the event would take place we already noticed an increase of 10% in traffic compared to last year. A sign that we would be heading towards a busier than ever weekend for corsozundert.nl . The weather forecast was great, and it seemed a lot of people were planning their visits.

We decided to rule out any change to fail and scaled up and out our App Service S1 plan to 3 instances of the P1v2. That’s a pretty expensive setup but we had plenty of budget and needed to succeed. We didn’t use auto scaling because we really wanted to get a sense of control and see the impact of our scaling actions.

The Saturday before the event we already hit a record high number of visitors according to Google Analytics. This was already a success for the migration we did because last year the server collapsed under this load.

## During the event

All of the team members were scattered around the village of Zundert during the event to watch the parade. We didn’t receive any down notification from our monitoring system StatusCake. It was fun to keep checking Google Analytics to see the the number of realtime visitors on corsozundert.nl , and it was fun to check the site itself and see it still responded very fast.

![]({{ "/assets/images/migrating-corsozundert-nl-to-azure/0-kxa4dwr0n8dyik71.jpg" | relative_url }})

*Winner of Corso Zundert 2018: Iguana (inter)action*

## After the event

We scaled back to 1 instance of the S1 App Service. We wrote down our scaling steps (what, when and who) and gathered some key performance metrics for future reference like:

- Number of requests (Azure)
- Average response time (Azure)
- Total egress (Azure)
- Average page load time (Google Analytics)
