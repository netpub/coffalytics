# Coffalytics
Coffee Analytics Dashboard - Coffalytics

## What is Coffalytics?
Coffalytics is a coffee analytics Dashboard made by network.publishing GmbH. It works with
an API. The coffalytics API based on Node.js [can be found here](https://github.com/netpub/coffalytics-api).
We are working with an Amazon dash button to get the signal for a new coffee being made. Everytime you click it, a record is added to a Redis database with the current timestamp.

## How to start?
Checkout the github project and run the command **npm install** to install gulp, bower and sass. After this you have to install all javascript dependencies with
**bower install**.
Now go to the data.php and change the $apiUrl to your API Url.
