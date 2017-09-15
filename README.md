# coffalytics
Coffee Analytics Dashboard - Coffalytics

## What is coffalytics?
Coffalytics is a coffee analytics Dashboard made by network.publishing GmbH. It works with
an api. [The coffalytics api based on Node.js](https://github.com/netpub/coffalytics-api) can be found here.
We are working with an amazon dash button. Everytime you click, a record is added to a redis database with the current timestamp.

## How to start?
Checkout the github project and run the command **npm install** to install gulp,bower and sass. After this you have to install all javascript dependencies with
**bower install**.
Now go to the data.php and change the $apiUrl to your Api Url.
