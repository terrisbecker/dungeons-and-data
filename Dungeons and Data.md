# Dungeons and Data \- The Backend

# Concept

Dungeons and Data intends to be a lightweight tool to help dungeon masters manage D\&D games by organizing large amounts of game data into a relational database and letting them access it easily with some API calls. On top of the database layer, there will be some business logic to help with nested locations, character management, items and inventory management, item economy for shops/markets, chests, loot, encounters, and dice rolls. This guide introduces the backend only. There will be a separate concept for a front end layer.

# Tech stack

* Node.js/express  
* Typescript  
* Eslint/prettier  
* Prisma ORM  
* Postgres SQL  
* Docker

# Backend Layers

* Database layer \- PostgresSQL \- interact with the database via prisma ORM  
* Query layer \- handles connecting to the database, defining queries, and running them against the database  
* Service layer \- establishes business logic, takes raw data and transforms it and/or takes raw requests and converts it to relevant queries  
* Controller layer \- takes requests that hit api endpoints and passes it to the relevant service. Handles errors and request logic  
* API layer/route \- defines the api route for given requests

# File naming conventions

All source code file names follow a \[topic\].\[layer\].ts file name. They are all placed in a folder named relevant to the topic. For example source code relating to managing monsters would be in a folder named “monsters” with files called monsters.queries.ts or monsters.controllers.ts.

# Data Tables

This section defines the initial prisma ORM setup. It will change, but this will get the project off the ground.

## Conventions

* All ID columns are UUID unless otherwise specified

## Location Table

The location table defines all the locations within the game – from the largest realm to the smallest cottage. Note the nested structure of the table so that one can define multiple hamlets within a region, multiple buildings within a town, etc.

* Table name: locations  
* Columns  
  * ID  
  * locationName (text)  
  * Description (text)  
  * type (text)  
    * Defines what type of location (i.e. region, country, city, town, etc.)  
  * NPCs/mosters (array of IDs from the npc and monster tables)

## Player Characters Table

This table manages the names, descriptions, backgrounds, inventory, class, race, and stats of a player. Since player characters are complex and nuanced, I’m open to suggestions that deviate from what I’ve defined here.

* Table name: playerCharacters  
* Columns  
  * ID  
  * characterName  
  * race  
  * class  
  * abilityScores (not sure if it should be an array like \[STR, CON, DEX, etc.\] or separate columns)  
  * skills (similarly, not sure if it should be an array or separate columns)  
  * items (array of ids linking to the items table)  
  * description  
  * background  
  * traits  
  * …additional relevant DnD columns for player characters

## 