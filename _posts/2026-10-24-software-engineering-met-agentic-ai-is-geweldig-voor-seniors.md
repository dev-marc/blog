---
layout: post
title: "Software Engineering met Agentic AI is geweldig… voor seniors"
date: 2026-10-24
tags: [legacy, php, ai, claude, modernisering]
description: "Wat ik leerde van het moderniseren van het Corso Zundert archief met Claude en het AI-native SDLC playbook."
image: /assets/images/software-engineering-met-agentic-ai-is-geweldig-voor-seniors/social-1945-v2.webp
---

Het voelt een beetje als een 'guess who's back', maar schrijven blijft een manier om denken te structureren en daarom vind ik het 'ironisch genoeg' een fijne manier om wat ik geleerd heb de afgelopen dagen over software engineering m.b.v. AI om te zetten in iets wat ik later kan teruglezen.

De voorgaande posts (laatste in 2019, origineel op @Medium) waren 'technische recepten' die ik vanwege dezelfde reden schreef. Wel in het Engels, omdat ik toen dacht dat ik een internationaal publiek zou bedienen 😂 .

Inmiddels is er een hoop veranderd. Ik ben docent Software Engineering aan de Avans University of Applied Sciences. Dit in een buitengewoon interessante tijd. Het eerste jaar zag ik studenten nog traditioneel worstelen met code, en daarna veranderde het langzaam in worstelen met code, maar dan dankzij (of ondanks) AI. Het is een beroep dat mij goed ligt. Het contact met de studenten en collega's i.c.m. een technisch vak gaan goed samen met mijn energie om mensen te willen helpen.

## Wat ik wilde leren 🧑‍🎓

De wereld staat niet stil. Afgestudeerde studenten vertelden mij dat ze niet veel meer met de hand schrijven. Hoewel ik dat prima kon accepteren liep ik nog wel rond met een 'vroeger deden we het zo'-mindset en dat moest veranderen.

Nadat ik een AI-gegenereerde codebase van een student had gereviewed merkte ik dat deze mindset ook vooroordelen met zich meebrengt. Vooroordelen die het belangrijkste doel in het onderwijs: het opleiden tot junior software engineer, in de weg konden staan. Ik moest zelf weer eens mijn handen vies maken. Uiteraard had ik Claude Code al wel eens gebruikt, maar veelal nog op een traditionele wijze: voor het opzoeken van codeconstructies, uitzoeken van problemen en als een soort Google + StackOverflow ineen. De industrie en vele podcasts deden mij echter geloven dat ik daarmee niet alles uit de tooling haalde.

Omdat ik beter leer wanneer ik een echt probleem wil oplossen besloot ik om een oude PHP legacy codebase van het [Corso Zundert Archief](https://archief.corsozundert.nl) (sowieso een van mijn favoriete technische speeldomeinen) om te schrijven naar 'iets moderns' maar dan ook op een 'moderne manier'.

De moderne manier werd Claude's [AI-native SDLC playbook](https://academy.claude.com/courses/ai-native-sdlc-playbook)

Het doel was niet zozeer het omschrijven van een legacy-applicatie, maar vooral: kan ik deze werkwijze toepassen, vertrouwen hebben in het resultaat en uitleggen hoe het werkt? Hetzelfde als waar mijn studenten mee worstelen.

## Het probleem 🤔

Het [Corso Archief](https://archief.corsozundert.nl/) is een relatief eenvoudige applicatie met enkele views waarin informatie & media over alle voorgaande corso's te vinden is. Het is een schat aan informatie voor de corsoliefhebber en ook erg leuk om in te grasduinen.

De code was legacy PHP en met veel liefde geconstrueerd. De structuur was soms minder optimaal, en dat kwam de leesbaarheid en de performance niet altijd ten goede.

Ik was zelf niet belast met al te veel kennis van PHP dus dat vond ik alleen maar een betere reden om deze applicatie aan te pakken.

## De werkwijze 🪏

Ik maakte een repo, kopieerde de legacy code in een aparte map en vertelde Claude over mijn intenties. Samen kwamen we tot de conclusie dat:

- de database & media buiten scope viel 👉 De datastructuur is, ondanks wat kleine imperfecties, niet verkeerd. Als we de huidige database blijven gebruik werd de scope een stuk beperkter en werd het eenvoudiger om de nieuwe versie te testen en te deployen.
- Laravel is het meest geschikte framework voor dit doel was 👉 of zoals ze zelf zeggen "The clean stack for artisans & agents".
- de originele app blijft als twin ernaast vanuit dezelfde codebase 👉 handig bij dit migratie scenario
- de oplossing volledig containeriseren: lokale MySQL database, legacy app, Laravel app 👉 minder lokale dev dependencies 🥳

Met deze opzet (legacy code naast de laravel code) voorzag ik Claude van voldoende context (de code is de beste documentatie right?) en een manier om 'Parity Tests' uit te voeren 👉 tonen de nieuwe views hetzelfde als de oude views.

Voor iedere wijziging maakte ik m.b.v. Claude Code op mijn PC:
- Een intent (wat is het doel)
- Een spec (wat zijn de specificaties en welke keuzes zitten hierin)
- Een plan (welke stappen gaat Claude uitvoeren)

En vervolgens liet ik Claude Code zijn werk doen en het uitprogrammeren.

## Het resultaat en introductie agentic workflow 🌺🤖

Na twee intents en een paar uurtjes was de volledige oplossing herschreven door Claude. Indrukwekkend. Dit had mij minimaal een week gekost.

De output beoordelen bleek lastiger. Ik ben dus geen PHP-expert, en of Laravel op deze wijze juist was ingezet? Ik vermoedde het. Ik zag componenten, services, models. Concepten die mij niet vreemd zijn uit andere frameworks. 

Al snel begon ik al allerlei (niet) functionele aspecten te verbeteren met nieuwe intents (laadtijden, media optimalisatie met `WEBP` en `srcset`, responsive design). De code bekeek ik af en toe, omdat het soms moest van mezelf. Het doorvoeren van verbeteringen is nog steeds even leuk, ook als de code voor je wordt geschreven. De aspecten die ik wilde verbeteren kwamen uit mijn hoofd, maar Claude komt vaak ook met goede suggesties en denkt mee hoe dit te bereiken.

*Een na- en voor met mijn favoriete corsowagen: [Feniks, Buurtschapp Tiggelaar, winnaar 2025](https://archief.corsozundert.nl/wagen.php?id=1798)*
<div class="image-row">
  <figure>
    <img src="{{ '/assets/images/software-engineering-met-agentic-ai-is-geweldig-voor-seniors/archief-nieuw.png' | relative_url }}" alt="De nieuwe versie: de pagina van Feniks (2025) in Laravel en Tailwind CSS">
    <figcaption>De nieuwe versie (in Laravel en Tailwind CSS)</figcaption>
  </figure>
  <figure>
    <img src="{{ '/assets/images/software-engineering-met-agentic-ai-is-geweldig-voor-seniors/archief-oud.webp' | relative_url }}" alt="De oude versie van dezelfde pagina">
    <figcaption>De oude versie</figcaption>
  </figure>
</div>

Als laatste stap heb ik de workflow volledig geautomatiseerd in GitHub. Want wat ik op mijn PC in een prompt kan, kan een archief-beheerder (productowner) ook via een GitHub issue, en vaak zelfs beter. Als techneut wil ik wel grip houden op de code, dus implementeerde ik een 'agentic werkwijze' die als volgt werkt:

- Issue aanmaken. Een productowner of developer maakt een issue aan, in het Nederlands of Engels, en beschrijft wat er moet veranderen en waarom. Zet het label `claude` erop.
- Intent beoordelen. Claude schrijft de intent en opent een draft-PR met een Nederlandse samenvatting. 
- Spec en output beoordelen. Claude schrijft de spec en het plan, bouwt de wijziging en zet in een reactie op de PR wat er gebouwd is. Met het label `testomgeving` wordt deze ook op een aparte testomgeving geplaatst. Deze optie wil ik ook aanbieden voor developers die liever op de lokale PC of met de hand blijven werken, en zo kunnen beide workflows blijven bestaan.

Daarnaast heeft Claude guardrails gekregen: welke bestanden mag je wel aanpassen, en welke nooit

<div class="image-row">
  <figure>
    <img src="{{ '/assets/images/software-engineering-met-agentic-ai-is-geweldig-voor-seniors/github-issue.png' | relative_url }}" alt="Een issue met het label claude, opgepakt door Claude op GitHub">
    <figcaption>Een issue met het label <code>claude</code>, opgepakt door Claude op GitHub</figcaption>
  </figure>
  <figure>
    <img src="{{ '/assets/images/software-engineering-met-agentic-ai-is-geweldig-voor-seniors/intents.png' | relative_url }}" alt="De map .intents in de repository, met een map per wijziging">
    <figcaption>De map <code>.intents</code> in de repository, met een map per wijziging</figcaption>
  </figure>
</div>

## Leerpunt 1: Terugsnoeien van tests & texts 🧑‍🌾

Wat ik merk, ook bij studenten, is dat Claude (of Codex for that matter) een handje heeft van overbodig compleet willen zijn en zichzelf te willen beschermen tegen fouten.
- De hoeveelheid tests, zelfs voor triviale zaken als redirects, groeit zo enorm.
- De hoeveelheid tekst als code commentaar en in README's groeit en groeit.

Hierdoor wordt het lastiger om hoofd- en bijzaak van elkaar te onderscheiden, waardoor code-bases als deze al snel intimiderend groot worden. De complexiteit zit dan niet in de code (het bleef bij enkele views en modellen) maar juist in de hoeveelheid tests & tekst die ermee gepaard gaan. Heb je echt bij iedere functie 5 regels commentaar nodig met uitleg en verwijzing naar de intent? Is het nodig dat kleine bugfixes in de output blijvend getest worden? 

Ik heb er bewust voor gekozen om een aantal tests, overbodige laravel configuratie opties, commentaar en de README drastisch terug te snoeien. Beperk het tot de essentie: wat moet de volgende developer (of jijzelf over een paar jaar) weten voordat deze aan de slag kan met deze codebase en denk goed na over wat er echt niet kapot mag gaan om zo de hoeveel tijd tests beperkt.

## Leerpunt 2: Code begrijpen kost tijd en energie 🥲

Ik zag een berg tests, en relatief eenvoudige PHP code. De structuur van Laravel was mij onbekend, dus ja, waar zit dan die verbinding met de database? Een vraag die ik graag stel aan eerstejaarsstudenten. Als je stuurt op de output (een werkende webapplicatie) is het minder 'leuk' om naar de code te kijken. Daarom heb ik actief gestuurd op documentatie, zodat ik de oplossing en de werkwijze zelf begrijp. 

## Leerpunt 3: De ethische kant bestaat echt 🤕

Gaandeweg besefte ik iets anders ...

Voor een junior/medior kan het heel leuk en zingevend zijn om een groepje mensen te helpen met code die hun probleem oplost. Dit is ook altijd mijn grote drijfveer geweest. Het ging mij al niet echt om de code, al ben ik later gaan beseffen dat goede code het leven van alle stakeholders fijner maakt. Het oplossen van problemen voor echte mensen leert je veel meer dan alleen coderen.

Met deze "moderne werkwijze" vernietig ik een proces waar een andere junior developer veilig, leerzaam en zingevend werk had kunnen doen in een context waar mensen überhaupt blij zijn dat je een steentje bijdraagt (Corso Zundert draait volledig op vrijwilligers), en ik voelde mij dus ook schuldig over mijn aanpak.

## Conclusie

Ik begon met drie vragen: kan ik deze werkwijze toepassen, heb ik vertrouwen in het resultaat, en kan ik uitleggen hoe het werkt?

Toepassen: ja. Dat ging sneller en beter dan ik had verwacht. Na een paar uur stond er een werkende applicatie. Na drie dagen konden beheerders via een GitHub issue zelf wijzigingen laten bouwen.

Vertrouwen: ja, maar niet omdat ik de code heb gelezen. Mijn vertrouwen kwam uit de opzet eromheen: de legacy-app als twin, de parity tests, een afgebakende scope, de guardrails en de keten van intent, spec en plan. Dat zijn geen PHP-vaardigheden. Het zijn keuzes die ik maakte omdat ik heb geleerd dat je een oplossing pas mag accepteren als je weet wat de voor- en nadelen zijn en hem veilig in productie kunt beheren, en later uitbouwen.

Uitleggen: deels. De werkwijze kan ik uitleggen. Of ik de code kan uitleggen, hangt af van de documentatie waar ik zelf op heb gestuurd. Waar die verbinding met de database precies zit, moest ik nog steeds opzoeken.

Dat verschil is interessant. Michael Polanyi schreef: “we can know more than we can tell”. Een groot deel van wat een ervaren developer weet, is tacit knowledge: kennis die je niet kunt opschrijven, alleen kunt opbouwen door het te doen. Wat moet ik vragen? Wat laat ik buiten scope? 

In Laravel was ik een beginner, maar in software engineering niet. Claude nam het beginnerswerk over, terwijl ik het oordeel van de expert inbracht, en kennis over webdevelopment, cloudhosting op Azure en GitHub workflows. Daarom werkte het voor mij.

Een junior heeft dat oordeel nog niet. En het ontstaat juist in de stadia die AI nu zo makkelijk laat overslaan: het worstelen, het fout doen, het zelf de verbinding met de database zoeken. Als we juniors die meters niet meer laten maken, leveren we mensen af die output kunnen genereren, maar niet weten wat ze moeten vragen.

Daar zit ook mijn ongemak uit leerpunt 3. Het gaat niet alleen om dit ene project. Het gaat om de plekken waar die stilzwijgend deze kennis werd opgebouwd. Een opleiding is slechts één van die plekken, en vaak het startpunt.

## Verder lezen 📚

- Bosman & Ongena (2026), [De paradox van het ICT-onderwijs](https://www.themahogeronderwijs.org/artikel/110-4310_De-paradox-van-het-ICT-onderwijs). Th&ma, 7 juli 2026.
- Heck (2026), [Competences for the AI-Augmented Software Engineer](https://fontysblogt.nl/author/petraheck/). Fontys blog, 3 juni 2026.
- Hermans (2026), [Leer coderen omdat het leuk is!](https://tweakers.net/plan/4864/felienne-hermans-op-de-dev-summit-over-ai-en-code-leer-het-omdat-het-leuk-is.html?referrer=https%3A%2F%2Fwww.felienne.nl%2Fvierkante-ogen%2F). Tweakers Dev Summit, 21 oktober 2026.
